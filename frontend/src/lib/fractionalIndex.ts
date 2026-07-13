const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const BASE = 62;

function digitVal(c: string): number {
    const v = DIGITS.indexOf(c);
    return v === -1 ? 0 : v;
}

export function generateSortOrder(
    before: string | null,
    after: string | null,
): string {
    if (before === null && after === null) return "a0";

    if (before === null) {
        let i = 0;
        for (; i < after!.length; i++) {
            const d = digitVal(after![i]);
            if (d > 0) {
                return after!.slice(0, i) + DIGITS[Math.floor(d / 2)];
            }
        }
        return after! + "01";
    }

    if (after === null) {
        let i = before.length;
        while (i > 0) {
            i--;
            const d = digitVal(before[i]);
            if (d < BASE - 1) {
                return before.slice(0, i) + DIGITS[d + 1];
            }
        }
        return before + "a";
    }

    if (before >= after) {
        const tmp = before;
        before = after;
        after = tmp;
    }

    let prefix = "";
    for (let i = 0; i < before.length && i < after.length; i++) {
        const b = digitVal(before[i]);
        const a = digitVal(after[i]);
        if (b === a) {
            prefix += before[i];
            continue;
        }
        if (b < a) {
            const mid = Math.floor((b + a) / 2);
            if (mid > b) return prefix + DIGITS[mid];
            return prefix + before[i] + "a";
        }
        break;
    }

    const suffix = after.slice(prefix.length);
    for (let i = 0; i < suffix.length; i++) {
        const d = digitVal(suffix[i]);
        if (d > 0) {
            return after.slice(0, prefix.length + i) + DIGITS[Math.floor(d / 2)];
        }
    }

    return before + "0a";
}
