export interface JournalResponse {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface JournalRequest {
    title: string;
    content?: string;
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
