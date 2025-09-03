importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAB5TldoIqRS_WfUlF7JYfVnzXi3i96dmw",
  authDomain: "medibot-457514.firebaseapp.com",
  projectId: "medibot-457514",
  messagingSenderId: "806828516267",
  appId: "1:806828516267:web:a75aad403f3dfbc67da8ee"
});

const messaging = firebase.messaging();

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'MediBot Reminder';
  const notificationBody = payload.notification?.body || payload.data?.body || 'You have a medication reminder';
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'medication-reminder-' + Date.now(),
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'taken', title: '✓ Taken' },
      { action: 'dismiss', title: '✗ Dismiss' }
    ],
    data: payload.data
  };

  console.log('[firebase-messaging-sw.js] Showing notification:', notificationTitle, notificationOptions);
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  const medicineName = event.notification.data?.medicineName;
  if (medicineName && 'speechSynthesis' in self) {
    const utterance = new SpeechSynthesisUtterance(`Time to take ${medicineName}`);
    self.speechSynthesis.speak(utterance);
  }
});