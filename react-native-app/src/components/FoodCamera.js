import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import Modal from 'react-native-modal';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { analyzeFoodImage } from '../services/aiService';

export default function FoodCamera({ isVisible, onClose }) {
  const { selectedDate, dispatch } = useApp();
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  React.useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({
          quality: 0.7,
          base64: false,
        });
        setCapturedImage(photo.uri);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    try {
      // Mock AI analysis for demo purposes
      // In a real app, this would call your AI service
      const mockResult = {
        foods: [
          {
            name: 'Grilled Chicken Breast',
            quantity: 1,
            unit: 'piece',
            calories: 231,
            protein: 43.5,
            carbs: 0,
            fat: 5.0,
            confidence: 0.95,
          },
          {
            name: 'Steamed Broccoli',
            quantity: 1,
            unit: 'cup',
            calories: 55,
            protein: 3.7,
            carbs: 11.2,
            fat: 0.6,
            confidence: 0.87,
          },
        ],
        totalCalories: 286,
        confidence: 0.91,
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAnalysisResult(mockResult);
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addFoodsToMeal = () => {
    if (!analysisResult) return;

    analysisResult.foods.forEach((food, index) => {
      const mealItem = {
        id: Date.now() + index,
        foodId: `ai_${Date.now()}_${index}`,
        food: {
          id: `ai_${Date.now()}_${index}`,
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
        },
        quantity: food.quantity,
        unit: food.unit,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        date: selectedDate,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_MEAL', payload: mealItem });
    });

    Alert.alert(
      'Success!',
      `Added ${analysisResult.foods.length} food items to your meal`,
      [{ text: 'OK', onPress: handleClose }]
    );
  };

  const handleClose = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    onClose();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
  };

  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    return (
      <Modal isVisible={isVisible} onBackdropPress={onClose}>
        <View style={styles.modalContainer}>
          <Text style={styles.errorText}>No access to camera</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal 
      isVisible={isVisible} 
      onBackdropPress={onClose}
      style={styles.modal}
    >
      <View style={styles.modalContainer}>
        {!capturedImage ? (
          // Camera View
          <View style={styles.cameraContainer}>
            <Camera 
              style={styles.camera} 
              ref={setCameraRef}
              type={Camera.Constants.Type.back}
            />
            
            <View style={styles.cameraControls}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={pickImageFromLibrary}
              >
                <Ionicons name="images" size={24} color="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Image Analysis View
          <View style={styles.analysisContainer}>
            <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
            
            {!analysisResult ? (
              <View style={styles.analysisControls}>
                <TouchableOpacity 
                  style={[styles.button, styles.primaryButton]}
                  onPress={analyzeImage}
                  disabled={isAnalyzing}
                >
                  <Ionicons 
                    name={isAnalyzing ? 'hourglass' : 'scan'} 
                    size={20} 
                    color="#ffffff" 
                  />
                  <Text style={styles.buttonText}>
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Food'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton]}
                  onPress={retakePhoto}
                >
                  <Ionicons name="camera" size={20} color="#f97316" />
                  <Text style={[styles.buttonText, { color: '#f97316' }]}>
                    Retake Photo
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Detected Foods</Text>
                <Text style={styles.confidenceText}>
                  Confidence: {Math.round(analysisResult.confidence * 100)}%
                </Text>
                
                {analysisResult.foods.map((food, index) => (
                  <View key={index} style={styles.foodResult}>
                    <Text style={styles.foodResultName}>{food.name}</Text>
                    <Text style={styles.foodResultDetails}>
                      {food.quantity} {food.unit} • {food.calories} cal
                    </Text>
                    <Text style={styles.foodResultMacros}>
                      P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                    </Text>
                  </View>
                ))}
                
                <View style={styles.totalResult}>
                  <Text style={styles.totalResultText}>
                    Total: {analysisResult.totalCalories} calories
                  </Text>
                </View>
                
                <View style={styles.resultsControls}>
                  <TouchableOpacity 
                    style={[styles.button, styles.primaryButton]}
                    onPress={addFoodsToMeal}
                  >
                    <Ionicons name="add" size={20} color="#ffffff" />
                    <Text style={styles.buttonText}>Add to Meal</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.secondaryButton]}
                    onPress={retakePhoto}
                  >
                    <Ionicons name="camera" size={20} color="#f97316" />
                    <Text style={[styles.buttonText, { color: '#f97316' }]}>
                      Try Again
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 50,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  analysisContainer: {
    flex: 1,
    padding: 16,
  },
  capturedImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  analysisControls: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#f97316',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#f97316',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  confidenceText: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 16,
  },
  foodResult: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  foodResultName: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  foodResultDetails: {
    color: '#f97316',
    fontSize: 14,
    marginBottom: 2,
  },
  foodResultMacros: {
    color: '#94a3b8',
    fontSize: 12,
  },
  totalResult: {
    backgroundColor: '#f97316',
    padding: 12,
    borderRadius: 6,
    marginVertical: 16,
    alignItems: 'center',
  },
  totalResultText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsControls: {
    gap: 12,
    marginTop: 'auto',
  },
  errorText: {
    color: '#f1f5f9',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});