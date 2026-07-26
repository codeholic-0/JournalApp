import { useState, useEffect, useRef } from "react";
import {
    X,
    Folder,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useVaultStore } from "../store/vaultStore";
import {
    useCreateFolder,
    useUpdateFolder,
    useDeleteFolder,
} from "../hooks/useFolders";
import IconColorPicker from "./IconColorPicker";
import type { FolderResponse } from "../types/folder";

type Mode = "create" | "rename" | "move" | "restyle" | "delete" | null;

interface Props {
    workspaceId: string;
    folders: FolderResponse[];
    mode: Mode;
    target: FolderResponse | null;
    onClose: () => void;
}

function getDescendantIds(
    folders: FolderResponse[],
    parentId: string,
): Set<string> {
    const ids = new Set<string>([parentId]);
    let added = true;
    while (added) {
        added = false;
        for (const f of folders) {
            if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) {
                ids.add(f.id);
                added = true;
            }
        }
    }
    return ids;
}

export default function FolderDialogs({
    workspaceId,
    folders,
    mode,
    target,
    onClose,
}: Props) {
    const expandedFolders = useVaultStore((s) => s.expandedFolders);
    const toggleExpanded = useVaultStore((s) => s.toggleFolderExpanded);
    const createFolder = useCreateFolder(workspaceId);
    const updateFolder = useUpdateFolder(workspaceId);
    const deleteFolder = useDeleteFolder(workspaceId);

    const [name, setName] = useState(target?.name ?? "");
    const [parentId, setParentId] = useState<string | undefined>(
        target?.parentId ?? undefined,
    );
    const [icon, setIcon] = useState(target?.icon ?? "folder");
    const [color, setColor] = useState(target?.color ?? "#1976d2");
    const [forceDelete, setForceDelete] = useState(false);

    if (!mode) return null;

    const rootFolders = folders.filter((f) => !f.parentId);

    const renderFolderOption = (f: FolderResponse, depth = 0) => {
        const children = folders.filter((c) => c.parentId === f.id);
        const isExpanded = expandedFolders.has(f.id);
        const isDisabled = target
            ? getDescendantIds(folders, target.id).has(f.id)
            : false;
        return (
            <div key={f.id}>
                <button
                    onClick={() => {
                        if (isDisabled) return;
                        setParentId(parentId === f.id ? undefined : f.id);
                    }}
                    disabled={isDisabled}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors ${
                        parentId === f.id
                            ? "bg-primary/10 text-primary"
                            : isDisabled
                              ? "opacity-40 cursor-not-allowed"
                              : "text-on-surface-muted hover:bg-hover"
                    }`}
                    style={{ paddingLeft: `${8 + depth * 16}px` }}
                >
                    {children.length > 0 ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(f.id);
                            }}
                            aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
                            className="flex items-center"
                        >
                            {isExpanded ? (
                                <ChevronDown size={12} aria-hidden="true" />
                            ) : (
                                <ChevronRight size={12} aria-hidden="true" />
                            )}
                        </button>
                    ) : (
                        <span className="w-3" />
                    )}
                    <Folder size={13} className="shrink-0" />
                    <span className="truncate">{f.name}</span>
                </button>
                {isExpanded &&
                    children.map((c) => renderFolderOption(c, depth + 1))}
            </div>
        );
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        try {
            await createFolder.mutateAsync({
                name: name.trim(),
                parentId,
                icon,
                color,
            });
            toast.success("Folder created");
            onClose();
        } catch {
            toast.error("Failed to create folder");
        }
    };

    const handleRename = async () => {
        if (!name.trim() || !target) return;
        try {
            await updateFolder.mutateAsync({
                id: target.id,
                data: { name: name.trim() },
            });
            toast.success("Folder renamed");
            onClose();
        } catch {
            toast.error("Failed to rename folder");
        }
    };

    const handleMove = async () => {
        if (!target) return;
        try {
            await updateFolder.mutateAsync({
                id: target.id,
                data: { parentId },
            });
            toast.success("Folder moved");
            onClose();
        } catch {
            toast.error("Failed to move folder");
        }
    };

    const handleRestyle = async () => {
        if (!target) return;
        try {
            await updateFolder.mutateAsync({
                id: target.id,
                data: { icon, color },
            });
            toast.success("Folder style updated");
            onClose();
        } catch {
            toast.error("Failed to update folder style");
        }
    };

    const handleDelete = async () => {
        if (!target) return;
        try {
            await deleteFolder.mutateAsync({
                id: target.id,
                force: true,
            });
            toast.success("Folder deleted");
            onClose();
        } catch {
            toast.error("Failed to delete folder");
        }
    };

    const hasChildren = target
        ? folders.some((f) => f.parentId === target.id)
        : false;

    return (
        <>
            {mode === "create" && (
                <Modal onClose={onClose} title="New folder">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-on-surface">
                            Name
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Folder name"
                            autoFocus
                            className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface text-sm placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-on-surface">
                            Parent (optional)
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-outline rounded-lg p-1 bg-surface">
                            <button
                                onClick={() => setParentId(undefined)}
                                className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors ${
                                    parentId === undefined
                                        ? "bg-primary/10 text-primary"
                                        : "text-on-surface-muted hover:bg-hover"
                                }`}
                            >
                                <Folder size={13} />
                                <span>(Root)</span>
                            </button>
                            {rootFolders.map((f) => renderFolderOption(f))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-on-surface">
                            Icon & Color
                        </label>
                        <IconColorPicker
                            icon={icon}
                            color={color}
                            onIconChange={setIcon}
                            onColorChange={setColor}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleCreate}
                            disabled={!name.trim() || createFolder.isPending}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors active:scale-[0.98]"
                        >
                            {createFolder.isPending ? "Creating..." : "Create"}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-outline text-sm text-on-surface-muted hover:bg-hover transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </Modal>
            )}

            {mode === "rename" && (
                <Modal onClose={onClose} title="Rename folder">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-on-surface">
                            Name
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface text-sm placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleRename}
                            disabled={!name.trim() || updateFolder.isPending}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors active:scale-[0.98]"
                        >
                            {updateFolder.isPending ? "Saving..." : "Rename"}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-outline text-sm text-on-surface-muted hover:bg-hover transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </Modal>
            )}

            {mode === "move" && (
                <Modal onClose={onClose} title="Move folder">
                    <p className="text-sm text-on-surface-muted">
                        Choose a new parent folder (or (Root) to un-nest).
                    </p>
                    <div className="max-h-60 overflow-y-auto border border-outline rounded-lg p-1 bg-surface">
                        <button
                            onClick={() => setParentId(undefined)}
                            className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors ${
                                parentId === undefined
                                    ? "bg-primary/10 text-primary"
                                    : "text-on-surface-muted hover:bg-hover"
                            }`}
                        >
                            <Folder size={13} />
                            <span>(Root)</span>
                        </button>
                        {rootFolders.map((f) => renderFolderOption(f))}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleMove}
                            disabled={updateFolder.isPending}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors active:scale-[0.98]"
                        >
                            {updateFolder.isPending ? "Moving..." : "Move"}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-outline text-sm text-on-surface-muted hover:bg-hover transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </Modal>
            )}

            {mode === "restyle" && (
                <Modal onClose={onClose} title="Change icon & color">
                    <IconColorPicker
                        icon={icon}
                        color={color}
                        onIconChange={setIcon}
                        onColorChange={setColor}
                    />
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleRestyle}
                            disabled={updateFolder.isPending}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors active:scale-[0.98]"
                        >
                            {updateFolder.isPending ? "Saving..." : "Save"}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-outline text-sm text-on-surface-muted hover:bg-hover transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </Modal>
            )}

            {mode === "delete" && (
                <Modal onClose={onClose} title="Delete folder">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-600/5 border border-red-600/20">
                        <AlertTriangle
                            size={18}
                            className="text-red-400 shrink-0 mt-0.5"
                        />
                        <div className="text-sm text-on-surface-muted space-y-2">
                            <p>
                                Are you sure you want to delete{" "}
                                <strong className="text-on-surface">
                                    "{target?.name}"
                                </strong>
                                ?
                            </p>
                            {hasChildren && (
                                <p>
                                    This folder has sub-folders. Use "Force
                                    delete" to orphan them (notes inside will
                                    become unfiled).
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-3 pt-1">
                        {hasChildren && (
                            <label className="flex items-center gap-2 text-sm text-on-surface-muted cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={forceDelete}
                                    onChange={(e) =>
                                        setForceDelete(e.target.checked)
                                    }
                                    className="rounded border-outline"
                                />
                                Force delete (orphan sub-folders and notes)
                            </label>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={handleDelete}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors active:scale-[0.98] ${
                                    forceDelete
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-primary hover:bg-primary-hover"
                                }`}
                            >
                                {forceDelete ? "Force Delete" : "Delete"}
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg border border-outline text-sm text-on-surface-muted hover:bg-hover transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}

function Modal({
    onClose,
    title,
    children,
}: {
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const titleId = title.toLowerCase().replace(/\s+/g, "-");

    useEffect(() => {
        if (!cardRef.current) return;
        const el = cardRef.current;
        const focusable = el.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        first?.focus();
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") { onClose(); return; }
            if (e.key !== "Tab") return;
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last?.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first?.focus();
                }
            }
        };
        el.addEventListener("keydown", handler);
        return () => el.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                ref={cardRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="bg-surface-raised rounded-xl border border-outline p-6 w-full max-w-md mx-auto space-y-4 shadow-xl animate-scaleIn max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 id={titleId} className="text-lg font-semibold text-on-surface">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="p-1 rounded-md text-on-surface-muted hover:bg-hover transition-colors"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
