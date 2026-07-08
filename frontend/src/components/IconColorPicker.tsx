import {
    Folder,
    Book,
    Star,
    Heart,
    Briefcase,
    GraduationCap,
    Code,
    Pen,
} from "lucide-react";

const PRESET_ICONS = [
    { value: "folder", Component: Folder },
    { value: "book", Component: Book },
    { value: "star", Component: Star },
    { value: "heart", Component: Heart },
    { value: "briefcase", Component: Briefcase },
    { value: "graduation-cap", Component: GraduationCap },
    { value: "code", Component: Code },
    { value: "pen", Component: Pen },
];

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

interface Props {
    icon: string;
    color: string;
    onIconChange: (icon: string) => void;
    onColorChange: (color: string) => void;
}

export default function IconColorPicker({
    icon,
    color,
    onIconChange,
    onColorChange,
}: Props) {
    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface">
                    Icon
                </label>
                <div className="flex gap-2 flex-wrap">
                    {PRESET_ICONS.map(({ value, Component }) => (
                        <button
                            key={value}
                            onClick={() => onIconChange(value)}
                            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                                icon === value
                                    ? "bg-primary text-white"
                                    : "bg-surface-alt text-on-surface-muted hover:bg-hover border border-outline"
                            }`}
                        >
                            <Component size={14} />
                        </button>
                    ))}
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface">
                    Color
                </label>
                <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                        <button
                            key={c}
                            onClick={() => onColorChange(c)}
                            className={`w-7 h-7 rounded-full transition-transform ${
                                color === c
                                    ? "ring-2 ring-offset-2 ring-offset-surface-raised ring-primary scale-110"
                                    : ""
                            }`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
