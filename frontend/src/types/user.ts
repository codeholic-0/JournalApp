import type { UserRole } from "./auth";

export interface UserResponse {
    id: string;
    username: string;
    roles: UserRole[];
}

export interface UserRequest {
    username?: string;
    password?: string;
}
