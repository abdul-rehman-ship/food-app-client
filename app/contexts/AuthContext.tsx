'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, db, googleProvider } from '../lib/firebase';
import { ref, set, get, update } from 'firebase/database';
import { getAndStoreFCMToken } from '../lib/fcm';
import toast from 'react-hot-toast';

interface UserData {
  userId: string;
  email: string;
  fullName: string;
  mobileNumber: string;
  registeredAt: number;
  status: string;
  fcmToken?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  isGuest: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, mobileNumber: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auto store FCM token for authenticated user
  const autoStoreFCMToken = async (userId: string) => {
    try {
      await getAndStoreFCMToken(userId);
    } catch (error) {
      console.error('Error auto-storing FCM token:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsGuest(false);
        
        // Fetch user data from database
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setUserData(snapshot.val());
        }
        
        // Auto store FCM token after login
        await autoStoreFCMToken(firebaseUser.uid);
      } else {
        // Check for guest session
        const guestData = localStorage.getItem('guest_session');
        if (guestData) {
          setIsGuest(true);
          setUserData(JSON.parse(guestData));
        } else {
          setUser(null);
          setUserData(null);
          setIsGuest(false);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await autoStoreFCMToken(result.user.uid);
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const signup = async (email: string, password: string, fullName: string, mobileNumber: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const userData = {
        userId: result.user.uid,
        email: email,
        fullName: fullName,
        mobileNumber: mobileNumber,
        registeredAt: Date.now(),
        status: 'active'
      };
      
      await set(ref(db, `users/${result.user.uid}`), userData);
      await autoStoreFCMToken(result.user.uid);
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        const userData = {
          userId: user.uid,
          email: user.email,
          fullName: user.displayName || user.email?.split('@')[0],
          mobileNumber: '',
          registeredAt: Date.now(),
          status: 'active'
        };
        await set(userRef, userData);
      }
      
      await autoStoreFCMToken(user.uid);
      toast.success('Google login successful!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const loginAsGuest = () => {
    const guestData = {
      userId: `guest_${Date.now()}`,
      email: 'guest@example.com',
      fullName: 'Guest User',
      mobileNumber: '',
      registeredAt: Date.now(),
      status: 'guest'
    };
    localStorage.setItem('guest_session', JSON.stringify(guestData));
    setIsGuest(true);
    setUserData(guestData);
    toast.success('You are now browsing as a guest');
  };

  const logout = async () => {
    try {
      if (isGuest) {
        localStorage.removeItem('guest_session');
        setIsGuest(false);
        setUserData(null);
        toast.success('Logged out successfully');
      } else {
        // Remove FCM token before logout
        if (user) {
          const userRef = ref(db, `users/${user.uid}`);
          await update(userRef, { fcmToken: null });
        }
        await signOut(auth);
        toast.success('Logged out successfully');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      isGuest,
      loading,
      login,
      signup,
      loginWithGoogle,
      loginAsGuest,
      logout,
      forgotPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};