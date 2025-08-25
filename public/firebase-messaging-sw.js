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

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/logo.png'
  });
});

self.addEventListener('notificationclick', function(event) {
  const medicineName = event.notification.data?.medicineName;
  if (medicineName && 'speechSynthesis' in self) {
    const utterance = new SpeechSynthesisUtterance(`Time to take ${medicineName}`);
    self.speechSynthesis.speak(utterance);
  }
});