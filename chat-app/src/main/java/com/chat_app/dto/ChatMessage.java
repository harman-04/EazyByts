package com.chat_app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    private String id; // Add this field
    private MessageType type;
    private String sender;
    private String receiver;
    private String content;
    private String timestamp;

    public enum MessageType {
        CHAT,
        JOIN,
        LEAVE
    }

    // Lombok's @Data annotation will automatically generate the setId(String id) method.
    // If you are not using Lombok, you will need to add it manually:
    /*
    public void setId(String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }
    */
}