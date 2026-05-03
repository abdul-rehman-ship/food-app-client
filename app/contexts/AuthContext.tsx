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
import { getAndStoreFCMToken, removeFCMToken } from '../lib/fcm';
import toast from 'react-hot-toast';

interface UserData {
  userId: string;
  email: string;
  fullName: string;
  mobileNumber: string;
  registeredAt: number;
  status: string;
  fcmToken?: string;
  fcmTokenUpdatedAt?: number;
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
      console.log('Auto-storing FCM token for user:', userId);
      await getAndStoreFCMToken(userId);
    } catch (error) {
      console.error('Error auto-storing FCM token:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.uid || 'No user');
      
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsGuest(false);
        
        // Fetch user data from database
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const existingUserData = snapshot.val();
          console.log('Existing user data:', existingUserData);
          setUserData(existingUserData);
          
          // If user already has a token, no need to store again
          if (!existingUserData.fcmToken) {
            console.log('No existing FCM token, storing new one...');
            await autoStoreFCMToken(firebaseUser.uid);
          } else {
            console.log('User already has FCM token:', existingUserData.fcmToken);
          }
        } else {
          console.log('No user data found in database');
          setUserData(null);
          // Still try to store FCM token
          await autoStoreFCMToken(firebaseUser.uid);
        }
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
      console.log('Logging in with email:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful, user UID:', result.user.uid);
      
      // Store FCM token after login
      await autoStoreFCMToken(result.user.uid);
      toast.success('Login successful!');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const signup = async (email: string, password: string, fullName: string, mobileNumber: string) => {
    try {
      console.log('Signing up with email:', email);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Signup successful, user UID:', result.user.uid);
      
      const newUserData = {
        userId: result.user.uid,
        email: email,
        fullName: fullName,
        mobileNumber: mobileNumber,
        registeredAt: Date.now(),
        status: 'active'
      };
      
      await set(ref(db, `users/${result.user.uid}`), newUserData);
      console.log('User data saved to database');
      
      // Store FCM token after signup
      await autoStoreFCMToken(result.user.uid);
      toast.success('Account created successfully!');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      console.log('Logging in with Google');
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      console.log('Google login successful, user UID:', googleUser.uid);
      
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
        console.log('New Google user data saved to database');
      } else {
        console.log('Existing Google user found in database');
      }
      
      // Store FCM token after Google login
      await autoStoreFCMToken(googleUser.uid);
      toast.success('Google login successful!');
    } catch (error: any) {
      console.error('Google login error:', error);
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
          console.log('Removing FCM token for user:', user.uid);
          await removeFCMToken(user.uid);
        }
        await signOut(auth);
        toast.success('Logged out successfully');
      }
    } catch (error: any) {
      console.error('Logout error:', error);
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