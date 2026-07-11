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
        onSuccess: () => {
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

    return {
        theme: prefs.theme ?? "dark",
        accent: prefs.accent ?? null,
        fontScale: prefs.fontScale ?? null,
        density: prefs.density ?? null,
        setTheme,
        setAccent,
    };
}
