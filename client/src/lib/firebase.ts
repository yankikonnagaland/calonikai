import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    console.log("Firebase config debug:", {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Missing',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      currentDomain: window.location.hostname
    });
    
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Sign-in successful:", result.user.email);
    return result.user;
  } catch (error: any) {
    console.error("Google sign-in error details:", {
      code: error.code,
      message: error.message,
      customData: error.customData,
      currentDomain: window.location.hostname,
      currentOrigin: window.location.origin
    });
    
    // Handle unauthorized domain error specifically
    if (error.code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      console.error(`Domain ${currentDomain} not authorized in Firebase. Please add it to Firebase Console.`);
      throw new Error(`Authentication failed: Domain ${currentDomain} needs to be added to Firebase authorized domains. Please contact support or check the Firebase configuration.`);
    }
    
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};