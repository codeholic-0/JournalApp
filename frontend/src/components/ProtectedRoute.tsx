import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();
    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <Loader2 className="animate-spin text-primary" size={24} />
            </div>
        );
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <Outlet />;
}
