import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FolderDialogs from "../../components/FolderDialogs";
import type { FolderResponse } from "../../types/folder";

const queryClient = new QueryClient();

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const mockFolders: FolderResponse[] = [
    {
        id: "f1",
        workspaceId: "ws-1",
        parentId: null,
        name: "Root Folder",
        icon: "folder",
        color: "#1976d2",
        sortOrder: "1",
        materializedPath: "/ws-1/f1",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
    },
    {
        id: "f2",
        workspaceId: "ws-1",
        parentId: "f1",
        name: "Child Folder",
        icon: "folder",
        color: "#2e7d32",
        sortOrder: "2",
        materializedPath: "/ws-1/f1/f2",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
    },
];

describe("FolderDialogs", () => {
    it("renders create dialog when mode is create", () => {
        render(
            <FolderDialogs
                workspaceId="ws-1"
                folders={mockFolders}
                mode="create"
                target={null}
                onClose={() => {}}
            />,
            { wrapper },
        );
        expect(screen.getByText("New folder")).toBeDefined();
        expect(screen.getByPlaceholderText("Folder name")).toBeDefined();
    });

    it("renders rename dialog when mode is rename", () => {
        render(
            <FolderDialogs
                workspaceId="ws-1"
                folders={mockFolders}
                mode="rename"
                target={mockFolders[0]}
                onClose={() => {}}
            />,
            { wrapper },
        );
        expect(screen.getByText("Rename folder")).toBeDefined();
    });

    it("renders move dialog when mode is move", () => {
        render(
            <FolderDialogs
                workspaceId="ws-1"
                folders={mockFolders}
                mode="move"
                target={mockFolders[0]}
                onClose={() => {}}
            />,
            { wrapper },
        );
        expect(screen.getByText("Move folder")).toBeDefined();
    });

    it("renders restyle dialog when mode is restyle", () => {
        render(
            <FolderDialogs
                workspaceId="ws-1"
                folders={mockFolders}
                mode="restyle"
                target={mockFolders[0]}
                onClose={() => {}}
            />,
            { wrapper },
        );
        expect(screen.getByText("Change icon & color")).toBeDefined();
    });

    it("renders delete dialog when mode is delete", () => {
        render(
            <FolderDialogs
                workspaceId="ws-1"
                folders={mockFolders}
                mode="delete"
                target={mockFolders[0]}
                onClose={() => {}}
            />,
            { wrapper },
        );
        expect(screen.getByText("Delete folder")).toBeDefined();
    });

    it("returns null when mode is null", () => {
        const { container } = render(
            <FolderDialogs
                workspaceId="ws-1"
                folders={mockFolders}
                mode={null}
                target={null}
                onClose={() => {}}
            />,
            { wrapper },
        );
        expect(container.innerHTML).toBe("");
    });
});
