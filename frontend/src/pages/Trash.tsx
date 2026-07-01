import { useState } from "react";
import {
    FileText,
    Trash2,
    RotateCcw,
    Calendar,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useTrashNotes, useRestoreNote, usePurgeNote } from "../hooks/useNotes";
import { SkeletonCard } from "../components/Skeleton";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Trash() {
    const { user } = useAuth();
    const [page, setPage] = useState(0);
    const { data, isLoading, isError } = useTrashNotes(
        user?.username ?? "",
        page,
    );
    const restoreNote = useRestoreNote();
    const purgeNote = usePurgeNote();
    const [confirmTarget, setConfirmTarget] = useState<{
        id: string;
        title: string;
        action: "restore" | "purge";
    } | null>(null);

    const notes = data?.content ?? [];
    const totalPages = data?.page?.totalPages ?? 0;

    const handleConfirm = async () => {
        if (!confirmTarget) return;
        const { id, action } = confirmTarget;
        const username = user?.username ?? "";
        try {
            if (action === "restore") {
                await restoreNote.mutateAsync({ username, id });
                toast.success("Note restored");
            } else {
                await purgeNote.mutateAsync({ username, id });
                toast.success("Note permanently deleted");
            }
            setConfirmTarget(null);
            if (notes.length === 1 && page > 0) setPage((p) => p - 1);
        } catch {
            toast.error("Action failed");
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold text-on-surface">Trash</h1>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return <p className="text-red-400">Failed to load trash.</p>;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <h1 className="text-2xl font-bold text-on-surface">Trash</h1>

            {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Trash2 size={48} className="text-on-surface-muted" />
                    <p className="text-on-surface-muted text-sm">
                        Trash is empty.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {notes.map((j) => (
                            <div
                                key={j.id}
                                className="group bg-surface-alt rounded-xl border border-outline p-4 space-y-3 opacity-80 hover:opacity-100 transition-opacity"
                            >
                                <div className="flex items-start gap-3">
                                    <FileText
                                        size={18}
                                        className="text-on-surface-muted shrink-0 mt-0.5"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <h2 className="font-semibold text-on-surface truncate">
                                            {j.title}
                                        </h2>
                                    </div>
                                </div>

                                {j.content && (
                                    <p className="text-sm text-on-surface-muted line-clamp-2 leading-relaxed">
                                        {j.content}
                                    </p>
                                )}

                                <div className="flex items-center gap-1.5 text-xs text-on-surface-muted">
                                    <Calendar size={12} />
                                    <span>
                                        Deleted:{" "}
                                        {new Date(
                                            j.updatedAt,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 pt-1">
                                    <button
                                        onClick={() =>
                                            setConfirmTarget({
                                                id: j.id,
                                                title: j.title,
                                                action: "restore",
                                            })
                                        }
                                        className="flex items-center gap-1 text-xs text-green-500 hover:text-green-400 font-medium transition-colors"
                                    >
                                        <RotateCcw size={14} />
                                        Restore
                                    </button>
                                    <button
                                        onClick={() =>
                                            setConfirmTarget({
                                                id: j.id,
                                                title: j.title,
                                                action: "purge",
                                            })
                                        }
                                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                                    >
                                        <Trash2 size={14} />
                                        Purge
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
                open={confirmTarget !== null}
                onClose={() => setConfirmTarget(null)}
                onConfirm={handleConfirm}
                variant={
                    confirmTarget?.action === "restore" ? "default" : "danger"
                }
                confirmLabel={
                    confirmTarget?.action === "restore" ? "Restore" : "Delete"
                }
                title={
                    confirmTarget?.action === "restore"
                        ? "Restore note?"
                        : "Permanently delete?"
                }
                message={
                    confirmTarget?.action === "restore"
                        ? `Restore "${confirmTarget?.title}" to your notes?`
                        : `Permanently delete "${confirmTarget?.title}"? This cannot be undone.`
                }
            />
        </div>
    );
}
