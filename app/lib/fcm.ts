import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { db } from './firebase';
import { ref, update, get } from 'firebase/database';

// Register service worker
const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | undefined> => {
  if (typeof window === 'undefined') return undefined;
  
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return undefined;
  }
};

// Request notification permission and get token (manual trigger)
export const requestNotificationPermission = async (userId: string) => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window) || !messaging) {
      console.log('FCM not available in this environment');
      return null;
    }

    // Register service worker first
    const registration = await registerServiceWorker();
    if (!registration) {
      console.log('Service Worker registration failed');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get and store FCM token
    return await getAndStoreFCMToken(userId);
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Get and store FCM token
export const getAndStoreFCMToken = async (userId: string) => {
  try {
    console.log('getAndStoreFCMToken called for userId:', userId);
    
    if (typeof window === 'undefined') {
      return null;
    }

    if (!('Notification' in window) || !messaging) {
      console.log('FCM not available');
      return null;
    }

    // Check if user already has a token in database
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    const existingToken = snapshot.val()?.fcmToken;
    
    if (existingToken) {
      console.log('User already has FCM token');
      return existingToken;
    }

    // Check permission
    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    // Ensure service worker is registered
    let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) {
      registration = await registerServiceWorker();
    }

    // Get FCM token - fix TypeScript error by converting null to undefined
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
      serviceWorkerRegistration: registration ?? undefined
    });

    if (token) {
      // Store token in user's record
      await update(userRef, {
        fcmToken: token,
        fcmTokenUpdatedAt: Date.now(),
        fcmTokenSource: 'vercel'
      });
      console.log('FCM token stored successfully for user:', userId);
      return token;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Remove FCM token from user
export const removeFCMToken = async (userId: string) => {
  try {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, {
      fcmToken: null,
      fcmTokenRemovedAt: Date.now()
    });
    console.log('FCM token removed for user:', userId);
  } catch (error) {
    console.error('Error removing FCM token:', error);
  }
};

// Check if user has FCM token
export const checkUserFCMToken = async (userId: string) => {
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    return snapshot.val()?.fcmToken || null;
  } catch (error) {
    console.error('Error checking FCM token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return;
  
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};