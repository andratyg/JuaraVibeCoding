import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-xl">
                <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center text-red-500 mb-8 mx-auto">
                    <span className="text-4xl">⚠️</span>
                </div>
                <h1 className="text-white text-2xl font-black mb-4">Something went wrong.</h1>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    FlowState encountered an unexpected error. Don't worry, your data is safe.
                </p>
                <button 
                    onClick={() => window.location.reload()}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                >
                    Restart Application
                </button>
                <p className="mt-6 text-[10px] text-slate-600 font-mono italic">
                    Error: {this.state.error?.message}
                </p>
            </div>
        </div>
      );
    }

    return (this as any).props?.children;
  }
}

export default ErrorBoundary;
