import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as foldersApi from "../api/folders";
import type { FolderRequest, FolderPatchRequest } from "../types/folder";

export const useFolders = (workspaceId: string, sort: string = "sortOrder") =>
    useQuery({
        queryKey: ["folders", workspaceId, sort],
        queryFn: () => foldersApi.getFolders(workspaceId, sort),
        enabled: !!workspaceId,
    });

export const useFolder = (workspaceId: string, folderId: string) =>
    useQuery({
        queryKey: ["folder", workspaceId, folderId],
        queryFn: () => foldersApi.getFolder(workspaceId, folderId),
        enabled: !!workspaceId && !!folderId,
    });

export const useCreateFolder = (workspaceId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: FolderRequest) =>
            foldersApi.createFolder(workspaceId, data),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: ["folders", workspaceId] }),
    });
};

export const useUpdateFolder = (workspaceId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: FolderPatchRequest }) =>
            foldersApi.updateFolder(workspaceId, id, data),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: ["folders", workspaceId] }),
    });
};

export const useDeleteFolder = (workspaceId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
            foldersApi.deleteFolder(workspaceId, id, force),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: ["folders", workspaceId] }),
    });
};
