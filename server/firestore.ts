// Firebase initialization made optional to prevent startup crashes
let db: any = null;
let initialized = false;

async function initializeFirebase() {
  if (initialized) return db;
  
  try {
    // Only import and initialize Firebase if credentials are available
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');
      
      if (!getApps().length) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: privateKey,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        });
        db = getFirestore();
        console.log("Firebase Admin SDK initialized successfully");
      }
    } else {
      console.log("Firebase credentials not provided, using fallback storage");
    }
  } catch (error) {
    console.warn("Firebase initialization failed, using fallback storage:", error);
    db = null;
  }
  
  initialized = true;
  return db;
}

// For backward compatibility, but Firebase won't be initialized until explicitly called
export { db, initializeFirebase };