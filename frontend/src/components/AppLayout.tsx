import { useState, useCallback, useEffect, useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
    LayoutDashboard,
    FilePlus2,
    UserCircle,
    Menu,
    X,
    PanelLeftOpen,
    Trash2,
    ChevronDown,
} from "lucide-react";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import SortSelector from "./SortSelector";
import CreateWorkspaceModal from "./CreateWorkspaceModal";
import FolderTree from "./FolderTree";
import { useAuth } from "../hooks/useAuth";
import { useVaultStore } from "../store/vaultStore";
import Breadcrumbs from "./Breadcrumbs";
import ShortcutOverlay from "./ShortcutOverlay";
import { useShortcuts } from "../hooks/useShortcuts";

const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/notes/new", label: "New Note", icon: FilePlus2, end: false },
    { to: "/trash", label: "Trash", icon: Trash2, end: false },
];

const accountItem = {
    to: "/account",
    end: false,
};

function SectionDivider({
    label,
    section,
    collapsed,
    children,
}: {
    label: string;
    section: string;
    collapsed: boolean;
    children: React.ReactNode;
}) {
    const isCollapsed = useVaultStore(
        (s) => s.sectionCollapse[section] ?? false,
    );
    const toggle = useVaultStore((s) => s.toggleSection);

    if (collapsed) return null;

    return (
        <div>
            <button
                onClick={() => toggle(section)}
                aria-expanded={!isCollapsed}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-semibold text-on-surface-muted hover:text-on-surface transition-colors"
            >
                <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                        isCollapsed ? "-rotate-90" : ""
                    }`}
                />
                {label}
            </button>
            <div
                className={`grid transition-[grid-template-rows] duration-200 ${
                    isCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
                }`}
            >
                <div className={isCollapsed ? "overflow-hidden" : ""}>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function AppLayout() {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const sidebarWidth = useVaultStore((s) => s.sidebarWidth);
    const setSidebarWidth = useVaultStore((s) => s.setSidebarWidth);
    const collapsed = sidebarWidth <= 80;
    const focusMode = useVaultStore((s) => s.focusMode);
    const { showShortcuts, setShowShortcuts } = useShortcuts();
    const dragRef = useRef<HTMLDivElement>(null);

    const toggleCollapsed = useCallback(() => {
        setSidebarWidth(collapsed ? 256 : 64);
    }, [collapsed, setSidebarWidth]);

    useEffect(() => {
        const el = dragRef.current;
        if (!el || collapsed) return;

        let startX = 0;
        let startWidth = 0;

        const onMouseDown = (e: MouseEvent) => {
            startX = e.clientX;
            startWidth = sidebarWidth;
            setIsDragging(true);
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        };

        const onMouseMove = (e: MouseEvent) => {
            const delta = e.clientX - startX;
            setSidebarWidth(Math.min(400, Math.max(64, startWidth + delta)));
        };

        const onMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };

        el.addEventListener("mousedown", onMouseDown);
        return () => {
            el.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, [collapsed, sidebarWidth, setSidebarWidth]);

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
            isActive
                ? "bg-primary/10 text-primary font-medium shadow-[inset_2px_0_0_0] shadow-primary"
                : "text-on-surface-muted hover:bg-hover hover:text-on-surface"
        } ${collapsed ? "justify-center px-2" : ""}`;

    const sidebarInner = (
        <>
            {/* Collapse/Expand button (only shown when collapsed) */}
            <div
                className={`border-b border-outline ${collapsed ? "p-3" : ""}`}
            >
                {collapsed && (
                    <button
                        onClick={toggleCollapsed}
                        className="w-full p-1.5 rounded-md text-on-surface-muted hover:bg-hover hover:text-on-surface transition-colors"
                        title="Expand sidebar"
                    >
                        <PanelLeftOpen size={18} className="mx-auto" />
                    </button>
                )}
            </div>

            {/* Workspaces section */}
            <SectionDivider
                label="Workspaces"
                section="workspaces"
                collapsed={collapsed}
            >
                <WorkspaceSwitcher
                    onNewWorkspace={() => setShowCreateModal(true)}
                />
                <SortSelector />
            </SectionDivider>

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

                <SectionDivider
                    label="Folders"
                    section="folders"
                    collapsed={collapsed}
                >
                    <FolderTree />
                </SectionDivider>
            </nav>

            {/* Account link */}
            <div className="border-t border-outline p-2 space-y-1">
                <NavLink
                    to={accountItem.to}
                    end={accountItem.end}
                    onClick={() => setSidebarOpen(false)}
                    className={linkClass}
                >
                    <UserCircle size={18} />
                    {!collapsed && <span>{user?.username ?? "Account"}</span>}
                </NavLink>
                <button
                    onClick={() => setShowShortcuts(true)}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-on-surface-muted hover:bg-hover hover:text-on-surface transition-colors"
                    title="Keyboard shortcuts"
                >
                    <span className="w-5 h-5 flex items-center justify-center text-xs font-bold border border-outline rounded">
                        ?
                    </span>
                    {!collapsed && <span>Keyboard shortcuts</span>}
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-surface">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-surface-raised focus:text-on-surface focus:border focus:border-outline focus:shadow-lg">
                Skip to content
            </a>
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
            <div className="hidden lg:block">
                <aside
                    className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-outline bg-surface-alt overflow-y-auto transition-[width] duration-300 max-lg:max-w-[85vw] ${
                        collapsed ? "overflow-hidden" : ""
                    } ${isDragging ? "transition-none" : ""} ${focusMode ? "hidden" : ""}`}
                    style={{ width: collapsed ? 64 : sidebarWidth }}
                >
                    {sidebarInner}
                    {!collapsed && (
                        <div
                            ref={dragRef}
                            aria-label="Resize sidebar"
                            className="absolute right-0 inset-y-0 w-1.5 cursor-col-resize z-10 hover:bg-primary/30 active:bg-primary/50 transition-colors"
                        />
                    )}
                </aside>
            </div>

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
                        <aside className="w-72 max-w-[85vw] flex flex-col h-full border-r border-outline bg-surface-alt overflow-y-auto">
                            {sidebarInner}
                        </aside>
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
                id="main-content"
                className={`transition-all duration-300 p-6 pt-16 lg:pt-6 animate-fadeIn ${focusMode ? "ml-0! pt-0!" : ""}`}
                style={
                    {
                        "--sidebar-offset": collapsed
                            ? "64px"
                            : `${Math.min(sidebarWidth, 400)}px`,
                    } as React.CSSProperties
                }
            >
                <Breadcrumbs />
                <Outlet />
            </main>
            <ShortcutOverlay
                open={showShortcuts}
                onClose={() => setShowShortcuts(false)}
            />
        </div>
    );
}
