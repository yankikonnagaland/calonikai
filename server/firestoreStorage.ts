import { db, initializeFirebase } from './firestore';
import type {
  Food,
  MealItem,
  MealItemWithFood,
  UserProfile,
  Exercise,
  DailySummary,
  DailyWeight,
  User,
  UpsertUser,
  InsertMealItem,
  InsertUserProfile,
  InsertExercise,
  InsertDailySummary,
  InsertDailyWeight,
} from '@shared/schema';
import type { IStorage } from './storage';

export class FirestoreStorage implements IStorage {
  // Food operations
  async getAllFoods(): Promise<Food[]> {
    const firestore = await initializeFirebase();
    if (!firestore) {
      console.warn('Firestore not available, using fallback storage');
      return [];
    }
    const snapshot = await firestore.collection('foods').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Food));
  }

  async searchFoods(query: string): Promise<Food[]> {
    const snapshot = await db.collection('foods')
      .where('name', '>=', query.toLowerCase())
      .where('name', '<=', query.toLowerCase() + '\uf8ff')
      .limit(20)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Food));
  }

  async getFoodById(id: number): Promise<Food | undefined> {
    const doc = await db.collection('foods').doc(id.toString()).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Food;
  }

  async storeAiFood(food: Food): Promise<void> {
    await db.collection('foods').doc(food.id.toString()).set(food);
  }

  // Meal operations
  async getMealItems(sessionId: string, date?: string): Promise<MealItemWithFood[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const snapshot = await db.collection('mealItems')
      .where('sessionId', '==', sessionId)
      .where('date', '==', targetDate)
      .get();

    const mealItems: MealItemWithFood[] = [];
    
    for (const doc of snapshot.docs) {
      const mealItem = { id: doc.id, ...doc.data() } as MealItem;
      const food = await this.getFoodById(mealItem.foodId);
      
      if (food) {
        mealItems.push({
          ...mealItem,
          food,
        });
      }
    }

    return mealItems;
  }

  async addMealItem(mealItem: InsertMealItem): Promise<MealItem> {
    const docRef = await db.collection('mealItems').add({
      ...mealItem,
      createdAt: new Date(),
    });
    
    const doc = await docRef.get();
    return { id: docRef.id, ...doc.data() } as MealItem;
  }

  async removeMealItem(id: number): Promise<boolean> {
    try {
      await db.collection('mealItems').doc(id.toString()).delete();
      return true;
    } catch {
      return false;
    }
  }

  async clearMeal(sessionId: string, date?: string): Promise<boolean> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const snapshot = await db.collection('mealItems')
        .where('sessionId', '==', sessionId)
        .where('date', '==', targetDate)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      return true;
    } catch {
      return false;
    }
  }

  // Profile operations
  async saveUserProfile(profile: InsertUserProfile & { bmr: number; tdee: number; targetCalories: number }): Promise<UserProfile> {
    const docRef = await db.collection('userProfiles').add({
      ...profile,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const doc = await docRef.get();
    return { id: docRef.id, ...doc.data() } as UserProfile;
  }

  async getUserProfile(sessionId: string): Promise<UserProfile | undefined> {
    const snapshot = await db.collection('userProfiles')
      .where('sessionId', '==', sessionId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return undefined;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as UserProfile;
  }

  // Exercise operations
  async addExercise(exercise: InsertExercise): Promise<Exercise> {
    const docRef = await db.collection('exercises').add({
      ...exercise,
      createdAt: new Date(),
    });
    
    const doc = await docRef.get();
    return { id: docRef.id, ...doc.data() } as Exercise;
  }

  async getExercises(sessionId: string, date?: string): Promise<Exercise[]> {
    let query = db.collection('exercises').where('sessionId', '==', sessionId);
    
    if (date) {
      query = query.where('date', '==', date);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
  }

  async removeExercise(id: number): Promise<boolean> {
    try {
      await db.collection('exercises').doc(id.toString()).delete();
      return true;
    } catch {
      return false;
    }
  }

  async clearExercises(sessionId: string): Promise<boolean> {
    try {
      const snapshot = await db.collection('exercises')
        .where('sessionId', '==', sessionId)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      return true;
    } catch {
      return false;
    }
  }

  // Daily summary operations
  async saveDailySummary(summary: InsertDailySummary): Promise<DailySummary> {
    const docRef = await db.collection('dailySummaries').add({
      ...summary,
      createdAt: new Date(),
    });
    
    const doc = await docRef.get();
    return { id: docRef.id, ...doc.data() } as DailySummary;
  }

  async getDailySummary(sessionId: string, date: string): Promise<DailySummary | undefined> {
    const snapshot = await db.collection('dailySummaries')
      .where('sessionId', '==', sessionId)
      .where('date', '==', date)
      .limit(1)
      .get();

    if (snapshot.empty) return undefined;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as DailySummary;
  }

  async getDailySummaries(sessionId: string): Promise<DailySummary[]> {
    const snapshot = await db.collection('dailySummaries')
      .where('sessionId', '==', sessionId)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailySummary));
  }

  // Daily weight operations
  async saveDailyWeight(weight: InsertDailyWeight): Promise<DailyWeight> {
    const docRef = await db.collection('dailyWeights').add({
      ...weight,
      createdAt: new Date(),
    });
    
    const doc = await docRef.get();
    return { id: docRef.id, ...doc.data() } as DailyWeight;
  }

  async getDailyWeight(sessionId: string, date: string): Promise<DailyWeight | undefined> {
    const snapshot = await db.collection('dailyWeights')
      .where('sessionId', '==', sessionId)
      .where('date', '==', date)
      .limit(1)
      .get();

    if (snapshot.empty) return undefined;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as DailyWeight;
  }

  async getDailyWeights(sessionId: string): Promise<DailyWeight[]> {
    const snapshot = await db.collection('dailyWeights')
      .where('sessionId', '==', sessionId)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyWeight));
  }

  // User operations (required for authentication)
  async getUser(id: string): Promise<User | undefined> {
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const snapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) return undefined;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const docRef = await db.collection('users').add({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const doc = await docRef.get();
    return { id: docRef.id, ...doc.data() } as User;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (userData.id) {
      // Update existing user
      await db.collection('users').doc(userData.id).set({
        ...userData,
        updatedAt: new Date(),
      }, { merge: true });
      
      const doc = await db.collection('users').doc(userData.id).get();
      return { id: doc.id, ...doc.data() } as User;
    } else {
      // Create new user
      return this.createUser(userData);
    }
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User> {
    await db.collection('users').doc(userId).update({
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      updatedAt: new Date(),
    });
    
    const doc = await db.collection('users').doc(userId).get();
    return { id: doc.id, ...doc.data() } as User;
  }

  // Usage tracking operations
  async trackUsage(userId: string, actionType: "meal_add" | "photo_analyze"): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const usageId = `${userId}_${actionType}_${today}`;
    
    const doc = await db.collection('usageTracking').doc(usageId).get();
    
    if (doc.exists) {
      await db.collection('usageTracking').doc(usageId).update({
        count: (doc.data()?.count || 0) + 1,
        updatedAt: new Date(),
      });
    } else {
      await db.collection('usageTracking').doc(usageId).set({
        userId,
        actionType,
        date: today,
        count: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  async getUserUsage(userId: string, actionType: "meal_add" | "photo_analyze", date: string): Promise<number> {
    const usageId = `${userId}_${actionType}_${date}`;
    const doc = await db.collection('usageTracking').doc(usageId).get();
    
    return doc.exists ? (doc.data()?.count || 0) : 0;
  }

  async canUserPerformAction(userId: string, actionType: "meal_add" | "photo_analyze"): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    // Premium users have higher limits
    const limits = user.subscriptionStatus === 'premium' 
      ? { meal_add: 20, photo_analyze: 5 }
      : { meal_add: 1, photo_analyze: 2 };

    const today = new Date().toISOString().split('T')[0];
    const currentUsage = await this.getUserUsage(userId, actionType, today);
    
    return currentUsage < limits[actionType];
  }

  async activatePremiumSubscription(userId: string, razorpayData: { customerId?: string; subscriptionId?: string }): Promise<User> {
    const premiumExpiryDate = new Date();
    premiumExpiryDate.setMonth(premiumExpiryDate.getMonth() + 1); // 1 month subscription

    await db.collection('users').doc(userId).update({
      subscriptionStatus: 'premium',
      premiumActivatedAt: new Date(),
      premiumExpiryDate: premiumExpiryDate,
      stripeCustomerId: razorpayData.customerId || null,
      stripeSubscriptionId: razorpayData.subscriptionId || null,
      updatedAt: new Date(),
    });
    
    const doc = await db.collection('users').doc(userId).get();
    return { id: doc.id, ...doc.data() } as User;
  }
}

export const firestoreStorage = new FirestoreStorage();