import { describe, it, expect, beforeEach } from "vitest";
import { useVaultStore } from "../../store/vaultStore";

describe("vaultStore", () => {
    beforeEach(() => {
        useVaultStore.setState({
            currentWorkspaceId: null,
            workspaceSort: "sortOrder",
            expandedFolders: new Set(),
            selectedTagIds: [],
            selectedCategoryId: null,
            selectedCollectionIds: [],
            selectedNoteIds: [],
            filters: { pinned: false, favorite: false },
            bulkMode: false,
        });
    });

    it("should initialize with default values", () => {
        const state = useVaultStore.getState();
        expect(state.currentWorkspaceId).toBeNull();
        expect(state.workspaceSort).toBe("sortOrder");
        expect(state.bulkMode).toBe(false);
        expect(state.filters).toEqual({ pinned: false, favorite: false });
    });

    it("should update currentWorkspaceId", () => {
        useVaultStore.getState().setCurrentWorkspaceId("ws-1");
        expect(useVaultStore.getState().currentWorkspaceId).toBe("ws-1");
    });

    it("should set currentWorkspaceId to null", () => {
        useVaultStore.getState().setCurrentWorkspaceId(null);
        expect(useVaultStore.getState().currentWorkspaceId).toBeNull();
    });

    it("should update workspaceSort", () => {
        useVaultStore.getState().setWorkspaceSort("name");
        expect(useVaultStore.getState().workspaceSort).toBe("name");
    });

    it("should toggle expandedFolders", () => {
        useVaultStore.getState().toggleFolderExpanded("f1");
        expect(useVaultStore.getState().expandedFolders.has("f1")).toBe(true);
        useVaultStore.getState().toggleFolderExpanded("f1");
        expect(useVaultStore.getState().expandedFolders.has("f1")).toBe(false);
    });

    it("should set selectedTagIds", () => {
        useVaultStore.getState().setSelectedTagIds(["t1", "t2"]);
        expect(useVaultStore.getState().selectedTagIds).toEqual(["t1", "t2"]);
    });

    it("should set selectedCategoryId", () => {
        useVaultStore.getState().setSelectedCategoryId("cat-1");
        expect(useVaultStore.getState().selectedCategoryId).toBe("cat-1");
    });

    it("should set selectedCollectionIds", () => {
        useVaultStore.getState().setSelectedCollectionIds(["col-1"]);
        expect(useVaultStore.getState().selectedCollectionIds).toEqual([
            "col-1",
        ]);
    });

    it("should set selectedNoteIds", () => {
        useVaultStore.getState().setSelectedNoteIds(["n1"]);
        expect(useVaultStore.getState().selectedNoteIds).toEqual(["n1"]);
    });

    it("should merge filters partially", () => {
        useVaultStore.getState().setFilters({ pinned: true });
        expect(useVaultStore.getState().filters.pinned).toBe(true);
        expect(useVaultStore.getState().filters.favorite).toBe(false);
    });

    it("should set bulkMode", () => {
        useVaultStore.getState().setBulkMode(true);
        expect(useVaultStore.getState().bulkMode).toBe(true);
    });

    it("should reset selections", () => {
        useVaultStore.getState().setSelectedNoteIds(["n1", "n2"]);
        useVaultStore.getState().setSelectedCategoryId("cat-1");
        useVaultStore.getState().resetSelection();
        const state = useVaultStore.getState();
        expect(state.selectedNoteIds).toEqual([]);
        expect(state.selectedCategoryId).toBeNull();
        expect(state.selectedTagIds).toEqual([]);
        expect(state.selectedCollectionIds).toEqual([]);
    });
});
