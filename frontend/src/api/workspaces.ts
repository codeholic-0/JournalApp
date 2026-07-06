import api from "./axios";
import type {
    WorkspaceResponse,
    WorkspaceRequest,
    WorkspacePatchRequest,
    WorkspaceDeleteResponse,
} from "../types/workspace";

export const getWorkspaces = async (
    sort: string = "sortOrder",
    includeInternal: boolean = false,
): Promise<WorkspaceResponse[]> => {
    const { data } = await api.get(
        `/api/workspaces?sort=${sort}&includeInternal=${includeInternal}`,
    );
    return data;
};

export const getWorkspace = async (id: string): Promise<WorkspaceResponse> => {
    const { data } = await api.get(`/api/workspaces/${id}`);
    return data;
};

export const createWorkspace = async (
    body: WorkspaceRequest,
): Promise<WorkspaceResponse> => {
    const { data } = await api.post("/api/workspaces", body);
    return data;
};

export const updateWorkspace = async (
    id: string,
    body: WorkspacePatchRequest,
): Promise<WorkspaceResponse> => {
    const { data } = await api.patch(`/api/workspaces/${id}`, body);
    return data;
};

export const deleteWorkspace = async (
    id: string,
): Promise<WorkspaceDeleteResponse> => {
    const { data } = await api.delete(`/api/workspaces/${id}`);
    return data;
};
