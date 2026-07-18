import { useEffect } from "react";
import { X } from "lucide-react";

interface Shortcut {
    keys: string;
    desc: string;
    scope: "Global" | "Editor" | "Overlay";
}

const shortcuts: Shortcut[] = [
    { keys: "Ctrl+K", desc: "Command palette", scope: "Global" },
    { keys: "Ctrl+F", desc: "Find in file", scope: "Editor" },
    { keys: "Ctrl+S", desc: "Save note", scope: "Editor" },
    { keys: "Ctrl+B", desc: "Bold text", scope: "Editor" },
    { keys: "Ctrl+/", desc: "Toggle comment", scope: "Editor" },
    { keys: "/", desc: "Slash menu", scope: "Editor" },
    { keys: "?", desc: "Open this help", scope: "Global" },
    { keys: "Esc", desc: "Close this menu", scope: "Overlay" },
];

function scopeClass(scope: string) {
    switch (scope) {
        case "Editor": return "text-primary";
        case "Global": return "text-amber-500";
        default: return "text-on-surface-muted";
    }
}

export default function ShortcutOverlay({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-surface-raised border border-outline rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-on-surface">
                        Keyboard Shortcuts
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md text-on-surface-muted hover:bg-hover hover:text-on-surface"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="space-y-1">
                    {shortcuts.map((s) => (
                        <div
                            key={s.keys}
                            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-1.5"
                        >
                            <span className="text-sm text-on-surface-muted">
                                {s.desc}
                            </span>
                            <span className={`text-[10px] uppercase tracking-wider font-medium ${scopeClass(s.scope)}`}>
                                {s.scope}
                            </span>
                            <kbd className="px-2 py-0.5 rounded bg-surface-alt border border-outline text-xs text-on-surface font-mono">
                                {s.keys}
                            </kbd>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
