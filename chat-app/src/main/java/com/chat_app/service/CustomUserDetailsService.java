package com.chat_app.service;

import com.chat_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

// IMPORTANT: Ensure your User entity is correctly imported
import com.chat_app.entity.User; // <--- Make sure this import is present and correct

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // --- FIX IS HERE ---
        // user.getRole() already returns a String, so no .name() needed.
        String roleName = user.getRole();

        // It's common practice to prefix roles with "ROLE_" in Spring Security.
        // Ensure your roles in the database are like "ADMIN", "USER", "MODERATOR" etc.
        // and then add "ROLE_" here if not already present in your role definition.
        if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName;
        }

        // Creating a list of authorities (even if it's just one role)
        List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(roleName));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),        // The username (or email)
                user.getPassword(),     // The password (must be BCrypt encoded from DB)
                authorities             // The collection of GrantedAuthority objects
        );
    }
}