import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "../api/users";
import type { UserRequest } from "../types/user";

export const useUser = (username: string) =>
    useQuery({
        queryKey: ["user", username],
        queryFn: () => usersApi.getUser(username),
        enabled: !!username,
    });

export const useUpdatePassword = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            username,
            data,
        }: {
            username: string;
            data: UserRequest;
        }) => usersApi.updatePassword(username, data),
        onSuccess: (_data, { username }) => {
            qc.invalidateQueries({ queryKey: ["user", username] });
        },
    });
};

export const useDeleteUser = () =>
    useMutation({
        mutationFn: (username: string) => usersApi.deleteUser(username),
    });
