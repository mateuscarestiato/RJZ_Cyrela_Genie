import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
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
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white p-10 text-center">
          <div className="bg-red-500/10 p-10 rounded-[3rem] border border-red-500/20 mb-8">
            <h1 className="text-4xl font-black mb-4">Algo deu errado</h1>
            <p className="text-slate-400 max-w-md mx-auto">
              Ocorreu um erro inesperado na interface. Tente recarregar a página ou limpar o cache do navegador.
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-orange-500 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/20 hover:scale-105 transition-transform"
          >
            Recarregar Portal
          </button>
          {this.state.error && (
            <pre className="mt-10 p-6 bg-black/50 rounded-2xl text-[10px] text-red-400 font-mono text-left max-w-2xl overflow-auto border border-white/5">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
