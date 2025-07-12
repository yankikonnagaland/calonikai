import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Image,
  ActivityIndicator 
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '../services/ApiService';

export default function FoodCameraModal({ onClose, onFoodDetected, sessionId }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const cameraRef = useRef(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current && cameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
        });
        setCapturedImage(photo);
        await analyzeImage(photo.base64);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
        console.error('Camera error:', error);
      }
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const image = result.assets[0];
        setCapturedImage({ uri: image.uri });
        await analyzeImage(image.base64);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const analyzeImage = async (base64Image) => {
    try {
      setIsAnalyzing(true);
      const result = await ApiService.analyzeFood(base64Image);
      
      if (result && result.foods && result.foods.length > 0) {
        setAnalysisResult(result);
      } else {
        Alert.alert('No Food Detected', 'Unable to identify food in this image. Please try another photo.');
      }
    } catch (error) {
      Alert.alert('Analysis Failed', 'Unable to analyze the image. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectDetectedFood = (food) => {
    onFoodDetected(food);
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={64} color="#6b7280" />
          <Text style={styles.permissionText}>Camera permission denied</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (capturedImage && analysisResult) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Food Analysis Result</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <Image source={{ uri: capturedImage.uri }} style={styles.capturedImage} />

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Detected Foods:</Text>
          {analysisResult.foods.map((food, index) => (
            <TouchableOpacity
              key={index}
              style={styles.foodResult}
              onPress={() => selectDetectedFood(food)}
            >
              <View>
                <Text style={styles.foodResultName}>{food.name}</Text>
                <Text style={styles.foodResultNutrition}>
                  {food.calories} cal • {food.protein}g protein
                </Text>
                <Text style={styles.foodResultPortion}>
                  Portion: {food.smartPortion || 'Standard serving'}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.retakeButton} onPress={resetCamera}>
            <Text style={styles.retakeButtonText}>Take Another Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (capturedImage && isAnalyzing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analyzing Food...</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <Image source={{ uri: capturedImage.uri }} style={styles.capturedImage} />

        <View style={styles.analysingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.analysingText}>AI is analyzing your food...</Text>
          <Text style={styles.analysingSubtext}>This may take a few seconds</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Food Recognition</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={Camera.Constants.Type.back}
        onCameraReady={() => setCameraReady(true)}
      >
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraFrame} />
          <Text style={styles.cameraInstruction}>
            Position food in the frame and tap capture
          </Text>
        </View>
      </Camera>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.galleryButton} onPress={pickImageFromGallery}>
          <Ionicons name="images" size={24} color="#ffffff" />
          <Text style={styles.controlButtonText}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.captureButton, !cameraReady && styles.captureButtonDisabled]} 
          onPress={takePicture}
          disabled={!cameraReady}
        >
          <Ionicons name="camera" size={32} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.placeholder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#1f2937',
  },
  headerTitle: {
    color: '#ffffff',
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
  cameraFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  cameraInstruction: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 30,
    backgroundColor: '#1f2937',
  },
  galleryButton: {
    alignItems: 'center',
    padding: 10,
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 4,
  },
  captureButton: {
    backgroundColor: '#10b981',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  placeholder: {
    width: 44,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  permissionText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  closeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  capturedImage: {
    width: 300,
    height: 300,
    borderRadius: 20,
    alignSelf: 'center',
    marginVertical: 20,
  },
  analysingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  analysingText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '600',
  },
  analysingSubtext: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 8,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 20,
  },
  resultsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  foodResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  foodResultName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  foodResultNutrition: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 2,
  },
  foodResultPortion: {
    color: '#10b981',
    fontSize: 12,
    marginTop: 2,
  },
  bottomActions: {
    backgroundColor: '#1f2937',
    padding: 20,
  },
  retakeButton: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});