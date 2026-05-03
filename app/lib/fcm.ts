import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { db } from './firebase';
import { ref, update, get } from 'firebase/database';

// Request notification permission and get token (manual trigger)
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
      return await getAndStoreFCMToken(userId);
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

// Get and store FCM token (called automatically on login/signup)
export const getAndStoreFCMToken = async (userId: string) => {
  try {
    console.log('getAndStoreFCMToken called for userId:', userId);
    
    if (typeof window === 'undefined') {
      console.log('Not in browser environment');
      return null;
    }

    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    if (!messaging) {
      console.log('Firebase Messaging not initialized');
      return null;
    }

    // First, check if user already has a valid token in database
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    const existingToken = snapshot.val()?.fcmToken;
    
    if (existingToken) {
      console.log('User already has FCM token, verifying...');
      // You could optionally verify the token is still valid
      return existingToken;
    }

    // Check permission status - don't auto-request, just check
    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted. User needs to enable manually.');
      console.log('Current permission status:', Notification.permission);
      return null;
    }

    // Get FCM token
    console.log('Getting FCM token...');
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY
    });

    if (token) {
      console.log('FCM token obtained successfully');
      
      // Store token in user's record
      await update(userRef, {
        fcmToken: token,
        fcmTokenUpdatedAt: Date.now()
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

// Remove FCM token from user (on logout)
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

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return;
  
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};