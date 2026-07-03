import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";

describe("useDebouncedCallback", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("should return a stable function reference across rerenders", () => {
        const callback = vi.fn();
        const { result, rerender } = renderHook(
            ({ cb, delay }) => useDebouncedCallback(cb, delay),
            { initialProps: { cb: callback, delay: 100 } },
        );

        const first = result.current;
        rerender({ cb: callback, delay: 100 });
        expect(result.current).toBe(first);
    });

    it("should keep the function reference stable when delay changes", () => {
        const { result, rerender } = renderHook(
            ({ delay }) => useDebouncedCallback(() => {}, delay),
            { initialProps: { delay: 100 } },
        );
        const first = result.current;
        rerender({ delay: 200 });
        expect(result.current).toBe(first);
    });

    it("should invoke the latest callback when debounced fires", () => {
        const first = vi.fn();
        const second = vi.fn();
        const { result, rerender } = renderHook(
            ({ cb }) => useDebouncedCallback(cb, 100),
            { initialProps: { cb: first } },
        );

        act(() => result.current());
        rerender({ cb: second });
        act(() => result.current());
        act(() => vi.advanceTimersByTime(150));

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });

    it("should pass args to the callback", () => {
        const callback = vi.fn();
        const { result } = renderHook(() =>
            useDebouncedCallback(callback, 100),
        );

        act(() => result.current("a", 1));
        act(() => vi.advanceTimersByTime(150));
        expect(callback).toHaveBeenCalledWith("a", 1);
    });

    it("should coalesce rapid calls into one invocation", () => {
        const callback = vi.fn();
        const { result } = renderHook(() =>
            useDebouncedCallback(callback, 100),
        );

        act(() => {
            result.current();
            result.current("x");
            result.current("y");
        });
        act(() => vi.advanceTimersByTime(150));
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith("y");
    });
});
