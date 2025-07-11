import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CameraScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef(null);

  const API_BASE = 'https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api';

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const getSessionId = async () => {
    let sessionId = await AsyncStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
        });
        setCapturedImage(photo);
        analyzeImage(photo);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
        console.error('Camera error:', error);
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0]);
        analyzeImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const analyzeImage = async (imageData) => {
    setIsAnalyzing(true);
    try {
      const sessionId = await getSessionId();
      
      const formData = new FormData();
      formData.append('image', {
        uri: imageData.uri,
        type: 'image/jpeg',
        name: 'food-image.jpg',
      });

      const response = await fetch(`${API_BASE}/analyze-food-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-session-id': sessionId,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setAnalysisResult(result.analysis);
      } else {
        Alert.alert('Analysis Failed', result.error || 'Failed to analyze image');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze image');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addDetectedFoodToMeal = async (food) => {
    try {
      const sessionId = await getSessionId();
      const today = new Date().toISOString().split('T')[0];

      const response = await fetch(`${API_BASE}/meal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          sessionId,
          foodId: food.id,
          quantity: food.quantity || 1,
          unit: food.unit || 'serving',
          date: today,
          frontendCalories: food.calories,
          frontendProtein: food.protein,
          frontendCarbs: food.carbs,
          frontendFat: food.fat,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', `${food.name} added to your meal!`);
        // Reset camera state
        setCapturedImage(null);
        setAnalysisResult(null);
      } else {
        Alert.alert('Error', 'Failed to add food to meal');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add food to meal');
      console.error('Add food error:', error);
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>No access to camera</Text>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {capturedImage ? (
        <ScrollView style={styles.resultContainer}>
          {/* Captured Image */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: capturedImage.uri }} style={styles.capturedImage} />
          </View>

          {/* Analysis Status */}
          {isAnalyzing ? (
            <View style={styles.analysisContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.analysisText}>Analyzing your food with AI...</Text>
            </View>
          ) : analysisResult ? (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>🤖 AI Detected Foods:</Text>
              {analysisResult.foods?.map((food, index) => (
                <View key={index} style={styles.foodCard}>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.foodDetails}>
                      {Math.round(food.calories)} cal • {Math.round(food.protein)}g protein
                    </Text>
                    <Text style={styles.foodPortion}>
                      Portion: {food.quantity} {food.unit}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addFoodButton}
                    onPress={() => addDetectedFoodToMeal(food)}
                  >
                    <Text style={styles.addFoodButtonText}>Add to Meal</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.analysisContainer}>
              <Text style={styles.errorText}>Failed to analyze image</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetCamera}>
              <Text style={styles.secondaryButtonText}>Take Another Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.cameraContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>AI Food Camera</Text>
            <Text style={styles.subtitle}>Point camera at your food for instant nutrition analysis</Text>
          </View>

          {/* Camera View */}
          <View style={styles.cameraWrapper}>
            <Camera
              style={styles.camera}
              ref={cameraRef}
              onCameraReady={() => setCameraReady(true)}
            />
            
            {/* Camera Overlay */}
            <View style={styles.cameraOverlay}>
              <View style={styles.focusArea} />
            </View>
          </View>

          {/* Camera Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <Text style={styles.controlButtonText}>📱 Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.captureButton, !cameraReady && styles.captureButtonDisabled]}
              onPress={takePicture}
              disabled={!cameraReady}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.controlButtonText}>← Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraContainer: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  cameraWrapper: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusArea: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonDisabled: {
    backgroundColor: '#64748B',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  galleryButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    padding: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  capturedImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  analysisContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  analysisText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  resultsContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  foodCard: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  foodInfo: {
    marginBottom: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  foodDetails: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  foodPortion: {
    fontSize: 12,
    color: '#64748B',
  },
  addFoodButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addFoodButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default CameraScreen;