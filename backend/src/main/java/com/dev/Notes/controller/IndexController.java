package com.dev.Notes.controller;

import com.dev.Notes.dto.response.UserPreferencesResponse;
import com.dev.Notes.service.UserPreferencesService;
import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Profile("prod")
@RestController
@Slf4j
public class IndexController {

    private static final String MARKER = "<!--INJECT_PREFS-->";
    private static final String INDEX_PATH = "static/index.html";

    private final UserPreferencesService userPreferencesService;
    private final ObjectMapper objectMapper;
    private String cachedHtml;

    public IndexController(UserPreferencesService userPreferencesService, ObjectMapper objectMapper) {
        this.userPreferencesService = userPreferencesService;
        this.objectMapper = objectMapper;
    }

    @GetMapping(value = "/**", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> index(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri != null && (uri.startsWith("/api")
                || uri.startsWith("/swagger-ui") || uri.startsWith("/v3/"))) {
            return ResponseEntity.notFound().build();
        }
        String html = loadHtml();
        if (html == null) {
            return ResponseEntity.notFound().build();
        }
        String prefsJson = resolvePrefs();
        String script = "<script>window.__PREFS__ = " + prefsJson + ";</script>";
        String body = html.contains(MARKER) ? html.replace(MARKER, script) : html + script;
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(body);
    }

    private String resolvePrefs() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return "null";
        String username = null;
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetails ud) {
            username = ud.getUsername();
        } else if (principal instanceof String s) {
            username = s;
        }
        if (username == null) return "null";
        try {
            UserPreferencesResponse prefs = userPreferencesService.getUserPreferences(username);
            return objectMapper.writeValueAsString(prefs);
        } catch (Exception e) {
            log.warn("Failed to resolve prefs for {}: {}", username, e.getMessage());
            return "null";
        }
    }

    private String loadHtml() {
        if (cachedHtml != null) return cachedHtml;
        try {
            var resource = new ClassPathResource(INDEX_PATH);
            if (!resource.exists()) {
                log.warn("index.html not found at {}", INDEX_PATH);
                return null;
            }
            cachedHtml = new String(resource.getContentAsByteArray(), StandardCharsets.UTF_8);
            log.info("Cached index.html ({} bytes)", cachedHtml.length());
            return cachedHtml;
        } catch (IOException e) {
            log.error("Failed to read index.html", e);
            return null;
        }
    }
}