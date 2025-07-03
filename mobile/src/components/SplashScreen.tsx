import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text variant="headlineLarge" style={styles.title}>
        Calonik.ai
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Smart Calorie Tracking
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#94A3B8',
  },
});