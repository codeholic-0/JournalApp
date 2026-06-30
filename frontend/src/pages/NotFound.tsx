import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4 animate-fadeIn">
      <FileQuestion size={48} className="text-on-surface-muted" />
      <h1 className="text-xl font-semibold text-on-surface">Page not found</h1>
      <p className="text-sm text-on-surface-muted">This page doesn't exist.</p>
      <Link to="/" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors">
        Go home
      </Link>
    </div>
  );
}