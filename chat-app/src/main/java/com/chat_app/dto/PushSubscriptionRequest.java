package com.chat_app.dto;

import lombok.Data; // Requires Lombok dependency

@Data // This generates getters, setters, toString, equals, hashCode
public class PushSubscriptionRequest {
    private String endpoint;
    private Keys keys; // This will correctly map the nested 'keys' object

    @Data // Inner class for the 'keys' object
    public static class Keys {
        private String p256dh;
        private String auth;
    }
}