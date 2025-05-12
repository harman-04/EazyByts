// // public/service-worker.js
// // This service worker is for handling push notifications.
// // It runs in the background and intercepts push events.

// self.addEventListener('install', (event) => {
//   console.log('Service Worker: Installing...');
//   // This ensures the new service worker activates as soon as possible
//   event.waitUntil(self.skipWaiting());
// });

// self.addEventListener('activate', (event) => {
//   console.log('Service Worker: Activating...');
//   // Claim all clients (tabs/windows) under this service worker's control
//   event.waitUntil(self.clients.claim());
//   // Optional: Clean up old caches if you have any from previous versions
//   event.waitUntil(
//     caches.keys().then((cacheNames) => {
//       return Promise.all(
//         cacheNames.map((cacheName) => {
//           // If you have specific caches, remove them
//           // e.g., if (cacheName.startsWith('your-app-cache-')) {
//           //   return caches.delete(cacheName);
//           // }
//           return null; // No action for other caches
//         })
//       );
//     })
//   );
// });

// self.addEventListener('push', (event) => {
//   console.log('Service Worker: Push event received!', event);
//   // Extract data from the push event
//   const data = event.data.json();
//   const title = data.title || 'New Message';
//   const options = {
//     body: data.body || 'You have a new message!',
//     icon: '/logo192.png', // Path to your app icon (e.g., from your public folder)
//     badge: '/logo192.png', // Icon for Android badge (smaller, monochrome)
//     data: {
//       url: data.url || '/', // URL to navigate to when notification is clicked
//     }
//   };

//   // Show the notification
//   event.waitUntil(self.registration.showNotification(title, options));
// });

// self.addEventListener('notificationclick', (event) => {
//   console.log('Service Worker: Notification clicked!', event);
//   event.notification.close(); // Close the notification

//   const urlToOpen = event.notification.data.url;

//   event.waitUntil(
//     // Check if there's an existing client (tab/window) open for this URL
//     self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
//       for (const client of clientList) {
//         if (client.url.includes(urlToOpen) && 'focus' in client) {
//           return client.focus(); // If found, focus on that tab
//         }
//       }
//       // Otherwise, open a new window/tab
//       if (self.clients.openWindow) {
//         return self.clients.openWindow(urlToOpen);
//       }
//     })
//   );
// });