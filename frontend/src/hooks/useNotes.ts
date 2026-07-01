import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notesApi from "../api/notes";
import type { NoteRequest } from "../types/note";

export const useNotes = (username: string, page: number = 0) =>
    useQuery({
        queryKey: ["notes", username, page],
        queryFn: () => notesApi.getNotes(username, page),
        enabled: !!username,
        placeholderData: (previousData) => previousData,
    });

export const useNote = (username: string, id: string) =>
    useQuery({
        queryKey: ["note", username, id],
        queryFn: () => notesApi.getNote(username, id),
        enabled: !!username && !!id,
    });

export const useCreateNote = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            username,
            data,
        }: {
            username: string;
            data: NoteRequest;
        }) => notesApi.createNote(username, data),
        onSuccess: (_data, { username }) => {
            qc.invalidateQueries({ queryKey: ["notes", username] });
        },
    });
};

export const useUpdateNote = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            username,
            id,
            data,
        }: {
            username: string;
            id: string;
            data: NoteRequest;
        }) => notesApi.updateNote(username, id, data),
        onSuccess: (_data, { username, id }) => {
            qc.invalidateQueries({ queryKey: ["notes", username] });
            qc.invalidateQueries({ queryKey: ["note", username, id] });
        },
    });
};

export const useDeleteNote = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ username, id }: { username: string; id: string }) =>
            notesApi.deleteNote(username, id),
        onSuccess: (_data, { username }) => {
            qc.invalidateQueries({ queryKey: ["notes", username] });
        },
    });
};

export const useTrashNotes = (username: string, page: number = 0) =>
    useQuery({
        queryKey: ["trash", username, page],
        queryFn: () => notesApi.getTrashedNotes(username, page),
        enabled: !!username,
        placeholderData: (previousData) => previousData,
    });

export const useRestoreNote = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ username, id }: { username: string; id: string }) =>
            notesApi.restoreNote(username, id),
        onSuccess: (_data, { username }) => {
            qc.invalidateQueries({ queryKey: ["trash", username] });
            qc.invalidateQueries({ queryKey: ["notes", username] });
        },
    });
};

export const usePurgeNote = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ username, id }: { username: string; id: string }) =>
            notesApi.purgeNote(username, id),
        onSuccess: (_data, { username }) => {
            qc.invalidateQueries({ queryKey: ["trash", username] });
        },
    });
};
