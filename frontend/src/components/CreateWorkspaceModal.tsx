import { useState } from "react";
import { X } from "lucide-react";
import { useCreateWorkspace } from "../hooks/useWorkspaces";
import { useVaultStore } from "../store/vaultStore";

const PRESET_COLORS = [
    "#1976d2",
    "#2e7d32",
    "#c62828",
    "#f57f17",
    "#6a1b9a",
    "#00838f",
    "#4e342e",
    "#78909c",
];

const PRESET_ICONS = [
    "folder",
    "book",
    "star",
    "heart",
    "briefcase",
    "graduation-cap",
    "code",
    "pen",
];

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function CreateWorkspaceModal({ open, onClose }: Props) {
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("folder");
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const createWorkspace = useCreateWorkspace();
    const setCurrentId = useVaultStore((s) => s.setCurrentWorkspaceId);

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
                className="bg-surface-raised rounded-xl border border-outline p-6 w-full max-w-md mx-auto space-y-5 shadow-xl animate-scaleIn max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-on-surface">
                        New workspace
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md text-on-surface-muted hover:bg-hover transition-colors"
                    >
                        <X size={18} />
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

                <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface">
                        Icon
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {PRESET_ICONS.map((ic) => (
                            <button
                                key={ic}
                                onClick={() => setIcon(ic)}
                                className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                                    icon === ic
                                        ? "bg-primary text-white"
                                        : "bg-surface-alt text-on-surface-muted hover:bg-hover border border-outline"
                                }`}
                            >
                                {ic[0].toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface">
                        Color
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {PRESET_COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-full transition-transform ${
                                    color === c
                                        ? "ring-2 ring-offset-2 ring-offset-surface-raised ring-primary scale-110"
                                        : ""
                                }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

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
