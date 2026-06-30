import api, { setAccessToken, setRefreshToken } from "./axios";
import type { AuthResponse, LoginRequest } from "../types/auth";
import axios from "axios";
export const register = async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/api/auth/register", data);
    setAccessToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
    return res.data;
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/api/auth/login", data);
    setAccessToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
    return res.data;
};

export const refresh = async (token: string): Promise<AuthResponse> => {
    const base = import.meta.env.VITE_API_URL || "";
    const { data } = await axios.post<AuthResponse>(
        base + "/api/auth/refresh",
        {
            refreshToken: token,
        },
    );
    return data;
};

export const logout = async (refreshTokenStr: string): Promise<void> => {
    await api.post("/api/auth/logout", { refreshToken: refreshTokenStr });
};
