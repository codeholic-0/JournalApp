import { useState } from "react";
import { createPortal } from "react-dom";
import {
    ChevronRight,
    ChevronDown,
    Folder,
    Inbox,
    Archive,
    Plus,
    MoreHorizontal,
    Pencil,
    ArrowRight,
    Palette,
    Trash2,
} from "lucide-react";
import { useVaultStore } from "../store/vaultStore";
import { useFolders } from "../hooks/useFolders";
import { useUnfiledCount } from "../hooks/useNotes";
import { useAuth } from "../hooks/useAuth";
import FolderDialogs from "./FolderDialogs";
import type { FolderResponse } from "../types/folder";

type Mode = "create" | "rename" | "move" | "restyle" | "delete" | null;

interface MenuState {
    folder: FolderResponse;
    buttonRect: DOMRect;
}

export default function FolderTree() {
    const workspaceId = useVaultStore((s) => s.currentWorkspaceId);
    const currentFolderId = useVaultStore((s) => s.currentFolderId);
    const setCurrentFolderId = useVaultStore((s) => s.setCurrentFolderId);
    const showUnfiled = useVaultStore((s) => s.showUnfiled);
    const setShowUnfiled = useVaultStore((s) => s.setShowUnfiled);
    const expandedFolders = useVaultStore((s) => s.expandedFolders);
    const toggleExpanded = useVaultStore((s) => s.toggleFolderExpanded);
    const sort = useVaultStore((s) => s.workspaceSort);
    const { user } = useAuth();
    const username = user?.username ?? "";

    const { data: folders } = useFolders(workspaceId ?? "", sort);
    const { data: unfiledCount } = useUnfiledCount(username, workspaceId ?? undefined);

    const [dialogMode, setDialogMode] = useState<Mode>(null);
    const [dialogTarget, setDialogTarget] = useState<FolderResponse | null>(
        null,
    );
    const [menuState, setMenuState] = useState<MenuState | null>(null);

    if (!workspaceId) return null;

    const rootFolders = folders?.filter((f) => !f.parentId) ?? [];

    const openDialog = (mode: Mode, target: FolderResponse | null = null) => {
        setDialogMode(mode);
        setDialogTarget(target);
        setMenuState(null);
    };

    const closeDialog = () => {
        setDialogMode(null);
        setDialogTarget(null);
    };

    const openMenu = (e: React.MouseEvent, folder: FolderResponse) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuState({ folder, buttonRect: rect });
    };

    const renderFolder = (folder: FolderResponse, depth: number = 0) => {
        const children = folders?.filter((f) => f.parentId === folder.id) ?? [];
        const isExpanded = expandedFolders.has(folder.id);
        const showMenu = menuState?.folder.id === folder.id;
        return (
            <div key={folder.id}>
                <div className="group flex items-center">
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
                        style={{ paddingLeft: `${12 + Math.min(depth, 3) * 16}px` }}
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
                    <div className="shrink-0 px-1">
                        <button
                            onClick={(e) =>
                                showMenu
                                    ? setMenuState(null)
                                    : openMenu(e, folder)
                            }
                            className="p-1 rounded-md text-on-surface-muted hover:bg-hover"
                        >
                            <MoreHorizontal size={14} />
                        </button>
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
            {/* All Notes */}
            <button
                onClick={() => {
                    setCurrentFolderId(null);
                    setShowUnfiled(false);
                }}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left transition-colors ${
                    currentFolderId === null && !showUnfiled
                        ? "bg-primary/10 text-primary"
                        : "text-on-surface-muted"
                }`}
            >
                <Inbox size={14} />
                <span className="truncate">All Notes</span>
            </button>
            {/* Unfiled */}
            <button
                onClick={() => setShowUnfiled(true)}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left transition-colors ${
                    showUnfiled
                        ? "bg-primary/10 text-primary"
                        : "text-on-surface-muted"
                }`}
            >
                <Archive size={14} />
                <span className="truncate flex-1">Unfiled</span>
                {unfiledCount !== undefined && (
                    <span className="text-xs text-on-surface-muted">{unfiledCount}</span>
                )}
            </button>
            {rootFolders.map((f) => renderFolder(f))}

            {/* Dialogs - portal to body to avoid CSS containment issues from sidebar */}
            {dialogMode &&
                createPortal(
                    <FolderDialogs
                        workspaceId={workspaceId}
                        folders={folders ?? []}
                        mode={dialogMode}
                        target={dialogTarget}
                        onClose={closeDialog}
                    />,
                    document.body,
                )}

            {/* Context menu portal */}
            {menuState && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuState(null)}
                    />
                    <div
                        className="fixed z-50 min-w-40 bg-surface-raised border border-outline rounded-lg shadow-xl py-1 animate-fadeIn"
                        style={{
                            left: Math.min(
                                menuState.buttonRect.left,
                                window.innerWidth - 176,
                            ),
                            top: menuState.buttonRect.bottom + 4,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() =>
                                openDialog("rename", menuState.folder)
                            }
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface hover:bg-hover transition-colors"
                        >
                            <Pencil size={14} /> Rename
                        </button>
                        <button
                            onClick={() => openDialog("move", menuState.folder)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface hover:bg-hover transition-colors"
                        >
                            <ArrowRight size={14} /> Move
                        </button>
                        <button
                            onClick={() =>
                                openDialog("restyle", menuState.folder)
                            }
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface hover:bg-hover transition-colors"
                        >
                            <Palette size={14} /> Icon & Color
                        </button>
                        <hr className="border-outline my-1" />
                        <button
                            onClick={() =>
                                openDialog("delete", menuState.folder)
                            }
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-600/10 transition-colors"
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
