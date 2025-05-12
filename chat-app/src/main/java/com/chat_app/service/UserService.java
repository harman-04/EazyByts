package com.chat_app.service;

// src/main/java/com/example/chatapp/service/UserService.java



import com.chat_app.entity.User;
import com.chat_app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // Method to fetch all users from the database
    public List<User> findAllUsers() {
        return userRepository.findAll();
    }

    // You might have other methods here like findByEmail, registerUser, etc.
}