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
import { getAndStoreFCMToken, requestNotificationPermission } from '../lib/fcm';
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
  hasFCMToken: boolean;
  refreshUserData: () => Promise<void>;
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
  const [hasFCMToken, setHasFCMToken] = useState(false);

  const refreshUserData = async () => {
    if (user) {
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserData(data);
        setHasFCMToken(!!data.fcmToken);
      }
    }
  };

  // Auto request notification permission after login
  const autoRequestNotificationPermission = async (userId: string) => {
    try {
      // Small delay to ensure everything is loaded
      setTimeout(async () => {
        const token = await requestNotificationPermission(userId);
        if (token) {
          console.log('Auto notification permission granted and token stored');
          await refreshUserData();
        } else {
          console.log('Auto notification permission denied or skipped');
        }
      }, 1000);
    } catch (error) {
      console.error('Auto notification permission error:', error);
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
          const existingUserData = snapshot.val();
          setUserData(existingUserData);
          setHasFCMToken(!!existingUserData.fcmToken);
          
          // Auto request notification permission if no token exists
          if (!existingUserData.fcmToken) {
            await autoRequestNotificationPermission(firebaseUser.uid);
          }
        } else {
          setUserData(null);
          setHasFCMToken(false);
          // Auto request notification permission for new users
          await autoRequestNotificationPermission(firebaseUser.uid);
        }
      } else {
        // Check for guest session
        const guestData = localStorage.getItem('guest_session');
        if (guestData) {
          setIsGuest(true);
          setUserData(JSON.parse(guestData));
          setHasFCMToken(false);
        } else {
          setUser(null);
          setUserData(null);
          setIsGuest(false);
          setHasFCMToken(false);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login successful!');
      // Auto request notification permission after login
      await autoRequestNotificationPermission(result.user.uid);
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
      toast.success('Account created successfully!');
      // Auto request notification permission after signup
      await autoRequestNotificationPermission(result.user.uid);
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      
      const userRef = ref(db, `users/${googleUser.uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        const userData = {
          userId: googleUser.uid,
          email: googleUser.email,
          fullName: googleUser.displayName || googleUser.email?.split('@')[0],
          mobileNumber: '',
          registeredAt: Date.now(),
          status: 'active'
        };
        await set(userRef, userData);
      }
      
      toast.success('Google login successful!');
      // Auto request notification permission after Google login
      await autoRequestNotificationPermission(googleUser.uid);
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
      hasFCMToken,
      refreshUserData,
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