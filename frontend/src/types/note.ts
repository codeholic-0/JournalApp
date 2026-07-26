export interface NoteResponse {
    id: string;
    title: string;
    content: string;
    noteType?: NoteType;
    favorite?: boolean;
    pinned?: boolean;
    contentJson?: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
    sortOrder?: string;
    color?: string;
    workspaceId?: string;
    folderId?: string | null;
    icon?: string;
}

export interface NoteRequest {
    title: string;
    content?: string;
    noteType?: NoteType;
    favorite?: boolean;
    pinned?: boolean;
    contentJson?: Record<string, unknown> | null;
    workspaceId?: string;
    icon?: string;
    color?: string; 
}

export interface PageMetadata {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
}

export interface PagedResponse<T> {
    content: T[];
    page: PageMetadata;
}

export interface NoteDraft {
    title: string;
    content: string;
    savedAt: number;
}

export type NoteType =
    | "BASIC"
    | "DAILY"
    | "TASK"
    | "DATABASE"
    | "JOURNAL"
    | "MEETING"
    | "PROJECT"
    | "WHITEBOARD";
