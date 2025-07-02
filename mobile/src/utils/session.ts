import * as SecureStore from 'expo-secure-store';

export class SessionManager {
  private static readonly SESSION_KEY = 'calonik_session_id';

  static getSessionId(): string {
    // For demo purposes, using a static session ID
    // In production, this would be managed through authentication
    return 'mobile_user_session';
  }

  static async storeSessionId(sessionId: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.SESSION_KEY, sessionId);
    } catch (error) {
      console.error('Failed to store session ID:', error);
    }
  }

  static async getStoredSessionId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.SESSION_KEY);
    } catch (error) {
      console.error('Failed to retrieve session ID:', error);
      return null;
    }
  }

  static async clearSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }
}