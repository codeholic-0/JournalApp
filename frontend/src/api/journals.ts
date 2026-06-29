import api from "./axios";
import type { JournalResponse, JournalRequest } from "../types/journal";

export const getJournals = async (
    username: string,
): Promise<JournalResponse[]> => {
    const { data } = await api.get<JournalResponse[]>(
        `/api/users/${username}/journals`,
    );
    return data;
};

export const getJournal = async (
    username: string,
    id: string,
): Promise<JournalResponse> => {
    const { data } = await api.get<JournalResponse>(
        `/api/users/${username}/journals/${id}`,
    );
    return data;
};

export const createJournal = async (
    username: string,
    body: JournalRequest,
): Promise<JournalResponse> => {
    const { data } = await api.post<JournalResponse>(
        `/api/users/${username}/journals`,
        body,
    );
    return data;
};

export const updateJournal = async (
    username: string,
    id: string,
    body: JournalRequest,
): Promise<JournalResponse> => {
    const { data } = await api.patch<JournalResponse>(
        `/api/users/${username}/journals/${id}`,
        body,
    );
    return data;
};

export const deleteJournal = async (
    username: string,
    id: string,
): Promise<void> => {
    await api.delete(`/api/users/${username}/journals/${id}`);
};
