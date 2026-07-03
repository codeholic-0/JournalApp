import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notesApi from "../api/notes";
import type { NoteRequest, NoteResponse, PagedResponse } from "../types/note";

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

export const useToggleFavorite = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ username, id }: { username: string; id: string }) =>
            notesApi.toggleFavorite(username, id),
        onMutate: async ({ username, id }) => {
            await qc.cancelQueries({ queryKey: ["notes", username] });
            await qc.cancelQueries({ queryKey: ["note", username, id] });

            const snapshot = qc.getQueriesData({
                queryKey: ["notes", username],
            });
            const previousNote = qc.getQueryData<NoteResponse>([
                "note",
                username,
                id,
            ]);

            qc.setQueriesData<PagedResponse<NoteResponse>>(
                { queryKey: ["notes", username] },
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        content: old.content.map((n) =>
                            n.id === id ? { ...n, favorite: !n.favorite } : n,
                        ),
                    };
                },
            );

            qc.setQueryData<NoteResponse>(["note", username, id], (old) => {
                if (!old) return old;
                return { ...old, favorite: !old.favorite };
            });

            return { snapshot, previousNote };
        },
        onError: (_err, { username, id }, ctx) => {
            if (ctx?.previousNote)
                qc.setQueryData(["note", username, id], ctx.previousNote);
            if (ctx?.snapshot) {
                for (const [key, data] of ctx.snapshot)
                    qc.setQueryData(key, data);
            }
        },
        onSettled: (_data, _err, { username, id }) => {
            qc.invalidateQueries({ queryKey: ["notes", username] });
            qc.invalidateQueries({ queryKey: ["note", username, id] });
        },
    });
};

export const useTogglePin = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ username, id }: { username: string; id: string }) =>
            notesApi.togglePin(username, id),
        onMutate: async ({ username, id }) => {
            await qc.cancelQueries({ queryKey: ["notes", username] });
            await qc.cancelQueries({ queryKey: ["note", username, id] });

            const snapshot = qc.getQueriesData({
                queryKey: ["notes", username],
            });
            const previousNote = qc.getQueryData<NoteResponse>([
                "note",
                username,
                id,
            ]);

            qc.setQueriesData<PagedResponse<NoteResponse>>(
                { queryKey: ["notes", username] },
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        content: old.content.map((n) =>
                            n.id === id ? { ...n, pinned: !n.pinned } : n,
                        ),
                    };
                },
            );

            qc.setQueryData<NoteResponse>(["note", username, id], (old) => {
                if (!old) return old;
                return { ...old, pinned: !old.pinned };
            });

            return { snapshot, previousNote };
        },
        onError: (_err, { username, id }, ctx) => {
            if (ctx?.previousNote)
                qc.setQueryData(["note", username, id], ctx.previousNote);
            if (ctx?.snapshot) {
                for (const [key, data] of ctx.snapshot)
                    qc.setQueryData(key, data);
            }
        },
        onSettled: (_data, _err, { username, id }) => {
            qc.invalidateQueries({ queryKey: ["notes", username] });
            qc.invalidateQueries({ queryKey: ["note", username, id] });
        },
    });
};

export const useAutosaveNote = () => {
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
        onSuccess: (_data, { username }) => {
            qc.invalidateQueries({ queryKey: ["notes", username] });
        },
    });
};
