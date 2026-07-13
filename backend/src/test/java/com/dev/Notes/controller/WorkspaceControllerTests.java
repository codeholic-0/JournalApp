package com.dev.Notes.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.dev.Notes.config.JwtUtil;
import com.dev.Notes.dto.request.WorkspacePatchRequest;
import com.dev.Notes.dto.request.WorkspaceRequest;
import com.dev.Notes.dto.response.WorkspaceDeleteResponse;
import com.dev.Notes.dto.response.WorkspaceResponse;
import com.dev.Notes.service.UserDetailsServiceImpl;
import com.dev.Notes.service.WorkspaceService;

import tools.jackson.databind.ObjectMapper;

@WebMvcTest(WorkspaceController.class)
@WithMockUser(username = "testuser")
@Tag("WorkspaceControllerTests")
public class WorkspaceControllerTests {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WorkspaceService workspaceService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    private WorkspaceResponse sampleResponse() {
        WorkspaceResponse r = new WorkspaceResponse();
        r.setId("ws-1");
        r.setName("My Workspace");
        r.setColor("#1976d2");
        r.setIcon("folder");
        r.setSortOrder("1");
        r.setCreatedAt(LocalDateTime.now());
        r.setUpdatedAt(LocalDateTime.now());
        return r;
    }

    @TestConfiguration
    static class TestSecurityConfig implements WebMvcConfigurer {
        @Override
        public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
            resolvers.add(new AuthenticationPrincipalArgumentResolver());
        }
    }

    @Test
    void getWorkspaces_returns200() throws Exception {
        when(workspaceService.getWorkspaces("testuser", "name"))
                .thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/workspaces?sort=name"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("My Workspace"));
    }

    @Test
    void createWorkspace_returns201() throws Exception {
        WorkspaceRequest req = new WorkspaceRequest("My Workspace", "#1976d2", "folder");
        when(workspaceService.createWorkspace(eq("testuser"), any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/workspaces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("My Workspace"));
    }

    @Test
    void getWorkspace_returns200() throws Exception {
        when(workspaceService.getWorkspaceById("testuser", "ws-1")).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/workspaces/ws-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("ws-1"));
    }

    @Test
    void updateWorkspace_returns200() throws Exception {
        WorkspacePatchRequest req = new WorkspacePatchRequest("Renamed", null, null);
        when(workspaceService.updateWorkspace(eq("testuser"), eq("ws-1"), any())).thenReturn(sampleResponse());

        mockMvc.perform(patch("/api/workspaces/ws-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void deleteWorkspace_returns200() throws Exception {
        WorkspaceDeleteResponse delRes = new WorkspaceDeleteResponse("trash", 100L, 5);
        when(workspaceService.deleteWorkspace("testuser", "ws-1")).thenReturn(delRes);

        mockMvc.perform(delete("/api/workspaces/ws-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode").value("trash"))
                .andExpect(jsonPath("$.bytes").value(100));
    }
}
