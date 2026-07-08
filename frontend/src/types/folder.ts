export interface FolderResponse {
    id: string;
    workspaceId: string;
    parentId: string | null;
    name: string;
    icon: string | null;
    color: string | null;
    sortOrder: string;
    materializedPath: string;
    createdAt: string;
    updatedAt: string;
}

export interface FolderRequest {
    name: string;
    parentId?: string;
    icon?: string;
    color?: string;
}

export interface FolderPatchRequest {
    name?: string;
    parentId?: string;
    icon?: string;
    color?: string;
}
