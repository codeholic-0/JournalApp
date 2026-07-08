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
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import com.dev.Notes.dto.request.FolderPatchRequest;
import com.dev.Notes.dto.request.FolderRequest;
import com.dev.Notes.dto.response.FolderResponse;
import com.dev.Notes.exceptions.FolderConflictException;
import com.dev.Notes.exceptions.FolderNotEmptyException;
import com.dev.Notes.exceptions.WorkspaceOwnershipMismatchException;
import com.dev.Notes.models.Folder;
import com.dev.Notes.models.Note;
import com.dev.Notes.models.Workspace;
import com.dev.Notes.repository.FolderRepository;
import com.dev.Notes.repository.WorkspaceRepository;

@ExtendWith(MockitoExtension.class)
@Tag("FolderTests")
public class FolderServiceTests {

    @Mock
    private FolderRepository folderRepository;

    @Mock
    private WorkspaceRepository workspaceRepository;

    @Mock
    private MongoTemplate mongoTemplate;

    private FolderService folderService;

    @BeforeEach
    void setUp() {
        folderService = new FolderService(folderRepository, workspaceRepository, mongoTemplate);
    }

    private Workspace workspace() {
        Workspace w = new Workspace();
        w.setId("ws-1");
        w.setUsername("testuser");
        w.setName("Test Workspace");
        return w;
    }

    private Folder folder(String id, String name, String parentId, String workspaceId, String path) {
        Folder f = new Folder();
        f.setId(id);
        f.setName(name);
        f.setWorkspaceId(workspaceId != null ? workspaceId : "ws-1");
        f.setParentId(parentId);
        f.setSortOrder("1");
        f.setMaterializedPath(path);
        return f;
    }

    @Test
    void createFolder_root_setsMaterializedPath() {
        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(workspace()));
        when(folderRepository.existsByWorkspaceIdAndName("ws-1", "Root")).thenReturn(false);
        when(folderRepository.save(any())).thenAnswer(invocation -> {
            Folder f = invocation.getArgument(0);
            if (f.getId() == null) f.setId("f-root");
            return f;
        });

        FolderRequest req = new FolderRequest("Root", null, null, null);
        FolderResponse res = folderService.createFolder("testuser", "ws-1", req);

        assertThat(res.getName()).isEqualTo("Root");
        assertThat(res.getMaterializedPath()).isEqualTo("/ws-1/f-root");
        assertThat(res.getParentId()).isNull();
        verify(folderRepository, times(2)).save(any());
    }

    @Test
    void createFolder_child_setsMaterializedPath() {
        Folder parent = folder("f-parent", "Parent", null, "ws-1", "/ws-1/f-parent");

        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(workspace()));
        when(folderRepository.existsByWorkspaceIdAndName("ws-1", "Child")).thenReturn(false);
        when(folderRepository.findById("f-parent")).thenReturn(Optional.of(parent));
        when(folderRepository.save(any())).thenAnswer(invocation -> {
            Folder f = invocation.getArgument(0);
            if (f.getId() == null) f.setId("f-child");
            return f;
        });

        FolderRequest req = new FolderRequest("Child", "f-parent", null, null);
        FolderResponse res = folderService.createFolder("testuser", "ws-1", req);

        assertThat(res.getName()).isEqualTo("Child");
        assertThat(res.getMaterializedPath()).isEqualTo("/ws-1/f-parent/f-child");
        assertThat(res.getParentId()).isEqualTo("f-parent");
    }

    @Test
    void createFolder_duplicateName_throws() {
        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(workspace()));
        when(folderRepository.existsByWorkspaceIdAndName("ws-1", "Root")).thenReturn(true);

        FolderRequest req = new FolderRequest("Root", null, null, null);
        assertThrows(FolderConflictException.class,
                () -> folderService.createFolder("testuser", "ws-1", req));
    }

    @Test
    void updateFolder_setSelfAsParent_throws() {
        Folder existing = folder("f-1", "Folder", null, "ws-1", "/ws-1/f-1");
        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(workspace()));
        when(folderRepository.findById("f-1")).thenReturn(Optional.of(existing));

        FolderPatchRequest req = new FolderPatchRequest(null, "f-1", null, null);
        assertThrows(FolderConflictException.class,
                () -> folderService.updateFolder("testuser", "ws-1", "f-1", req));
    }

    @Test
    void updateFolder_setDescendantAsParent_throws() {
        Folder folder = folder("f-parent", "Parent", null, "ws-1", "/ws-1/f-parent");
        Folder child = folder("f-child", "Child", "f-parent", "ws-1", "/ws-1/f-parent/f-child");

        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(workspace()));
        when(folderRepository.findById("f-parent")).thenReturn(Optional.of(folder));
        when(folderRepository.findById("f-child")).thenReturn(Optional.of(child));

        FolderPatchRequest req = new FolderPatchRequest(null, "f-child", null, null);
        assertThrows(FolderConflictException.class,
                () -> folderService.updateFolder("testuser", "ws-1", "f-parent", req));
    }

    @Test
    void updateFolder_reparent_rebuildsSubtreePaths() {
        Folder root = folder("f-root", "Root", null, "ws-1", "/ws-1/f-root");
        Folder newParent = folder("f-new", "NewParent", null, "ws-1", "/ws-1/f-new");
        Folder descendant = folder("f-child", "Child", "f-root", "ws-1", "/ws-1/f-root/f-child");

        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(workspace()));
        when(folderRepository.findById("f-root")).thenReturn(Optional.of(root));
        when(folderRepository.findById("f-new")).thenReturn(Optional.of(newParent));
        when(folderRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(folderRepository.findByWorkspaceIdAndMaterializedPathStartingWith("ws-1", "/ws-1/f-root/"))
                .thenReturn(List.of(descendant));

        FolderPatchRequest req = new FolderPatchRequest(null, "f-new", null, null);
        FolderResponse res = folderService.updateFolder("testuser", "ws-1", "f-root", req);

        assertThat(res.getParentId()).isEqualTo("f-new");
        assertThat(res.getMaterializedPath()).isEqualTo("/ws-1/f-new/f-root");
        verify(folderRepository).findByWorkspaceIdAndMaterializedPathStartingWith("ws-1", "/ws-1/f-root/");
        verify(folderRepository, times(3)).save(any());
    }

    @Test
    void updateFolder_rename_success() {
        Folder existing = folder("f-1", "Old", null, "ws-1", "/ws-1/f-1");
        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(workspace()));
        when(folderRepository.findById("f-1")).thenReturn(Optional.of(existing));
        when(folderRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        FolderPatchRequest req = new FolderPatchRequest("New", null, null, null);
        FolderResponse res = folderService.updateFolder("testuser", "ws-1", "f-1", req);

        assertThat(res.getName()).isEqualTo("New");
        verify(folderRepository, times(2)).save(any());
    }

    @Test
    void deleteFolder_withoutForce_hasChildren_throws() {
        Folder folder = folder("f-1", "Folder", null, "ws-1", "/ws-1/f-1");
        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(workspace()));
        when(folderRepository.findById("f-1")).thenReturn(Optional.of(folder));
        when(folderRepository.findByWorkspaceIdAndParentId("ws-1", "f-1"))
                .thenReturn(List.of(folder("f-2", "Child", "f-1", "ws-1", "/ws-1/f-1/f-2")));

        assertThrows(FolderNotEmptyException.class,
                () -> folderService.deleteFolder("testuser", "ws-1", "f-1", false));
    }

    @Test
    void deleteFolder_withoutForce_hasNotes_throws() {
        Folder folder = folder("f-1", "Folder", null, "ws-1", "/ws-1/f-1");
        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(workspace()));
        when(folderRepository.findById("f-1")).thenReturn(Optional.of(folder));
        when(folderRepository.findByWorkspaceIdAndParentId("ws-1", "f-1")).thenReturn(List.of());
        when(mongoTemplate.count(any(Query.class), eq(Note.class))).thenReturn(3L);

        assertThrows(FolderNotEmptyException.class,
                () -> folderService.deleteFolder("testuser", "ws-1", "f-1", false));
    }

    @Test
    void deleteFolder_withForce_orphansChildrenAndNotes() {
        Folder folder = folder("f-1", "Folder", null, "ws-1", "/ws-1/f-1");
        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(workspace()));
        when(folderRepository.findById("f-1")).thenReturn(Optional.of(folder));

        folderService.deleteFolder("testuser", "ws-1", "f-1", true);

        verify(mongoTemplate, times(1)).updateMulti(any(Query.class), any(Update.class), eq(Note.class));
        verify(mongoTemplate, times(1)).updateMulti(any(Query.class), any(Update.class), eq(Folder.class));
        verify(folderRepository).delete(folder);
    }

    @Test
    void getFolders_sortedByCustom() {
        Folder f1 = folder("f-1", "A", null, "ws-1", "/ws-1/f-1");
        Folder f2 = folder("f-2", "B", null, "ws-1", "/ws-1/f-2");
        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(workspace()));
        when(folderRepository.findByWorkspaceId(eq("ws-1"), any(Sort.class)))
                .thenReturn(List.of(f1, f2));

        var res = folderService.getFolders("testuser", "ws-1", "sortOrder");

        assertThat(res).hasSize(2);
        assertThat(res.get(0).getName()).isEqualTo("A");
    }

    @Test
    void getFolderById_owned_returns() {
        Folder f = folder("f-1", "My Folder", null, "ws-1", "/ws-1/f-1");
        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(workspace()));
        when(folderRepository.findById("f-1")).thenReturn(Optional.of(f));

        FolderResponse res = folderService.getFolderById("testuser", "ws-1", "f-1");

        assertThat(res.getName()).isEqualTo("My Folder");
        assertThat(res.getMaterializedPath()).isEqualTo("/ws-1/f-1");
    }

    @Test
    void getFolderById_notOwned_throws() {
        Workspace otherWs = workspace();
        otherWs.setUsername("otheruser");
        when(workspaceRepository.findById("ws-1")).thenReturn(Optional.of(otherWs));

        assertThrows(WorkspaceOwnershipMismatchException.class,
                () -> folderService.getFolderById("testuser", "ws-1", "f-1"));
    }
}
