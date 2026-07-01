import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Loader2, Trash2, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useUpdatePassword, useDeleteUser } from "../hooks/useUser";
import axios from "axios";

const schema = z
    .object({
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(24, "Password must be at most 24 characters"),
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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const username = user?.username ?? "";

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<PasswordForm>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: PasswordForm) => {
        try {
            await updatePassword.mutateAsync({
                username,
                data: { username, password: data.password },
            });
            toast.success("Password updated");
        } catch (e) {
            const msg = axios.isAxiosError(e)
                ? (e.response?.data?.message ?? "Failed to update password")
                : "Failed to update password";
            toast.error(msg);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteUser.mutateAsync(username);
            await logout();
            toast.success("Account deleted");
            navigate("/login");
        } catch {
            toast.error("Failed to delete account");
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-8 animate-fadeIn">
            <h1 className="text-2xl font-bold text-on-surface">Account</h1>

            {/* Update password */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <h2 className="text-lg font-semibold text-on-surface">
                    Change password
                </h2>

                <div className="relative">
                    <Lock
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-muted"
                    />
                    <input
                        {...register("password")}
                        type="password"
                        placeholder="New password (8 - 24 characters)"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-outline bg-surface-alt text-on-surface text-sm placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    />
                    {errors.password && (
                        <p className="text-xs text-red-400 mt-1">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div className="relative">
                    <Lock
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-muted"
                    />
                    <input
                        {...register("confirm")}
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-outline bg-surface-alt text-on-surface text-sm placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    />
                    {errors.confirm && (
                        <p className="text-xs text-red-400 mt-1">
                            {errors.confirm.message}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors active:scale-[0.98]"
                >
                    {isSubmitting && (
                        <Loader2 size={14} className="animate-spin" />
                    )}
                    {isSubmitting ? "Updating..." : "Update password"}
                </button>
            </form>

            {/* Delete account */}
            <div className="pt-4 border-t border-outline space-y-3">
                <h2 className="text-lg font-semibold text-red-400">
                    Delete account
                </h2>
                <p className="text-sm text-on-surface-muted">
                    This action is permanent. All your notes will be deleted.
                </p>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors active:scale-[0.98]"
                >
                    <Trash2 size={14} />
                    Delete my account
                </button>
            </div>

            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => setShowDeleteModal(false)}
                >
                    <div
                        className="bg-surface-raised rounded-xl border border-outline p-6 max-w-sm w-full space-y-4 shadow-xl animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center">
                                    <AlertTriangle
                                        size={20}
                                        className="text-red-400"
                                    />
                                </div>
                                <h3 className="text-lg font-semibold text-on-surface">
                                    Delete account?
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="p-1 rounded-md text-on-surface-muted hover:bg-hover transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-sm text-on-surface-muted leading-relaxed">
                            This will permanently delete your account and all
                            notes. This action cannot be undone.
                        </p>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors active:scale-[0.98]"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 rounded-lg border border-outline text-sm text-on-surface-muted hover:bg-hover transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
