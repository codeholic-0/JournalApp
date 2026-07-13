import { useParams, useLocation, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useVaultStore } from "../store/vaultStore";
import { useWorkspace } from "../hooks/useWorkspaces";
import { useFolder } from "../hooks/useFolders";
import { useNote } from "../hooks/useNotes";

interface Crumb {
    label: string;
    to?: string;
}

export default function Breadcrumbs() {
    const { id: noteId } = useParams();
    const location = useLocation();
    const path = location.pathname;
    const { user } = useAuth();
    const username = user?.username ?? "";
    const currentWorkspaceId = useVaultStore((s) => s.currentWorkspaceId);
    const currentFolderId = useVaultStore((s) => s.currentFolderId);
    const { data: workspace } = useWorkspace(currentWorkspaceId ?? "");
    const { data: folder } = useFolder(currentWorkspaceId ?? "", currentFolderId ?? "");
    const { data: note } = useNote(username, noteId ?? "");

    if (path !== "/" && !path.startsWith("/notes/")) return null;

    const crumbs: Crumb[] = [];
    crumbs.push({ label: "Root", to: "/" });

    if (currentWorkspaceId && workspace?.name) {
        crumbs.push({ label: workspace.name, to: "/" });
    }
    if (currentFolderId && folder?.name) {
        crumbs.push({ label: folder.name, to: "/" });
    }
    if (noteId && note?.title) {
        const isEditing = path.endsWith("/edit");
        crumbs.push({
            label: isEditing ? `${note.title} (editing)` : note.title,
        });
    }

    if (crumbs.length <= 1) return null;

    return (
        <nav className="flex items-center gap-1 text-xs text-on-surface-muted mb-4 select-none">
            {crumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight size={12} />}
                    {crumb.to ? (
                        <Link
                            to={crumb.to}
                            className={`transition-colors whitespace-nowrap ${
                                i === 0
                                    ? "opacity-0 w-0 hover:opacity-100 hover:w-auto overflow-hidden"
                                    : "hover:text-on-surface"
                            }`}
                        >
                            {crumb.label}
                        </Link>
                    ) : (
                        <span className="text-on-surface font-medium truncate max-w-50">
                            {crumb.label}
                        </span>
                    )}
                </span>
            ))}
        </nav>
    );
}