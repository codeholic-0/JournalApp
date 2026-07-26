import { ArrowUpDown } from "lucide-react";
import { useVaultStore } from "../store/vaultStore";

const SORT_OPTIONS = [
    { value: "sortOrder" as const, label: "Custom" },
    { value: "name" as const, label: "A→Z" },
    { value: "createdAt" as const, label: "Newest" },
];

export default function SortSelector() {
    const sort = useVaultStore((s) => s.workspaceSort);
    const setSort = useVaultStore((s) => s.setWorkspaceSort);

    return (
        <div className="flex items-center gap-1 px-2 pb-2" role="radiogroup" aria-label="Sort order">
            <ArrowUpDown size={14} className="text-on-surface-muted shrink-0" aria-hidden="true" />
            {SORT_OPTIONS.map((opt) => (
                <button
                    key={opt.value}
                    role="radio"
                    aria-checked={sort === opt.value}
                    onClick={() => setSort(opt.value)}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${
                        sort === opt.value
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-on-surface-muted hover:text-on-surface"
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
