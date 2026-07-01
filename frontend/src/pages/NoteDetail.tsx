import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    FileText,
    Calendar,
    Clock,
    Pencil,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useAuth } from "../hooks/useAuth";
import { useNote, useDeleteNote } from "../hooks/useNotes";
import { Skeleton, SkeletonText } from "../components/Skeleton";
import ConfirmDialog from "../components/ConfirmDialog";
import NoteTypeBadge from "../components/NoteTypeBadge";

export default function NoteDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const username = user?.username ?? "";
    const { data: note, isLoading, isError } = useNote(username, id ?? "");
    const deleteNote = useDeleteNote();
    const [deleteTarget, setDeleteTarget] = useState<{
        id: string;
        title: string;
    } | null>(null);

    const editor = useEditor({
        extensions: [StarterKit],
        content: note?.contentJson ?? {
            type: "doc",
            content: [{ type: "paragraph" }],
        },
        editable: false,
    });

    useEffect(() => {
        return () => editor?.destroy();
    }, [editor]);

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

            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <FileText size={24} className="text-primary shrink-0" />
                    <h1 className="text-2xl font-bold text-on-surface wrap-break-word">
                        {note.title}
                    </h1>
                    <NoteTypeBadge type={note.noteType} />
                </div>
                <div className="flex items-center gap-2 shrink-0">
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

            <div className="border-t border-outline pt-6">
                <EditorContent editor={editor} />
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
