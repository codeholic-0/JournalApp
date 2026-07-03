import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LoadingScreen from "./components/LoadingScreen";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import { useTheme } from "./hooks/useTheme";
import Trash from "./pages/Trash";

const NoteEditor = lazy(() => import("./pages/NoteEditor"));
const NoteDetail = lazy(() => import("./pages/NoteDetail"));

const queryClient = new QueryClient();

export default function App() {
    useTheme();
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <BrowserRouter>
                        <Suspense fallback={<LoadingScreen />}>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route
                                    path="/register"
                                    element={<Register />}
                                />
                                <Route element={<ProtectedRoute />}>
                                    <Route element={<AppLayout />}>
                                        <Route index element={<Dashboard />} />
                                        <Route
                                            path="notes/new"
                                            element={<NoteEditor />}
                                        />
                                        <Route
                                            path="notes/:id"
                                            element={<NoteDetail />}
                                        />
                                        <Route
                                            path="notes/:id/edit"
                                            element={<NoteEditor />}
                                        />
                                        <Route
                                            path="account"
                                            element={<Account />}
                                        />
                                        <Route path="trash" element={<Trash />} />
                                    </Route>
                                </Route>
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </BrowserRouter>
                </AuthProvider>
                <Toaster
                    theme="dark"
                    position="bottom-right"
                    richColors
                    closeButton
                />
            </QueryClientProvider>
        </ErrorBoundary>
    );
}
