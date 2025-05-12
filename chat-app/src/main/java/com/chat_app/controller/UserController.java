package com.chat_app.controller;

// src/main/java/com/example/chatapp/controller/UserController.java

import com.chat_app.entity.User;
import com.chat_app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.security.Principal; // To get the currently authenticated user's email
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users") // This defines the base path for this controller's endpoints
public class UserController {

    @Autowired
    private UserService userService;

    // Optional: A simple DTO (Data Transfer Object) to control what data is sent to the frontend
    public static class UserDto {
        private Long id;
        private String email;
        private String username; // Use username for display if available

        public UserDto(User user) {
            this.id = user.getId();
            this.email = user.getEmail();
            this.username = user.getUsername();
        }

        // Getters
        public Long getId() { return id; }
        public String getEmail() { return email; }
        public String getUsername() { return username; }
    }

    @GetMapping // This maps to GET /api/users
    public ResponseEntity<List<UserDto>> getAllUsers(Principal principal) {
        // Get the email of the currently authenticated user from the JWT token
        String currentUserEmail = principal != null ? principal.getName() : null;

        List<User> users = userService.findAllUsers();

        // Convert User entities to UserDto and filter out the current user
        List<UserDto> userDtos = users.stream()
                .filter(user -> !user.getEmail().equals(currentUserEmail)) // Don't show current user in the list
                .map(UserDto::new) // Map User entity to UserDto
                .collect(Collectors.toList()); // Collect to a list

        return ResponseEntity.ok(userDtos);
    }
}