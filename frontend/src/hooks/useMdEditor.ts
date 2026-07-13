import {
    useRef,
    useEffect,
    useLayoutEffect,
    useCallback,
    useState,
} from "react";
import { mountMD, type EditorAPI, type MountMDOpts } from "../editor/mdEditor";
import { useDebouncedCallback } from "./useDebouncedCallback";

export function useMdEditor(opts?: MountMDOpts) {
    const editorRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<EditorAPI | null>(null);
    const optsRef = useRef(opts);
    const [ready, setReady] = useState(false);
    const [stats, setStats] = useState({ words: 0, chars: 0 });
    useLayoutEffect(() => {
        optsRef.current = opts;
    });

    const updateStats = useDebouncedCallback((value: string) => {
        setStats({
            words: value ? value.trim().split(/\s+/).filter(Boolean).length : 0,
            chars: value.length,
        });
    }, 250);

    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        apiRef.current = mountMD(el, "", {
            onDocChange: (value) => {
                updateStats(value);
                optsRef.current?.onDocChange?.(value);
            },
        });
        setReady(true);
        return () => {
            apiRef.current?.destroy();
            setReady(false);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const getValue = useCallback(() => apiRef.current?.getValue() ?? "", []);
    const setValue = useCallback((val: string) => {
        if (apiRef.current) {
            apiRef.current.setValue(val);
        }
    }, []);

    const setWrap = useCallback((enabled: boolean) => {
        apiRef.current?.setWrap(enabled);
    }, []);

    const triggerCompletion = useCallback(() => {
        apiRef.current?.triggerCompletion();
    }, []);

    return { editorRef, getValue, setValue, ready, setWrap, stats, triggerCompletion };
}
