import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
          <div className="text-center max-w-sm">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Terjadi Kesalahan</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text2)' }}>Ada yang tidak beres. Silakan muat ulang halaman.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-[var(--r-md)] text-sm font-medium text-white"
              style={{ background: 'var(--accent)' }}
            >
              Muat Ulang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
