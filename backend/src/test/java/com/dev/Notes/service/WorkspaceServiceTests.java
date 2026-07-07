package com.dev.Notes.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.redis.core.RedisTemplate;

import com.dev.Notes.common.WorkspaceSizeResult;
import com.dev.Notes.dto.request.WorkspacePatchRequest;
import com.dev.Notes.dto.request.WorkspaceRequest;
import com.dev.Notes.dto.response.WorkspaceDeleteResponse;
import com.dev.Notes.dto.response.WorkspaceResponse;
import com.dev.Notes.enumeration.UserType;
import com.dev.Notes.exceptions.WorkspaceConflictException;
import com.dev.Notes.exceptions.WorkspaceOwnershipMismatchException;
import com.dev.Notes.models.Note;
import com.dev.Notes.models.User;
import com.dev.Notes.models.Workspace;
import com.dev.Notes.repository.NoteRepository;
import com.dev.Notes.repository.UserRepository;
import com.dev.Notes.repository.WorkspaceRepository;

@ExtendWith(MockitoExtension.class)
@Tag("WorkspaceTests")
public class WorkspaceServiceTests {
    @Mock
    private WorkspaceRepository workspaceRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NoteRepository noteRepository;
    @Mock
    private RedisTemplate<String, Object> redisTemplate;
    @Mock
    private MongoTemplate mongoTemplate;

    private WorkspaceService workspaceService;

    @BeforeEach
    void setUp() {
        workspaceService = new WorkspaceService(
                workspaceRepository, userRepository, noteRepository,
                redisTemplate, mongoTemplate, 524288000L);
    }

    private Workspace workspace(String name) {
        Workspace w = new Workspace();
        w.setId("ws-" + name);
        w.setUsername("testuser");
        w.setName(name);
        w.setIcon("folder");
        w.setColor("#000");
        w.setSortOrder("1");
        return w;
    }

    private WorkspaceSizeResult sizeResult(long bytes, int count) {
        return new WorkspaceSizeResult() {
            @Override
            public Long getTotal() {
                return bytes;
            }

            @Override
            public Integer getCount() {
                return count;
            }
        };
    }

    @Test
    void createWorkspace_success() {
        WorkspaceRequest req = new WorkspaceRequest("My Workspace", "#1976d2", "folder");
        when(workspaceRepository.existsByUsernameAndName("testuser", "My Workspace")).thenReturn(false);
        when(workspaceRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        WorkspaceResponse res = workspaceService.createWorkspace("testuser", req);

        assertThat(res.getName()).isEqualTo("My Workspace");
        assertThat(res.getColor()).isEqualTo("#1976d2");
        assertThat(res.getIcon()).isEqualTo("folder");
        verify(workspaceRepository).save(any());
    }

    @Test
    void createWorkspace_duplicateName_throws() {
        WorkspaceRequest req = new WorkspaceRequest("My Workspace", "#1976d2", "folder");
        when(workspaceRepository.existsByUsernameAndName("testuser", "My Workspace")).thenReturn(true);

        assertThrows(WorkspaceConflictException.class,
                () -> workspaceService.createWorkspace("testuser", req));
    }

    @Test
    void getOrCreateInternalWorkspace_createsNew() {
        User user = new User("uid", "testuser", "password", List.of(), List.of(UserType.USER));
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(workspaceRepository.findByUsernameAndName("testuser", "__internal_uid")).thenReturn(Optional.empty());
        when(workspaceRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        WorkspaceResponse res = workspaceService.getOrCreateInternalWorkspace("testuser");

        assertThat(res.getName()).isEqualTo("__internal_uid");
        verify(workspaceRepository).save(any());
    }

    @Test
    void getOrCreateInternalWorkspace_returnsExisting() {
        User user = new User("uid", "testuser", "password", List.of(), List.of(UserType.USER));
        Workspace internal = workspace("__internal_uid");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(workspaceRepository.findByUsernameAndName("testuser", "__internal_uid")).thenReturn(Optional.of(internal));

        WorkspaceResponse res = workspaceService.getOrCreateInternalWorkspace("testuser");

        assertThat(res.getId()).isEqualTo("ws-__internal_uid");
        verify(workspaceRepository, never()).save(any());
    }

    @Test
    void getWorkspaceById_owned_returns() {
        Workspace ws = workspace("personal");
        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(ws));

        WorkspaceResponse res = workspaceService.getWorkspaceById("testuser", "ws-1");

        assertThat(res.getName()).isEqualTo("personal");
    }

    @Test
    void getWorkspaceById_notOwned_throws() {
        Workspace ws = workspace("personal");
        ws.setUsername("otheruser");
        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(ws));

        assertThrows(WorkspaceOwnershipMismatchException.class,
                () -> workspaceService.getWorkspaceById("testuser", "ws-1"));
    }

    @Test
    void getWorkspaces_sortedByName() {
        when(workspaceRepository.findByUsername(eq("testuser"), any(Sort.class)))
                .thenReturn(List.of(workspace("A"), workspace("B")));

        var res = workspaceService.getWorkspaces("testuser", "name", false);

        assertThat(res).hasSize(2);
    }

    @Test
    void getWorkspaces_filtersInternal() {
        Workspace normal = workspace("personal");
        Workspace internal = workspace("__internal_uid");
        when(workspaceRepository.findByUsername(eq("testuser"), any(Sort.class)))
                .thenReturn(List.of(normal, internal));

        var res = workspaceService.getWorkspaces("testuser", "name", false);

        assertThat(res).hasSize(1);
        assertThat(res.get(0).getName()).isEqualTo("personal");
    }

    @Test
    void deleteWorkspace_underThreshold_trashMode() {
        Workspace ws = workspace("personal");
        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(ws));
        when(noteRepository.aggregateWorkspaceSize("ws-1"))
                .thenReturn(List.of(sizeResult(100L, 5)));

        WorkspaceDeleteResponse res = workspaceService.deleteWorkspace("testuser", "ws-1");

        assertThat(res.getMode()).isEqualTo("trash");
        assertThat(res.getBytes()).isEqualTo(100L);
        assertThat(res.getNotesHandled()).isEqualTo(5);
        verify(mongoTemplate).updateMulti(any(), any(), eq(Note.class));
        verify(noteRepository, never()).deleteByWorkspaceId(any());
        verify(workspaceRepository).deleteById("ws-1");
    }

    @Test
    void deleteWorkspace_overThreshold_hardDelete() {
        Workspace ws = workspace("personal");
        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(ws));
        when(noteRepository.aggregateWorkspaceSize("ws-1"))
                .thenReturn(List.of(sizeResult(600_000_000L, 1000)));

        WorkspaceDeleteResponse res = workspaceService.deleteWorkspace("testuser", "ws-1");

        assertThat(res.getMode()).isEqualTo("hard_delete");
        verify(noteRepository).deleteByWorkspaceId("ws-1");
        verify(mongoTemplate, never()).updateMulti(any(), any(), eq(Note.class));
        verify(workspaceRepository).deleteById("ws-1");
    }

    @Test
    void updateWorkspace_renamed_success() {
        Workspace ws = workspace("old");
        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(ws));
        when(workspaceRepository.existsByUsernameAndName("testuser", "new")).thenReturn(false);

        WorkspacePatchRequest req = new WorkspacePatchRequest("new", null, null);
        WorkspaceResponse res = workspaceService.updateWorkspace("testuser", "ws-1", req);

        assertThat(res.getName()).isEqualTo("new");
    }

    @Test
    void updateWorkspace_duplicateName_throws() {
        Workspace ws = workspace("old");
        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(ws));
        when(workspaceRepository.existsByUsernameAndName("testuser", "taken")).thenReturn(true);

        WorkspacePatchRequest req = new WorkspacePatchRequest("taken", null, null);

        assertThrows(WorkspaceConflictException.class,
                () -> workspaceService.updateWorkspace("testuser", "ws-1", req));
    }
}
