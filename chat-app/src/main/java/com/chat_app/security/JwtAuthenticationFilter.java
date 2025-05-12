package com.chat_app.security;

import com.chat_app.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull; // Ensure this import is present
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException; // IMPORTANT: Add this import
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

// IMPORTANT: Add these imports for JWT specific exceptions
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.security.SignatureException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String servletPath = request.getServletPath();
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        String userEmail = null; // Initialize userEmail to null

        // --- CRITICAL LOGIC START ---
        // 1. Handle requests to public endpoints (like /api/auth/** and /ws/**)
        // If a public endpoint is accessed AND no token is provided, or the token format is wrong,
        // immediately let the request pass through without attempting JWT validation.
        // This is essential for allowing registration and login to work correctly without being blocked by an invalid token.
        if (servletPath.startsWith("/api/auth/") || servletPath.startsWith("/ws/")) {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                filterChain.doFilter(request, response);
                return; // Allow the request to reach AuthController/WebSocket endpoint
            }
            // If a token *is* present on a public path, we will still try to process it below.
            // Any exceptions will be handled gracefully within the try-catch blocks.
        }
        // --- CRITICAL LOGIC END ---


        // If it's not a public path, or if a token was present on a public path, proceed to extract it.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7); // Extract the actual JWT token

        // --- CRITICAL LOGIC START ---
        // Add try-catch blocks to gracefully handle JWT exceptions.
        // This prevents the filter from stopping the request chain prematurely.
        try {
            userEmail = jwtService.extractUsername(jwt);
        } catch (SignatureException e) {
            System.err.println("JWT SignatureException: " + e.getMessage());
            SecurityContextHolder.clearContext(); // Clear any existing authentication context
            // For public paths, allow the request to proceed even if the token is invalid
            if (servletPath.startsWith("/api/auth/") || servletPath.startsWith("/ws/")) {
                filterChain.doFilter(request, response);
                return;
            }
            // For protected paths, an invalid signature means unauthorized
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401 Unauthorized
            response.getWriter().write("Invalid token signature.");
            return;
        } catch (ExpiredJwtException e) {
            System.err.println("JWT ExpiredJwtException: " + e.getMessage());
            SecurityContextHolder.clearContext();
            if (servletPath.startsWith("/api/auth/") || servletPath.startsWith("/ws/")) {
                filterChain.doFilter(request, response);
                return;
            }
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Token expired.");
            return;
        } catch (UsernameNotFoundException e) { // Handle if extractUsername calls userDetailsService and it fails
            System.err.println("JWT UsernameNotFoundException: " + e.getMessage());
            SecurityContextHolder.clearContext();
            if (servletPath.startsWith("/api/auth/") || servletPath.startsWith("/ws/")) {
                filterChain.doFilter(request, response);
                return;
            }
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("User not found from token.");
            return;
        } catch (Exception e) { // Catch any other general JWT parsing errors
            System.err.println("General JWT Exception: " + e.getMessage());
            SecurityContextHolder.clearContext();
            if (servletPath.startsWith("/api/auth/") || servletPath.startsWith("/ws/")) {
                filterChain.doFilter(request, response);
                return;
            }
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Error processing token.");
            return;
        }
        // --- CRITICAL LOGIC END ---


        // If userEmail is successfully extracted and no authentication is currently set in the SecurityContext
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // Load user details from your database
            // This is where the UsernameNotFoundException might originate if the token's subject (email)
            // doesn't correspond to an actual user in the database.
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // If the token is valid for the loaded user details
            if (jwtService.isTokenValid(jwt, userDetails)) {
                // Create an authentication token and set it in the SecurityContext
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null, // Credentials are not stored here
                        userDetails.getAuthorities() // User's roles/authorities
                );
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // Continue the filter chain (pass the request to the next filter or the target controller)
        filterChain.doFilter(request, response);
    }
}