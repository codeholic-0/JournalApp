package com.dev.Notes.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.dev.Notes.config.JwtUtil;
import com.dev.Notes.dto.response.UserPreferencesResponse;
import com.dev.Notes.service.UserDetailsServiceImpl;
import com.dev.Notes.service.UserPreferencesService;

@WebMvcTest(IndexController.class)
@ActiveProfiles("prod")
@Tag("IndexControllerTests")
public class IndexControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserPreferencesService userPreferencesService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    @Test
    void anonymousRequest_injectsNullPrefs() throws Exception {
        mockMvc.perform(get("/").accept(MediaType.TEXT_HTML))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(content().string(containsString("window.__PREFS__ = null")))
                .andExpect(content().string(containsString("<!doctype html>")));
    }

    @Test
    @WithMockUser(username = "testuser")
    void authenticatedRequest_injectsPrefs() throws Exception {
        UserPreferencesResponse prefs = new UserPreferencesResponse("dark", "#e07c3c", null, null);
        when(userPreferencesService.getUserPreferences("testuser")).thenReturn(prefs);

        mockMvc.perform(get("/").accept(MediaType.TEXT_HTML))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(content().string(containsString("window.__PREFS__ = ")))
                .andExpect(content().string(containsString("\"theme\":\"dark\"")))
                .andExpect(content().string(containsString("\"accent\":\"#e07c3c\"")));
    }

    @Test
    void apiPath_returns404() throws Exception {
        mockMvc.perform(get("/api/check").accept(MediaType.TEXT_HTML))
                .andExpect(status().isNotFound());
    }
}
