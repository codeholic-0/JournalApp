import api from "./axios";
import type { UserPreferences } from "../types/preferences";

export const getPreferences = async (
    username: string,
): Promise<UserPreferences> => {
    const { data } = await api.get<UserPreferences>(
        `/api/users/${username}/prefs`,
    );
    return data;
};

export const updatePreferences = async (
    username: string,
    body: Partial<UserPreferences>,
): Promise<UserPreferences> => {
    const { data } = await api.put<UserPreferences>(
        `/api/users/${username}/prefs`,
        body,
    );
    return data;
};
