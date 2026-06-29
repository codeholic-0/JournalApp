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
