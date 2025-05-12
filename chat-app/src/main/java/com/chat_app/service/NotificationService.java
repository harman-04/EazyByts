package com.chat_app.service;

import com.chat_app.entity.PushSubscription;
import com.chat_app.entity.User;
import com.chat_app.repository.PushSubscriptionRepository;
import com.chat_app.repository.UserRepository;

// Add Firebase imports:
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.WebpushConfig;
import com.google.firebase.messaging.WebpushNotification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
// import java.io.FileInputStream; // REMOVE THIS IMPORT
import java.io.IOException;
import java.io.InputStream; // ADD THIS IMPORT (use InputStream instead of FileInputStream)
import java.util.List;
import java.util.Map;

// ADD THIS IMPORT FOR ClassPathResource
import org.springframework.core.io.ClassPathResource;


@Service
public class NotificationService {

    // ... (existing fields like vapidPublicKey, vapidPrivateKey, vapidSubject commented out)

    @Value("${firebase.service-account-file}")
    private String firebaseServiceAccountPath; // This will be 'classpath:your-file.json'

    @Autowired
    private PushSubscriptionRepository pushSubscriptionRepository;

    @Autowired
    private UserRepository userRepository;

    @PostConstruct
    private void init() throws IOException {
        InputStream serviceAccount = null; // Declare outside try for finally block

        try {
            // Remove the 'classpath:' prefix if present, as ClassPathResource constructor
            // expects just the resource path relative to the classpath root.
            String resourcePath = firebaseServiceAccountPath.startsWith("classpath:") ?
                    firebaseServiceAccountPath.substring("classpath:".length()) :
                    firebaseServiceAccountPath;

            // Use ClassPathResource to load the file from the classpath
            serviceAccount = new ClassPathResource(resourcePath).getInputStream();

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
            System.out.println("Firebase Admin SDK initialized.");

        } finally {
            // Ensure the input stream is closed even if an error occurs
            if (serviceAccount != null) {
                serviceAccount.close();
            }
        }
    }

    /**
     * Sends a push notification to a specific user using Firebase Cloud Messaging (FCM).
     * @param user The target user.
     * @param title The title of the notification.
     * @param body The body text of the notification.
     * @param url The URL to open when the notification is clicked.
     */
    public void sendNotification(User user, String title, String body, String url) {
        List<PushSubscription> subscriptions = pushSubscriptionRepository.findByUser(user);

        if (subscriptions.isEmpty()) {
            System.out.println("No push subscriptions found for user: " + user.getEmail());
            return;
        }

        for (PushSubscription pushSubscription : subscriptions) {
            try {
                String fcmRegistrationToken = pushSubscription.getEndpoint();

                WebpushNotification webpushNotification = WebpushNotification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .putCustomData("url", url)
                        .build();

                WebpushConfig webpushConfig = WebpushConfig.builder()
                        .setNotification(webpushNotification)
                        .build();

                Message message = Message.builder()
                        .setToken(fcmRegistrationToken)
                        .setWebpushConfig(webpushConfig)
                        .build();

                String response = FirebaseMessaging.getInstance().send(message);
                System.out.println("Successfully sent Firebase push message: " + response +
                        " to user " + user.getEmail() + " endpoint: " + pushSubscription.getEndpoint());

            } catch (FirebaseMessagingException e) {
                System.err.println("Error sending Firebase push notification to " + user.getEmail() + ": " + e.getMessage());

                if (e.getMessage().contains("token-not-registered")) {
                    System.out.println("Removing expired Firebase push subscription: " + pushSubscription.getEndpoint());
                    pushSubscriptionRepository.delete(pushSubscription);
                }
            } catch (Exception e) {
                System.err.println("Generic error sending push notification to " + user.getEmail() + ": " + e.getMessage());
            }
        }
    }

    /**
     * Sends push notifications to all users in the public chat, excluding the sender.
     * @param title The title of the notification.
     * @param body The body text of the notification.
     * @param url The URL to open when the notification is clicked.
     * @param senderEmail The email of the message sender (to exclude from notifications).
     */
    public void sendNotificationToAllPublicChatUsers(String title, String body, String url, String senderEmail) {
        List<User> allUsers = userRepository.findAll();

        for (User user : allUsers) {
            if (!user.getEmail().equals(senderEmail)) {
                sendNotification(user, title, body, url);
            }
        }
    }
}