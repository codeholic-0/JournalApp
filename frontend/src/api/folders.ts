import api from "./axios";
import type {
    FolderResponse,
    FolderRequest,
    FolderPatchRequest,
} from "../types/folder";

export const getFolders = async (
    workspaceId: string,
    sort: string = "sortOrder",
): Promise<FolderResponse[]> => {
    const { data } = await api.get<FolderResponse[]>(
        `/api/workspaces/${workspaceId}/folders?sort=${sort}`,
    );
    return data;
};

export const getFolder = async (
    workspaceId: string,
    folderId: string,
): Promise<FolderResponse> => {
    const { data } = await api.get<FolderResponse>(
        `/api/workspaces/${workspaceId}/folders/${folderId}`,
    );
    return data;
};

export const createFolder = async (
    workspaceId: string,
    body: FolderRequest,
): Promise<FolderResponse> => {
    const { data } = await api.post(
        `/api/workspaces/${workspaceId}/folders`,
        body,
    );
    return data;
};

export const updateFolder = async (
    workspaceId: string,
    folderId: string,
    body: FolderPatchRequest,
): Promise<FolderResponse> => {
    const { data } = await api.patch(
        `/api/workspaces/${workspaceId}/folders/${folderId}`,
        body,
    );
    return data;
};

export const deleteFolder = async (
    workspaceId: string,
    folderId: string,
    force: boolean = false,
): Promise<void> => {
    await api.delete(
        `/api/workspaces/${workspaceId}/folders/${folderId}?force=${force}`,
    );
};
