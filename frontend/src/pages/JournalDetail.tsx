import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Calendar, Clock, Pencil } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useJournal } from "../hooks/useJournals";
import { Skeleton, SkeletonText } from "../components/Skeleton";

export default function JournalDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const username = user?.username ?? "";
  const { data: journal, isLoading, isError } = useJournal(username, id ?? "");

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

  if (isError || !journal) {
    return <p className="text-red-400">Journal not found.</p>;
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
            {journal.title}
          </h1>
        </div>
        <Link
          to={`/journals/${journal.id}/edit`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline text-sm text-on-surface-muted hover:text-on-surface hover:bg-hover transition-colors shrink-0"
        >
          <Pencil size={14} />
          Edit
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-on-surface-muted">
        <span className="flex items-center gap-1.5">
          <Calendar size={14} />
          Created: {new Date(journal.createdAt).toLocaleString()}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={14} />
          Updated: {new Date(journal.updatedAt).toLocaleString()}
        </span>
      </div>

      <div className="border-t border-outline pt-6">
        <p className="text-on-surface leading-relaxed whitespace-pre-wrap">
          {journal.content || "No content."}
        </p>
      </div>
    </div>
  );
}