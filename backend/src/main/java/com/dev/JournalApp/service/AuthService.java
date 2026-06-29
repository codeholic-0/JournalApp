package com.dev.JournalApp.service;

import com.dev.JournalApp.config.JwtUtil;
import com.dev.JournalApp.dto.request.LoginRequest;
import com.dev.JournalApp.dto.request.UserRequest;
import com.dev.JournalApp.dto.response.AuthResponse;
import com.dev.JournalApp.enumeration.UserType;
import com.dev.JournalApp.exceptions.ResourceNotFoundException;
import com.dev.JournalApp.exceptions.UserAlreadyExistsException;
import com.dev.JournalApp.models.User;
import com.dev.JournalApp.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.refreshTokenService = refreshTokenService;
    }

    private AuthResponse toUserResponse(User user, String accessToken, String refreshToken) {
        AuthResponse res = new AuthResponse();
        res.setUsername(user.getUsername());
        res.setRoles(user.getRoles());
        res.setAccessToken(accessToken);
        res.setRefreshToken(refreshToken);
        return res;
    }

    @Transactional
    public AuthResponse createNewUser(UserRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            log.warn("Duplicate Registration Attempt: {}", req.getUsername());
            throw new UserAlreadyExistsException(req.getUsername());
        } else {
            User user = new User();
            user.setUsername(req.getUsername());
            user.setPassword(passwordEncoder.encode(req.getPassword()));
            user.setRoles(List.of(UserType.USER));
            userRepository.save(user);
            log.info("User Registered: {}", req.getUsername());
            String accessToken = jwtUtil.generateAccessToken(req.getUsername(), user.getRoles());
            String refreshToken = refreshTokenService.createRefreshToken(req.getUsername());

            return toUserResponse(user, accessToken, refreshToken);
        }
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid Credentials!"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid username or password");
        }
        log.info("User logged in: {}", req.getUsername());

        String accessToken = jwtUtil.generateAccessToken(user.getUsername(), user.getRoles());
        String refreshToken = refreshTokenService.createRefreshToken(user.getUsername());

        AuthResponse res = new AuthResponse();
        res.setAccessToken(accessToken);
        res.setRefreshToken(refreshToken);
        res.setUsername(user.getUsername());
        res.setRoles(user.getRoles());
        return res;
    }

    @Transactional
    public AuthResponse refresh(Map<String, String> body) {
        String rawToken = body.get("refreshToken");
        if (rawToken == null) {
            throw new BadCredentialsException("Invalid Token!");
        }
        String username = refreshTokenService.extractUsername(rawToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User with username: " + username + " not found"));
        String newaccessToken = jwtUtil.generateAccessToken(username, user.getRoles());
        String newrefreshToken = refreshTokenService.createRefreshToken(username);

        return new AuthResponse(newaccessToken, newrefreshToken, username, user.getRoles());
    }
}
