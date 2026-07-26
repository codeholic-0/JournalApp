import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
}
interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("ErrorBoundary caught:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4 animate-fadeIn" role="alert">
                    <AlertTriangle size={48} className="text-red-400" aria-hidden="true" />
                    <h1 className="text-xl font-semibold text-on-surface">
                        Something went wrong
                    </h1>
                    <p className="text-sm text-on-surface-muted max-w-md text-center">
                        {this.state.error?.message ||
                            "An unexpected error occurred."}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
                    >
                        <RefreshCw size={16} aria-hidden="true" />
                        Reload page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
