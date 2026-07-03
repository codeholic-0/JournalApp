// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
    callback: T,
    delay: number,
): { call: (...args: Parameters<T>) => void; cancel: () => void } {
    let timer: ReturnType<typeof setTimeout> | null = null;

    return {
        call(...args: Parameters<T>) {
            if (timer !== null) clearTimeout(timer);
            timer = setTimeout(() => {
                callback(...args);
                timer = null;
            }, delay);
        },
        cancel() {
            if (timer !== null) clearTimeout(timer);
            timer = null;
        },
    };
}
