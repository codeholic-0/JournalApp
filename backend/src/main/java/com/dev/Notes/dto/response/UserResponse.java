package com.dev.Notes.dto.response;

import java.util.List;

import com.dev.Notes.enumeration.UserType;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private String id;
    private String username;
    private List<UserType> roles;
}
