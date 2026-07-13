import { useState, useCallback, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    FileText,
    FilePlus2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Star,
    Pin,
    FolderOpen,
    GripVertical,
    LayoutGrid,
    List,
} from "lucide-react";
import { toast } from "sonner";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "../hooks/useAuth";
import { SkeletonCard } from "../components/Skeleton";
import ConfirmDialog from "../components/ConfirmDialog";
import NoteTypeBadge from "../components/NoteTypeBadge";
import {
    useNotes,
    useDeleteNote,
    useToggleFavorite,
    useTogglePin,
    useUpdateSortOrder,
} from "../hooks/useNotes";
import { useVaultStore } from "../store/vaultStore";
import type { NoteResponse } from "../types/note";
import { generateSortOrder } from "../lib/fractionalIndex";
import NoteCardActions from "../components/NoteCardActions";

function SortableNoteCard({
    note,
    username,
    onDelete,
}: {
    note: NoteResponse;
    username: string;
    onDelete: (note: NoteResponse) => void;
}) {
    const toggleFav = useToggleFavorite();
    const togglePin = useTogglePin();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : "auto" as const,
    };

    return (
    <div
        ref={setNodeRef}
        style={{
            ...style,
            padding: "var(--card-p)",
            borderTop: note.color ? `4px solid ${note.color}` : undefined,
        }}
        className="group bg-surface-alt rounded-xl border border-outline border-t-4 space-y-3 hover:scale-[1.02] hover:shadow-md transition-all duration-200"
    >
        <div className="flex items-start gap-3">
            <button
                {...attributes}
                {...listeners}
                className="p-0.5 mt-0.5 cursor-grab active:cursor-grabbing text-on-surface-muted hover:text-on-surface transition-colors touch-none"
                aria-label="Drag to reorder"
            >
                <GripVertical size={16} />
            </button>
            <FileText size={18} className="text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-on-surface truncate">
                    {note.title}
                </h2>
            </div>
            <button
                onClick={() => toggleFav.mutate({ username, id: note.id })}
                className={`shrink-0 transition-colors ${
                    note.favorite
                        ? "text-amber-400"
                        : "text-on-surface-muted max-lg:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                }`}
                aria-label="Toggle favorite"
            >
                <Star size={14} />
            </button>
            <button
                onClick={() => togglePin.mutate({ username, id: note.id })}
                className={`shrink-0 transition-colors ${
                    note.pinned
                        ? "text-primary"
                        : "text-on-surface-muted max-lg:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                }`}
                aria-label="Toggle pin"
            >
                <Pin size={14} />
            </button>
            <NoteTypeBadge type={note.noteType} />
        </div>

        {note.content && (
            <p className="text-sm text-on-surface-muted line-clamp-2 leading-relaxed">
                {note.content}
            </p>
        )}

        <div className="flex items-center gap-1.5 text-xs text-on-surface-muted">
            <Calendar size={12} />
            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
        </div>

        <NoteCardActions noteId={note.id} onDelete={() => onDelete(note)} />
    </div>
);
}

export default function Dashboard() {
    const { user } = useAuth();
    const username = user?.username ?? "";
    const [page, setPage] = useState(0);
    const currentWorkspaceId = useVaultStore((s) => s.currentWorkspaceId);
    const currentFolderId = useVaultStore((s) => s.currentFolderId);
    const showUnfiled = useVaultStore((s) => s.showUnfiled);
    const { data, isLoading, isError } = useNotes(
        user?.username ?? "",
        page,
        currentWorkspaceId ?? undefined,
        currentFolderId ?? undefined,
        showUnfiled || undefined,
    );

    const deleteNote = useDeleteNote();
    const updateSortOrder = useUpdateSortOrder();
    const [deleteTarget, setDeleteTarget] = useState<{
        id: string;
        title: string;
    } | null>(null);
    const [showFavorites, setShowFavorites] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const dashboardView = useVaultStore((s) => s.dashboardView);
    const setDashboardView = useVaultStore((s) => s.setDashboardView);

    useEffect(() => {
        const view = searchParams.get("view");
        if (view === "grid" || view === "list") {
            setDashboardView(view);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleViewChange = (view: "grid" | "list") => {
        setDashboardView(view);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set("view", view);
            return next;
        });
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );

    const notes = data?.content ?? [];
    const displayNotes = (showFavorites ? notes.filter((n) => n.favorite) : notes)
        .sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            if (a.sortOrder && b.sortOrder) return a.sortOrder.localeCompare(b.sortOrder);
            if (a.sortOrder) return -1;
            if (b.sortOrder) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    const totalPages = data?.page?.totalPages ?? 0;

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const items = displayNotes.filter((n) => n.id !== active.id);
            const overIndex = items.findIndex((n) => n.id === over.id);
            if (overIndex === -1) return;
            const dragged = displayNotes.find((n) => n.id === active.id);
            if (!dragged) return;
            items.splice(overIndex, 0, dragged);

            const idx = items.findIndex((n) => n.id === active.id);
            const before = idx > 0 ? items[idx - 1].sortOrder ?? null : null;
            const after =
                idx < items.length - 1
                    ? items[idx + 1].sortOrder ?? null
                    : null;

            const newSortOrder = generateSortOrder(before, after);

            updateSortOrder.mutate({
                username,
                id: String(active.id),
                sortOrder: newSortOrder,
            });
        },
        [displayNotes, username, updateSortOrder],
    );

    if (!currentWorkspaceId) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <FolderOpen size={48} className="text-on-surface-muted" />
                <p className="text-on-surface-muted text-sm">
                    Select a workspace from the sidebar to get started.
                </p>
            </div>
        );
    }

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteNote.mutateAsync({
                username: user?.username ?? "",
                id: deleteTarget.id,
            });
            toast.success("Note deleted");
            setDeleteTarget(null);
            if (notes.length === 1 && page > 0) {
                setPage((p) => p - 1);
            }
        } catch {
            toast.error("Failed to delete note");
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold text-on-surface">My Notes</h1>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return <p className="text-red-400">Failed to load notes.</p>;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-on-surface">My Notes</h1>
                <Link
                    to="/notes/new"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors active:scale-[0.98]"
                >
                    <FilePlus2 size={16} />
                    New Note
                </Link>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowFavorites((p) => !p)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        showFavorites
                            ? "bg-amber-50 border-amber-300 text-amber-700"
                            : "border-outline text-on-surface-muted hover:text-on-surface hover:bg-hover"
                    }`}
                >
                    <Star
                        size={14}
                        className={
                            showFavorites ? "fill-amber-400 text-amber-400" : ""
                        }
                    />
                    {showFavorites ? "All Notes" : "Favorites"}
                </button>
                <div className="flex border border-outline rounded-lg overflow-hidden">
                    <button
                        onClick={() => handleViewChange("grid")}
                        className={`p-2 transition-colors ${
                            dashboardView === "grid"
                                ? "bg-primary/10 text-primary"
                                : "text-on-surface-muted hover:text-on-surface hover:bg-hover"
                        }`}
                        aria-label="Grid view"
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <button
                        onClick={() => handleViewChange("list")}
                        className={`p-2 transition-colors ${
                            dashboardView === "list"
                                ? "bg-primary/10 text-primary"
                                : "text-on-surface-muted hover:text-on-surface hover:bg-hover"
                        }`}
                        aria-label="List view"
                    >
                        <List size={16} />
                    </button>
                </div>
            </div>

            {displayNotes.length === 0 && page === 0 ? (
                showFavorites && notes.length > 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Star size={48} className="text-on-surface-muted" />
                        <p className="text-on-surface-muted text-sm">
                            No favorited notes yet.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <FileText size={48} className="text-on-surface-muted" />
                        <p className="text-on-surface-muted text-sm">
                            No note entries yet.
                        </p>
                        <Link
                            to="/notes/new"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
                        >
                            <FilePlus2 size={16} />
                            Create your first one
                        </Link>
                    </div>
                )
            ) : (
                <>
                    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                        <SortableContext
                            items={displayNotes.map((n) => n.id)}
                            strategy={rectSortingStrategy}
                        >
                        {dashboardView === "grid" ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "var(--grid-gap)" }}>
                                {displayNotes.map((j) => (
                                    <SortableNoteCard
                                        key={j.id}
                                        note={j}
                                        username={username}
                                        onDelete={(note) =>
                                            setDeleteTarget({
                                                id: note.id,
                                                title: note.title,
                                            })
                                        }
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {displayNotes.map((j) => (
                                    <SortableNoteCard
                                        key={j.id}
                                        note={j}
                                        username={username}
                                        onDelete={(note) =>
                                            setDeleteTarget({
                                                id: note.id,
                                                title: note.title,
                                            })
                                        }
                                    />
                                ))}
                            </div>
                        )}
                        </SortableContext>
                    </DndContext>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 pt-4">
                            <button
                                onClick={() => setPage((p) => p - 1)}
                                disabled={page === 0}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline text-sm text-on-surface-muted hover:bg-hover hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-colors active:scale-[0.98]"
                            >
                                <ChevronLeft size={16} />
                                Prev
                            </button>
                            <span className="text-sm text-on-surface-muted">
                                Page {page + 1} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= totalPages - 1}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline text-sm text-on-surface-muted hover:bg-hover hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-colors active:scale-[0.98]"
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}

            <ConfirmDialog
                open={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete note?"
                message={`Move "${deleteTarget?.title}" to trash?`}
            />
        </div>
    );
}
