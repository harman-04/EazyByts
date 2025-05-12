package com.chat_app.entity;

import jakarta.persistence.*; // <--- Keep this import for @Entity, @Table, @Column, @GeneratedValue, GenerationType
import lombok.*;
// import org.springframework.data.annotation.Id; // <--- REMOVE THIS INCORRECT IMPORT!

// IMPORTANT: ADD THIS CORRECT IMPORT FOR JPA's @Id
import jakarta.persistence.Id;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id // This @Id is now from jakarta.persistence.Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String email;

    @Column(nullable = false)
    private String password;

    private String role = "USER";
}