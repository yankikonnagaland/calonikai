import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { camera, close, checkmark } from 'ionicons/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/ApiService';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  selectedDate: string;
}

interface DetectedFood {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const CameraModal: React.FC<CameraModalProps> = ({ 
  isOpen, 
  onClose, 
  sessionId, 
  selectedDate 
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFoods, setSelectedFoods] = useState<Set<number>>(new Set());

  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: (imageData: string) => apiService.analyzeFood(imageData, sessionId),
    onSuccess: (data) => {
      setDetectedFoods(data.foods || []);
      setIsAnalyzing(false);
    },
    onError: (error) => {
      console.error('Analysis failed:', error);
      setIsAnalyzing(false);
    },
  });

  const addMealMutation = useMutation({
    mutationFn: (mealData: any) => apiService.addMeal(mealData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', sessionId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['dailySummary', sessionId, selectedDate] });
    },
  });

  const takePicture = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        setCapturedImage(image.dataUrl);
        setIsAnalyzing(true);
        setDetectedFoods([]);
        setSelectedFoods(new Set());
        
        // Start analysis
        analyzeMutation.mutate(image.dataUrl);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
    }
  };

  const selectFromGallery = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (image.dataUrl) {
        setCapturedImage(image.dataUrl);
        setIsAnalyzing(true);
        setDetectedFoods([]);
        setSelectedFoods(new Set());
        
        // Start analysis
        analyzeMutation.mutate(image.dataUrl);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  const toggleFoodSelection = (index: number) => {
    const newSelected = new Set(selectedFoods);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedFoods(newSelected);
  };

  const addSelectedFoods = async () => {
    const foodsToAdd = detectedFoods.filter((_, index) => 
      selectedFoods.has(index)
    );

    for (const food of foodsToAdd) {
      try {
        await addMealMutation.mutateAsync({
          sessionId,
          date: selectedDate,
          foodName: food.name,
          quantity: food.quantity,
          unit: food.unit,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
        });
      } catch (error) {
        console.error('Error adding food:', error);
      }
    }

    handleClose();
  };

  const handleClose = () => {
    setCapturedImage(null);
    setDetectedFoods([]);
    setSelectedFoods(new Set());
    setIsAnalyzing(false);
    onClose();
  };

  const updateFoodQuantity = (index: number, quantity: number) => {
    const updatedFoods = [...detectedFoods];
    const food = updatedFoods[index];
    const ratio = quantity / food.quantity;
    
    updatedFoods[index] = {
      ...food,
      quantity,
      calories: Math.round(food.calories * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10,
    };
    
    setDetectedFoods(updatedFoods);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>AI Food Scanner</IonTitle>
          <IonButton 
            slot="end" 
            fill="clear" 
            onClick={handleClose}
          >
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        {!capturedImage ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <IonButton 
              expand="block" 
              onClick={takePicture}
              style={{ margin: '10px 0' }}
            >
              <IonIcon icon={camera} slot="start" />
              Take Photo
            </IonButton>
            
            <IonButton 
              expand="block" 
              fill="outline"
              onClick={selectFromGallery}
              style={{ margin: '10px 0' }}
            >
              Select from Gallery
            </IonButton>
          </div>
        ) : (
          <div>
            <img 
              src={capturedImage} 
              alt="Captured food"
              style={{ 
                width: '100%', 
                maxHeight: '200px', 
                objectFit: 'cover' 
              }}
            />
            
            {isAnalyzing ? (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <IonSpinner name="circular" />
                <p style={{ marginTop: '10px' }}>Analyzing food...</p>
              </div>
            ) : detectedFoods.length > 0 ? (
              <div style={{ padding: '10px' }}>
                <h3>Detected Foods:</h3>
                {detectedFoods.map((food, index) => (
                  <IonCard key={index}>
                    <IonCardHeader>
                      <IonCardTitle>
                        <IonButton
                          fill={selectedFoods.has(index) ? 'solid' : 'outline'}
                          color={selectedFoods.has(index) ? 'primary' : 'medium'}
                          onClick={() => toggleFoodSelection(index)}
                          size="small"
                          style={{ marginRight: '10px' }}
                        >
                          <IonIcon icon={checkmark} />
                        </IonButton>
                        {food.name}
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonGrid>
                        <IonRow>
                          <IonCol size="6">
                            <IonItem>
                              <IonLabel position="stacked">Quantity</IonLabel>
                              <IonInput
                                type="number"
                                value={food.quantity}
                                onIonInput={(e) => 
                                  updateFoodQuantity(index, parseInt(e.detail.value!) || 1)
                                }
                              />
                            </IonItem>
                          </IonCol>
                          <IonCol size="6">
                            <IonItem>
                              <IonLabel position="stacked">Unit</IonLabel>
                              <IonLabel>{food.unit}</IonLabel>
                            </IonItem>
                          </IonCol>
                        </IonRow>
                        <IonRow>
                          <IonCol>
                            <p><strong>{food.calories} cal</strong> | 
                               {food.protein}g protein | 
                               {food.carbs}g carbs | 
                               {food.fat}g fat</p>
                          </IonCol>
                        </IonRow>
                      </IonGrid>
                    </IonCardContent>
                  </IonCard>
                ))}
                
                {selectedFoods.size > 0 && (
                  <IonButton 
                    expand="block" 
                    onClick={addSelectedFoods}
                    disabled={addMealMutation.isPending}
                    style={{ marginTop: '20px' }}
                  >
                    {addMealMutation.isPending ? (
                      <IonSpinner name="circular" />
                    ) : (
                      `Add ${selectedFoods.size} Food${selectedFoods.size > 1 ? 's' : ''}`
                    )}
                  </IonButton>
                )}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>No food detected. Try taking another photo.</p>
                <IonButton onClick={() => setCapturedImage(null)}>
                  Take Another Photo
                </IonButton>
              </div>
            )}
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default CameraModal;