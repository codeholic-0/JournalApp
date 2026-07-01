import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import JournalEditor from "./pages/JournalEditor";
import JournalDetail from "./pages/JournalDetail";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import { useTheme } from "./hooks/useTheme";

const queryClient = new QueryClient();

export default function App() {
    useTheme();
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route element={<ProtectedRoute />}>
                                <Route element={<AppLayout />}>
                                    <Route index element={<Dashboard />} />
                                    <Route
                                        path="journals/new"
                                        element={<JournalEditor />}
                                    />
                                    <Route
                                        path="journals/:id"
                                        element={<JournalDetail />}
                                    />
                                    <Route
                                        path="journals/:id/edit"
                                        element={<JournalEditor />}
                                    />
                                    <Route
                                        path="account"
                                        element={<Account />}
                                    />
                                </Route>
                            </Route>
                            <Route path="*" element={<NotFound />} />
                        </Routes>
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
