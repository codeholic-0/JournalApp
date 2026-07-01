import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: "danger" | "default";
}

export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel,
    variant = "danger",
}: ConfirmDialogProps) {
    if (!open) return null;

    const isDanger = variant !== "default";
    const label = confirmLabel ?? (isDanger ? "Delete" : "Confirm");
    const btnClass = isDanger
        ? "bg-red-600 hover:bg-red-700"
        : "bg-primary hover:bg-primary-hover";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-surface-raised rounded-xl border border-outline p-6 max-w-sm w-full space-y-4 shadow-xl animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isDanger ? "bg-red-600/10" : "bg-primary/10"
                            }`}
                        >
                            <AlertTriangle
                                size={20}
                                className={
                                    isDanger ? "text-red-400" : "text-primary"
                                }
                            />
                        </div>
                        <h3 className="text-lg font-semibold text-on-surface">
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md text-on-surface-muted hover:bg-hover transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <p className="text-sm text-on-surface-muted leading-relaxed">
                    {message}
                </p>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onConfirm}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors active:scale-[0.98] ${btnClass}`}
                    >
                        {label}
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
