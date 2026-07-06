import { create } from "zustand";

type WorkspaceSort = "sortOrder" | "name" | "createdAt";

interface VaultState {
    currentWorkspaceId: string | null;
    workspaceSort: WorkspaceSort;
    expandedFolders: Set<string>;
    selectedTagIds: string[];
    selectedCategoryId: string | null;
    selectedCollectionIds: string[];
    selectedNoteIds: string[];
    filters: { pinned: boolean; favorite: boolean };
    bulkMode: boolean;

    setCurrentWorkspaceId: (id: string | null) => void;
    setWorkspaceSort: (sort: WorkspaceSort) => void;
    toggleFolderExpanded: (id: string) => void;
    setSelectedTagIds: (ids: string[]) => void;
    setSelectedCategoryId: (id: string | null) => void;
    setSelectedCollectionIds: (ids: string[]) => void;
    setSelectedNoteIds: (ids: string[]) => void;
    setFilters: (filters: Partial<VaultState["filters"]>) => void;
    setBulkMode: (mode: boolean) => void;
    resetSelection: () => void;
}

export const useVaultStore = create<VaultState>((set) => ({
    currentWorkspaceId: null,
    workspaceSort: "sortOrder",
    expandedFolders: new Set(),
    selectedTagIds: [],
    selectedCategoryId: null,
    selectedCollectionIds: [],
    selectedNoteIds: [],
    filters: { pinned: false, favorite: false },
    bulkMode: false,

    setCurrentWorkspaceId: (id) => set({ currentWorkspaceId: id }),
    setWorkspaceSort: (sort) => set({ workspaceSort: sort }),
    toggleFolderExpanded: (id) =>
        set((state) => {
            const next = new Set(state.expandedFolders);
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            next.has(id) ? next.delete(id) : next.add(id);
            return { expandedFolders: next };
        }),
    setSelectedTagIds: (ids) => set({ selectedTagIds: ids }),
    setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
    setSelectedCollectionIds: (ids) => set({ selectedCollectionIds: ids }),
    setSelectedNoteIds: (ids) => set({ selectedNoteIds: ids }),
    setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),
    setBulkMode: (mode) => set({ bulkMode: mode }),
    resetSelection: () =>
        set({
            selectedTagIds: [],
            selectedCategoryId: null,
            selectedCollectionIds: [],
            selectedNoteIds: [],
        }),
}));
