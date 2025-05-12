package com.chat_app.service;

import com.chat_app.repository.UserRepository; // Assuming you have this repository
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsernameService {

    private final UserRepository userRepository;

    /**
     * Retrieves the username for a given email.
     * Falls back to a part of the email if no username is found in the database.
     *
     * @param email The email of the user.
     * @return The username associated with the email, or a derived name if not found.
     */
    public String getUsernameByEmail(String email) {
        // Assuming your User entity has a getUsername() method
        return userRepository.findByEmail(email)
                .map(user -> user.getUsername()) // Assuming `User` entity has `getUsername()`
                .orElse(email.split("@")[0]); // Fallback to the part before '@' in the email
    }
}