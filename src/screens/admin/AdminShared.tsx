import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export function AdminToolbar({
  title,
  eyebrow,
  description,
  action,
}: {
  title: string
  eyebrow?: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-accent-lime">{eyebrow}</p>}
        <h1 className="font-display text-h1 font-black uppercase italic text-white">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-text-muted">{description}</p>}
      </div>
      {action}
    </header>
  )
}

export function AdminSearchFilter({
  search,
  onSearch,
  status,
  onStatus,
  statuses = [
    ['all', 'Todos'],
    ['published', 'Publicado'],
    ['draft', 'Rascunho'],
    ['active', 'Ativo'],
    ['inactive', 'Inativo'],
    ['archived', 'Arquivado'],
  ],
}: {
  search: string
  onSearch: (value: string) => void
  status?: string
  onStatus?: (value: string) => void
  statuses?: string[][]
}) {
  return (
    <div className="mb-5 grid gap-3 md:grid-cols-12">
      <div className="relative md:col-span-8">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={event => onSearch(event.target.value)}
          placeholder="Buscar..."
          className="ec-input w-full rounded-xl py-3 pl-11 pr-4 text-sm text-text-primary outline-none"
        />
      </div>
      {status !== undefined && onStatus && (
        <select value={status} onChange={event => onStatus(event.target.value)} className="ec-input rounded-xl px-4 py-3 text-sm text-white md:col-span-4">
          {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      )}
    </div>
  )
}

export function AdminState({ isLoading, error, empty, children }: { isLoading?: boolean; error?: string | null; empty?: boolean; children: React.ReactNode }) {
  if (isLoading) {
    return <div className="flex h-[45vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-ec-violet/30 border-t-ec-violet" /></div>
  }
  if (error) {
    return <div className="rounded-2xl border border-accent-red/20 bg-accent-red/10 p-6 text-sm text-accent-red">{error}</div>
  }
  if (empty) {
    return <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-sm text-text-muted">Nada encontrado com os filtros atuais.</div>
  }
  return <>{children}</>
}

export function StatusSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={event => onChange(event.target.value)} className="ec-input rounded-xl px-3 py-2 text-xs text-white">
      <option value="draft">Rascunho</option>
      <option value="published">Publicado</option>
      <option value="active">Ativo</option>
      <option value="inactive">Inativo</option>
      <option value="archived">Arquivado</option>
    </select>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</span>
      {children}
    </label>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`ec-input w-full rounded-xl px-4 py-3 text-sm text-white outline-none ${props.className || ''}`} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`ec-input w-full rounded-xl px-4 py-3 text-sm text-white outline-none ${props.className || ''}`} />
}

export function ConfirmButton({ children, message, onConfirm, variant = 'ghost' }: { children: React.ReactNode; message: string; onConfirm: () => void; variant?: 'ghost' | 'destructive' | 'lime' }) {
  const [isConfirming, setIsConfirming] = useState(false)

  if (isConfirming) {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl border border-accent-yellow/30 bg-accent-yellow/10 px-3 py-2">
        <span className="max-w-[220px] text-xs font-bold text-accent-yellow">{message}</span>
        <Button variant={variant} className="w-auto px-3 py-2 text-xs" onClick={() => { setIsConfirming(false); onConfirm() }}>
          Confirmar
        </Button>
        <Button variant="ghost" className="w-auto px-3 py-2 text-xs" onClick={() => setIsConfirming(false)}>
          Cancelar
        </Button>
      </span>
    )
  }

  return (
    <Button variant={variant} className="w-auto" onClick={() => setIsConfirming(true)}>
      {children}
    </Button>
  )
}

export function toJson(value: unknown) {
  return JSON.stringify(value ?? null, null, 2)
}

export function parseJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T } catch { return fallback }
}
