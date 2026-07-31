import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  remoteName: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class RemoteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[MFE Error] ${this.props.remoteName}:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mfe-card border-amber-500/40 bg-amber-500/10">
          <div className="mb-2 flex items-center gap-2">
            <span className="mfe-concept-tag">Error Boundary</span>
            <span className="text-sm text-amber-200">Remote unavailable</span>
          </div>
          <h3 className="text-lg font-semibold text-amber-100">
            Failed to load {this.props.remoteName}
          </h3>
          <p className="mt-2 text-sm text-admin-muted">
            The remote micro frontend could not be loaded. Start it independently
            with its serve target, or check the federation config.
          </p>
          {this.state.error && (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900/60 p-3 text-xs text-amber-200">
              {this.state.error.message}
            </pre>
          )}
          <button
            className="mfe-btn-primary mt-4"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
