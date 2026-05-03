import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { db } from './firebase';
import { ref, update } from 'firebase/database';

// Request notification permission and get token
export const requestNotificationPermission = async (userId: string) => {
  try {
    // Check if browser supports notifications
    if (typeof window === 'undefined' || !('Notification' in window) || !messaging) {
      console.log('FCM not available in this environment');
      return null;
    }

    // Check if permission is already granted
    if (Notification.permission === 'granted') {
      console.log('Notification permission already granted');
      return await getFCMToken(userId);
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get and store FCM token
    return await getFCMToken(userId);
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Get and store FCM token
export const getAndStoreFCMToken = async (userId: string) => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window) || !messaging) {
      console.log('FCM not available in this environment');
      return null;
    }

    // Check if permission is granted
    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    return await getFCMToken(userId);
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Get FCM token and store in database
const getFCMToken = async (userId: string) => {
  try {
    if (!messaging) {
      console.log('Firebase Messaging not initialized');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY
    });

    if (token) {
      // Store token in user's record
      const userRef = ref(db, `users/${userId}`);
      await update(userRef, {
        fcmToken: token
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
      fcmToken: null
    });
    console.log('FCM token removed for user:', userId);
  } catch (error) {
    console.error('Error removing FCM token:', error);
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