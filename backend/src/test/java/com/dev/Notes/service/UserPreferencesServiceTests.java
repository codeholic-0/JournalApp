package com.dev.Notes.service;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;
import java.util.List;
import java.time.Duration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import com.dev.Notes.dto.request.UserPreferencesRequest;
import com.dev.Notes.dto.response.UserPreferencesResponse;
import com.dev.Notes.exceptions.ResourceNotFoundException;
import com.dev.Notes.models.User;
import com.dev.Notes.models.User.Preferences;
import com.dev.Notes.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@Tag("UserPreferencesTests")
public class UserPreferencesServiceTests {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RedisTemplate<String, Object> redisTemplate;
    @Mock
    private ValueOperations<String, Object> valueOps;

    private UserPreferencesService userPreferencesService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        userPreferencesService = new UserPreferencesService(userRepository, redisTemplate);
    }

    private User userWithoutPrefs() {
        return new User("uid", "testuser", "password", List.of(), List.of(), null);
    }

    private User userWithPrefs(String theme, String accent, Double fontScale, String density) {
        Preferences prefs = new Preferences(theme, accent, fontScale, density);
        return new User("uid", "testuser", "password", List.of(), List.of(), prefs);
    }

    @Test
    void getUserPreferences_userNotFound_throws() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userPreferencesService.getUserPreferences("unknown"));
    }

    @Test
    void getUserPreferences_defaultTheme() {
        User user = userWithoutPrefs();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        UserPreferencesResponse res = userPreferencesService.getUserPreferences("testuser");

        assertThat(res.getTheme()).isEqualTo("dark");
        assertThat(res.getAccent()).isNull();
        assertThat(res.getFontScale()).isNull();
        assertThat(res.getDensity()).isNull();
    }

    @Test
    void getUserPreferences_cached() {
        UserPreferencesResponse cached = new UserPreferencesResponse("light", "#e07c3c", 1.0, "compact");
        when(valueOps.get("user:prefs:testuser")).thenReturn(cached);

        UserPreferencesResponse res = userPreferencesService.getUserPreferences("testuser");

        assertThat(res.getTheme()).isEqualTo("light");
        assertThat(res.getAccent()).isEqualTo("#e07c3c");
        verify(userRepository, never()).findByUsername(any());
    }

    @Test
    void getUserPreferences_fromDb_populatesCache() {
        User user = userWithPrefs("light", null, null, null);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(valueOps.get("user:prefs:testuser")).thenReturn(null);

        UserPreferencesResponse res = userPreferencesService.getUserPreferences("testuser");

        assertThat(res.getTheme()).isEqualTo("light");
        verify(valueOps).set(eq("user:prefs:testuser"), any(UserPreferencesResponse.class), any(Duration.class));
    }

    @Test
    void updateUserPreferences_changesTheme() {
        User user = userWithPrefs("dark", null, null, null);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferencesRequest req = new UserPreferencesRequest("light", null, null, null);
        UserPreferencesResponse res = userPreferencesService.updateUserPreferences("testuser", req);

        assertThat(res.getTheme()).isEqualTo("light");
        verify(userRepository).save(any());
        verify(redisTemplate).delete("user:prefs:testuser");
    }

    @Test
    void updateUserPreferences_partialUpdate() {
        User user = userWithPrefs("dark", null, null, null);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferencesRequest req = new UserPreferencesRequest(null, "#e07c3c", null, null);
        UserPreferencesResponse res = userPreferencesService.updateUserPreferences("testuser", req);

        assertThat(res.getTheme()).isEqualTo("dark");
        assertThat(res.getAccent()).isEqualTo("#e07c3c");
        verify(userRepository).save(any());
        verify(redisTemplate).delete("user:prefs:testuser");
    }

    @Test
    void updateUserPreferences_preservesNullFields() {
        User user = userWithPrefs("light", "#e07c3c", 1.0, "compact");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferencesRequest req = new UserPreferencesRequest("dark", null, null, null);
        UserPreferencesResponse res = userPreferencesService.updateUserPreferences("testuser", req);

        assertThat(res.getTheme()).isEqualTo("dark");
        assertThat(res.getAccent()).isEqualTo("#e07c3c");
        assertThat(res.getFontScale()).isEqualTo(1.0);
        assertThat(res.getDensity()).isEqualTo("compact");
    }

    @Test
    void updateUserPreferences_userNotFound_throws() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        UserPreferencesRequest req = new UserPreferencesRequest("light", null, null, null);
        assertThrows(ResourceNotFoundException.class,
                () -> userPreferencesService.updateUserPreferences("unknown", req));
    }
}