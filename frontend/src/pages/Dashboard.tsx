import { useState } from "react";
import { Link } from "react-router-dom";
import {
    FileText,
    FilePlus2,
    Calendar,
    Eye,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Star,
    Pin,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { SkeletonCard } from "../components/Skeleton";
import ConfirmDialog from "../components/ConfirmDialog";
import NoteTypeBadge from "../components/NoteTypeBadge";
import {
    useNotes,
    useDeleteNote,
    useToggleFavorite,
    useTogglePin,
} from "../hooks/useNotes";
export default function Dashboard() {
    const { user } = useAuth();
    const username = user?.username ?? "";
    const [page, setPage] = useState(0);
    const { data, isLoading, isError } = useNotes(user?.username ?? "", page);
    const deleteNote = useDeleteNote();
    const [deleteTarget, setDeleteTarget] = useState<{
        id: string;
        title: string;
    } | null>(null);
    const [showFavorites, setShowFavorites] = useState(false);
    const toggleFav = useToggleFavorite();
    const togglePin = useTogglePin();
    const notes = data?.content ?? [];
    const displayNotes = showFavorites
        ? notes.filter((n) => n.favorite)
        : notes;
    const totalPages = data?.page?.totalPages ?? 0;

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
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {displayNotes.map((j) => (
                            <div
                                key={j.id}
                                className="group bg-surface-alt rounded-xl border border-outline p-4 space-y-3 hover:scale-[1.02] hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-start gap-3">
                                    <FileText
                                        size={18}
                                        className="text-primary shrink-0 mt-0.5"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <h2 className="font-semibold text-on-surface truncate">
                                            {j.title}
                                        </h2>
                                    </div>
                                    <NoteTypeBadge type={j.noteType} />
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() =>
                                            toggleFav.mutate({
                                                username,
                                                id: j.id,
                                            })
                                        }
                                    >
                                        {j.favorite ? (
                                            <Star
                                                size={16}
                                                className="text-amber-400 fill-amber-400"
                                            />
                                        ) : (
                                            <Star size={16} />
                                        )}
                                    </button>
                                    <button
                                        onClick={() =>
                                            togglePin.mutate({
                                                username,
                                                id: j.id,
                                            })
                                        }
                                    >
                                        {j.pinned ? (
                                            <Pin
                                                size={16}
                                                className="text-primary fill-primary"
                                            />
                                        ) : (
                                            <Pin size={16} />
                                        )}
                                    </button>
                                </div>

                                {j.content && (
                                    <p className="text-sm text-on-surface-muted line-clamp-2 leading-relaxed">
                                        {j.content}
                                    </p>
                                )}

                                <div className="flex items-center gap-1.5 text-xs text-on-surface-muted">
                                    <Calendar size={12} />
                                    <span>
                                        {new Date(
                                            j.createdAt,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex gap-3">
                                        <Link
                                            to={`/notes/${j.id}`}
                                            className="flex items-center gap-1 text-xs text-on-surface-muted hover:text-primary transition-colors"
                                        >
                                            <Eye size={14} />
                                            View
                                        </Link>
                                        <Link
                                            to={`/notes/${j.id}/edit`}
                                            className="flex items-center gap-1 text-xs text-on-surface-muted hover:text-primary transition-colors"
                                        >
                                            <Pencil size={14} />
                                            Edit
                                        </Link>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setDeleteTarget({
                                                id: j.id,
                                                title: j.title,
                                            })
                                        }
                                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

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
