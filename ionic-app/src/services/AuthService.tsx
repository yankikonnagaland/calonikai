import React, { createContext, useContext, useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';

interface User {
  id: string;
  email?: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  sessionId: string;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string>('guest_user');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const { value: storedUser } = await Preferences.get({ key: 'calonik_user' });
      const { value: storedSessionId } = await Preferences.get({ key: 'calonik_session_id' });
      
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      
      if (storedSessionId) {
        setSessionId(storedSessionId);
      } else {
        // Generate a unique session ID for guest users
        const guestSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(guestSessionId);
        await Preferences.set({ key: 'calonik_session_id', value: guestSessionId });
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User) => {
    try {
      setUser(userData);
      setSessionId(userData.id);
      
      await Preferences.set({ key: 'calonik_user', value: JSON.stringify(userData) });
      await Preferences.set({ key: 'calonik_session_id', value: userData.id });
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      
      // Generate new guest session ID
      const guestSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(guestSessionId);
      
      await Preferences.remove({ key: 'calonik_user' });
      await Preferences.set({ key: 'calonik_session_id', value: guestSessionId });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value: AuthContextType = {
    user,
    sessionId,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};