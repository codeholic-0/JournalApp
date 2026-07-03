import { useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { mountMD, type EditorAPI, type MountMDOpts } from "../editor/mdEditor";

export function useMdEditor(opts?: MountMDOpts) {
    const editorRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<EditorAPI | null>(null);
    const optsRef = useRef(opts);
    useLayoutEffect(() => {
        optsRef.current = opts;
    });

    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        apiRef.current = mountMD(el, "", {
            onDocChange: (value) => optsRef.current?.onDocChange?.(value),
        });
        return () => apiRef.current?.destroy();
    }, []);

    const getValue = useCallback(() => apiRef.current?.getValue() ?? "", []);
    const setValue = useCallback(
        (val: string) => apiRef.current?.setValue(val),
        [],
    );

    return { editorRef, getValue, setValue };
}
