export type UserRole = "USER" | "ADMIN";

export interface LoginRequest {
    username: string;
    password: string;
}

export interface AuthResponse {
    id: string;
    accessToken: string;
    refreshToken: string;
    username: string;
    roles: UserRole[];
}
