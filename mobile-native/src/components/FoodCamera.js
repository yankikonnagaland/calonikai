import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function FoodCamera({ onClose, onFoodDetected }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants?.Type?.back || 'back');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
        });
        setCapturedImage(photo.uri);
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
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    try {
      // Mock AI analysis - in real app this would call your backend API
      // Simulating API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock detected foods
      const mockFoods = [
        {
          foodName: 'Rice Bowl',
          quantity: 1,
          unit: 'bowl',
          calories: 206,
          protein: 4.3,
          carbs: 45,
          fat: 0.4,
        },
        {
          foodName: 'Dal',
          quantity: 0.5,
          unit: 'bowl',
          calories: 115,
          protein: 6.8,
          carbs: 19,
          fat: 0.5,
        },
      ];

      setAnalysisResult(mockFoods);
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddFoods = () => {
    if (analysisResult && onFoodDetected) {
      onFoodDetected(analysisResult);
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="camera-off" size={64} color="#64748b" />
          <Text style={styles.errorTitle}>Camera Access Denied</Text>
          <Text style={styles.errorText}>
            Please enable camera access in your device settings to use food scanning.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Scanner</Text>
        <TouchableOpacity onPress={() => setType(type === 'back' ? 'front' : 'back')}>
          <Ionicons name="camera-reverse" size={24} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      {!capturedImage ? (
        <>
          {/* Camera View */}
          <Camera style={styles.camera} type={type} ref={cameraRef}>
            <View style={styles.cameraOverlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.instructionText}>
                Point your camera at food and tap the capture button
              </Text>
            </View>
          </Camera>

          {/* Camera Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <Ionicons name="images" size={24} color="#f8fafc" />
              <Text style={styles.controlText}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            
            <View style={styles.placeholder} />
          </View>
        </>
      ) : (
        <>
          {/* Captured Image View */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
            
            {isAnalyzing && (
              <View style={styles.analyzingOverlay}>
                <ActivityIndicator size="large" color="#f97316" />
                <Text style={styles.analyzingText}>Analyzing food...</Text>
              </View>
            )}
          </View>

          {/* Analysis Results */}
          {analysisResult && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Detected Foods:</Text>
              {analysisResult.map((food, index) => (
                <View key={index} style={styles.foodItem}>
                  <Text style={styles.foodName}>{food.foodName}</Text>
                  <Text style={styles.foodDetails}>
                    {food.quantity} {food.unit} • {Math.round(food.calories)} cal
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Image Controls */}
          <View style={styles.imageControls}>
            <TouchableOpacity style={styles.retakeButton} onPress={resetCamera}>
              <Ionicons name="camera" size={20} color="#f8fafc" />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
            
            {!analysisResult && !isAnalyzing && (
              <TouchableOpacity style={styles.analyzeButton} onPress={analyzeImage}>
                <Ionicons name="scan" size={20} color="#ffffff" />
                <Text style={styles.analyzeText}>Analyze</Text>
              </TouchableOpacity>
            )}
            
            {analysisResult && (
              <TouchableOpacity style={styles.addButton} onPress={handleAddFoods}>
                <Ionicons name="add" size={20} color="#ffffff" />
                <Text style={styles.addText}>Add Foods</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#f8fafc',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e293b',
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#f97316',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  instructionText: {
    color: '#f8fafc',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    backgroundColor: '#1e293b',
  },
  galleryButton: {
    alignItems: 'center',
  },
  controlText: {
    color: '#f8fafc',
    fontSize: 12,
    marginTop: 4,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  placeholder: {
    width: 48,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  capturedImage: {
    flex: 1,
    width: '100%',
    resizeMode: 'contain',
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: '#f8fafc',
    fontSize: 16,
    marginTop: 16,
  },
  resultsContainer: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  resultsTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  foodItem: {
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  foodName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  foodDetails: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  imageControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retakeText: {
    color: '#f8fafc',
    marginLeft: 8,
    fontSize: 16,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  analyzeText: {
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addText: {
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});