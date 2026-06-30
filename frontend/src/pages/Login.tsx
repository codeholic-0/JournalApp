import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";

const schema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof schema>;

export default function Login() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({ resolver: zodResolver(schema) });

    useEffect(() => {
        if (isAuthenticated) navigate("/", { replace: true });
    }, [isAuthenticated, navigate]);

    const onSubmit = async (data: LoginForm) => {
        try {
            await login(data.username, data.password);
            toast.success("Welcome back!");
            navigate("/", { replace: true });
        } catch {
            toast.error("Invalid username or password");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface px-4">
            <div className="w-full max-w-sm animate-fadeIn">
                <div className="bg-surface-alt rounded-xl border border-outline p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Lock size={20} className="text-primary" />
                        </div>
                        <h1 className="text-xl font-semibold text-on-surface">
                            Sign in
                        </h1>
                    </div>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <div className="relative">
                            <User
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-muted"
                            />
                            <input
                                {...register("username")}
                                placeholder="Username"
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-outline bg-surface text-on-surface text-sm placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                            />
                            {errors.username && (
                                <p className="text-xs text-red-400 mt-1">
                                    {errors.username.message}
                                </p>
                            )}
                        </div>

                        <div className="relative">
                            <Lock
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-muted"
                            />
                            <input
                                {...register("password")}
                                type="password"
                                placeholder="Password"
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-outline bg-surface text-on-surface text-sm placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                            />
                            {errors.password && (
                                <p className="text-xs text-red-400 mt-1">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors active:scale-[0.98]"
                        >
                            {isSubmitting && (
                                <Loader2 size={16} className="animate-spin" />
                            )}
                            {isSubmitting ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <p className="text-sm text-center text-on-surface-muted">
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            className="text-primary hover:underline"
                        >
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
