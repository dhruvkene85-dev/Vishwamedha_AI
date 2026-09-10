import { Component, type ErrorInfo, type ReactNode } from 'react';
import { VishwamedhaSymbol } from './Logo';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Vishwamedha AI ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      this.setState({ hasError: false, error: null, errorInfo: null });
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex items-center justify-center p-4 font-sans select-none">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-6">
            {/* Vishwamedha Logo with Alert Accent */}
            <div className="relative inline-flex items-center justify-center">
              <div className="p-4 rounded-3xl bg-indigo-50/70 border border-indigo-100 shadow-xs">
                <VishwamedhaSymbol size={56} />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-rose-500 text-white shadow-xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            {/* Title & Tagline */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Vishwamedha AI
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-indigo-600 text-white">
                  Error
                </span>
              </div>
              <p className="text-xs font-semibold text-indigo-700">Intelligence Without Boundaries</p>
              <p className="text-sm text-slate-600 pt-2 leading-relaxed">
                An unexpected interface issue occurred. Your conversation data and settings remain safe.
              </p>
            </div>

            {/* Error Message Details (if available) */}
            {this.state.error && (
              <div className="text-left bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs font-mono text-slate-700 max-h-32 overflow-y-auto break-words">
                <p className="font-semibold text-rose-600 mb-1">Issue Details:</p>
                <p>{this.state.error.message || 'Unknown runtime error'}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                id="btn-error-reload"
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>

              <button
                id="btn-error-reset"
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Workspace</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
