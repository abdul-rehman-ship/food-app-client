import { messaging } from './firebase';
import { getToken } from 'firebase/messaging';
import { db } from './firebase';
import { ref, update } from 'firebase/database';

// Get and store FCM token automatically
export const getAndStoreFCMToken = async (userId: string) => {
  try {
    // Check if browser supports notifications and messaging is initialized
    if (typeof window === 'undefined' || !('Notification' in window) || !messaging) {
      console.log('FCM not available in this environment');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY
    });

    if (token) {
      // Store token in user's record in database
      const userRef = ref(db, `users/${userId}`);
      await update(userRef, {
        fcmToken: token
      });
      console.log('FCM token stored automatically for user:', userId);
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