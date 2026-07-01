import api from "./axios";
import type { NoteResponse, NoteRequest, PagedResponse } from "../types/note";

export const getNotes = async (
    username: string,
    page: number = 0,
    size: number = 10,
): Promise<PagedResponse<NoteResponse>> => {
    const { data } = await api.get<PagedResponse<NoteResponse>>(
        `/api/users/${username}/notes?page=${page}&size=${size}`,
    );
    return data;
};

export const getNote = async (
    username: string,
    id: string,
): Promise<NoteResponse> => {
    const { data } = await api.get<NoteResponse>(
        `/api/users/${username}/notes/${id}`,
    );
    return data;
};

export const createNote = async (
    username: string,
    body: NoteRequest,
): Promise<NoteResponse> => {
    const { data } = await api.post<NoteResponse>(
        `/api/users/${username}/notes`,
        body,
    );
    return data;
};

export const updateNote = async (
    username: string,
    id: string,
    body: NoteRequest,
): Promise<NoteResponse> => {
    const { data } = await api.patch<NoteResponse>(
        `/api/users/${username}/notes/${id}`,
        body,
    );
    return data;
};

export const deleteNote = async (
    username: string,
    id: string,
): Promise<void> => {
    await api.delete(`/api/users/${username}/notes/${id}`);
};

export const getTrashedNotes = async (
    username: string,
    page: number = 0,
    size: number = 10,
): Promise<PagedResponse<NoteResponse>> => {
    const { data } = await api.get<PagedResponse<NoteResponse>>(
        `/api/users/${username}/notes/trash?page=${page}&size=${size}`,
    );
    return data;
};

export const restoreNote = async (
    username: string,
    id: string,
): Promise<NoteResponse> => {
    const { data } = await api.post<NoteResponse>(
        `/api/users/${username}/notes/${id}/restore`,
    );
    return data;
};

export const purgeNote = async (
    username: string,
    id: string,
): Promise<void> => {
    await api.delete(`/api/users/${username}/notes/${id}/purge`);
};
