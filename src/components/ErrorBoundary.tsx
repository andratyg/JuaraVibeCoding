import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6 text-[var(--text)]">
          <div className="max-w-md w-full bg-[var(--surface)] p-8 rounded-[2rem] border border-[var(--border)] shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Terjadi Kesalahan</h1>
            <p className="text-[var(--text2)] mb-6 text-sm">
              Maaf, Velora mengalami kendala teknis. Kesalahan ini telah dicatat.
            </p>
            {this.state.error && (
              <div className="w-full bg-[var(--bg)] p-4 rounded-xl mb-6 overflow-x-auto text-left">
                <code className="text-xs text-[var(--danger)]">{this.state.error.message}</code>
              </div>
            )}
            <Button 
              size="lg"
              fullWidth
              icon={RefreshCw}
              onClick={() => window.location.reload()}
            >
              Muat Ulang Velora
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
