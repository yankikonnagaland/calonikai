import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const LogoHeader = () => {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/calonik-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#0F172A',
  },
  logo: {
    width: 120,
    height: 60,
  },
});

export default LogoHeader;