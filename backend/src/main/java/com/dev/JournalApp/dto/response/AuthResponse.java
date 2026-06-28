package com.dev.JournalApp.dto.response;

import java.util.ArrayList;
import java.util.List;

import com.dev.JournalApp.enumeration.UserType;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String username;
    private List<UserType> roles = new ArrayList<>();
}
