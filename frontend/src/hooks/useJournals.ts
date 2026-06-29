import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as journalsApi from "../api/journals";
import type { JournalRequest } from "../types/journal";

export const useJournals = (username: string) =>
    useQuery({
        queryKey: ["journals", username],
        queryFn: () => journalsApi.getJournals(username),
        enabled: !!username,
    });

export const useJournal = (username: string, id: string) =>
    useQuery({
        queryKey: ["journal", username, id],
        queryFn: () => journalsApi.getJournal(username, id),
        enabled: !!username && !!id,
    });

export const useCreateJournal = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            username,
            data,
        }: {
            username: string;
            data: JournalRequest;
        }) => journalsApi.createJournal(username, data),
        onSuccess: (_data, { username }) => {
            qc.invalidateQueries({ queryKey: ["journals", username] });
        },
    });
};

export const useUpdateJournal = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            username,
            id,
            data,
        }: {
            username: string;
            id: string;
            data: JournalRequest;
        }) => journalsApi.updateJournal(username, id, data),
        onSuccess: (_data, { username, id }) => {
            qc.invalidateQueries({ queryKey: ["journals", username] });
            qc.invalidateQueries({ queryKey: ["journal", username, id] });
        },
    });
};

export const useDeleteJournal = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ username, id }: { username: string; id: string }) =>
            journalsApi.deleteJournal(username, id),
        onSuccess: (_data, { username }) => {
            qc.invalidateQueries({ queryKey: ["journals", username] });
        },
    });
};
