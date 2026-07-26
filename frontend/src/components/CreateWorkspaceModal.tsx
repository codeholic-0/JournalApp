import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useCreateWorkspace } from "../hooks/useWorkspaces";
import { useVaultStore } from "../store/vaultStore";
import IconColorPicker from "./IconColorPicker";

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function CreateWorkspaceModal({ open, onClose }: Props) {
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("folder");
    const [color, setColor] = useState("#1976d2");
    const createWorkspace = useCreateWorkspace();
    const setCurrentId = useVaultStore((s) => s.setCurrentWorkspaceId);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, onClose]);

    useEffect(() => {
        if (!open || !cardRef.current) return;
        const el = cardRef.current;
        const focusable = el.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        first?.focus();
        const handler = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
            }
        };
        el.addEventListener("keydown", handler);
        return () => el.removeEventListener("keydown", handler);
    }, [open]);

    if (!open) return null;

    const handleSubmit = async () => {
        if (!name.trim()) return;
        const res = await createWorkspace.mutateAsync({
            name: name.trim(),
            icon,
            color,
        });
        setCurrentId(res.id);
        setName("");
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                ref={cardRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="workspace-dialog-title"
                className="bg-surface-raised rounded-xl border border-outline p-6 w-full max-w-md mx-auto space-y-5 shadow-xl animate-scaleIn max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 id="workspace-dialog-title" className="text-lg font-semibold text-on-surface">
                        New workspace
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="p-1 rounded-md text-on-surface-muted hover:bg-hover transition-colors"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface">
                        Name
                    </label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My workspace"
                        autoFocus
                        className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface text-sm placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <IconColorPicker
                    icon={icon}
                    color={color}
                    onIconChange={setIcon}
                    onColorChange={setColor}
                />

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim() || createWorkspace.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors active:scale-[0.98]"
                    >
                        {createWorkspace.isPending ? "Creating..." : "Create"}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-outline text-sm text-on-surface-muted hover:bg-hover transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
