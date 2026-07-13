import { Link } from "react-router-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface NoteCardActionsProps {
    noteId: string;
    onDelete: () => void;
}

export default function NoteCardActions({ noteId, onDelete }: NoteCardActionsProps) {
    return (
        <div className="flex items-center justify-between pt-1">
            <div className="flex gap-3">
                <Link
                    to={`/notes/${noteId}`}
                    className="flex items-center gap-1 text-xs text-on-surface-muted hover:text-primary transition-colors"
                >
                    <Eye size={14} /> View
                </Link>
                <Link
                    to={`/notes/${noteId}/edit`}
                    className="flex items-center gap-1 text-xs text-on-surface-muted hover:text-primary transition-colors"
                >
                    <Pencil size={14} /> Edit
                </Link>
            </div>
            <button
                onClick={onDelete}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
            >
                <Trash2 size={14} /> Delete
            </button>
        </div>
    );
}