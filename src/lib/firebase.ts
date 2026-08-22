import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  serverTimestamp, 
  arrayUnion, 
  arrayRemove,
  increment,
  query,
  orderBy
} from 'firebase/firestore';
import { BittyUser, ApiKeyMeta, TrackedBittyBox, CreditTransaction } from '../types';

const requiredEnv = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required Firebase config: ${key}`);
  }
  return value;
};

const firebaseConfig = {
  projectId: requiredEnv('VITE_FIREBASE_PROJECT_ID'),
  appId: requiredEnv('VITE_FIREBASE_APP_ID'),
  apiKey: requiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || '',
  recaptchaSiteKey: import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || '',
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with custom database ID if specified
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in using Google OAuth Popup
 */
export async function signInWithGoogle(): Promise<{ success: boolean; user?: BittyUser; error?: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (!result.user) {
      return { success: false, error: 'No user returned from Google authentication.' };
    }
    const bittyUser = await getOrCreateFirestoreUser(result.user);
    return { success: true, user: bittyUser };
  } catch (error: any) {
    console.error('[Firebase Auth] Google Sign-In error:', error);
    // User closed popup or cancelled
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Sign-in window closed before completing.' };
    }
    if (error.code === 'auth/cancelled-popup-request') {
      return { success: false, error: 'Sign-in cancelled.' };
    }
    return { success: false, error: error.message || 'Failed to sign in with Google.' };
  }
}

/**
 * Sign out current Firebase user
 */
export async function signOutFirebase(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('[Firebase Auth] Sign-out error:', error);
  }
}

/**
 * Get or create a Firestore user profile document upon Google Auth
 */
export async function getOrCreateFirestoreUser(fbUser: FirebaseUser): Promise<BittyUser> {
  const userRef = doc(db, 'users', fbUser.uid);
  const snapshot = await getDoc(userRef);

  const nowIso = new Date().toISOString();

  if (snapshot.exists()) {
    const data = snapshot.data();
    // Update last sign in
    await updateDoc(userRef, {
      lastSignedInAt: nowIso,
      displayName: fbUser.displayName || data.displayName || 'Bitty Builder',
      avatar: fbUser.photoURL || data.avatar || '⚡',
      email: fbUser.email || data.email || ''
    });

    return {
      id: fbUser.uid,
      email: fbUser.email || data.email || '',
      displayName: fbUser.displayName || data.displayName || 'Bitty Builder',
      tier: data.tier || 'PRO BUILDER',
      avatar: fbUser.photoURL || data.avatar || '⚡',
      credits: data.credits ?? 100,
      creditsUsedTotal: data.creditsUsedTotal ?? 0,
      creditsHumanUsed: data.creditsHumanUsed ?? 0,
      creditsApiUsed: data.creditsApiUsed ?? 0,
      creditsMcpUsed: data.creditsMcpUsed ?? 0,
      joinedDate: data.joinedDate || nowIso,
      lastSignedInAt: nowIso,
      settings: data.settings || { autoSaveLinks: true, trustThisDevice: true },
      apiKeys: data.apiKeys || [],
      links: data.links || [],
      transactions: data.transactions || []
    };
  }

  // Create new user profile in Firestore with 100 starter credits
  const initialUser: BittyUser = {
    id: fbUser.uid,
    email: fbUser.email || '',
    displayName: fbUser.displayName || 'Bitty Builder',
    tier: 'PRO BUILDER',
    avatar: fbUser.photoURL || '⚡',
    credits: 100,
    creditsUsedTotal: 0,
    creditsHumanUsed: 0,
    creditsApiUsed: 0,
    creditsMcpUsed: 0,
    joinedDate: nowIso,
    lastSignedInAt: nowIso,
    settings: {
      autoSaveLinks: true,
      trustThisDevice: true
    },
    apiKeys: [],
    links: [],
    transactions: [
      {
        id: `tx_init_${Date.now()}`,
        type: 'grant',
        amount: 100,
        description: 'Google Sign-In Starter Bonus (100 Credits)',
        createdAt: nowIso
      }
    ]
  };

  await setDoc(userRef, {
    ...initialUser,
    authProvider: 'google',
    createdAt: serverTimestamp()
  });

  return initialUser;
}

/**
 * Subscribe to real-time updates for a user document
 */
export function subscribeToUserProfile(uid: string, onUpdate: (user: BittyUser | null) => void) {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      onUpdate({
        id: uid,
        email: data.email || '',
        displayName: data.displayName || 'Bitty Builder',
        tier: data.tier || 'PRO BUILDER',
        avatar: data.avatar || '⚡',
        credits: data.credits ?? 100,
        creditsUsedTotal: data.creditsUsedTotal ?? 0,
        creditsHumanUsed: data.creditsHumanUsed ?? 0,
        creditsApiUsed: data.creditsApiUsed ?? 0,
        creditsMcpUsed: data.creditsMcpUsed ?? 0,
        joinedDate: data.joinedDate || new Date().toISOString(),
        lastSignedInAt: data.lastSignedInAt || new Date().toISOString(),
        settings: data.settings || { autoSaveLinks: true, trustThisDevice: true },
        apiKeys: data.apiKeys || [],
        links: data.links || [],
        transactions: data.transactions || []
      });
    } else {
      onUpdate(null);
    }
  }, (err) => {
    console.error('[Firebase Firestore] User profile subscription error:', err);
  });
}

/**
 * Save a micro-site box to user's Firestore collection & update user's links array
 */
export async function saveBoxToFirestore(uid: string, box: TrackedBittyBox): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const boxRef = doc(db, 'users', uid, 'boxes', box.id);

  await setDoc(boxRef, {
    ...box,
    userId: uid,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  // Update links summary in user document
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    const existingLinks: TrackedBittyBox[] = userDoc.data().links || [];
    const filtered = existingLinks.filter(l => l.id !== box.id);
    await updateDoc(userRef, {
      links: [box, ...filtered]
    });
  }
}

/**
 * Delete a micro-site box from user's Firestore collection
 */
export async function deleteBoxFromFirestore(uid: string, boxId: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const boxRef = doc(db, 'users', uid, 'boxes', boxId);

  await deleteDoc(boxRef);

  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    const existingLinks: TrackedBittyBox[] = userDoc.data().links || [];
    const filtered = existingLinks.filter(l => l.id !== boxId);
    await updateDoc(userRef, {
      links: filtered
    });
  }
}

/**
 * Add an agent API key to user document
 */
export async function addApiKeyToFirestore(uid: string, keyMeta: ApiKeyMeta): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    apiKeys: arrayUnion(keyMeta)
  });
}

/**
 * Revoke an agent API key in Firestore
 */
export async function revokeApiKeyInFirestore(uid: string, keyId: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    const keys: ApiKeyMeta[] = userDoc.data().apiKeys || [];
    const updated = keys.filter(k => k.id !== keyId);
    await updateDoc(userRef, {
      apiKeys: updated
    });
  }
}

/**
 * Purchase / grant credits in Firestore
 */
export async function addCreditsInFirestore(
  uid: string, 
  amount: number, 
  transaction: CreditTransaction
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    credits: increment(amount),
    transactions: arrayUnion(transaction)
  });
}

/**
 * Deduct credits for an operation in Firestore
 */
export async function deductCreditsInFirestore(
  uid: string,
  amount: number,
  type: 'human' | 'api' | 'mcp',
  description: string
): Promise<boolean> {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) return false;

  const current = userDoc.data().credits ?? 0;
  if (current < amount) return false;

  const tx: CreditTransaction = {
    id: `tx_${Date.now()}`,
    type: 'usage',
    amount: -amount,
    description,
    createdAt: new Date().toISOString()
  };

  const updatePayload: Record<string, any> = {
    credits: increment(-amount),
    creditsUsedTotal: increment(amount),
    transactions: arrayUnion(tx)
  };

  if (type === 'human') {
    updatePayload.creditsHumanUsed = increment(amount);
  } else if (type === 'api') {
    updatePayload.creditsApiUsed = increment(amount);
  } else if (type === 'mcp') {
    updatePayload.creditsMcpUsed = increment(amount);
  }

  await updateDoc(userRef, updatePayload);
  return true;
}

/**
 * Set credits to an absolute value in Firestore.
 * Used to mirror the authoritative Creem CCA balance for Firebase users.
 */
export async function setCreditsInFirestore(
  uid: string,
  amount: number
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { credits: amount });
}
