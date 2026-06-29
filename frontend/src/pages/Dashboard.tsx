import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useJournals } from "../hooks/useJournals";

export default function Dashboard() {
    const { user } = useAuth();
    const {
        data: journals,
        isLoading,
        isError,
    } = useJournals(user?.username ?? "");

    if (isLoading)
        return <p className="text-on-surface">Loading journals...</p>;
    if (isError)
        return <p className="text-red-500">Failed to load journals.</p>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-on-surface">
                    My Journals
                </h1>
                <Link
                    to="/journals/new"
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
                >
                    + New Journal
                </Link>
            </div>

            {journals?.length === 0 ? (
                <p className="text-outline">
                    No journal entries yet.{" "}
                    <Link
                        to="/journals/new"
                        className="text-primary hover:underline"
                    >
                        Create your first one
                    </Link>
                </p>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {journals?.map((j) => (
                        <div
                            key={j.id}
                            className="bg-surface rounded-xl p-4 border border-outline space-y-2"
                        >
                            <h2 className="font-semibold text-on-surface truncate">
                                {j.title}
                            </h2>
                            <p className="text-sm text-outline line-clamp-2">
                                {j.content}
                            </p>
                            <p className="text-xs text-outline">
                                {new Date(j.createdAt).toLocaleDateString()}
                            </p>
                            <div className="flex gap-2 pt-1">
                                <Link
                                    to={`/journals/${j.id}`}
                                    className="text-sm text-primary hover:underline"
                                >
                                    View
                                </Link>
                                <Link
                                    to={`/journals/${j.id}/edit`}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Edit
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
