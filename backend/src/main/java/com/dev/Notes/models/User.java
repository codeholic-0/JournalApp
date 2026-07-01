package com.dev.Notes.models;

import java.util.ArrayList;
import java.util.List;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.dev.Notes.enumeration.UserType;

@Document(collection = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    @NonNull
    @Indexed(unique = true)
    private String username;

    @NonNull
    private String password;

    private List<String> noteIds = new ArrayList<>();

    private List<UserType> roles = new ArrayList<>();
}
