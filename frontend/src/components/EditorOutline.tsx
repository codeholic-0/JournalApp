import { X } from "lucide-react";
import type { Heading } from "../editor/extensions/outline";

interface Props {
    headings: Heading[];
    words: number;
    onHeadingClick: (pos: number) => void;
    onClose: () => void;
}

export default function EditorOutline({ headings, words, onHeadingClick, onClose }: Props) {
    if (headings.length === 0) return null;

    const readingTime = Math.max(1, Math.ceil(words / 200));

    return (
        <div className="absolute top-2 right-2 z-50 bg-surface-raised border border-outline rounded-lg shadow-xl max-w-64 w-56 max-h-80 overflow-y-auto p-3 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-muted">
                    {words} words &middot; {readingTime} min read
                </span>
                <button
                    onClick={onClose}
                    className="p-0.5 rounded text-on-surface-muted hover:bg-hover transition-colors"
                    aria-label="Close outline"
                >
                    <X size={12} />
                </button>
            </div>
            <ul className="space-y-0.5">
                {headings.map((h, i) => (
                    <li key={i}>
                        <button
                            onClick={() => onHeadingClick(h.pos)}
                            className="text-xs text-left text-on-surface-muted hover:text-on-surface hover:bg-hover w-full rounded px-1.5 py-0.5 truncate transition-colors"
                            style={{ paddingLeft: `${8 + (h.level - 1) * 12}px` }}
                        >
                            {h.text}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
