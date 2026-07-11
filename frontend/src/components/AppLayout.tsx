import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    FilePlus2,
    Settings,
    Moon,
    Sun,
    LogOut,
    Menu,
    X,
    PanelLeftOpen,
    UserCircle,
    Trash2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAppearance } from "../hooks/useAppearance";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import SortSelector from "./SortSelector";
import CreateWorkspaceModal from "./CreateWorkspaceModal";
import FolderTree from "./FolderTree";

const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/notes/new", label: "New Note", icon: FilePlus2, end: false },
    { to: "/trash", label: "Trash", icon: Trash2, end: false },
];

const accountItem = {
    to: "/account",
    label: "Settings",
    icon: Settings,
    end: false,
};

export default function AppLayout() {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useAppearance(user?.username);
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem("sidebar-collapsed") === "true";
    });

    const toggleCollapsed = () => {
        setCollapsed((prev) => {
            localStorage.setItem("sidebar-collapsed", String(!prev));
            return !prev;
        });
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
            isActive
                ? "bg-primary/10 text-primary font-medium shadow-[inset_2px_0_0_0] shadow-primary"
                : "text-on-surface-muted hover:bg-hover hover:text-on-surface"
        } ${collapsed ? "justify-center px-2" : ""}`;

    const sidebarContent = (
        <aside
            className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-outline bg-surface-alt overflow-y-auto transition-all duration-300 ${
                collapsed ? "w-16" : "w-64 max-lg:w-72 max-lg:max-w-[85vw]"
            }`}
        >
            {/* Workspace header */}
            <div
                className={`border-b border-outline ${collapsed ? "p-3" : ""}`}
            >
                {collapsed ? (
                    <button
                        onClick={toggleCollapsed}
                        className="w-full p-1.5 rounded-md text-on-surface-muted hover:bg-hover hover:text-on-surface transition-colors"
                        title="Expand sidebar"
                    >
                        <PanelLeftOpen size={18} className="mx-auto" />
                    </button>
                ) : (
                    <div>
                        <WorkspaceSwitcher
                            onNewWorkspace={() => setShowCreateModal(true)}
                        />
                        <SortSelector />
                    </div>
                )}
            </div>

            {/* Primary nav */}
            <nav className="flex-1 p-2 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setSidebarOpen(false)}
                        className={linkClass}
                        title={collapsed ? item.label : undefined}
                    >
                        <item.icon size={18} />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}

                {!collapsed && <FolderTree />}

                {!collapsed && (
                    <div className="pt-3 pb-1 text-xs font-medium text-on-surface-muted px-3">
                        Account
                    </div>
                )}

                <NavLink
                    to={accountItem.to}
                    end={accountItem.end}
                    onClick={() => setSidebarOpen(false)}
                    className={linkClass}
                    title={collapsed ? accountItem.label : undefined}
                >
                    <accountItem.icon size={18} />
                    {!collapsed && <span>{accountItem.label}</span>}
                </NavLink>
            </nav>

            {/* Bottom */}
            <div className="border-t border-outline p-2 space-y-1">
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-on-surface-muted hover:bg-hover hover:text-on-surface transition-colors ${
                        collapsed ? "justify-center px-2" : ""
                    }`}
                    title={collapsed ? (theme === "dark" ? "Light mode" : "Dark mode") : undefined}
                >
                    {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                    {!collapsed && (
                        <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                    )}
                </button>

                {!collapsed && (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-on-surface-muted truncate">
                        <UserCircle size={16} />
                        <span className="truncate">{user?.username}</span>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-on-surface-muted hover:bg-hover hover:text-red-400 transition-colors ${
                        collapsed ? "justify-center px-2" : ""
                    }`}
                    title={collapsed ? "Logout" : undefined}
                >
                    <LogOut size={18} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );

    return (
        <div className="min-h-screen bg-surface">
            {/* Mobile hamburger */}
            <button
                className={`lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-alt border border-outline text-on-surface shadow-sm transition-opacity duration-200 ${
                    sidebarOpen
                        ? "opacity-0 pointer-events-none"
                        : "opacity-100"
                }`}
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
            >
                <Menu size={20} />
            </button>

            {/* Desktop sidebar */}
            <div className="hidden lg:block">{sidebarContent}</div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <button
                            className="absolute top-4 right-4 p-2 rounded-lg bg-surface-alt border border-outline text-on-surface shadow-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSidebarOpen(false);
                            }}
                            aria-label="Close sidebar"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="lg:hidden fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-out translate-x-0">
                        {sidebarContent}
                    </div>
                </>
            )}

            {showCreateModal && (
                <CreateWorkspaceModal
                    open={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {/* Main */}
            <main
                className={`transition-all duration-300 p-6 pt-16 lg:pt-6 ${
                    collapsed ? "lg:ml-16" : "lg:ml-64"
                } animate-fadeIn`}
            >
                <Outlet />
            </main>
        </div>
    );
}
