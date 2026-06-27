package com.dev.JournalApp.service;

import com.dev.JournalApp.dto.UserRequest;
import com.dev.JournalApp.dto.UserResponse;
import com.dev.JournalApp.enumeration.UserType;
import com.dev.JournalApp.exceptions.UserAlreadyExistsException;
import com.dev.JournalApp.models.User;
import com.dev.JournalApp.repository.UserRepository;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private UserResponse toUserResponse(User user) {
        UserResponse res = new UserResponse();
        res.setId(user.getId());
        res.setUsername(user.getUsername());
        res.setRoles(user.getRoles());
        return res;
    }

    public UserResponse createNewUser(UserRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new UserAlreadyExistsException(req.getUsername());
        } else {
            User user = new User();
            user.setUsername(req.getUsername());
            user.setPassword(passwordEncoder.encode(req.getPassword()));
            user.setRoles(List.of(UserType.USER));
            userRepository.save(user);
            return toUserResponse(user);
        }
    }
}
