import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({ resolver: zodResolver(schema) });

    useEffect(() => {
        if (isAuthenticated) navigate("/", { replace: true });
    }, [isAuthenticated, navigate]);

    const onSubmit = async (data: LoginForm) => {
        try {
            await login(data.username, data.password);
            navigate("/", { replace: true });
        } catch {
            setError("root", { message: "Invalid username or password" });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-alt px-4">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-full max-w-sm bg-surface p-6 rounded-xl shadow space-y-4"
            >
                <h1 className="text-xl font-bold text-on-surface text-center">
                    Sign in
                </h1>

                <div>
                    <input
                        {...register("username")}
                        placeholder="Username"
                        className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.username && (
                        <p className="text-sm text-red-500 mt-1">
                            {errors.username.message}
                        </p>
                    )}
                </div>

                <div>
                    <input
                        {...register("password")}
                        type="password"
                        placeholder="Password"
                        className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.password && (
                        <p className="text-sm text-red-500 mt-1">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                {errors.root && (
                    <p className="text-sm text-red-500 text-center">
                        {errors.root.message}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                    {isSubmitting ? "Signing in..." : "Sign in"}
                </button>

                <p className="text-sm text-center text-outline">
                    Don't have an account?{" "}
                    <Link
                        to="/register"
                        className="text-primary hover:underline"
                    >
                        Register
                    </Link>
                </p>
            </form>
        </div>
    );
}
