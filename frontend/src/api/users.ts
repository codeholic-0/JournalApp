import api from "./axios";
import type { UserRequest, UserResponse } from "../types/user";

export const getUser = async (username: string): Promise<UserResponse> => {
    const { data } = await api.get<UserResponse>(`/api/users/${username}`);
    return data;
};

export const updateUser = async (
    username: string,
    body: UserRequest,
): Promise<UserResponse> => {
    const { data } = await api.patch<UserResponse>(
        `/api/users/${username}`,
        body,
    );
    return data;
};

export const deleteUser = async (username: string): Promise<void> => {
    await api.delete(`/api/users/${username}`);
};
