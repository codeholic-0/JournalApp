import { useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { debounce } from "./debounce";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => void>(
    callback: T,
    delay: number,
): (...args: Parameters<T>) => void {
    const callbackRef = useRef(callback);
    const debouncedRef = useRef<ReturnType<typeof debounce<T>> | null>(null);

    useLayoutEffect(() => {
        debouncedRef.current = debounce((...args: Parameters<T>) => {
            callbackRef.current(...args);
        }, delay);
    }, [delay]);

    useEffect(() => {
        callbackRef.current = callback;
    });

    return useCallback((...args: Parameters<T>) => {
        debouncedRef.current?.call(...args);
    }, []);
}
