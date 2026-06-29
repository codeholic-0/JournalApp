import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const navItems = [
    { to: "/", label: "Dashboard", icon: "●" },
    { to: "/journals/new", label: "New Journal", icon: "✏️" },
    { to: "/account", label: "Account", icon: "👤" },
];

export default function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dark, setDark] = useState(false);

    const toggleDark = () => {
        setDark((prev) => {
            document.documentElement.classList.toggle("dark", !prev);
            return !prev;
        });
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const sidebar = (
        <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-outline flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-outline">
                <h1 className="text-lg font-bold text-on-surface">
                    JournalApp
                </h1>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/"}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                isActive
                                    ? "bg-primary text-white"
                                    : "text-on-surface hover:bg-surface-alt"
                            }`
                        }
                    >
                        <span>{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom */}
            <div className="border-t border-outline p-3 space-y-2">
                <button
                    onClick={toggleDark}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-alt transition-colors"
                >
                    <span>{dark ? "☀️" : "🌑"}</span>
                    {dark ? "Light mode" : "Dark mode"}
                </button>
                <div className="px-3 py-2 text-sm text-on-surface truncate">
                    👤 {user?.username}
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-alt transition-colors"
                >
                    🚪 Logout
                </button>
            </div>
        </aside>
    );

    return (
        <div className="min-h-screen bg-surface-alt text-on-surface">
            {/* Mobile hamburger */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded bg-surface border border-outline"
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                <span className="text-xl">{sidebarOpen ? "✕" : "☰"}</span>
            </button>

            {/* Desktop sidebar */}
            <div className="hidden lg:block">{sidebar}</div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="lg:hidden">{sidebar}</div>
                </>
            )}

            {/* Main */}
            <main className="lg:ml-64 p-6 pt-16 lg:pt-6">
                <Outlet />
            </main>
        </div>
    );
}
