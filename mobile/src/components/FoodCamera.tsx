import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services/api';

interface FoodCameraProps {
  onFoodDetected: (foods: any[]) => void;
  onClose: () => void;
}

const FoodCameraComponent: React.FC<FoodCameraProps> = ({
  onFoodDetected,
  onClose,
}) => {
  const [type, setType] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<Camera>(null);

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} mode="contained">
          Grant Permission
        </Button>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsAnalyzing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        // Analyze the image
        const result = await apiService.analyzeFood(photo.uri);
        onFoodDetected(result.foods || []);
        Alert.alert('Success', 'Food detected! Check your meal tracker.');
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to analyze food image');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsAnalyzing(true);
        const imageUri = result.assets[0].uri;
        
        // Analyze the image
        const analysisResult = await apiService.analyzeFood(imageUri);
        onFoodDetected(analysisResult.foods || []);
        Alert.alert('Success', 'Food detected! Check your meal tracker.');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to analyze food image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCameraType = () => {
    setType(current => (current === CameraType.back ? CameraType.front : CameraType.back));
  };

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={30} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraType}>
            <Icon name="flip-camera-ios" size={30} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
            <Icon name="photo-library" size={30} color="white" />
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isAnalyzing && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Text style={styles.buttonText}>Analyzing...</Text>
            ) : (
              <Icon name="camera" size={40} color="white" />
            )}
          </TouchableOpacity>

          <View style={styles.placeholder} />
        </View>
      </Camera>

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          Point your camera at food to analyze nutrition content
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 20,
  },
  closeButton: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 10,
  },
  flipButton: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 10,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  galleryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 15,
    minWidth: 70,
  },
  captureButton: {
    backgroundColor: '#6366F1',
    borderRadius: 40,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    minHeight: 80,
  },
  captureButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  placeholder: {
    minWidth: 70,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  instructionContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 15,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default FoodCameraComponent;