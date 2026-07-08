import { useRef, useEffect, useLayoutEffect, useCallback, useState } from "react";
import { mountMD, type EditorAPI, type MountMDOpts } from "../editor/mdEditor";

export function useMdEditor(opts?: MountMDOpts) {
    const editorRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<EditorAPI | null>(null);
    const optsRef = useRef(opts);
    const [ready, setReady] = useState(false);
    useLayoutEffect(() => {
        optsRef.current = opts;
    });

    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        apiRef.current = mountMD(el, "", {
            onDocChange: (value) => optsRef.current?.onDocChange?.(value),
        });
        setReady(true);
        return () => {
            apiRef.current?.destroy();
            setReady(false);
        };
    }, []);

    const getValue = useCallback(() => apiRef.current?.getValue() ?? "", []);
    const setValue = useCallback(
        (val: string) => {
            if (apiRef.current) {
                apiRef.current.setValue(val);
            }
        },
        [],
    );

    return { editorRef, getValue, setValue, ready };
}
