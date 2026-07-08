import { useState } from "react";
import {
    ChevronRight,
    ChevronDown,
    Folder,
    Inbox,
    Plus,
    MoreHorizontal,
    Pencil,
    ArrowRight,
    Palette,
    Trash2,
} from "lucide-react";
import { useVaultStore } from "../store/vaultStore";
import { useFolders } from "../hooks/useFolders";
import FolderDialogs from "./FolderDialogs";
import type { FolderResponse } from "../types/folder";

type Mode = "create" | "rename" | "move" | "restyle" | "delete" | null;

export default function FolderTree() {
    const workspaceId = useVaultStore((s) => s.currentWorkspaceId);
    const currentFolderId = useVaultStore((s) => s.currentFolderId);
    const setCurrentFolderId = useVaultStore((s) => s.setCurrentFolderId);
    const expandedFolders = useVaultStore((s) => s.expandedFolders);
    const toggleExpanded = useVaultStore((s) => s.toggleFolderExpanded);
    const sort = useVaultStore((s) => s.workspaceSort);

    const { data: folders } = useFolders(workspaceId ?? "", sort);

    const [dialogMode, setDialogMode] = useState<Mode>(null);
    const [dialogTarget, setDialogTarget] = useState<FolderResponse | null>(
        null,
    );
    const [menuFolder, setMenuFolder] = useState<string | null>(null);

    if (!workspaceId) return null;

    const rootFolders = folders?.filter((f) => !f.parentId) ?? [];

    const openDialog = (mode: Mode, target: FolderResponse | null = null) => {
        setDialogMode(mode);
        setDialogTarget(target);
        setMenuFolder(null);
    };

    const closeDialog = () => {
        setDialogMode(null);
        setDialogTarget(null);
    };

    const renderFolder = (folder: FolderResponse, depth: number = 0) => {
        const children = folders?.filter((f) => f.parentId === folder.id) ?? [];
        const isExpanded = expandedFolders.has(folder.id);
        const showMenu = menuFolder === folder.id;
        return (
            <div key={folder.id}>
                <div className="group relative flex items-center">
                    <button
                        onClick={() => {
                            setCurrentFolderId(
                                folder.id === currentFolderId
                                    ? null
                                    : folder.id,
                            );
                        }}
                        className={`flex items-center gap-2 flex-1 px-3 py-1.5 text-sm text-left transition-colors ${
                            folder.id === currentFolderId
                                ? "bg-primary/10 text-primary"
                                : ""
                        }`}
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
                    <div
                        className={`absolute right-2 top-1/2 -translate-y-1/2 transition-opacity ${
                            showMenu ? "z-20" : ""
                        } opacity-80 group-hover:opacity-100`}
                    >
                        <button
                            onClick={() =>
                                setMenuFolder(showMenu ? null : folder.id)
                            }
                            className="p-1 rounded-md text-on-surface-muted hover:bg-hover"
                        >
                            <MoreHorizontal size={14} />
                        </button>
                        {showMenu && (
                            <div
                                className="absolute right-0 top-full mt-1 z-20 w-40 bg-surface-raised border border-outline rounded-lg shadow-xl py-1 animate-fadeIn"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => openDialog("rename", folder)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface hover:bg-hover transition-colors"
                                >
                                    <Pencil size={14} /> Rename
                                </button>
                                <button
                                    onClick={() => openDialog("move", folder)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface hover:bg-hover transition-colors"
                                >
                                    <ArrowRight size={14} /> Move
                                </button>
                                <button
                                    onClick={() =>
                                        openDialog("restyle", folder)
                                    }
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface hover:bg-hover transition-colors"
                                >
                                    <Palette size={14} /> Icon & Color
                                </button>
                                <hr className="border-outline my-1" />
                                <button
                                    onClick={() => openDialog("delete", folder)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-600/10 transition-colors"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {isExpanded &&
                    children.map((child) => renderFolder(child, depth + 1))}
            </div>
        );
    };

    return (
        <div className="py-2">
            <div className="flex items-center justify-between px-3 pb-1">
                <span className="text-xs font-medium text-on-surface-muted">
                    Folders
                </span>
                <button
                    onClick={() => openDialog("create")}
                    className="p-1 rounded-md text-on-surface-muted hover:bg-hover hover:text-on-surface transition-colors"
                    title="New folder"
                >
                    <Plus size={14} />
                </button>
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

            {/* Dialogs */}
            <FolderDialogs
                workspaceId={workspaceId}
                folders={folders ?? []}
                mode={dialogMode}
                target={dialogTarget}
                onClose={closeDialog}
            />

            {/* Click outside to close menu */}
            {menuFolder && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuFolder(null)}
                />
            )}
        </div>
    );
}
