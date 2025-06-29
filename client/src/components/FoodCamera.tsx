import { useState, useRef, useCallback } from "react";
import {
  Camera,
  Upload,
  X,
  Zap,
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { isUsageLimitError } from "@/lib/authUtils";
import SubscriptionModal from "./SubscriptionModal";
import type { Food } from "@shared/schema";

interface FoodCameraProps {
  sessionId: string;
  selectedDate?: string;
  onFoodDetected: (food: Food) => void;
  onMealItemAdded?: () => void;
}

interface AnalysisResult {
  foods: Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence: number;
    estimatedQuantity: string;
  }>;
  suggestions: string[];
}

export default function FoodCamera({
  sessionId,
  selectedDate,
  onFoodDetected,
  onMealItemAdded,
}: FoodCameraProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<"camera" | "upload">("camera");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [usageData, setUsageData] = useState<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  // Get user's daily usage stats
  const { data: usageStats, refetch: refetchUsageStats } = useQuery({
    queryKey: ["/api/usage-stats"],
    enabled: isAuthenticated,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const addMealMutation = useMutation({
    mutationFn: async (data: {
      foodId: number;
      quantity: number;
      unit: string;
      sessionId: string;
      date?: string;
    }) => {
      const response = await apiRequest("POST", "/api/meal", data);
      return response.json();
    },
    onSuccess: () => {
      // Force refresh the meal data immediately with selected date
      const dateParam = selectedDate || new Date().toISOString().split("T")[0];
      queryClient.invalidateQueries({
        queryKey: [`/api/meal/${sessionId}/${dateParam}`],
      });
      queryClient.invalidateQueries({ queryKey: [`/api/meal/${sessionId}`] });
      queryClient.removeQueries({
        queryKey: [`/api/meal/${sessionId}/${dateParam}`],
      });
      queryClient.refetchQueries({
        queryKey: [`/api/meal/${sessionId}/${dateParam}`],
      });
    },
    onError: (error) => {
      console.error("Error adding food to meal:", error);
    },
  });

  const startCamera = async () => {
    try {
      setCapturedImage(null);
      setAnalysisResult(null);
      setCameraError(null);
      setCameraReady(false);

      console.log("Requesting camera access...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      console.log("Camera access granted, setting up video stream");

      setIsOpen(true);
      setCameraMode("camera");

      // Wait for component re-render, then set stream
      setTimeout(() => {
        if (videoRef.current && stream) {
          console.log("Setting video stream");
          videoRef.current.srcObject = stream;
          streamRef.current = stream;

          videoRef.current.onloadedmetadata = () => {
            console.log("Video ready");
            setCameraReady(true);
          };

          videoRef.current.play().catch(() => {
            videoRef.current!.muted = true;
            videoRef.current!.play();
          });
        }
      }, 100);
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError("Camera access denied");
      toast({
        title: "Camera Access Denied",
        description: "Please use Upload Photo instead",
        variant: "destructive",
      });
    }
  };

  const openFileUpload = () => {
    // Reset states before opening file upload
    setCapturedImage(null);
    setAnalysisResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.click();
      setIsOpen(true);
      setCameraMode("upload");
    }
  };

  const stopCameraDelayed = () => {
    setTimeout(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }, 100);
  };

  const resizeImageToStandard = (imageElement: HTMLImageElement): string => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) return "";

    // Set standard Food101 model dimensions (224x224)
    canvas.width = 224;
    canvas.height = 224;

    // Draw image resized to 224x224 for optimal AI analysis
    context.drawImage(imageElement, 0, 0, 224, 224);

    // Convert to base64 with compression for efficiency
    return canvas.toDataURL("image/jpeg", 0.6);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File upload triggered");
    const file = event.target.files?.[0];
    console.log("Selected file:", file);

    if (file && file.type.startsWith("image/")) {
      console.log("Valid image file detected:", file.name, file.type);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log("File read complete, data length:", result.length);

        // Create image element to resize for preview
        const img = new Image();
        img.onload = () => {
          console.log(
            "Image loaded for processing:",
            img.width,
            "x",
            img.height,
          );
          // Create smaller preview for display (max 400px width)
          const previewCanvas = document.createElement("canvas");
          const previewContext = previewCanvas.getContext("2d");

          if (previewContext) {
            // Create neat square preview (300x300)
            const previewSize = 300;
            previewCanvas.width = previewSize;
            previewCanvas.height = previewSize;

            // Calculate crop dimensions to maintain aspect ratio
            const sourceSize = Math.min(img.width, img.height);
            const cropX = (img.width - sourceSize) / 2;
            const cropY = (img.height - sourceSize) / 2;

            previewContext.drawImage(
              img,
              cropX,
              cropY,
              sourceSize,
              sourceSize, // source crop
              0,
              0,
              previewSize,
              previewSize, // destination
            );
            const previewImage = previewCanvas.toDataURL("image/jpeg", 0.8);
            console.log("Preview image created, setting state");
            setCapturedImage(previewImage);
          } else {
            console.log("Canvas context failed, using original image");
            setCapturedImage(result);
          }

          setAnalysisResult(null);
          toast({
            title: "Photo Uploaded",
            description:
              "Image optimized for analysis. Click 'Analyze Food' to identify nutrients",
          });
        };
        img.onerror = () => {
          console.error("Failed to load image for processing");
          toast({
            title: "Image Load Error",
            description: "Failed to process the uploaded image.",
            variant: "destructive",
          });
        };
        img.src = result;
      };
      reader.onerror = () => {
        console.error("FileReader error");
        toast({
          title: "File Read Error",
          description: "Failed to read the uploaded file.",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    } else {
      console.log("Invalid file type or no file selected");
      toast({
        title: "Invalid File",
        description: "Please select a valid image file.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsOpen(false);
    setCapturedImage(null);
    setAnalysisResult(null);
  };

  const resetCamera = () => {
    // Reset all camera states to initial values
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsOpen(false);
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setCapturedImage(null);
    setCameraMode("camera");
    setCameraError(null);
    setCameraReady(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    console.log("Camera reset to initial state");
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas ref not available");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      console.error("Canvas context not available");
      return;
    }

    // Ensure video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error("Video dimensions not ready");
      toast({
        title: "Camera Not Ready",
        description: "Please wait for the camera to initialize properly",
        variant: "destructive",
      });
      return;
    }

    // Set canvas dimensions to match video for preview
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Create preview image (smaller for display)
    const previewImage = canvas.toDataURL("image/jpeg", 0.8);
    console.log("Photo captured, setting captured image");
    setCapturedImage(previewImage);

    // Stop camera after capture
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    toast({
      title: "Photo Captured",
      description:
        "Image optimized for analysis. Click 'Analyze Food' to identify nutrients",
    });
  }, [toast]);

  const analyzeFood = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    try {
      // Create optimized 224x224 image for AI analysis
      const img = new Image();

      const analyzeImage = new Promise<void>((resolve, reject) => {
        img.onload = async () => {
          try {
            const optimizedImageData = resizeImageToStandard(img);
            console.log(
              "Optimized image data:",
              optimizedImageData.substring(0, 50) + "...",
            );

            // Extract base64 data from optimized data URL
            const base64Data = optimizedImageData.split(",")[1];

            if (!base64Data) {
              throw new Error("Invalid image format");
            }

            console.log(
              "Sending optimized base64 data length:",
              base64Data.length,
            );

            // Use admin session ID if in admin mode
            const isAdminMode = localStorage.getItem("admin_mode") === "true";
            const effectiveSessionId = isAdminMode
              ? localStorage.getItem("session_id") || sessionId
              : sessionId;

            const response = await apiRequest(
              "POST",
              "/api/analyze-food-image",
              {
                image: base64Data,
                sessionId: effectiveSessionId,
              },
            );

            const result = await response.json();
            console.log("Parsed API response:", result);
            console.log("Foods array:", result.foods);
            console.log("Is foods array?", Array.isArray(result.foods));
            setAnalysisResult(result as AnalysisResult);

            // Automatically add all detected foods to Current Meal (only once)
            if (result.foods && result.foods.length > 0 && !analysisResult) {
              await addDetectedFoodsToMeal(result.foods);
            }

            toast({
              title: "Analysis Complete",
              description: `Detected ${result.foods?.length || 0} food item(s) and added to Current Meal`,
            });
            resolve();
          } catch (error: any) {
            if (isUsageLimitError(error)) {
              // Extract usage data from error response
              try {
                const errorText = error.message;
                const jsonStart = errorText.indexOf("{");
                if (jsonStart !== -1) {
                  const jsonPart = errorText.substring(jsonStart);
                  const errorData = JSON.parse(jsonPart);
                  setUsageData(errorData.usageData || errorData);
                  setShowSubscriptionModal(true);
                  resolve();
                  return;
                }
              } catch (parseError) {
                console.error("Error parsing usage data:", parseError);
              }
              // Fallback: show subscription modal anyway
              setShowSubscriptionModal(true);
              resolve();
              return;
            }
            reject(error);
          }
        };

        img.onerror = () => reject(new Error("Failed to load image"));
      });

      img.src = capturedImage;
      await analyzeImage;
    } catch (error: any) {
      console.error("Analysis error:", error);

      // Check if this is a usage limit error for premium users
      if (error.message && error.message.includes("Daily limit reached")) {
        // For premium users hitting their limit, just show the error without upgrade modal
        if (isPremium) {
          toast({
            title: "Daily Limit Reached",
            description:
              "You've used all 5 daily photo analyses. Your limit resets tomorrow.",
            variant: "destructive",
          });
        } else {
          // For free users, show the subscription modal
          if (!isPremium) {
            setShowSubscriptionModal(true);
          }
        }
      } else {
        // Other errors
        const isAdminMode = localStorage.getItem("admin_mode") === "true";

        if (!showSubscriptionModal && !isAdminMode) {
          toast({
            title: "Analysis Failed",
            description:
              error instanceof Error
                ? error.message
                : "Unable to analyze the image. Please try again.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addSingleFoodToMeal = async (detectedFood: any) => {
    try {
      // Create a hash-based ID for consistency in the AI food range
      const foodString = `${detectedFood.name}-${detectedFood.calories}-${detectedFood.protein}`;
      const baseHash = Math.abs(
        foodString.split("").reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0);
          return a & a;
        }, 0),
      );
      // Ensure the ID is in the AI food range (>= 2100000000)
      const hashId = 2100000000 + (baseHash % 1000000);

      // Get intelligent unit selection for this food
      const intelligentUnit = getIntelligentUnitForFood(detectedFood.name);

      // Store the AI food in the database with smart portion data
      await apiRequest("POST", "/api/ai-food", {
        id: hashId,
        name: detectedFood.name,
        calories: detectedFood.calories,
        protein: detectedFood.protein,
        carbs: detectedFood.carbs,
        fat: detectedFood.fat,
        portionSize: intelligentUnit.unit,
        category: "AI Detected",
        defaultUnit: intelligentUnit.unit,
        // Include smart portion data if detected by AI
        smartPortionGrams: detectedFood.smartPortionGrams || null,
        smartCalories: detectedFood.smartCalories || null,
        smartProtein: detectedFood.smartProtein || null,
        smartCarbs: detectedFood.smartCarbs || null,
        smartFat: detectedFood.smartFat || null,
        aiConfidence: detectedFood.aiConfidence || detectedFood.confidence,
      });

      // Add to meal using intelligent unit selection
      return new Promise((resolve, reject) => {
        addMealMutation.mutate(
          {
            foodId: hashId,
            quantity: intelligentUnit.quantity,
            unit: intelligentUnit.unit,
            sessionId,
            date: selectedDate,
          },
          {
            onSuccess: () => {
              console.log(`Successfully added ${detectedFood.name} to meal`);
              resolve(true);
            },
            onError: (error) => {
              console.error(
                `Failed to add ${detectedFood.name} to meal:`,
                error,
              );
              reject(error);
            },
          },
        );
      });
    } catch (error) {
      console.error(`Error adding ${detectedFood.name}:`, error);
      throw error;
    }
  };

  // Enhanced nutrition multiplier calculation with food-specific intelligence (same as FoodSearch)
  const getUnitMultiplier = (unit: string, food: any) => {
    const unitLower = unit.toLowerCase();
    const name = food.name.toLowerCase();

    // Water always has 0 calories regardless of unit or quantity
    if (name.includes("water")) {
      return 0;
    }

    // PRIORITY 1: Extract volume/weight from unit descriptions for accurate calculations

    // VOLUME-BASED UNITS (for beverages) - Extract ml and calculate based on 100ml base
    const mlMatch = unitLower.match(/(\d+)ml/);
    if (mlMatch) {
      const mlAmount = parseInt(mlMatch[1]);
      console.log(
        `AI Camera - Volume calculation: ${mlAmount}ml = ${mlAmount / 100}x multiplier`,
      );
      return mlAmount / 100; // Base nutrition is per 100ml
    }

    // WEIGHT-BASED UNITS (for solid foods) - Extract grams and calculate based on 100g base
    const gMatch = unitLower.match(/(\d+)g\)/);
    if (gMatch) {
      const gAmount = parseInt(gMatch[1]);
      console.log(
        `AI Camera - Weight calculation: ${gAmount}g = ${gAmount / 100}x multiplier`,
      );
      return gAmount / 100; // Base nutrition is per 100g
    }

    // PRIORITY 2: Predefined specific beverage units (fallback for common descriptions)
    if (unitLower.includes("glass (250ml)")) return 2.5; // 250ml = 2.5 x 100ml
    if (unitLower.includes("bottle (500ml)")) return 5.0; // 500ml = 5 x 100ml
    if (unitLower.includes("bottle (650ml)")) return 6.5; // 650ml = 6.5 x 100ml
    if (unitLower.includes("bottle (330ml)")) return 3.3; // 330ml = 3.3 x 100ml
    if (unitLower.includes("can (330ml)")) return 3.3; // 330ml = 3.3 x 100ml
    if (unitLower.includes("cup (240ml)")) return 2.4; // 240ml = 2.4 x 100ml

    // PRIORITY 3: General unit patterns (when specific volume/weight not found)
    const baseMultipliers: Record<string, number> = {
      // Standard portions
      serving: 1.0,
      "half serving": 0.5,
      quarter: 0.25,

      // Size variations
      small: 0.7,
      medium: 1.0,
      large: 1.4,
      "extra large": 1.8,

      // Piece-based
      piece: 0.8,
      slice: 0.6,
      scoop: 0.5,

      // Volume-based (generic)
      cup: 2.4, // Standard cup 240ml
      glass: 2.5, // Standard glass 250ml
      bowl: 2.0, // Standard bowl 200ml
      bottle: 5.0, // Standard bottle 500ml
      can: 3.3, // Standard can 330ml

      // Portion descriptions
      "small portion": 0.7,
      "medium portion": 1.0,
      "large portion": 1.5,
      handful: 0.3,

      // Measurement units
      tablespoon: 0.15,
      teaspoon: 0.05,
      ml: 0.01,
    };

    // Get base multiplier
    let multiplier = baseMultipliers[unit] || 1.0;

    // BEVERAGES - Enhanced volume-based calculations
    if (
      food.category?.toLowerCase().includes("beverage") ||
      name.match(
        /\b(cola|coke|pepsi|sprite|beer|juice|tea|coffee|milk|lassi)\b/,
      )
    ) {
      // For beverages, use volume-based multipliers if specific ml not found
      if (unitLower.includes("glass") && !mlMatch) multiplier = 2.5; // 250ml standard
      if (unitLower.includes("bottle") && !mlMatch) multiplier = 5.0; // 500ml standard
      if (unitLower.includes("can") && !mlMatch) multiplier = 3.3; // 330ml standard
      if (unitLower.includes("cup") && !mlMatch) multiplier = 2.4; // 240ml standard
    }

    console.log(
      `AI Camera - Unit multiplier for ${name} - ${unit}: ${multiplier}`,
    );
    return Math.max(0.01, multiplier); // Ensure minimum multiplier
  };

  // Get intelligent unit selection for AI detected foods (same logic as FoodSearch)
  const getIntelligentUnitForFood = (foodName: string) => {
    const name = foodName.toLowerCase();

    // 1. BEVERAGES - Enhanced with realistic volumes
    if (name.match(/\b(tea|coffee|chai|latte|cappuccino|espresso)\b/)) {
      return { unit: "cup (240ml)", quantity: 1 };
    }

    if (name.match(/\b(beer|lager|ale)\b/)) {
      return { unit: "bottle/big can (650ml)", quantity: 1 };
    }

    if (name.match(/\b(cola|coke|pepsi|sprite|soda|soft drink)\b/)) {
      return { unit: "can (330ml)", quantity: 1 };
    }

    if (name.match(/\b(juice|lassi|smoothie|milkshake)\b/)) {
      return { unit: "glass (250ml)", quantity: 1 };
    }

    if (name.match(/\b(milk|water)\b/)) {
      return { unit: "glass (250ml)", quantity: 1 };
    }

    // 2. RICE & GRAIN DISHES
    if (name.match(/\b(rice|biryani|pulao|pilaf)\b/)) {
      const isSpecialRice = name.match(/\b(biryani|pulao|pilaf)\b/);
      return {
        unit: isSpecialRice ? "medium portion (200g)" : "medium portion (150g)",
        quantity: 1,
      };
    }

    // 3. CURRIES & LIQUID DISHES
    if (
      name.match(/\b(curry|dal|daal|soup|stew|gravy|sambhar|rasam|kadhi)\b/)
    ) {
      const isDal = name.match(/\b(dal|daal)\b/);
      if (isDal) {
        return { unit: "medium bowl (200g)", quantity: 1 };
      } else {
        return { unit: "serving (150g)", quantity: 1 };
      }
    }

    // 4. BREAD & FLATBREADS
    if (
      name.match(
        /\b(roti|chapati|naan|bread|toast|paratha|puri|kulcha|dosa|uttapam|idli|vada)\b/,
      )
    ) {
      if (name.match(/\b(roti|chapati)\b/)) {
        return { unit: "medium roti (50g)", quantity: 2 };
      } else if (name.match(/\b(naan|paratha)\b/)) {
        return { unit: "piece (80g)", quantity: 1 };
      } else if (name.match(/\b(idli)\b/)) {
        return { unit: "piece (30g)", quantity: 3 };
      } else {
        return { unit: "piece", quantity: 1 };
      }
    }

    // 5. FRUITS
    if (name.match(/\b(apple|orange|banana|mango|grapes|berries|fruit)\b/)) {
      if (name.includes("grapes") || name.includes("berries")) {
        return { unit: "handful", quantity: 1 };
      } else {
        return { unit: "medium piece", quantity: 1 };
      }
    }

    // 6. VEGETABLES
    if (name.match(/\b(potato|onion|tomato|carrot|vegetable|sabzi)\b/)) {
      return { unit: "serving (100g)", quantity: 1 };
    }

    // 7. SNACKS & FRIED FOODS
    if (
      name.match(/\b(samosa|pakora|vada|chips|biscuit|cookie|namkeen|snack)\b/)
    ) {
      if (name.includes("chips")) {
        return { unit: "small pack", quantity: 1 };
      } else {
        return { unit: "piece", quantity: 2 };
      }
    }

    // 8. SWEETS & DESSERTS
    if (
      name.match(
        /\b(sweet|laddu|gulab jamun|rasgulla|cake|ice cream|dessert)\b/,
      )
    ) {
      if (name.includes("ice cream")) {
        return { unit: "scoop", quantity: 1 };
      } else if (name.includes("cake")) {
        return { unit: "slice", quantity: 1 };
      } else {
        return { unit: "piece", quantity: 1 };
      }
    }

    // Default intelligent suggestion
    return { unit: "serving (100g)", quantity: 1 };
  };

  const addDetectedFoodsToMeal = async (foods: any[]) => {
    try {
      let addedCount = 0;

      for (const detectedFood of foods) {
        // Create a hash-based ID for consistency in the AI food range
        const foodString = `${detectedFood.name}-${detectedFood.calories}-${detectedFood.protein}`;
        const baseHash = Math.abs(
          foodString.split("").reduce((a, b) => {
            a = (a << 5) - a + b.charCodeAt(0);
            return a & a;
          }, 0),
        );
        // Ensure the ID is in the AI food range (>= 2100000000)
        const hashId = 2100000000 + (baseHash % 1000000);

        // Get intelligent unit selection for this food
        const intelligentUnit = getIntelligentUnitForFood(detectedFood.name);
        console.log(
          `AI Camera - Intelligent unit for ${detectedFood.name}:`,
          intelligentUnit,
        );

        try {
          // Store the AI food in the database first with intelligent unit
          await apiRequest("POST", "/api/ai-food", {
            id: hashId,
            name: detectedFood.name,
            calories: detectedFood.calories,
            protein: detectedFood.protein,
            carbs: detectedFood.carbs,
            fat: detectedFood.fat,
            portionSize: intelligentUnit.unit,
            category: "AI Detected",
            defaultUnit: intelligentUnit.unit,
          });

          // Wait for food to be stored, then add to meal
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Add to meal with intelligent unit selection and calculated nutrition
          const unitMultiplier = getUnitMultiplier(intelligentUnit.unit, {
            name: detectedFood.name,
            category: "AI Detected",
          });

          console.log(
            `AI Camera - Adding ${detectedFood.name} with unit: ${intelligentUnit.unit}, quantity: ${intelligentUnit.quantity}, multiplier: ${unitMultiplier}`,
          );

          await new Promise((resolve, reject) => {
            addMealMutation.mutate(
              {
                foodId: hashId,
                quantity: intelligentUnit.quantity,
                unit: intelligentUnit.unit,
                sessionId,
                date: selectedDate,
              },
              {
                onSuccess: (data) => {
                  console.log(
                    `Successfully added ${detectedFood.name} to meal with ID:`,
                    data,
                  );
                  // Immediate local cache update with selected date
                  const dateParam =
                    selectedDate || new Date().toISOString().split("T")[0];
                  queryClient.invalidateQueries({
                    queryKey: [`/api/meal/${sessionId}/${dateParam}`],
                  });
                  queryClient.invalidateQueries({
                    queryKey: [`/api/meal/${sessionId}`],
                  });
                  resolve(true);
                },
                onError: (error) => {
                  console.error(
                    `Failed to add ${detectedFood.name} to meal:`,
                    error,
                  );
                  reject(error);
                },
              },
            );
          });

          addedCount++;
        } catch (error) {
          console.error(`Error adding ${detectedFood.name}:`, error);
        }
      }

      // Force immediate UI update now that foods are properly stored
      const dateParam = selectedDate || new Date().toISOString().split("T")[0];
      queryClient.invalidateQueries({
        queryKey: [`/api/meal/${sessionId}/${dateParam}`],
      });
      queryClient.invalidateQueries({ queryKey: [`/api/meal/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-summary`] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage-stats"] });

      // Immediately refetch usage stats to update counter
      refetchUsageStats();

      if (onMealItemAdded) {
        onMealItemAdded();
      }

      // Reset camera after successful analysis and food addition
      toast({
        title: "Foods Added Successfully",
        description: `${addedCount} food items added to your meal`,
      });

      // Reset camera state after successful completion
      setTimeout(() => {
        resetCamera();
      }, 1500); // Give user time to see the success message
    } catch (error) {
      console.error("Error adding detected foods:", error);
      toast({
        title: "Error Adding Foods",
        description: "Failed to add some foods to your meal",
        variant: "destructive",
      });
      // Reset camera even on error after a delay
      setTimeout(() => {
        resetCamera();
      }, 2000);
    }
  };

  // Calculate remaining scans - use server data directly
  const isPremium = usageStats?.isPremium || false;
  const photoLimit = usageStats?.limits?.photos || (isPremium ? 5 : 2);
  const photosUsed = usageStats?.photos || 0;
  const remainingScans =
    usageStats?.remaining?.photos !== undefined
      ? usageStats.remaining.photos
      : Math.max(0, photoLimit - photosUsed);
  const isLimitReached = remainingScans === 0;

  console.log("FoodCamera usage data:", {
    isPremium,
    photoLimit,
    photosUsed,
    remainingScans,
    isLimitReached,
    usageStats: {
      isPremium: usageStats?.isPremium,
      limits: usageStats?.limits,
      remaining: usageStats?.remaining,
      photos: usageStats?.photos,
    },
  });

  // Fix for premium users not getting upgrade screen
  const shouldShowUpgradeModal = !isPremium && isLimitReached;

  return (
    <>
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-800 dark:text-purple-200">
            <Camera className="w-5 h-5 mr-2" />
            AI Food Camera
            {isAuthenticated && (
              <Badge
                variant="outline"
                className="ml-auto text-xs border-purple-300 bg-[#1b2027]"
              >
                {remainingScans} scans left
              </Badge>
            )}
          </CardTitle>
          {isLimitReached && isAuthenticated && (
            <div className="text-sm text-orange-600 p-2 rounded-md border border-orange-200 mt-2 flex items-center justify-between bg-[#ffffff]">
              <span>
                Camera Daily Limit Reached.{" "}
                {isPremium
                  ? "Use the Food Search."
                  : "Upgrade to premium for more scans."}
              </span>
              {!isPremium && (
                <Button
                  onClick={() => setShowSubscriptionModal(true)}
                  size="sm"
                  className="ml-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
                >
                  Upgrade to Premium
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!capturedImage && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Take a photo or upload an image to instantly identify food and
                get nutrition information.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={startCamera}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isAnalyzing || (isLimitReached && isAuthenticated)}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Open Camera
                </Button>
                <Button
                  onClick={openFileUpload}
                  disabled={isAnalyzing || (isLimitReached && isAuthenticated)}
                  variant="outline"
                  className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              </div>

              {cameraError && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-center text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm">Camera Error: {cameraError}</span>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {isOpen && cameraMode === "camera" && !capturedImage && (
            <div className="space-y-4">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover bg-black"
                  style={{
                    display: "block",
                    minHeight: "256px",
                  }}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Camera overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Viewfinder guide */}
                  <div className="absolute inset-4 border-2 border-white/30 rounded-lg"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 border-2 border-white/50 rounded-full"></div>
                </div>

                {/* Loading overlay */}
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm">Initializing camera...</p>
                    </div>
                  </div>
                )}

                {/* Status indicator */}
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {cameraReady ? "📹 Live" : "Starting..."}
                </div>

                {/* Instructions */}
                {cameraReady && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded">
                    Position food in center and tap Capture
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={capturePhoto}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 shadow-lg"
                  disabled={!cameraReady}
                  size="lg"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  {cameraReady
                    ? "📸 Capture Food Photo"
                    : "Initializing Camera..."}
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="px-4 py-3 border-2 border-gray-300 hover:border-gray-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {!cameraReady && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center text-blue-600 dark:text-blue-400">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="text-sm">Initializing camera...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {capturedImage && (
            <div className="space-y-4">
              <div className="relative flex justify-center">
                <img
                  src={capturedImage}
                  alt="Captured food"
                  className="w-64 h-64 object-cover rounded-lg border-2 border-purple-200 dark:border-purple-700"
                />
                <Button
                  onClick={stopCamera}
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={analyzeFood}
                  disabled={isAnalyzing || (isLimitReached && isAuthenticated)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : isLimitReached && isAuthenticated ? (
                    "Daily Limit Reached"
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Analyze Food
                    </>
                  )}
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Retake
                </Button>
              </div>

              {analysisResult && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-700 dark:text-green-300">
                      Food Analysis Results - Added to Current Meal
                    </h3>
                  </div>

                  {analysisResult.foods && analysisResult.foods.length > 0 ? (
                    <div className="space-y-3">
                      {analysisResult.foods.map((food, index) => (
                        <div
                          key={index}
                          className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {food.name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Confidence:{" "}
                                {Math.min(
                                  100,
                                  Math.round(food.confidence * 100),
                                )}
                                %
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">
                                Calories:
                              </span>
                              <span className="ml-1 font-medium">
                                {food.calories}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">
                                Protein:
                              </span>
                              <span className="ml-1 font-medium">
                                {food.protein}g
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">
                                Carbs:
                              </span>
                              <span className="ml-1 font-medium">
                                {food.carbs}g
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">
                                Fat:
                              </span>
                              <span className="ml-1 font-medium">
                                {food.fat}g
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Estimated: {food.estimatedQuantity}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                          No food items detected. Try taking a clearer photo or
                          uploading a different image.
                        </p>
                      </div>
                    </div>
                  )}

                  {analysisResult.suggestions &&
                    analysisResult.suggestions.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                          AI Suggestions:
                        </h4>
                        <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                          {analysisResult.suggestions.map(
                            (suggestion, index) => (
                              <li key={index}>• {suggestion}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </>
  );
}
