import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as preferencesApi from "../api/preferences";
import type { UserPreferences } from "../types/preferences";

function getInitialPrefs(): UserPreferences {
    if (typeof window !== "undefined" && window.__PREFS__) {
        return window.__PREFS__;
    }
    return { theme: "dark", accent: null, fontScale: null, density: null };
}

function applyTheme(theme: string) {
    document.documentElement.classList.toggle("dark", theme !== "light");
}

function applyAccent(accent: string | null) {
    if (accent) {
        document.documentElement.style.setProperty("--accent", accent);
    } else {
        document.documentElement.style.removeProperty("--accent");
    }
}

function applyDensity(density: string) {
    document.documentElement.style.setProperty("--row-density", density);
    const isCompact = density === "compact";
    document.documentElement.style.setProperty("--card-p", isCompact ? "0.5rem" : "1rem");
    document.documentElement.style.setProperty("--grid-gap", isCompact ? "0.5rem" : "1rem");
}

function applyFontScale(scale: number) {
    document.documentElement.style.setProperty("--font-scale", String(scale));
}

export function useAppearance(username?: string) {
    const qc = useQueryClient();
    const initial = getInitialPrefs();

    const { data: serverPrefs } = useQuery({
        queryKey: ["prefs", username],
        queryFn: () => preferencesApi.getPreferences(username!),
        enabled: !!username,
        staleTime: 5 * 60 * 1000,
    });

    const prefs = serverPrefs ?? initial;

    const updateMutation = useMutation({
        mutationFn: (body: Partial<UserPreferences>) =>
            preferencesApi.updatePreferences(username!, body),
        onMutate: async (body) => {
            await qc.cancelQueries({ queryKey: ["prefs", username] });
            const snapshot = qc.getQueryData<UserPreferences>(["prefs", username]);
            qc.setQueryData<UserPreferences>(["prefs", username], (old) => ({
                ...(old ?? initial),
                ...body,
            }));
            return { snapshot };
        },
        onError: (_err, _body, ctx) => {
            if (ctx?.snapshot)
                qc.setQueryData(["prefs", username], ctx.snapshot);
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["prefs", username] });
        },
    });

    const setTheme = (theme: string) => {
        applyTheme(theme);
        if (username) updateMutation.mutate({ theme });
    };

    const setAccent = (accent: string | null) => {
        applyAccent(accent);
        if (username) updateMutation.mutate({ accent });
    };

    const setDensity = (density: string) => {
        applyDensity(density);
        if (username) updateMutation.mutate({ density });
    };

    const setFontScale = (fontScale: number) => {
        applyFontScale(fontScale);
        if (username) updateMutation.mutate({ fontScale });
    };

    return {
        theme: prefs.theme ?? "dark",
        accent: prefs.accent ?? null,
        fontScale: prefs.fontScale ?? null,
        density: prefs.density ?? null,
        setTheme,
        setAccent,
        setDensity,
        setFontScale,
    };
}
