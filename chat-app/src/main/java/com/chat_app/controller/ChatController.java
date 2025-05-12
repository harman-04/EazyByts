package com.chat_app.controller;

import com.chat_app.dto.ChatMessage;
import com.chat_app.service.UsernameService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map; // Only import Map

@Controller
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UsernameService usernameService;

    public ChatController(SimpMessagingTemplate messagingTemplate, UsernameService usernameService) {
        this.messagingTemplate = messagingTemplate;
        this.usernameService = usernameService;
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setTimestamp(LocalDateTime.now().toString());
        return chatMessage;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage,
                               SimpMessageHeaderAccessor headerAccessor) {
        String senderEmail = chatMessage.getSender();
        String username = usernameService.getUsernameByEmail(senderEmail);

        // Safely add email and username to WebSocket session attributes
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null) {
            sessionAttributes.put("email", senderEmail);
            sessionAttributes.put("username", username);
        } else {
            System.err.println("WARNING: SimpMessageHeaderAccessor.getSessionAttributes() is null in chat.addUser. Cannot store email/username in session.");
        }

        String joinContentJson = "{\"username\": \"" + username + "\"}";

        return ChatMessage.builder()
                .type(ChatMessage.MessageType.JOIN)
                .sender(senderEmail)
                .content(joinContentJson)
                .timestamp(LocalDateTime.now().toString())
                .build();
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        String email = null;
        Principal principal = headerAccessor.getUser();
        if (principal != null) {
            email = principal.getName(); // This is typically the email from the JWT
        }

        String username = null;
        // Try to get username from session attributes (if they exist and were set by an interceptor or previous action)
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null) {
            username = (String) sessionAttributes.get("username");
        }

        // If username not found in session attributes, derive it from principal or service
        if (username == null && email != null) {
            username = usernameService.getUsernameByEmail(email);
            // If we want to store this for subsequent events like disconnect, try to put it in session attributes
            if (sessionAttributes != null) { // Only attempt to store if the map exists
                sessionAttributes.put("username", username);
                sessionAttributes.put("email", email); // Also store email for disconnect event
            }
        }

        if (username == null) {
            username = "anonymous"; // Fallback if username can't be found
        }

        String joinContentJson = "{\"username\": \"" + username + "\"}";

        ChatMessage chatMessage = ChatMessage.builder()
                .type(ChatMessage.MessageType.JOIN)
                .sender(email != null ? email : "anonymous")
                .content(joinContentJson)
                .timestamp(LocalDateTime.now().toString())
                .build();

        messagingTemplate.convertAndSend("/topic/public", chatMessage);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        String email = null;
        String username = null;

        // Attempt to retrieve from session attributes first
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null) {
            email = (String) sessionAttributes.get("email");
            username = (String) sessionAttributes.get("username");
        } else {
            System.err.println("WARNING: SimpMessageHeaderAccessor.getSessionAttributes() is null in handleWebSocketDisconnectListener. Cannot retrieve user details for LEAVE message from session.");
        }

        // Fallback to principal if session attributes were null or incomplete
        if (email == null || username == null) {
            Principal principal = headerAccessor.getUser();
            if (principal != null) {
                email = principal.getName(); // Get email from principal
                if (username == null) { // If username is still null, try to get it from service
                    username = usernameService.getUsernameByEmail(email);
                }
            }
        }

        if (username == null) { // Final fallback
            username = "anonymous";
        }
        if (email == null) { // Final fallback
            email = "anonymous";
        }

        if (username != null) { // Only send LEAVE message if we have a username
            String leaveContentJson = "{\"username\": \"" + username + "\"}";

            ChatMessage chatMessage = ChatMessage.builder()
                    .type(ChatMessage.MessageType.LEAVE)
                    .sender(email)
                    .content(leaveContentJson)
                    .timestamp(LocalDateTime.now().toString())
                    .build();
            messagingTemplate.convertAndSend("/topic/public", chatMessage);
        }
    }
}