package com.chat_app.dto;

import lombok.Data;
import lombok.Builder; // Add this import
import lombok.NoArgsConstructor; // Add this import
import lombok.AllArgsConstructor; // Add this import

@Data
@Builder // Add @Builder for cleaner object creation in ChatController
@NoArgsConstructor // Add no-arg constructor for deserialization
@AllArgsConstructor // Add all-args constructor for @Builder
public class ChatMessage {
    private String sender;
    private String receiver; // null for public
    private String content;
    private MessageType type;
    private String timestamp; // Add timestamp field

    public enum MessageType {
        CHAT,
        JOIN,
        LEAVE
    }

    // Lombok will generate getters and setters with @Data
}