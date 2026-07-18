import { useState, useEffect } from "react";

export function useShortcuts() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput =
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable;
            const mod = e.metaKey || e.ctrlKey;

            if (mod && (e.key === "s" || e.key === "k")) {
                if (isInput) return;
                e.preventDefault();
            }

            if (e.key === "?") {
                if (isInput) return;
                e.preventDefault();
                setShow((s) => !s);
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    return { showShortcuts: show, setShowShortcuts: setShow };
}
