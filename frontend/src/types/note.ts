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
}

export interface NoteRequest {
    title: string;
    content?: string;
    noteType?: NoteType;
    favorite?: boolean;
    pinned?: boolean;
    contentJson?: Record<string, unknown> | null;
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
    contentJson: Record<string, unknown>;
    markdown: string;
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
