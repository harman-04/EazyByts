package com.chat_app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor; // Often useful to have a no-args constructor with @Data

@Data
@AllArgsConstructor
@NoArgsConstructor // Add this if you also need a no-argument constructor (often good practice for DTOs)
public class AuthResponse {
    private String token; // <--- Missing semicolon here
} // <--- Missing closing curly brace here