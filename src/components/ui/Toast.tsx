import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

// Imperative singleton - any module can call toast() without a provider
let _addToast: ((msg: Omit<ToastMessage, 'id'>) => void) | null = null

export function toast(type: ToastType, message: string) {
  if (_addToast) {
    _addToast({ type, message })
  } else {
    // Fallback before container mounts
    console.warn(`[Toast ${type}] ${message}`)
  }
}

export const toastSuccess = (msg: string) => toast('success', msg)
export const toastError = (msg: string) => toast('error', msg)
export const toastInfo = (msg: string) => toast('info', msg)

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    _addToast = (msg) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setToasts(prev => [...prev.slice(-4), { ...msg, id }]) // max 5 toasts
      setTimeout(() => remove(id), 4500)
    }
    return () => { _addToast = null }
  }, [remove])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm" role="alert" aria-live="polite">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
      ))}
    </div>
  )
}

const STYLES: Record<ToastType, string> = {
  success: 'border-accent-lime/30 bg-[#0d1a0d] text-accent-lime',
  error:   'border-red-500/30 bg-[#1a0d0d] text-red-400',
  info:    'border-accent-sky/30 bg-[#0d141a] text-accent-sky',
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 shrink-0" />,
  error:   <XCircle className="h-4 w-4 shrink-0" />,
  info:    <Info className="h-4 w-4 shrink-0" />,
}

function ToastItem({ toast: t, onClose }: { toast: ToastMessage; onClose: () => void }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-right-4 fade-in duration-200 ${STYLES[t.type]}`}
    >
      {ICONS[t.type]}
      <span className="flex-1 leading-snug">{t.message}</span>
      <button
        onClick={onClose}
        className="mt-0.5 shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Fechar notificação"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
