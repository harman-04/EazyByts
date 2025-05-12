package com.chat_app.controller;

import com.chat_app.entity.Message;
import com.chat_app.service.ChatMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class ChatMessageRestController {

    @Autowired
    private ChatMessageService chatMessageService;

    @GetMapping("/public")
    public ResponseEntity<List<Message>> getPublicMessages() {
        return ResponseEntity.ok(chatMessageService.getPublicMessages());
    }

    @GetMapping("/private")
    public ResponseEntity<List<Message>> getPrivateMessages(@RequestParam String user1, @RequestParam String user2) {
        return ResponseEntity.ok(chatMessageService.getPrivateMessages(user1, user2));
    }
}
