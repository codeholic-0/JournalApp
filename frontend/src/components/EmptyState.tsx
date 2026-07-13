import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: { label: string; to: string };
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Icon size={48} className="text-on-surface-muted" />
            <p className="text-on-surface-muted text-sm">{title}</p>
            {description && (
                <p className="text-on-surface-muted text-xs">{description}</p>
            )}
            {action && (
                <Link
                    to={action.to}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
                >
                    {action.label}
                </Link>
            )}
        </div>
    );
}
