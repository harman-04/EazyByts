package com.chat_app.controller;

import com.chat_app.dto.ChatMessage;
import com.chat_app.repository.UserRepository;
import com.chat_app.service.ChatMessageService;
import com.chat_app.service.NotificationService; // Import NotificationService
import com.chat_app.service.UsernameService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID; // Import UUID for generating unique IDs

@Controller
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageService chatMessageService;
    private final UsernameService usernameService;
    private final NotificationService notificationService; // Inject NotificationService
    private final UserRepository userRepository;
    public ChatController(SimpMessagingTemplate messagingTemplate, ChatMessageService chatMessageService, UsernameService usernameService, NotificationService notificationService, UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.chatMessageService = chatMessageService;
        this.usernameService = usernameService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage, Principal principal) {
        chatMessage.setTimestamp(LocalDateTime.now().toString());
        chatMessage.setId(UUID.randomUUID().toString()); // Generate a unique ID for the message
        chatMessageService.saveMessage(chatMessage);

        // Send push notification to all other users in the public chat
        notificationService.sendNotificationToAllPublicChatUsers(
                "New Public Message",
                chatMessage.getSender() + ": " + chatMessage.getContent(),
                "/chat", // The URL to open when the notification is clicked
                principal.getName() // Exclude the sender
        );

        return chatMessage;
    }

    @MessageMapping("/send-message")
    public void handlePrivateMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setTimestamp(LocalDateTime.now().toString());
        chatMessage.setId(UUID.randomUUID().toString()); // Generate a unique ID
        chatMessageService.saveMessage(chatMessage);
        messagingTemplate.convertAndSendToUser(
                chatMessage.getReceiver(),
                "/queue/private",
                chatMessage
        );

        // Send push notification to the receiver of the private message
        userRepository.findByEmail(chatMessage.getReceiver())
                .ifPresent(receiver -> notificationService.sendNotification(
                        receiver,
                        "New Private Message",
                        chatMessage.getSender() + ": " + chatMessage.getContent(),
                        "/private/" + chatMessage.getSender() // URL to the private chat
                ));
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage,
                               SimpMessageHeaderAccessor headerAccessor) {
        String senderEmail = chatMessage.getSender();
        String username = usernameService.getUsernameByEmail(senderEmail);

        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null) {
            sessionAttributes.put("email", senderEmail);
            sessionAttributes.put("username", username);
        } else {
            System.err.println("WARNING: SimpMessageHeaderAccessor.getSessionAttributes() is null in chat.addUser. Cannot store email/username in session.");
        }

        // Send push notification to all other users about the join event
        notificationService.sendNotificationToAllPublicChatUsers(
                "User Joined",
                username + " has joined the chat.",
                "/chat",
                senderEmail // Exclude the joining user
        );

        return ChatMessage.builder()
                .type(ChatMessage.MessageType.JOIN)
                .sender(senderEmail)
                .content("{\"username\": \"" + username + "\"}")
                .timestamp(LocalDateTime.now().toString())
                .id(UUID.randomUUID().toString()) // Generate a unique ID for the JOIN message
                .build();
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        String email = null;
        Principal principal = headerAccessor.getUser();
        if (principal != null) {
            email = principal.getName();
        }

        String username = null;
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null) {
            username = (String) sessionAttributes.get("username");
        }

        if (username == null && email != null) {
            username = usernameService.getUsernameByEmail(email);
            if (sessionAttributes != null) {
                sessionAttributes.put("username", username);
                sessionAttributes.put("email", email);
            }
        }

        if (username == null) {
            username = "anonymous";
        }

        ChatMessage chatMessage = ChatMessage.builder()
                .type(ChatMessage.MessageType.JOIN)
                .sender(email != null ? email : "anonymous")
                .content("{\"username\": \"" + username + "\"}")
                .timestamp(LocalDateTime.now().toString())
                .id(UUID.randomUUID().toString()) // Generate a unique ID for the JOIN event
                .build();

        messagingTemplate.convertAndSend("/topic/public", chatMessage);

        // No need to send a separate notification here, as addUser is called after connect
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        String email = null;
        String username = null;

        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null) {
            email = (String) sessionAttributes.get("email");
            username = (String) sessionAttributes.get("username");
        } else {
            System.err.println("WARNING: SimpMessageHeaderAccessor.getSessionAttributes() is null in handleWebSocketDisconnectListener. Cannot retrieve user details for LEAVE message from session.");
        }

        if (email == null || username == null) {
            Principal principal = headerAccessor.getUser();
            if (principal != null) {
                email = principal.getName();
                if (username == null) {
                    username = usernameService.getUsernameByEmail(email);
                }
            }
        }

        if (username == null) {
            username = "anonymous";
        }
        if (email == null) {
            email = "anonymous";
        }

        if (username != null) {
            ChatMessage chatMessage = ChatMessage.builder()
                    .type(ChatMessage.MessageType.LEAVE)
                    .sender(email)
                    .content("{\"username\": \"" + username + "\"}")
                    .timestamp(LocalDateTime.now().toString())
                    .id(UUID.randomUUID().toString()) // Generate a unique ID for the LEAVE event
                    .build();
            messagingTemplate.convertAndSend("/topic/public", chatMessage);

            // Send push notification to all other users about the leave event
            notificationService.sendNotificationToAllPublicChatUsers(
                    "User Left",
                    username + " has left the chat.",
                    "/chat",
                    email // Exclude the leaving user
            );
        }
    }
}