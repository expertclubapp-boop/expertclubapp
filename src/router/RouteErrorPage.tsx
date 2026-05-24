import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react'

export function RouteErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()

  const is404 = isRouteErrorResponse(error) && error.status === 404

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm w-full space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-accent-red/10 border border-accent-red/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-accent-red" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-white">
            {is404 ? 'Página não encontrada' : 'Algo deu errado'}
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            {is404
              ? 'A página que você está tentando acessar não existe ou foi movida.'
              : 'Ocorreu um erro inesperado. Tente novamente ou volte ao início.'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Tentar novamente
          </button>
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-ec-violet text-sm font-semibold text-white hover:bg-ec-violet/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  )
}
