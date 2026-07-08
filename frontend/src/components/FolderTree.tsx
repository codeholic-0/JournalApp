import { ChevronRight, ChevronDown, Folder, Inbox } from "lucide-react";
import { useVaultStore } from "../store/vaultStore";
import { useFolders } from "../hooks/useFolders";
import type { FolderResponse } from "../types/folder";

export default function FolderTree() {
    const workspaceId = useVaultStore((s) => s.currentWorkspaceId);
    const currentFolderId = useVaultStore((s) => s.currentFolderId);
    const setCurrentFolderId = useVaultStore((s) => s.setCurrentFolderId);
    const expandedFolders = useVaultStore((s) => s.expandedFolders);
    const toggleExpanded = useVaultStore((s) => s.toggleFolderExpanded);
    const sort = useVaultStore((s) => s.workspaceSort);

    const { data: folders } = useFolders(workspaceId ?? "", sort);

    if (!workspaceId) return null;

    // Filter root folders (no parent)
    const rootFolders = folders?.filter((f) => !f.parentId) ?? [];

    const renderFolder = (folder: FolderResponse, depth: number = 0) => {
        const children = folders?.filter((f) => f.parentId === folder.id) ?? [];
        const isExpanded = expandedFolders.has(folder.id);
        return (
            <div key={folder.id}>
                <button
                    onClick={() => {
                        setCurrentFolderId(
                            folder.id === currentFolderId ? null : folder.id,
                        );
                    }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left transition-colors"
                    style={{ paddingLeft: `${12 + depth * 16}px` }}
                >
                    {children.length > 0 ? (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(folder.id);
                            }}
                        >
                            {isExpanded ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronRight size={14} />
                            )}
                        </span>
                    ) : (
                        <span className="w-3.5" />
                    )}
                    <Folder
                        size={14}
                        className="shrink-0 text-on-surface-muted"
                    />
                    <span className="truncate">{folder.name}</span>
                </button>
                {isExpanded &&
                    children.map((child) => renderFolder(child, depth + 1))}
            </div>
        );
    };

    return (
        <div className="py-2">
            <div className="px-3 pb-1 text-xs font-medium text-on-surface-muted">
                Folders
            </div>
            {/* Unfiled */}
            <button
                onClick={() => setCurrentFolderId(null)}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left transition-colors ${
                    currentFolderId === null
                        ? "bg-primary/10 text-primary"
                        : "text-on-surface-muted"
                }`}
            >
                <Inbox size={14} />
                <span className="truncate">Unfiled</span>
            </button>
            {rootFolders.map((f) => renderFolder(f))}
        </div>
    );
}
