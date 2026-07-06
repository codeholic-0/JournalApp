package com.dev.Notes.dto.response;

import java.util.ArrayList;
import java.util.List;

import com.dev.Notes.enumeration.UserType;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String id;
    private String accessToken;
    private String refreshToken;
    private String username;
    private List<UserType> roles = new ArrayList<>();
}
