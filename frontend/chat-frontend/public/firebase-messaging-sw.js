// public/firebase-messaging-sw.js
// This is the dedicated Firebase Messaging Service Worker file.
// It must be in the root of your public folder.

// Import Firebase SDKs from CDN (often easier for service workers)
importScripts('https://www.gstatic.com/firebasejs/9.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.3.0/firebase-messaging-compat.js');

// OR, if your build tool supports bundling ES modules for service workers:
// import { initializeApp } from 'firebase/app';
// import { getMessaging } from 'firebase/messaging/sw'; // Note 'sw' for service worker context

// IMPORTANT: Your Firebase project configuration (must match src/utils/firebase.js)
// add it from your firebase 
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// Initialize Firebase in the service worker
const app = firebase.initializeApp(firebaseConfig); // Using compat modules
const messaging = app.messaging(); // Using compat modules

// OR if using modular (no compat):
// const app = initializeApp(firebaseConfig);
// const messaging = getMessaging(app);

// Handle background messages (notifications when the app is not in focus)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  // Customize the notification here based on the payload
  const notificationTitle = payload.notification.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new message.',
    icon: payload.notification.icon || '/logo192.png', // Use an icon from payload or a default
    badge: '/logo192.png', // A small icon for Android status bar
    data: payload.data // Custom data from backend (e.g., URL to navigate to)
  };

  event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
});

// Optional: Handle notification clicks (if you want custom behavior beyond data.url)
self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Close the notification after clicking

    const urlToOpen = event.notification.data?.url; // Get URL from custom data

    if (urlToOpen) {
        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
                for (let i = 0; i < clientList.length; i++) {
                    let client = clientList[i];
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus(); // If tab with URL open, focus it
                    }
                }
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen); // Otherwise, open a new tab
                }
            })
        );
    }
});