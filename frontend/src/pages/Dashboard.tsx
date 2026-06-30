import { useState } from "react";
import { Link } from "react-router-dom";
import {
    FileText,
    FilePlus2,
    Calendar,
    Eye,
    Pencil,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useJournals, useDeleteJournal } from "../hooks/useJournals";
import { SkeletonCard } from "../components/Skeleton";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Dashboard() {
    const { user } = useAuth();
    const {
        data: journals,
        isLoading,
        isError,
    } = useJournals(user?.username ?? "");
    const deleteJournal = useDeleteJournal();
    const [deleteTarget, setDeleteTarget] = useState<{
        id: string;
        title: string;
    } | null>(null);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteJournal.mutateAsync({
                username: user?.username ?? "",
                id: deleteTarget.id,
            });
            toast.success("Journal deleted");
            setDeleteTarget(null);
        } catch {
            toast.error("Failed to delete journal");
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold text-on-surface">
                    My Journals
                </h1>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return <p className="text-red-400">Failed to load journals.</p>;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-on-surface">
                    My Journals
                </h1>
                <Link
                    to="/journals/new"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors active:scale-[0.98]"
                >
                    <FilePlus2 size={16} />
                    New Journal
                </Link>
            </div>

            {journals?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <FileText size={48} className="text-on-surface-muted" />
                    <p className="text-on-surface-muted text-sm">
                        No journal entries yet.
                    </p>
                    <Link
                        to="/journals/new"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
                    >
                        <FilePlus2 size={16} />
                        Create your first one
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {journals?.map((j) => (
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
                            </div>

                            {j.content && (
                                <p className="text-sm text-on-surface-muted line-clamp-2 leading-relaxed">
                                    {j.content}
                                </p>
                            )}

                            <div className="flex items-center gap-1.5 text-xs text-on-surface-muted">
                                <Calendar size={12} />
                                <span>
                                    {new Date(j.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="flex gap-3 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Link
                                    to={`/journals/${j.id}`}
                                    className="flex items-center gap-1 text-xs text-on-surface-muted hover:text-primary transition-colors"
                                >
                                    <Eye size={14} />
                                    View
                                </Link>
                                <Link
                                    to={`/journals/${j.id}/edit`}
                                    className="flex items-center gap-1 text-xs text-on-surface-muted hover:text-primary transition-colors"
                                >
                                    <Pencil size={14} />
                                    Edit
                                </Link>
                                <button
                                    onClick={() =>
                                        setDeleteTarget({
                                            id: j.id,
                                            title: j.title,
                                        })
                                    }
                                    className="flex items-center gap-1 text-xs text-on-surface-muted hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete journal?"
                message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
            />
        </div>
    );
}
