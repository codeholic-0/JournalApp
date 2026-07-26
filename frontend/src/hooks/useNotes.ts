import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notesApi from "../api/notes";
import type { NoteRequest, NoteResponse, PagedResponse } from "../types/note";

export const useNotes = (
    username: string,
    page: number = 0,
    workspaceId?: string,
    folderId?: string,
    unfiled?: boolean,
) =>
    useQuery({
        queryKey: ["notes", username, page, workspaceId, folderId, unfiled],
        queryFn: () =>
            notesApi.getNotes(
                username,
                page,
                10,
                workspaceId,
                folderId,
                unfiled,
            ),
        enabled: !!username,
        placeholderData: (previousData) => previousData,
    });

export const useUnfiledCount = (username: string, workspaceId?: string) =>
    useQuery({
        queryKey: ["unfiledCount", username, workspaceId],
        queryFn: () => notesApi.getUnfiledCount(username, workspaceId),
        enabled: !!username,
    });

export const useNote = (
    username: string,
    id: string,
    queryOptions?: { staleTime?: number },
) =>
    useQuery({
        queryKey: ["note", username, id],
        queryFn: () => notesApi.getNote(username, id),
        enabled: !!username && !!id,
        refetchOnMount: true,
        staleTime: queryOptions?.staleTime ?? 0,
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
            qc.invalidateQueries({ queryKey: ["unfiledCount", username] });
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
            qc.invalidateQueries({ queryKey: ["unfiledCount", username] });
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
            qc.invalidateQueries({ queryKey: ["unfiledCount", username] });
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
            qc.invalidateQueries({ queryKey: ["unfiledCount", username] });
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
            qc.invalidateQueries({ queryKey: ["unfiledCount", username] });
        },
    });
};

function useToggleNoteField(
    field: "favorite" | "pinned",
    toggleFn: (username: string, id: string) => Promise<NoteResponse>,
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ username, id }: { username: string; id: string }) =>
            toggleFn(username, id),
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
                            n.id === id
                                ? { ...n, [field]: !(n as Record<string, boolean>)[field] }
                                : n,
                        ),
                    };
                },
            );

            qc.setQueryData<NoteResponse>(["note", username, id], (old) => {
                if (!old) return old;
                return { ...old, [field]: !(old as Record<string, boolean>)[field] };
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
}

export const useToggleFavorite = () =>
    useToggleNoteField("favorite", notesApi.toggleFavorite);

export const useTogglePin = () =>
    useToggleNoteField("pinned", notesApi.togglePin);

export const useUpdateSortOrder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            username,
            id,
            sortOrder,
        }: {
            username: string;
            id: string;
            sortOrder: string;
        }) => notesApi.updateSortOrder(username, id, sortOrder),
        onSuccess: (_data, { username }) => {
            qc.invalidateQueries({ queryKey: ["notes", username] });
        },
    });
};


