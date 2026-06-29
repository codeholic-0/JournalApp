import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../hooks/useAuth";
import { useUpdatePassword, useDeleteUser } from "../hooks/useUser";

const schema = z
    .object({
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirm: z.string(),
    })
    .refine((data) => data.password === data.confirm, {
        message: "Passwords do not match",
        path: ["confirm"],
    });

type PasswordForm = z.infer<typeof schema>;

export default function Account() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const updatePassword = useUpdatePassword();
    const deleteUser = useDeleteUser();
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const username = user?.username ?? "";

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<PasswordForm>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: PasswordForm) => {
        try {
            await updatePassword.mutateAsync({
                username,
                data: { password: data.password },
            });
            setError("root", { message: "Password updated successfully" });
        } catch {
            setError("root", { message: "Failed to update password" });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteUser.mutateAsync(username);
            await logout();
            navigate("/login");
        } catch {
            // ignore
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-on-surface">Account</h1>

            {/* Update password */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <h2 className="text-lg font-semibold text-on-surface">
                    Change password
                </h2>

                <div>
                    <input
                        {...register("password")}
                        type="password"
                        placeholder="New password"
                        className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.password && (
                        <p className="text-sm text-red-500 mt-1">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div>
                    <input
                        {...register("confirm")}
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.confirm && (
                        <p className="text-sm text-red-500 mt-1">
                            {errors.confirm.message}
                        </p>
                    )}
                </div>

                {errors.root && (
                    <p className="text-sm text-center text-on-surface">
                        {errors.root.message}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                    {isSubmitting ? "Updating..." : "Update password"}
                </button>
            </form>

            {/* Delete account */}
            <div className="space-y-3 pt-4 border-t border-outline">
                <h2 className="text-lg font-semibold text-red-500">
                    Delete account
                </h2>
                <p className="text-sm text-outline">
                    This action is permanent. All your journals will be deleted.
                </p>
                {!deleteConfirm ? (
                    <button
                        onClick={() => setDeleteConfirm(true)}
                        className="px-6 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                        Delete my account
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button
                            onClick={handleDelete}
                            className="px-6 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                            Confirm delete
                        </button>
                        <button
                            onClick={() => setDeleteConfirm(false)}
                            className="px-6 py-2 rounded-lg border border-outline text-on-surface text-sm hover:bg-surface-alt transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
