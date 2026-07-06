import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as workspacesApi from "../api/workspaces";
import type {
    WorkspaceRequest,
    WorkspacePatchRequest,
} from "../types/workspace";

export const useWorkspaces = (
    sort: string = "sortOrder",
    includeInternal: boolean = false,
) =>
    useQuery({
        queryKey: ["workspaces", sort, includeInternal],
        queryFn: () => workspacesApi.getWorkspaces(sort, includeInternal),
    });

export const useWorkspace = (id: string) =>
    useQuery({
        queryKey: ["workspace", id],
        queryFn: () => workspacesApi.getWorkspace(id),
        enabled: !!id,
    });

export const useCreateWorkspace = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: WorkspaceRequest) =>
            workspacesApi.createWorkspace(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
    });
};

export const useUpdateWorkspace = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: WorkspacePatchRequest;
        }) => workspacesApi.updateWorkspace(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
    });
};

export const useDeleteWorkspace = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => workspacesApi.deleteWorkspace(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
    });
};
