import { beforeEach } from "vitest";

const store = new Map<string, string>();

beforeEach(() => {
    store.clear();
});

Object.defineProperty(globalThis, "localStorage", {
    value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
        clear: () => store.clear(),
        length: 0,
        key: () => null,
    },
    writable: true,
    configurable: true,
});
