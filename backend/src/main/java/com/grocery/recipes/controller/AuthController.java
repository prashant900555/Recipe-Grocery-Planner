package com.grocery.recipes.controller;

import com.grocery.recipes.model.RefreshToken;
import com.grocery.recipes.model.User;
import com.grocery.recipes.security.JwtUtils;
import com.grocery.recipes.service.AuthService;
import com.grocery.recipes.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthController(AuthenticationManager authenticationManager,
                          UserService userService,
                          AuthService authService,
                          PasswordEncoder passwordEncoder,
                          JwtUtils jwtUtils) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.authService = authService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
        // Check if email already exists
        if (userService.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Check if phone already exists
        if (userService.existsByPhone(signUpRequest.getPhoneAreaCode(), signUpRequest.getPhoneNumber())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Phone number is already in use!"));
        }

        // Create new user
        User user = new User();
        user.setName(signUpRequest.getName());
        user.setEmail(signUpRequest.getEmail());
        user.setPhoneAreaCode(signUpRequest.getPhoneAreaCode());
        user.setPhoneNumber(signUpRequest.getPhoneNumber());
        user.setPasswordHash(signUpRequest.getPassword()); // Will be hashed in service

        User savedUser = userService.createUser(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest,
                                              HttpServletResponse response) {

        // Find user by email or phone
        Optional<User> userOpt;
        if (loginRequest.getLoginIdentifier().contains("@")) {
            // Email login
            userOpt = userService.findByEmail(loginRequest.getLoginIdentifier());
        } else {
            // Phone login - assuming format is "+91-1234567890"
            String[] parts = loginRequest.getLoginIdentifier().split("-", 2);
            if (parts.length == 2) {
                userOpt = userService.findByPhoneAreaCodeAndPhoneNumber(parts[0], parts[1]);
            } else {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Invalid phone number format. Use: +areacode-number"));
            }
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Invalid credentials!"));
        }

        User user = userOpt.get();

        // Verify password
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Invalid credentials!"));
        }

        // Generate JWT token
        String jwt = jwtUtils.generateJwtToken(user.getEmail(), user.getId());

        // Create refresh token
        RefreshToken refreshToken = authService.createRefreshToken(user, loginRequest.getDeviceInfo());

        // Set JWT as HttpOnly cookie
        Cookie jwtCookie = new Cookie("accessToken", jwt);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setSecure(true); // Use only in HTTPS
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(30 * 60); // 30 minutes
        response.addCookie(jwtCookie);

        // Set Refresh Token as HttpOnly cookie
        Cookie refreshCookie = new Cookie("refreshToken", refreshToken.getToken());
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(true);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(14 * 24 * 60 * 60); // 14 days
        response.addCookie(refreshCookie);

        return ResponseEntity.ok(new JwtResponse(jwt, refreshToken.getToken(), user));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@CookieValue(value = "refreshToken", required = false) String refreshTokenStr,
                                          HttpServletResponse response) {
        if (refreshTokenStr == null || refreshTokenStr.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Refresh Token is empty!"));
        }

        return authService.findByToken(refreshTokenStr)
                .map(authService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    // Generate new access token
                    String newJwt = jwtUtils.generateJwtToken(user.getEmail(), user.getId());

                    // Rotate refresh token
                    RefreshToken oldToken = authService.findByToken(refreshTokenStr).get();
                    RefreshToken newRefreshToken = authService.rotateRefreshToken(oldToken, "");

                    // Set new cookies
                    Cookie jwtCookie = new Cookie("accessToken", newJwt);
                    jwtCookie.setHttpOnly(true);
                    jwtCookie.setSecure(true);
                    jwtCookie.setPath("/");
                    jwtCookie.setMaxAge(30 * 60);
                    response.addCookie(jwtCookie);

                    Cookie refreshCookie = new Cookie("refreshToken", newRefreshToken.getToken());
                    refreshCookie.setHttpOnly(true);
                    refreshCookie.setSecure(true);
                    refreshCookie.setPath("/");
                    refreshCookie.setMaxAge(14 * 24 * 60 * 60);
                    response.addCookie(refreshCookie);

                    return ResponseEntity.ok(new TokenRefreshResponse(newJwt, newRefreshToken.getToken()));
                })
                .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(@CookieValue(value = "refreshToken", required = false) String refreshTokenStr,
                                        HttpServletResponse response) {
        if (refreshTokenStr != null) {
            authService.findByToken(refreshTokenStr)
                    .ifPresent(token -> authService.deleteByUser(token.getUser()));
        }

        // Clear cookies
        Cookie jwtCookie = new Cookie("accessToken", "");
        jwtCookie.setHttpOnly(true);
        jwtCookie.setSecure(true);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(0);
        response.addCookie(jwtCookie);

        Cookie refreshCookie = new Cookie("refreshToken", "");
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(true);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(0);
        response.addCookie(refreshCookie);

        return ResponseEntity.ok(new MessageResponse("Log out successful!"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Not authenticated"));
        }

        String email = authentication.getName();
        Optional<User> userOpt = userService.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }

        User user = userOpt.get();
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("name", user.getName());
        userInfo.put("email", user.getEmail());
        userInfo.put("phoneAreaCode", user.getPhoneAreaCode());
        userInfo.put("phoneNumber", user.getPhoneNumber());
        userInfo.put("fullPhoneNumber", user.getFullPhoneNumber());

        return ResponseEntity.ok(userInfo);
    }

    // DTOs
    public static class RegisterRequest {
        private String name;
        private String email;
        private String phoneAreaCode;
        private String phoneNumber;
        private String password;

        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhoneAreaCode() { return phoneAreaCode; }
        public void setPhoneAreaCode(String phoneAreaCode) { this.phoneAreaCode = phoneAreaCode; }
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginRequest {
        private String loginIdentifier; // email or phone
        private String password;
        private String deviceInfo;

        // Getters and setters
        public String getLoginIdentifier() { return loginIdentifier; }
        public void setLoginIdentifier(String loginIdentifier) { this.loginIdentifier = loginIdentifier; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getDeviceInfo() { return deviceInfo; }
        public void setDeviceInfo(String deviceInfo) { this.deviceInfo = deviceInfo; }
    }

    public static class MessageResponse {
        private String message;

        public MessageResponse(String message) {
            this.message = message;
        }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class JwtResponse {
        private String token;
        private String type = "Bearer";
        private String refreshToken;
        private User user;

        public JwtResponse(String accessToken, String refreshToken, User user) {
            this.token = accessToken;
            this.refreshToken = refreshToken;
            this.user = user;
        }

        // Getters and setters
        public String getAccessToken() { return token; }
        public void setAccessToken(String accessToken) { this.token = accessToken; }
        public String getTokenType() { return type; }
        public void setTokenType(String tokenType) { this.type = tokenType; }
        public String getRefreshToken() { return refreshToken; }
        public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
        public User getUser() { return user; }
        public void setUser(User user) { this.user = user; }
    }

    public static class TokenRefreshResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";

        public TokenRefreshResponse(String accessToken, String refreshToken) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
        }

        // Getters and setters
        public String getAccessToken() { return accessToken; }
        public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
        public String getRefreshToken() { return refreshToken; }
        public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
        public String getTokenType() { return tokenType; }
        public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    }
}
