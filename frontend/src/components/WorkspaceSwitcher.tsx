import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Check } from "lucide-react";
import { useWorkspaces } from "../hooks/useWorkspaces";
import { useVaultStore } from "../store/vaultStore";

interface WorkspaceSwitcherProps {
    onNewWorkspace: () => void;
}

export default function WorkspaceSwitcher({
    onNewWorkspace,
}: WorkspaceSwitcherProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const sort = useVaultStore((s) => s.workspaceSort);
    const currentId = useVaultStore((s) => s.currentWorkspaceId);
    const setCurrentId = useVaultStore((s) => s.setCurrentWorkspaceId);
    const { data: workspaces } = useWorkspaces(sort);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const current = workspaces?.find((w) => w.id === currentId);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-semibold text-on-surface hover:bg-hover transition-colors"
            >
                <span className="truncate flex-1 text-left">
                    {current?.name ?? "No workspace"}
                </span>
                <ChevronDown
                    size={16}
                    className="text-on-surface-muted shrink-0"
                />
            </button>

            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface-raised border border-outline rounded-xl shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
                    {workspaces?.map((w) => (
                        <button
                            key={w.id}
                            onClick={() => {
                                setCurrentId(w.id);
                                setOpen(false);
                            }}
                            className={`flex items-center gap-3 w-full px-3 py-2 text-sm text-left transition-colors ${
                                w.id === currentId
                                    ? "bg-primary/10 text-primary"
                                    : "text-on-surface hover:bg-hover"
                            }`}
                        >
                            <span className="truncate flex-1">{w.name}</span>
                            {w.id === currentId && (
                                <Check size={16} className="shrink-0" />
                            )}
                        </button>
                    ))}
                    <div className="border-t border-outline mt-1 pt-1">
                        <button
                            onClick={() => {
                                setOpen(false);
                                onNewWorkspace();
                            }}
                            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-on-surface-muted hover:bg-hover transition-colors"
                        >
                            <Plus size={16} />
                            <span>New workspace</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
