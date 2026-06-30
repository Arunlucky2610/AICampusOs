import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const componentName = this.props.name || "Unknown";
    console.error(`[ErrorBoundary/${componentName}]`, {
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const msg = this.state.error?.message || "";
      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="max-w-md text-center">
            <AlertTriangle className="mx-auto mb-4 text-amber-500" size={44} />
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted">
              An unexpected error occurred in {this.props.name || "this section"}.
              {msg && <><br /><span className="mt-1 block text-xs text-muted/60">{msg}</span></>}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              <RefreshCw size={16} /> Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
