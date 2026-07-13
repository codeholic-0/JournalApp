import { create } from "zustand";
import { persist } from "zustand/middleware";

type WorkspaceSort = "sortOrder" | "name" | "createdAt";

interface VaultState {
    currentWorkspaceId: string | null;
    currentFolderId: string | null;
    workspaceSort: WorkspaceSort;
    expandedFolders: Set<string>;
    selectedTagIds: string[];
    selectedCategoryId: string | null;
    selectedCollectionIds: string[];
    selectedNoteIds: string[];
    filters: { pinned: boolean; favorite: boolean };
    bulkMode: boolean;
    sidebarWidth: number;
    sectionCollapse: Record<string, boolean>;
    dashboardView: "grid" | "list";

    setCurrentFolderId: (id: string | null) => void;
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
    setSidebarWidth: (width: number) => void;
    toggleSection: (section: string) => void;
    setDashboardView: (view: "grid" | "list") => void;
}

function getInitialSidebarWidth(): number {
    if (typeof window === "undefined") return 256;
    try {
        const old = localStorage.getItem("sidebar-collapsed");
        if (old === "true") return 64;
    } catch {
        /* noop */
    }
    return 256;
}

export const useVaultStore = create<VaultState>()(
    persist(
        (set) => ({
            currentFolderId: null,
            currentWorkspaceId: null,
            workspaceSort: "sortOrder",
            expandedFolders: new Set(),
            selectedTagIds: [],
            selectedCategoryId: null,
            selectedCollectionIds: [],
            selectedNoteIds: [],
            filters: { pinned: false, favorite: false },
            bulkMode: false,
            sidebarWidth: getInitialSidebarWidth(),
            sectionCollapse: {},
            dashboardView: "grid",

            setCurrentWorkspaceId: (id) => set({ currentWorkspaceId: id }),
            setCurrentFolderId: (id) => set({ currentFolderId: id }),
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
            setSelectedCollectionIds: (ids) =>
                set({ selectedCollectionIds: ids }),
            setSelectedNoteIds: (ids) => set({ selectedNoteIds: ids }),
            setFilters: (filters) =>
                set((state) => ({
                    filters: { ...state.filters, ...filters },
                })),
            setBulkMode: (mode) => set({ bulkMode: mode }),
            resetSelection: () =>
                set({
                    selectedTagIds: [],
                    selectedCategoryId: null,
                    selectedCollectionIds: [],
                    selectedNoteIds: [],
                }),
            setSidebarWidth: (width) => set({ sidebarWidth: width }),
            toggleSection: (section) =>
                set((state) => ({
                    sectionCollapse: {
                        ...state.sectionCollapse,
                        [section]: !state.sectionCollapse[section],
                    },
                })),
            setDashboardView: (view) => set({ dashboardView: view }),
        }),
        {
            name: "vault-storage",
            partialize: (state) => ({
                currentWorkspaceId: state.currentWorkspaceId,
                currentFolderId: state.currentFolderId,
                expandedFolders: Array.from(state.expandedFolders),
                workspaceSort: state.workspaceSort,
                sidebarWidth: state.sidebarWidth,
                sectionCollapse: state.sectionCollapse,
                dashboardView: state.dashboardView,
            }),
            merge: (persisted, current) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const p = persisted as any;
                return {
                    ...current,
                    ...p,
                    expandedFolders: new Set(p?.expandedFolders ?? []),
                };
            },
        },
    ),
);
