import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-center">
          <div className="ec-glass-strong p-8 rounded-card max-w-md w-full border border-accent-red/20">
            <h1 className="text-2xl font-bold text-accent-red mb-4">Ops! Algo deu errado.</h1>
            <p className="text-text-secondary mb-6">
              Ocorreu um erro inesperado ao carregar o aplicativo.
            </p>
            <div className="bg-black/40 p-4 rounded-lg text-left mb-6 overflow-auto max-h-40">
              <pre className="text-xs text-accent-red font-mono whitespace-pre-wrap">
                {this.state.error?.message}
              </pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="ec-premium-cta w-full py-3 rounded-xl font-bold"
            >
              Recarregar Aplicativo
            </button>
            <p className="text-[10px] text-text-muted mt-6 uppercase tracking-widest">
              Expert Club • Error Recovery
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
