package com.chat_app.service;

import com.chat_app.dto.ChatMessage;
import com.chat_app.entity.Message;
import com.chat_app.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatMessageService {

    @Autowired
    private MessageRepository messageRepository;

    public Message saveMessage(ChatMessage chatMessage) {
        Message msg = new Message();
        msg.setSender(chatMessage.getSender());
        msg.setReceiver(chatMessage.getReceiver());
        msg.setContent(chatMessage.getContent());
        msg.setTimestamp(LocalDateTime.now());
        msg.setType(Message.MessageType.valueOf(chatMessage.getType().name()));
        return messageRepository.save(msg);
    }

    public List<Message> getPublicMessages() {
        return messageRepository.findByReceiverIsNullOrderByTimestampAsc();
    }

    public List<Message> getPrivateMessages(String user1, String user2) {
        return messageRepository.findPrivateChat(user1, user2);
    }
}
