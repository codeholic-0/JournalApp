import { describe, it, expect, vi, afterEach } from "vitest";
import { debounce } from "../../hooks/debounce";

describe("debounce", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should call the callback after the specified delay", async () => {
        const fn = vi.fn();
        const { call } = debounce(fn, 100);
        call();
        expect(fn).not.toHaveBeenCalled();
        await new Promise((r) => setTimeout(r, 150));
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should debounce rapid successive calls", async () => {
        const fn = vi.fn();
        const { call } = debounce(fn, 100);
        call();
        await new Promise((r) => setTimeout(r, 50));
        call();
        await new Promise((r) => setTimeout(r, 50));
        call();
        await new Promise((r) => setTimeout(r, 50));
        call();
        await new Promise((r) => setTimeout(r, 150));
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should pass arguments to the callback", async () => {
        const fn = vi.fn();
        const { call } = debounce(fn, 100);
        call("a", 1);
        await new Promise((r) => setTimeout(r, 150));
        expect(fn).toHaveBeenCalledWith("a", 1);
    });

    it("should cancel a pending call", async () => {
        const fn = vi.fn();
        const { call, cancel } = debounce(fn, 100);
        call();
        cancel();
        await new Promise((r) => setTimeout(r, 150));
        expect(fn).not.toHaveBeenCalled();
    });
});
