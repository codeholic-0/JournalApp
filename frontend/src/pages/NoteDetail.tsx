import { useState, useEffect } from "react";
import { get } from "idb-keyval";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    FileText,
    Calendar,
    Clock,
    Pencil,
    Trash2,
    Star,
    Pin,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { useAuth } from "../hooks/useAuth";
import {
    useNote,
    useDeleteNote,
    useToggleFavorite,
    useTogglePin,
} from "../hooks/useNotes";
import { Skeleton, SkeletonText } from "../components/Skeleton";
import ConfirmDialog from "../components/ConfirmDialog";
import NoteTypeBadge from "../components/NoteTypeBadge";
import type { NoteDraft } from "../types/note";

export default function NoteDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const username = user?.username ?? "";
    const { data: note, isLoading, isError } = useNote(username, id ?? "");
    const deleteNote = useDeleteNote();
    const toggleFav = useToggleFavorite();
    const togglePin = useTogglePin();
    const [deleteTarget, setDeleteTarget] = useState<{
        id: string;
        title: string;
    } | null>(null);
    const [localContent, setLocalContent] = useState<string | null>(null);
    const [localSavedAt, setLocalSavedAt] = useState<number>(0);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const working = await get<NoteDraft>("note-working:" + id);
                if (working) {
                    setLocalContent(working.content);
                    setLocalSavedAt(working.savedAt);
                }
            } catch {
                /* ignore */
            }
        })();
    }, [id]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteNote.mutateAsync({ username, id: deleteTarget.id });
            toast.success("Note deleted");
            navigate("/");
        } catch {
            toast.error("Failed to delete note");
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto space-y-4 animate-fadeIn">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-3/4" />
                <div className="flex gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <SkeletonText lines={6} />
            </div>
        );
    }

    const hasUnsavedEdits = !!(
        localContent &&
        note &&
        localSavedAt > new Date(note.updatedAt).getTime()
    );

    if (isError || !note) {
        return <p className="text-red-400">Note not found.</p>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm text-on-surface-muted hover:text-primary transition-colors"
            >
                <ArrowLeft size={16} />
                Back
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <FileText size={24} className="text-primary shrink-0" />
                    <h1 className="text-2xl font-bold text-on-surface wrap-break-word">
                        {note.title}
                    </h1>
                    {hasUnsavedEdits && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                            Unsaved edits
                        </span>
                    )}
                    <NoteTypeBadge type={note.noteType} />
                    <div className="flex items-center gap-2 sm:hidden">
                        <button
                            onClick={() =>
                                toggleFav.mutate({ username, id: note.id })
                            }
                            className="cursor-pointer"
                        >
                            {note.favorite ? (
                                <Star
                                    size={18}
                                    className="text-amber-400 fill-amber-400"
                                />
                            ) : (
                                <Star size={18} />
                            )}
                        </button>
                        <button
                            onClick={() =>
                                togglePin.mutate({ username, id: note.id })
                            }
                            className="cursor-pointer"
                        >
                            {note.pinned ? (
                                <Pin
                                    size={18}
                                    className="text-primary fill-primary"
                                />
                            ) : (
                                <Pin size={18} />
                            )}
                        </button>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <button
                        onClick={() =>
                            toggleFav.mutate({ username, id: note.id })
                        }
                        className="cursor-pointer"
                    >
                        {note.favorite ? (
                            <Star
                                size={18}
                                className="text-amber-400 fill-amber-400"
                            />
                        ) : (
                            <Star size={18} />
                        )}
                    </button>
                    <button
                        onClick={() =>
                            togglePin.mutate({ username, id: note.id })
                        }
                        className="cursor-pointer"
                    >
                        {note.pinned ? (
                            <Pin
                                size={18}
                                className="text-primary fill-primary"
                            />
                        ) : (
                            <Pin size={18} />
                        )}
                    </button>
                    <Link
                        to={`/notes/${note.id}/edit`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline text-sm text-on-surface-muted hover:text-on-surface hover:bg-hover transition-colors"
                    >
                        <Pencil size={14} />
                        Edit
                    </Link>
                    <button
                        onClick={() =>
                            setDeleteTarget({
                                id: note.id,
                                title: note.title,
                            })
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline text-sm text-red-400 hover:text-red-300 hover:bg-hover transition-colors"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                </div>
                <div className="flex sm:hidden items-center gap-2">
                    <Link
                        to={`/notes/${note.id}/edit`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline text-sm text-on-surface hover:bg-hover transition-colors"
                    >
                        <Pencil size={14} />
                        Edit
                    </Link>
                    <button
                        onClick={() =>
                            setDeleteTarget({
                                id: note.id,
                                title: note.title,
                            })
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline text-sm text-red-400 hover:text-red-300 hover:bg-hover transition-colors"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-on-surface-muted">
                <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    Created: {new Date(note.createdAt).toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    Updated: {new Date(note.updatedAt).toLocaleString()}
                </span>
            </div>

            <div
                className="border-t border-outline pt-6"
                style={
                    note.color
                        ? { borderTop: `4px solid ${note.color}` }
                        : undefined
                }
            >
                {hasUnsavedEdits ? (
                    <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[
                                rehypeSanitize,
                                [
                                    rehypeHighlight,
                                    { detect: true, ignoreMissing: true },
                                ],
                            ]}
                            components={{
                                a: (props) => (
                                    <a
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        {...props}
                                    />
                                ),
                            }}
                        >
                            {localContent}
                        </ReactMarkdown>
                    </div>
                ) : note.content ? (
                    <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[
                                rehypeSanitize,
                                [
                                    rehypeHighlight,
                                    { detect: true, ignoreMissing: true },
                                ],
                            ]}
                            components={{
                                a: (props) => (
                                    <a
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        {...props}
                                    />
                                ),
                            }}
                        >
                            {note.content}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <p className="text-on-surface-muted italic">
                        No content yet.
                    </p>
                )}
            </div>

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
