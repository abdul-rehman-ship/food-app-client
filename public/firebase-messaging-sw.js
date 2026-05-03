// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Your Firebase config - HARDCODED from your .env
const firebaseConfig = {
  apiKey: "AIzaSyCT8Rjxqi-Pj1vDoMwyx6G54ewjw8tooNM",
  authDomain: "bertha-s-food.firebaseapp.com",
  databaseURL: "https://bertha-s-food-default-rtdb.firebaseio.com",
  projectId: "bertha-s-food",
  storageBucket: "bertha-s-food.firebasestorage.app",
  messagingSenderId: "861366816684",
  appId: "1:861366816684:web:21e5e80160e9cf49adb409",
  measurementId: "G-7E71W5TX99"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data,
    vibrate: [200, 100, 200],
    requireInteraction: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Optional: Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Open the orders page when notification is clicked
  event.waitUntil(
    clients.openWindow('/orders')
  );
});