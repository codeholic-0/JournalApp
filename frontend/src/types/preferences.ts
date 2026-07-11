export interface UserPreferences {
    theme: string | null;
    accent: string | null;
    fontScale: number | null;
    density: string | null;
}

declare global {
    interface Window {
        __PREFS__?: UserPreferences;
    }
}
