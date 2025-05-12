// src/components/NotificationManager.jsx
import React, { useEffect, useState } from 'react';
import { getToken, deleteToken } from 'firebase/messaging'; // Import getToken and deleteToken from Firebase Messaging
import { messaging } from '../utils/firebase'; // Import your initialized Firebase Messaging instance
// import { firebaseConfig } from '../utils/firebase'; // Import firebaseConfig to access messagingSenderId if needed
import { getToken as getAuthToken } from '../utils/token'; // Assuming this is your authentication token getter

// IMPORTANT: Get this VAPID_PUBLIC_KEY from Firebase Console:
// Project settings -> Cloud Messaging -> Web Push certificates -> Public key
const VAPID_PUBLIC_KEY = ''; // CONFIRMED VAPID Public Key
// Example: "BP7D9208D...long_string...zZ0" (This is NOT your old VAPID key or the backend's key)

const SUBSCRIPTION_API_URL = 'http://localhost:8081/api/subscriptions'; // Your backend endpoint

// Removed urlBase64ToUint8Array - Firebase's getToken handles this internally.

const NotificationManager = () => {
    const [isPushEnabled, setIsPushEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState(Notification.permission); // 'default', 'granted', 'denied'

    useEffect(() => {
        if (!('serviceWorker' in navigator && 'PushManager' in window)) {
            console.warn('Push notifications are not supported by this browser.');
            return;
        }

        const checkSubscription = async () => {
            try {
                // Firebase SDK automatically registers `firebase-messaging-sw.js`
                // when `getToken` or `onMessage` is called, as long as the SW file is in the root.
                // So, you generally don't need an explicit `navigator.serviceWorker.register` call here
                // if firebase-messaging-sw.js is correctly placed.

                // Attempt to get an existing FCM token. This does not request permission.
                const currentFCMToken = await getToken(messaging, {
                    vapidKey: VAPID_PUBLIC_KEY,
                    // The serviceWorkerRegistration option is for when you have a custom SW registration.
                    // If firebase-messaging-sw.js is in the root, Firebase often handles this automatically.
                    // You could pass it if you want to ensure a specific SW instance.
                    // serviceWorkerRegistration: await navigator.serviceWorker.ready // if you want to pass the registration explicitly
                }).catch(err => {
                    console.warn('Error getting existing FCM token:', err);
                    // Likely means no permission or token exists yet, or an issue with VAPID key/config.
                    return null;
                });

                if (currentFCMToken) {
                    console.log('Existing FCM Registration Token:', currentFCMToken);
                    setIsPushEnabled(true);
                    // Optionally re-send token to backend to ensure it's up-to-date
                    await sendSubscriptionToServer({ endpoint: currentFCMToken, keys: { p256dh: '', auth: '' } }); // Backend expects endpoint
                } else {
                    console.log('No existing FCM token found.');
                    setIsPushEnabled(false);
                }
                setPermissionStatus(Notification.permission);

            } catch (error) {
                console.error('FCM subscription check failed:', error);
                setIsPushEnabled(false);
            }
        };

        checkSubscription();

        // You can also set up an onMessage listener here for foreground messages
        // import { onMessage } from 'firebase/messaging';
        // onMessage(messaging, (payload) => {
        //     console.log('Foreground message received:', payload);
        //     // Customize how foreground notifications are displayed, e.g., with a toast or alert
        //     alert(`New Message: ${payload.notification.title} - ${payload.notification.body}`);
        // });

    }, []); // Run once on component mount

    const sendSubscriptionToServer = async (subscription) => {
        const authToken = getAuthToken(); // Your authentication token for your backend
        if (!authToken) {
            console.error("No authentication token found. Please log in to subscribe.");
            alert("Please log in to enable push notifications.");
            return false;
        }

        try {
            // For Firebase, the 'endpoint' is the FCM registration token itself.
            // The 'keys' object can be empty or contain placeholders if your backend expects them for compatibility.
            const payload = {
                endpoint: subscription.endpoint,
                keys: subscription.keys // This will be empty or placeholders for FCM, backend needs 'endpoint' primarily
            };

            const response = await fetch(SUBSCRIPTION_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
            }
            console.log('FCM token sent to server successfully.');
            return true;
        } catch (error) {
            console.error('Error sending FCM token to server:', error);
            alert('Failed to send push notification subscription to server: ' + error.message);
            return false;
        }
    };

    const subscribeUser = async () => {
        setIsLoading(true);
        try {
            // Request notification permission from the user if not already granted
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);

            if (permission !== 'granted') {
                alert('Notification permission not granted. Push notifications will not work.');
                setIsLoading(false);
                return;
            }

            // Use Firebase's getToken function to get the FCM registration token.
            // It also handles registering the Firebase service worker.
            const fcmToken = await getToken(messaging, {
                vapidKey: VAPID_PUBLIC_KEY,
                // serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js') // Optional, if explicitly registering
            });

            if (fcmToken) {
                console.log('New FCM token generated:', fcmToken);

                // Send the FCM token to your backend.
                // The backend expects 'endpoint' to be the FCM token.
                const subscriptionPayload = {
                    endpoint: fcmToken,
                    keys: { p256dh: '', auth: '' } // Provide empty/placeholder keys for backend compatibility
                };

                const sent = await sendSubscriptionToServer(subscriptionPayload);
                setIsPushEnabled(sent);
                if (sent) {
                    alert('Successfully subscribed to push notifications!');
                }
            } else {
                console.warn('Failed to get FCM token. User might have denied permission, or other issue.');
                setIsPushEnabled(false);
            }

        } catch (error) {
            console.error('Failed to subscribe the user to FCM:', error);
            alert('Failed to subscribe to push notifications: ' + error.message);
            setIsPushEnabled(false);
        } finally {
            setIsLoading(false);
        }
    };

    const unsubscribeUser = async () => {
        setIsLoading(true);
        try {
            // Get the current token, then delete it from FCM
            const currentToken = await getToken(messaging).catch(err => {
                console.warn('No current FCM token found for unsubscription:', err);
                return null;
            });

            if (currentToken) {
                // Delete the token from FCM's server.
                // This is the Firebase equivalent of PushManager.getSubscription().unsubscribe();
                await deleteToken(messaging).catch(err => {
                    console.error('Error deleting FCM token:', err);
                    // If deletion from Firebase fails, still try to remove from your backend
                });

                console.log('User unsubscribed from FCM.');

                // Notify backend to remove the subscription associated with the FCM token
                const authToken = getAuthToken(); // Your authentication token
                if (authToken) {
                    // Send the FCM token (which was acting as endpoint) to the backend for deletion
                    await fetch(`${SUBSCRIPTION_API_URL}/${encodeURIComponent(currentToken)}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    console.log('FCM token removed from server.');
                }
            } else {
                console.log('No FCM token to unsubscribe from.');
            }

            setIsPushEnabled(false);
            alert('Successfully unsubscribed from push notifications.');
        } catch (error) {
            console.error('Failed to unsubscribe the user from FCM:', error);
            alert('Failed to unsubscribe: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px', textAlign: 'center' }}>
            <h4>Push Notifications</h4>
            {permissionStatus === 'denied' && (
                <p className="text-danger">
                    Notifications are blocked by your browser. Please enable them in your browser settings.
                </p>
            )}
            {isLoading ? (
                <button className="btn btn-secondary" disabled>Loading...</button>
            ) : (
                <>
                    {!isPushEnabled && permissionStatus !== 'denied' ? (
                        <button className="btn btn-primary" onClick={subscribeUser}>
                            Enable Push Notifications
                        </button>
                    ) : (
                        <button className="btn btn-warning" onClick={unsubscribeUser}>
                            Disable Push Notifications
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default NotificationManager;