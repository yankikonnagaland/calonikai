import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev';

export class AuthService {
  static async checkAuthStatus() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const user = await response.json();
        return { user, token };
      } else {
        // Token is invalid, remove it
        await AsyncStorage.removeItem('authToken');
        return null;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      return null;
    }
  }

  static async loginWithGoogle() {
    try {
      // For mobile, we'll implement a simplified auth flow
      // In production, you'd use @react-native-google-signin/google-signin
      
      // For now, let's use a guest login that still gives access to features
      const guestUser = {
        id: `mobile_guest_${Date.now()}`,
        email: 'guest@mobile.app',
        name: 'Mobile Guest',
        subscriptionStatus: 'premium', // Give mobile users premium for testing
      };

      // Store auth token
      const mockToken = `mobile_token_${Date.now()}`;
      await AsyncStorage.setItem('authToken', mockToken);
      await AsyncStorage.setItem('userProfile', JSON.stringify(guestUser));
      
      return guestUser;
    } catch (error) {
      console.error('Error logging in:', error);
      throw new Error('Login failed');
    }
  }

  static async logout() {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userProfile']);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  static async getCurrentUser() {
    try {
      const userProfile = await AsyncStorage.getItem('userProfile');
      return userProfile ? JSON.parse(userProfile) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}