package com.chat_app.controller;

import com.chat_app.entity.PushSubscription;
import com.chat_app.entity.User;
import com.chat_app.repository.PushSubscriptionRepository;
import com.chat_app.repository.UserRepository;
import com.chat_app.dto.PushSubscriptionRequest; // Import the new DTO
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Optional;

@RestController
@RequestMapping("/api/subscriptions")
public class PushSubscriptionController {

    @Autowired
    private PushSubscriptionRepository pushSubscriptionRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> subscribe(@RequestBody PushSubscriptionRequest subscriptionRequest, Principal principal) {
        String userEmail = principal.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found for subscription: " + userEmail));

        String endpoint = subscriptionRequest.getEndpoint();
        // Safely get nested keys. For FCM, p256dh and auth might be empty but should not be null.
        String p256dh = (subscriptionRequest.getKeys() != null) ? subscriptionRequest.getKeys().getP256dh() : null;
        String auth = (subscriptionRequest.getKeys() != null) ? subscriptionRequest.getKeys().getAuth() : null;

        if (endpoint == null || p256dh == null || auth == null) {
            // This check now correctly validates the DTO structure and its nested fields
            return ResponseEntity.badRequest().body("Missing required subscription data (endpoint, p256dh, or auth).");
        }

        Optional<PushSubscription> existingSubscription = pushSubscriptionRepository.findByEndpoint(endpoint);

        PushSubscription pushSubscription;
        if (existingSubscription.isPresent()) {
            pushSubscription = existingSubscription.get();
            pushSubscription.setP256dh(p256dh);
            pushSubscription.setAuth(auth);
            pushSubscription.setUser(user); // Ensure it's linked to the current user
            System.out.println("Updated existing push subscription for user: " + userEmail + " endpoint: " + endpoint);
        } else {
            pushSubscription = new PushSubscription();
            pushSubscription.setEndpoint(endpoint);
            pushSubscription.setP256dh(p256dh);
            pushSubscription.setAuth(auth);
            pushSubscription.setUser(user);
            System.out.println("New push subscription created for user: " + userEmail + " endpoint: " + endpoint);
        }

        pushSubscriptionRepository.save(pushSubscription);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{endpoint}")
    public ResponseEntity<?> unsubscribe(@PathVariable String endpoint, Principal principal) {
        String userEmail = principal.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        Optional<PushSubscription> subscriptionToDelete = pushSubscriptionRepository.findByEndpoint(endpoint);

        if (subscriptionToDelete.isPresent() && subscriptionToDelete.get().getUser().equals(user)) {
            pushSubscriptionRepository.delete(subscriptionToDelete.get());
            System.out.println("Removed push subscription for user: " + userEmail + " endpoint: " + endpoint);
            return ResponseEntity.ok().build();
        } else {
            System.out.println("Push subscription not found or unauthorized for user: " + userEmail + " endpoint: " + endpoint);
            return ResponseEntity.notFound().build();
        }
    }
}