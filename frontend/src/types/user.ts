export interface UserResponse {
    id: string;
    username: string;
    roles: string[];
}

export interface UserRequest {
    username?: string;
    password?: string;
}
