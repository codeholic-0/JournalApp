import { Link, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useJournal } from "../hooks/useJournals";

export default function JournalDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const username = user?.username ?? "";
    const {
        data: journal,
        isLoading,
        isError,
    } = useJournal(username, id ?? "");

    if (isLoading) return <p className="text-on-surface">Loading...</p>;
    if (isError || !journal)
        return <p className="text-red-500">Journal not found.</p>;

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <Link to="/" className="text-sm text-primary hover:underline">
                ← Back
            </Link>

            <h1 className="text-2xl font-bold text-on-surface">
                {journal.title}
            </h1>

            <div className="flex gap-4 text-sm text-outline">
                <span>
                    Created: {new Date(journal.createdAt).toLocaleString()}
                </span>
                <span>
                    Updated: {new Date(journal.updatedAt).toLocaleString()}
                </span>
            </div>

            <p className="text-on-surface whitespace-pre-wrap">
                {journal.content}
            </p>

            <div className="flex gap-3 pt-2">
                <Link
                    to={`/journals/${journal.id}/edit`}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
                >
                    Edit
                </Link>
                <Link
                    to="/"
                    className="px-4 py-2 rounded-lg border border-outline text-on-surface text-sm hover:bg-surface-alt transition-colors"
                >
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
