import type { NoteType } from "../types/note";

const typeColors: Record<NoteType, { bg: string; text: string }> = {
    BASIC: {
        bg: "bg-gray-100 dark:bg-gray-800",
        text: "text-gray-600 dark:text-gray-400",
    },
    DAILY: {
        bg: "bg-blue-100 dark:bg-blue-900",
        text: "text-blue-600 dark:text-blue-300",
    },
    TASK: {
        bg: "bg-red-100 dark:bg-red-900",
        text: "text-red-600 dark:text-red-300",
    },
    DATABASE: {
        bg: "bg-purple-100 dark:bg-purple-900",
        text: "text-purple-600 dark:text-purple-300",
    },
    JOURNAL: {
        bg: "bg-amber-100 dark:bg-amber-900",
        text: "text-amber-600 dark:text-amber-300",
    },
    MEETING: {
        bg: "bg-green-100 dark:bg-green-900",
        text: "text-green-600 dark:text-green-300",
    },
    PROJECT: {
        bg: "bg-indigo-100 dark:bg-indigo-900",
        text: "text-indigo-600 dark:text-indigo-300",
    },
    WHITEBOARD: {
        bg: "bg-pink-100 dark:bg-pink-900",
        text: "text-pink-600 dark:text-pink-300",
    },
};

export default function NoteTypeBadge({ type }: { type?: NoteType | null }) {
    if (!type || type === "BASIC") return null;
    const colors = typeColors[type] ?? typeColors.BASIC;
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${colors.bg} ${colors.text}`}
        >
            {type}
        </span>
    );
}
