export interface WorkspaceResponse {
    id: string;
    name: string;
    color: string;
    icon: string;
    sortOrder: string;
    createdAt: string;
    updatedAt: string;
}

export interface WorkspaceRequest {
    name: string;
    color: string;
    icon: string;
}

export interface WorkspacePatchRequest {
    name?: string;
    color?: string;
    icon?: string;
}

export interface WorkspaceDeleteResponse {
    mode: "hard_delete" | "trash";
    bytes: number;
    notesHandled: number;
}
