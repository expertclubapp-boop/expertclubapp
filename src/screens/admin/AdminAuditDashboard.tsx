/**
 * AdminAuditDashboard — Financial Operations Console
 *
 * NOT an admin panel. A war room for incident investigation.
 *
 * Tabs:
 *   Explorer     — ledger search by UID / correlationId / billingEventId / payoutId
 *   Trace        — correlation trace viewer (visual financial timeline)
 *   Webhooks     — webhook lifecycle monitor (received → processing → processed/failed)
 *   Reconciliation — discrepancies, orphaned balances, DLQ
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  RefreshCw,
  Loader2,
  GitBranch,
  Webhook,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Link2,
  ChevronDown,
  ChevronRight,
  Inbox,
  RotateCcw,
  Ban,
  ShieldAlert,
  FileText,
  X,
} from 'lucide-react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase/firebase'
import { COLLECTIONS } from '../../lib/firebase/paths'
import { GlassCard, StatusBadge, PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { toastSuccess, toastError } from '../../components/ui/Toast'
import { useAuth } from '../../contexts/AuthContext'
import type { WalletLedgerEntry, WalletEntryType } from '../../types/domain'

type Tab = 'explorer' | 'trace' | 'webhooks' | 'reconciliation'

// ─── Shared helpers ───────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })
}

function elapsed(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60000) return `${Math.floor(ms / 1000)}s atrás`
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m atrás`
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h atrás`
  return `${Math.floor(ms / 86400000)}d atrás`
}

function amountColor(amount: number) {
  return amount > 0 ? 'text-accent-lime' : 'text-accent-red'
}

function entryTypeTone(t: WalletEntryType): 'green' | 'red' | 'sky' | 'yellow' | 'neutral' | 'violet' {
  if (t.startsWith('EARN') || t === 'ADMIN_CREDIT') return 'green'
  if (t.startsWith('SPEND') || t === 'PAYOUT_REQUEST' || t === 'ADMIN_DEBIT') return 'red'
  if (t.startsWith('RELEASE')) return 'sky'
  if (t.startsWith('REVERSE') || t === 'PAYOUT_REJECTED') return 'yellow'
  return 'neutral'
}

// ─── Shared LedgerRow ─────────────────────────────────────────────────────────

function LedgerRow({ e, onTraceClick }: { e: WalletLedgerEntry; onTraceClick?: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`text-lg font-black tabular-nums w-24 shrink-0 ${amountColor(e.amount)}`}>
          {e.amount > 0 ? '+' : ''}{e.amount.toFixed(e.currency === 'BRL' ? 2 : 0)} {e.currency}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge tone={entryTypeTone(e.entryType)}>{e.entryType}</StatusBadge>
            <StatusBadge tone={e.status === 'CONFIRMED' ? 'green' : e.status === 'PENDING' ? 'yellow' : e.status === 'REVERSED' ? 'red' : 'neutral'}>
              {e.status}
            </StatusBadge>
            {e.holdUntil && new Date(e.holdUntil) > new Date() && (
              <span className="text-[10px] text-amber-400 font-semibold">hold até {fmt(e.holdUntil)}</span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5 truncate">{e.description}</p>
        </div>
        <span className="text-xs text-text-muted shrink-0 hidden sm:block">{elapsed(e.createdAt)}</span>
        {open ? <ChevronDown className="h-4 w-4 text-text-muted shrink-0" /> : <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 border-t border-white/5 pt-3">
          {[
            { k: 'ID', v: e.id },
            { k: 'userId', v: e.userId },
            { k: 'accountType', v: e.accountType },
            { k: 'createdBy', v: e.createdBy },
            { k: 'createdAt', v: fmt(e.createdAt) },
            ...(e.correlationId ? [{ k: 'correlationId', v: e.correlationId }] : []),
            ...(e.referralId ? [{ k: 'referralId', v: e.referralId }] : []),
            ...(e.payoutId ? [{ k: 'payoutId', v: e.payoutId }] : []),
            ...(e.storeRedemptionId ? [{ k: 'storeRedemptionId', v: e.storeRedemptionId }] : []),
            ...(e.relatedEntryId ? [{ k: 'relatedEntryId', v: e.relatedEntryId }] : []),
            ...(e.reversedAt ? [{ k: 'reversedAt', v: fmt(e.reversedAt) }, { k: 'reversedBy', v: e.reversedBy ?? '—' }] : []),
            ...(e.holdUntil ? [{ k: 'holdUntil', v: fmt(e.holdUntil) }] : []),
          ].map(({ k, v }) => (
            <div key={k}>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">{k}</p>
              <p className="text-xs text-text-primary font-mono break-all">{v}</p>
            </div>
          ))}
          {e.correlationId && onTraceClick && (
            <div className="col-span-full mt-2">
              <Button variant="ghost" className="gap-1.5 text-xs h-7 px-3" onClick={() => onTraceClick(e.correlationId!)}>
                <Link2 className="h-3.5 w-3.5" /> Ver trace completo
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: Transaction Explorer
// ═══════════════════════════════════════════════════════════════════════════════

type SearchMode = 'uid' | 'correlationId' | 'billingEventId' | 'payoutId' | 'entryId'

const SEARCH_OPTIONS: { id: SearchMode; label: string; placeholder: string }[] = [
  { id: 'uid', label: 'UID', placeholder: 'Firebase UID do usuário' },
  { id: 'correlationId', label: 'correlationId', placeholder: 'Ex: redeem_abc123' },
  { id: 'billingEventId', label: 'billingEventId', placeholder: 'Ex: payment_12345678_status' },
  { id: 'payoutId', label: 'payoutId', placeholder: 'Doc ID do payout' },
  { id: 'entryId', label: 'entryId', placeholder: 'Doc ID de ledger entry' },
]

function ExplorerTab({ onTraceRequest }: { onTraceRequest: (id: string) => void }) {
  const [mode, setMode] = useState<SearchMode>('uid')
  const [input, setInput] = useState('')
  const [results, setResults] = useState<WalletLedgerEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = async () => {
    const q = input.trim()
    if (!q) return
    setLoading(true)
    setSearched(true)
    setResults([])

    try {
      let entries: WalletLedgerEntry[] = []

      if (mode === 'uid') {
        const snap = await getDocs(
          query(
            collection(db, COLLECTIONS.WALLET_LEDGER),
            where('userId', '==', q),
            orderBy('createdAt', 'desc'),
            limit(100)
          )
        )
        entries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WalletLedgerEntry))
      } else if (mode === 'correlationId') {
        const snap = await getDocs(
          query(
            collection(db, COLLECTIONS.WALLET_LEDGER),
            where('correlationId', '==', q),
            orderBy('createdAt', 'asc')
          )
        )
        entries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WalletLedgerEntry))
      } else if (mode === 'payoutId') {
        const snap = await getDocs(
          query(
            collection(db, COLLECTIONS.WALLET_LEDGER),
            where('payoutId', '==', q),
            orderBy('createdAt', 'asc')
          )
        )
        entries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WalletLedgerEntry))
      } else if (mode === 'billingEventId') {
        // billingEvents are stored as docs — also look for related ledger entries via metadata
        const evSnap = await getDoc(doc(db, COLLECTIONS.BILLING_EVENTS, q))
        if (evSnap.exists()) {
          const ev = evSnap.data() as any
          if (ev.uid) {
            const snap = await getDocs(
              query(
                collection(db, COLLECTIONS.WALLET_LEDGER),
                where('userId', '==', ev.uid),
                where('paymentId', '==', ev.providerEventId ?? q),
                limit(20)
              )
            )
            entries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WalletLedgerEntry))
          }
        }
      } else if (mode === 'entryId') {
        const snap = await getDoc(doc(db, COLLECTIONS.WALLET_LEDGER, q))
        if (snap.exists()) entries = [{ id: snap.id, ...snap.data() } as WalletLedgerEntry]
      }

      setResults(entries)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro na busca.')
    } finally {
      setLoading(false)
    }
  }

  const opt = SEARCH_OPTIONS.find((o) => o.id === mode)!

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <GlassCard className="rounded-card p-4 space-y-3">
        {/* Mode selector */}
        <div className="flex gap-1.5 flex-wrap">
          {SEARCH_OPTIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => { setMode(o.id); setResults([]); setSearched(false) }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                mode === o.id ? 'bg-ec-violet text-white' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder={opt.placeholder}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none font-mono"
          />
          <Button variant="primary" className="gap-1.5 shrink-0" onClick={search} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar
          </Button>
        </div>
      </GlassCard>

      {/* Results */}
      {searched && !loading && (
        <p className="text-xs text-text-muted px-1">
          {results.length === 0 ? 'Nenhum resultado.' : `${results.length} entr${results.length === 1 ? 'ada' : 'adas'} encontradas`}
        </p>
      )}

      <div className="space-y-1.5">
        {results.map((e) => (
          <LedgerRow key={e.id} e={e} onTraceClick={onTraceRequest} />
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: Correlation Trace Viewer
// ═══════════════════════════════════════════════════════════════════════════════

type TraceEvent =
  | { kind: 'ledger'; ts: string; data: WalletLedgerEntry }
  | { kind: 'billing'; ts: string; data: any }
  | { kind: 'payout'; ts: string; data: any }
  | { kind: 'redemption'; ts: string; data: any }

function traceIcon(ev: TraceEvent) {
  if (ev.kind === 'billing') return <Webhook className="h-4 w-4 text-sky-400" />
  if (ev.kind === 'payout') return <ArrowUpRight className="h-4 w-4 text-amber-400" />
  if (ev.kind === 'redemption') return <Activity className="h-4 w-4 text-violet-400" />
  const l = ev.data as WalletLedgerEntry
  if (l.amount > 0) return <ArrowUpRight className="h-4 w-4 text-accent-lime" />
  return <ArrowDownRight className="h-4 w-4 text-accent-red" />
}

function traceSummary(ev: TraceEvent): string {
  if (ev.kind === 'billing') return `Webhook · ${ev.data.eventType ?? ev.data.provider ?? '—'} · ${ev.data.status ?? '—'}`
  if (ev.kind === 'payout') return `Payout R$${Number(ev.data.amount ?? 0).toFixed(2)} · ${ev.data.status ?? '—'}`
  if (ev.kind === 'redemption') return `Resgate ${ev.data.storeItemTitle ?? ev.data.storeItemId ?? '—'} · ${ev.data.status ?? '—'}`
  const l = ev.data as WalletLedgerEntry
  return `${l.entryType} · ${l.amount > 0 ? '+' : ''}${l.amount.toFixed(l.currency === 'BRL' ? 2 : 0)} ${l.currency} · ${l.status}`
}

function TraceTab({ initialCorrelationId }: { initialCorrelationId?: string }) {
  const [cid, setCid] = useState(initialCorrelationId ?? '')
  const [events, setEvents] = useState<TraceEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (initialCorrelationId) { setCid(initialCorrelationId); loadTrace(initialCorrelationId) }
  }, [initialCorrelationId])

  const loadTrace = async (id: string) => {
    if (!id.trim()) return
    setLoading(true)
    setSearched(true)
    const all: TraceEvent[] = []

    try {
      // 1. Ledger entries with this correlationId
      const ledgerSnap = await getDocs(
        query(
          collection(db, COLLECTIONS.WALLET_LEDGER),
          where('correlationId', '==', id),
          orderBy('createdAt', 'asc')
        )
      )
      ledgerSnap.docs.forEach((d) => all.push({ kind: 'ledger', ts: d.data().createdAt, data: { id: d.id, ...d.data() } as WalletLedgerEntry }))

      // 2. billingEvents doc if cid looks like a billingEventId
      const bSnap = await getDoc(doc(db, COLLECTIONS.BILLING_EVENTS, id))
      if (bSnap.exists()) all.push({ kind: 'billing', ts: bSnap.data()?.claimedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(), data: { id: bSnap.id, ...bSnap.data() } })

      // 3. Payout with matching correlationId in metadata (best-effort)
      const payoutSnap = await getDocs(
        query(
          collection(db, COLLECTIONS.INFLUENCER_PAYOUTS),
          where('correlationId', '==', id),
          limit(5)
        )
      )
      payoutSnap.docs.forEach((d) => all.push({ kind: 'payout', ts: d.data().createdAt, data: { id: d.id, ...d.data() } }))

      // 4. Store redemption with matching correlationId
      const rSnap = await getDocs(
        query(
          collection(db, COLLECTIONS.STORE_REDEMPTIONS),
          where('correlationId', '==', id),
          limit(5)
        )
      )
      rSnap.docs.forEach((d) => all.push({ kind: 'redemption', ts: d.data().createdAt, data: { id: d.id, ...d.data() } }))

      // Sort by timestamp ascending
      all.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
      setEvents(all)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao carregar trace.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard className="rounded-card p-4">
        <div className="flex gap-2">
          <input
            value={cid}
            onChange={(e) => setCid(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadTrace(cid)}
            placeholder="correlationId ou billingEventId"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none font-mono"
          />
          <Button variant="primary" className="gap-1.5 shrink-0" onClick={() => loadTrace(cid)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
            Trace
          </Button>
        </div>
      </GlassCard>

      {loading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-text-muted" /></div>}

      {!loading && searched && events.length === 0 && (
        <GlassCard className="rounded-card p-8 text-center">
          <GitBranch className="h-8 w-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-secondary">Nenhum evento encontrado para este ID.</p>
          <p className="text-xs text-text-muted mt-1">Verifique se o correlationId está correto ou se os índices do Firestore estão criados.</p>
        </GlassCard>
      )}

      {events.length > 0 && (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-4 bottom-4 w-px bg-white/10" />
          <div className="space-y-1">
            {events.map((ev, i) => (
              <div key={i} className="flex gap-4 items-start">
                {/* Icon node */}
                <div className="shrink-0 w-10 h-10 rounded-full bg-surface-2 border border-white/10 flex items-center justify-center z-10">
                  {traceIcon(ev)}
                </div>
                {/* Content */}
                <GlassCard className="flex-1 rounded-xl p-3 border-white/5">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-text-primary leading-tight">{traceSummary(ev)}</p>
                    <span className="text-[10px] text-text-muted tabular-nums shrink-0">{fmt(ev.ts)}</span>
                  </div>
                  <p className="text-[10px] text-text-muted font-mono mt-1 truncate">{ev.data.id}</p>
                  {ev.kind === 'ledger' && (ev.data as WalletLedgerEntry).description && (
                    <p className="text-xs text-text-secondary mt-1">{(ev.data as WalletLedgerEntry).description}</p>
                  )}
                </GlassCard>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: Webhook Lifecycle Monitor
// ═══════════════════════════════════════════════════════════════════════════════

interface WebhookDoc {
  id: string
  status?: string
  eventType?: string
  resourceId?: string
  provider?: string
  claimedAt?: any
  processedAt?: string
  failedAt?: string
  error?: string
  note?: string
  normalizedStatus?: string
  amount?: number
  uid?: string
}

const WH_STATUS_TONE: Record<string, 'green' | 'yellow' | 'red' | 'neutral' | 'sky'> = {
  processed: 'green',
  processing: 'yellow',
  failed: 'red',
  dead_lettered: 'red',
}

function WebhooksTab() {
  const [docs, setDocs] = useState<WebhookDoc[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const snap = await getDocs(
        query(
          collection(db, COLLECTIONS.BILLING_EVENTS),
          orderBy('claimedAt', 'desc'),
          limit(150)
        )
      )
      setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WebhookDoc)))
    } catch {
      toastError('Erro ao carregar webhooks.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const now = Date.now()
  const processed = docs.filter((d) => d.status === 'processed')
  const failed = docs.filter((d) => d.status === 'failed')
  // Stuck: status is 'processing' for more than 5 minutes
  const stuck = docs.filter((d) => {
    if (d.status !== 'processing') return false
    const claimedMs = d.claimedAt?.toMillis?.() ?? (d.claimedAt ? new Date(d.claimedAt).getTime() : 0)
    return now - claimedMs > 5 * 60 * 1000
  })

  const metrics = [
    { label: 'Total (últimos 150)', value: docs.length, alert: false },
    { label: 'Processados', value: processed.length, alert: false },
    { label: 'Falhou', value: failed.length, alert: failed.length > 0 },
    { label: 'Travados (>5min)', value: stuck.length, alert: stuck.length > 0 },
  ]

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-text-muted" /></div>

  return (
    <div className="space-y-4">
      {/* Metric row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map(({ label, value, alert }) => (
          <GlassCard key={label} className={`rounded-card p-4 ${alert ? 'border-accent-red/40' : 'border-white/5'}`}>
            <p className={`text-xl font-black ${alert ? 'text-accent-red' : 'text-white'}`}>{value}</p>
            <p className="text-xs text-text-muted mt-0.5">{label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Stuck warning */}
      {stuck.length > 0 && (
        <GlassCard className="rounded-card p-4 border-accent-red/30 flex items-start gap-3">
          <Ban className="h-5 w-5 text-accent-red shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-accent-red">{stuck.length} webhook(s) travado(s) em 'processing'</p>
            <p className="text-xs text-text-muted mt-0.5">
              Pode indicar function timeout, cold-start falho, ou falha silenciosa no handler.
              Estes eventos NÃO serão reprocessados automaticamente — intervenção manual necessária.
            </p>
          </div>
        </GlassCard>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">{docs.length} eventos · ordenados por claimedAt desc</p>
        <Button variant="ghost" className="gap-1.5 text-xs h-8" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </Button>
      </div>

      {/* Event list */}
      <div className="space-y-1.5">
        {docs.map((d) => {
          const isStuck = stuck.some((s) => s.id === d.id)
          const claimedMs = d.claimedAt?.toMillis?.() ?? (d.claimedAt ? new Date(d.claimedAt).getTime() : 0)
          const claimedIso = claimedMs ? new Date(claimedMs).toISOString() : ''

          return (
            <GlassCard key={d.id} className={`rounded-card p-3 flex items-start gap-3 flex-wrap ${isStuck ? 'border-accent-red/40' : 'border-white/5'}`}>
              <div className="flex-1 min-w-[220px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge tone={WH_STATUS_TONE[d.status ?? ''] ?? 'neutral'}>{d.status ?? 'unknown'}</StatusBadge>
                  <span className="text-xs font-semibold text-text-primary">{d.eventType ?? '—'}</span>
                  {d.normalizedStatus && <StatusBadge tone="sky">{d.normalizedStatus}</StatusBadge>}
                  {isStuck && <span className="text-[10px] font-bold text-accent-red uppercase">TRAVADO</span>}
                </div>
                <div className="flex gap-4 mt-1 flex-wrap">
                  <p className="text-[11px] text-text-muted font-mono truncate max-w-[240px]">{d.id}</p>
                  {d.uid && <p className="text-[11px] text-text-muted">uid: {d.uid}</p>}
                  {d.amount !== undefined && <p className="text-[11px] text-text-muted">R$ {Number(d.amount).toFixed(2)}</p>}
                  {d.resourceId && <p className="text-[11px] text-text-muted font-mono">res: {d.resourceId}</p>}
                </div>
                {d.error && <p className="text-[11px] text-accent-red mt-1 truncate">{d.error}</p>}
                {d.note && <p className="text-[11px] text-amber-400 mt-0.5">{d.note}</p>}
              </div>
              <div className="text-right shrink-0">
                {claimedIso && <p className="text-[10px] text-text-muted">{elapsed(claimedIso)}</p>}
                {d.processedAt && <p className="text-[10px] text-accent-lime">{fmt(d.processedAt)}</p>}
                {d.failedAt && <p className="text-[10px] text-accent-red">{fmt(d.failedAt)}</p>}
              </div>
            </GlassCard>
          )
        })}
        {docs.length === 0 && (
          <GlassCard className="rounded-card p-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-accent-lime mx-auto mb-2" />
            <p className="text-sm text-text-secondary">Nenhum evento de webhook registrado.</p>
          </GlassCard>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4: Reconciliation Center + DLQ
// ═══════════════════════════════════════════════════════════════════════════════

interface ReconciliationReport {
  id: string
  ranAt: string
  balanceDiscrepancies?: { uid: string; computed: number; stored: number; delta: number }[]
  stalePayouts?: { id: string; influencerId: string; amount: number; ageHours: number }[]
  releasedHolds?: number
  errors?: string[]
  status: 'ok' | 'warning' | 'error'
}

type DLQSeverity = 'low' | 'medium' | 'high' | 'critical'

type DLQResolutionType =
  | 'informational_resolve'
  | 'replay_executed'
  | 'correction_executed'
  | 'ignored_intentionally'
  | 'fraud_escalation'
  | 'duplicate_suppression'

type DLQReasonCategory =
  | 'false_positive'
  | 'replayed_successfully'
  | 'manual_correction_applied'
  | 'duplicate_event'
  | 'stale_retry'
  | 'operator_error'
  | 'webhook_recovered'
  | 'reconciliation_override'
  | 'fraud_confirmed'
  | 'other'

interface DLQResolution {
  resolvedAt: string
  resolvedBy: { uid: string; email: string }
  resolutionType: DLQResolutionType
  reasonCategory: DLQReasonCategory
  notes: string
  linkedCorrectionEntryId?: string
}

interface DLQEntry {
  id: string
  operation: string
  error: string
  retryCount: number
  severity?: DLQSeverity
  scheduledRetryAt?: string
  createdAt: string
  resolvedAt?: string
  resolution?: DLQResolution
  context?: any
}

const SEVERITY_CONFIG: Record<DLQSeverity, { label: string; color: string; border: string }> = {
  critical: { label: 'CRÍTICO', color: 'text-accent-red', border: 'border-accent-red/50' },
  high:     { label: 'ALTO',    color: 'text-amber-400',  border: 'border-amber-400/40' },
  medium:   { label: 'MÉDIO',   color: 'text-amber-300',  border: 'border-amber-300/30' },
  low:      { label: 'BAIXO',   color: 'text-text-muted', border: 'border-white/5' },
}

function computeSeverity(e: DLQEntry): DLQSeverity {
  if (e.severity) return e.severity
  const op = e.operation.toLowerCase()
  const ageHours = (Date.now() - new Date(e.createdAt).getTime()) / 3_600_000
  if (e.retryCount >= 5 || (op.includes('payout') && e.retryCount >= 2)) return 'critical'
  if (op.includes('wallet') || op.includes('ledger') || e.retryCount >= 3) return 'high'
  if (op.includes('referral') || op.includes('commission') || ageHours > 24) return 'medium'
  return 'low'
}

const RESOLUTION_TYPE_LABELS: Record<DLQResolutionType, string> = {
  informational_resolve:  'Registro informacional',
  replay_executed:        'Replay executado',
  correction_executed:    'Correção financeira aplicada',
  ignored_intentionally:  'Ignorado intencionalmente',
  fraud_escalation:       'Escalado para antifraude',
  duplicate_suppression:  'Evento duplicado suprimido',
}

const REASON_CATEGORY_LABELS: Record<DLQReasonCategory, string> = {
  false_positive:              'Falso positivo',
  replayed_successfully:       'Reprocessado com sucesso',
  manual_correction_applied:   'Correção manual aplicada',
  duplicate_event:             'Evento duplicado',
  stale_retry:                 'Retry obsoleto',
  operator_error:              'Erro do operador',
  webhook_recovered:           'Webhook recuperado',
  reconciliation_override:     'Override de reconciliação',
  fraud_confirmed:             'Fraude confirmada',
  other:                       'Outro',
}

// ─── DLQ Resolution Modal ─────────────────────────────────────────────────────

interface DLQResolutionModalProps {
  entry: DLQEntry
  operatorUid: string
  operatorEmail: string
  onClose: () => void
  onCommit: (resolution: DLQResolution) => Promise<void>
}

function DLQResolutionModal({ entry, operatorUid, operatorEmail, onClose, onCommit }: DLQResolutionModalProps) {
  const [resolutionType, setResolutionType] = useState<DLQResolutionType>('informational_resolve')
  const [reasonCategory, setReasonCategory] = useState<DLQReasonCategory>('false_positive')
  const [notes, setNotes] = useState('')
  const [linkedEntryId, setLinkedEntryId] = useState('')
  const [saving, setSaving] = useState(false)

  const severity = computeSeverity(entry)
  const sev = SEVERITY_CONFIG[severity]
  const needsLinkedEntry = resolutionType === 'correction_executed'

  const canSubmit = notes.trim().length >= 10 && (!needsLinkedEntry || linkedEntryId.trim())

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      const resolution: DLQResolution = {
        resolvedAt: new Date().toISOString(),
        resolvedBy: { uid: operatorUid, email: operatorEmail },
        resolutionType,
        reasonCategory,
        notes: notes.trim(),
        ...(linkedEntryId.trim() ? { linkedCorrectionEntryId: linkedEntryId.trim() } : {}),
      }
      await onCommit(resolution)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0D1520] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-start justify-between gap-3 ${severity === 'critical' ? 'border-accent-red/40 bg-accent-red/10' : severity === 'high' ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/10'}`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className={`h-4 w-4 ${sev.color}`} />
              <span className={`text-[11px] font-black uppercase tracking-widest ${sev.color}`}>
                Severidade {sev.label}
              </span>
            </div>
            <p className="text-sm font-semibold text-text-primary">{entry.operation}</p>
            <p className="text-xs text-accent-red font-mono mt-0.5 truncate max-w-sm">{entry.error}</p>
          </div>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-white transition-colors shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Context */}
        <div className="px-5 py-3 bg-white/[0.02] border-b border-white/5 flex gap-6 text-xs text-text-muted">
          <span><strong className="text-white">{entry.retryCount}</strong> tentativa(s)</span>
          <span>criado <strong className="text-white">{elapsed(entry.createdAt)}</strong></span>
          {entry.scheduledRetryAt && <span>retry em <strong className="text-white">{fmt(entry.scheduledRetryAt)}</strong></span>}
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1.5">
                Tipo de resolução
              </label>
              <select
                value={resolutionType}
                onChange={(e) => setResolutionType(e.target.value as DLQResolutionType)}
                className="w-full rounded-lg border border-white/10 bg-[#0D1520] px-3 py-2 text-sm text-white focus:outline-none focus:border-ec-violet"
              >
                {(Object.keys(RESOLUTION_TYPE_LABELS) as DLQResolutionType[]).map((k) => (
                  <option key={k} value={k}>{RESOLUTION_TYPE_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1.5">
                Categoria da causa
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value as DLQReasonCategory)}
                className="w-full rounded-lg border border-white/10 bg-[#0D1520] px-3 py-2 text-sm text-white focus:outline-none focus:border-ec-violet"
              >
                {(Object.keys(REASON_CATEGORY_LABELS) as DLQReasonCategory[]).map((k) => (
                  <option key={k} value={k}>{REASON_CATEGORY_LABELS[k]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1.5">
              Notas operacionais <span className="text-accent-red">*</span>
              <span className="text-text-muted font-normal normal-case ml-1">(mínimo 10 caracteres)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Descreva o que foi investigado, o impacto financeiro real, e a ação tomada. Essa nota fica permanente no histórico."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-ec-violet resize-none"
            />
            <p className="text-[10px] text-text-muted mt-1">{notes.trim().length}/10 caracteres mínimos</p>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1.5">
              ID da correction entry vinculada
              {needsLinkedEntry && <span className="text-accent-red ml-1">* obrigatório para correção financeira</span>}
            </label>
            <input
              value={linkedEntryId}
              onChange={(e) => setLinkedEntryId(e.target.value)}
              placeholder="Doc ID do walletLedger ou payout de correção"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none font-mono bg-white/5 ${needsLinkedEntry ? 'border-amber-400/40 focus:border-amber-400' : 'border-white/10 focus:border-ec-violet'}`}
            />
          </div>

          {/* Operator */}
          <div className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-text-muted shrink-0" />
            <span className="text-xs text-text-muted">
              Registrado como: <strong className="text-text-primary">{operatorEmail}</strong>
              <span className="ml-2 font-mono text-[10px]">{operatorUid}</span>
            </span>
          </div>

          {/* Warning for high/critical */}
          {(severity === 'critical' || severity === 'high') && (
            <div className="rounded-lg border border-accent-red/30 bg-accent-red/5 px-3 py-2 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-accent-red shrink-0 mt-0.5" />
              <p className="text-xs text-accent-red">
                Resolução de incidente <strong>{sev.label}</strong>. Certifique-se de que o impacto financeiro foi verificado
                e a correction entry (se aplicável) foi linkada antes de confirmar.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-between gap-3 border-t border-white/5 pt-4">
          <Button variant="ghost" className="text-xs h-9" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            className={`gap-2 h-9 text-xs ${!canSubmit ? 'opacity-40 cursor-not-allowed' : ''} ${severity === 'critical' ? 'bg-accent-red hover:bg-red-600 text-white' : 'bg-ec-violet hover:bg-violet-600 text-white'}`}
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
            Confirmar resolução
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Reconciliation Tab ───────────────────────────────────────────────────────

function ReconciliationTab() {
  const { firebaseUser } = useAuth()
  const [reports, setReports] = useState<ReconciliationReport[]>([])
  const [dlq, setDlq] = useState<DLQEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [openReport, setOpenReport] = useState<string | null>(null)
  const [resolvingEntry, setResolvingEntry] = useState<DLQEntry | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rSnap, dSnap] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.RECONCILIATION_REPORTS), orderBy('ranAt', 'desc'), limit(20))),
        getDocs(query(collection(db, COLLECTIONS.DEAD_LETTER_QUEUE), orderBy('createdAt', 'desc'), limit(50))),
      ])
      setReports(rSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ReconciliationReport)))
      setDlq(dSnap.docs.map((d) => ({ id: d.id, ...d.data() } as DLQEntry)))
    } catch {
      toastError('Erro ao carregar reconciliação.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const commitResolution = async (resolution: DLQResolution) => {
    if (!resolvingEntry) return
    try {
      // Write resolution as an immutable nested object + keep resolvedAt at root for queries
      await updateDoc(doc(db, COLLECTIONS.DEAD_LETTER_QUEUE, resolvingEntry.id), {
        resolvedAt: resolution.resolvedAt,
        resolution,
      })
      toastSuccess('Resolução registrada com trilha de auditoria completa.')
      setResolvingEntry(null)
      load()
    } catch {
      toastError('Erro ao registrar resolução.')
      throw new Error('persist_failed')
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-text-muted" /></div>

  const pendingDLQ = dlq.filter((e) => !e.resolvedAt)
  const recentReport = reports[0]

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Último relatório', value: recentReport ? elapsed(recentReport.ranAt) : '—', alert: false },
          { label: 'Discrepâncias', value: recentReport?.balanceDiscrepancies?.length ?? 0, alert: (recentReport?.balanceDiscrepancies?.length ?? 0) > 0 },
          { label: 'Saques travados', value: recentReport?.stalePayouts?.length ?? 0, alert: (recentReport?.stalePayouts?.length ?? 0) > 0 },
          { label: 'DLQ pendente', value: pendingDLQ.length, alert: pendingDLQ.length > 0 },
        ].map(({ label, value, alert }) => (
          <GlassCard key={label} className={`rounded-card p-4 ${alert ? 'border-amber-400/40' : 'border-white/5'}`}>
            <p className={`text-xl font-black ${alert ? 'text-amber-400' : 'text-white'}`}>{value}</p>
            <p className="text-xs text-text-muted mt-0.5">{label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Reconciliation Reports */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Relatórios de Reconciliação</p>
          <Button variant="ghost" className="gap-1.5 text-xs h-7" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
        <div className="space-y-2">
          {reports.length === 0 && (
            <GlassCard className="rounded-card p-6 text-center">
              <Inbox className="h-6 w-6 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Nenhum relatório ainda. O job roda diariamente às 6h.</p>
            </GlassCard>
          )}
          {reports.map((r) => {
            const hasIssues = (r.balanceDiscrepancies?.length ?? 0) > 0 || (r.stalePayouts?.length ?? 0) > 0
            const isOpen = openReport === r.id

            return (
              <GlassCard key={r.id} className={`rounded-card overflow-hidden ${hasIssues ? 'border-amber-400/30' : 'border-white/5'}`}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                  onClick={() => setOpenReport(isOpen ? null : r.id)}
                >
                  {hasIssues
                    ? <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    : <CheckCircle2 className="h-4 w-4 text-accent-lime shrink-0" />
                  }
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-text-primary">{fmt(r.ranAt)}</span>
                    <span className="text-xs text-text-muted ml-3">
                      {r.releasedHolds ?? 0} holds liberados ·{' '}
                      {r.balanceDiscrepancies?.length ?? 0} discrepâncias ·{' '}
                      {r.stalePayouts?.length ?? 0} saques travados
                    </span>
                  </div>
                  <StatusBadge tone={r.status === 'ok' ? 'green' : r.status === 'warning' ? 'yellow' : 'red'}>{r.status}</StatusBadge>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-text-muted shrink-0" /> : <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-4">
                    {(r.balanceDiscrepancies?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-2">Discrepâncias de saldo</p>
                        <div className="space-y-1">
                          {r.balanceDiscrepancies!.map((d) => (
                            <div key={d.uid} className="flex items-center gap-4 text-xs flex-wrap">
                              <span className="font-mono text-text-muted">{d.uid}</span>
                              <span className="text-text-secondary">computado: <strong className="text-white">{d.computed}</strong></span>
                              <span className="text-text-secondary">armazenado: <strong className="text-white">{d.stored}</strong></span>
                              <span className={`font-bold ${Math.abs(d.delta) > 0 ? 'text-accent-red' : 'text-accent-lime'}`}>Δ {d.delta}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(r.stalePayouts?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-2">Saques pendentes há mais de 48h</p>
                        <div className="space-y-1">
                          {r.stalePayouts!.map((p) => (
                            <div key={p.id} className="flex items-center gap-4 text-xs flex-wrap">
                              <span className="font-mono text-text-muted">{p.id}</span>
                              <span className="text-text-secondary">R$ {p.amount.toFixed(2)}</span>
                              <span className="text-amber-400">{p.ageHours}h em fila</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(r.errors?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-accent-red mb-2">Erros do job</p>
                        {r.errors!.map((e, i) => <p key={i} className="text-xs text-accent-red font-mono">{e}</p>)}
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>
            )
          })}
        </div>
      </section>

      {/* Dead Letter Queue */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black uppercase tracking-widest text-text-secondary">
            Dead Letter Queue{pendingDLQ.length > 0 && <span className="ml-2 text-accent-red">({pendingDLQ.length} pendentes)</span>}
          </p>
        </div>
        <div className="space-y-1.5">
          {dlq.length === 0 && (
            <GlassCard className="rounded-card p-6 text-center">
              <CheckCircle2 className="h-6 w-6 text-accent-lime mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Dead letter queue vazia.</p>
            </GlassCard>
          )}
          {dlq.map((e) => {
            const resolved = !!e.resolvedAt
            const severity = computeSeverity(e)
            const sev = SEVERITY_CONFIG[severity]

            return (
              <GlassCard key={e.id} className={`rounded-card overflow-hidden ${resolved ? 'border-white/5 opacity-60' : sev.border}`}>
                <div className="p-3 flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {resolved
                        ? <CheckCircle2 className="h-4 w-4 text-accent-lime shrink-0" />
                        : <XCircle className={`h-4 w-4 shrink-0 ${sev.color}`} />
                      }
                      <span className="text-sm font-semibold text-text-primary">{e.operation}</span>
                      <StatusBadge tone={resolved ? 'green' : severity === 'critical' ? 'red' : severity === 'high' ? 'yellow' : 'neutral'}>
                        {resolved ? 'Resolvido' : sev.label}
                      </StatusBadge>
                      <span className="text-xs text-text-muted">{e.retryCount} tentativa(s)</span>
                    </div>
                    <p className="text-xs text-accent-red font-mono truncate">{e.error}</p>
                    <div className="flex gap-4 mt-1 text-[10px] text-text-muted flex-wrap">
                      <span><Clock className="inline h-3 w-3 mr-0.5" />{elapsed(e.createdAt)}</span>
                      {e.scheduledRetryAt && !resolved && (
                        <span className="text-amber-400">retry em {fmt(e.scheduledRetryAt)}</span>
                      )}
                      {e.resolvedAt && <span className="text-accent-lime">resolvido {elapsed(e.resolvedAt)}</span>}
                    </div>
                  </div>
                  {!resolved && (
                    <Button
                      variant="ghost"
                      className={`text-xs h-8 px-3 gap-1.5 shrink-0 ${severity === 'critical' ? 'text-accent-red hover:bg-accent-red/10' : ''}`}
                      onClick={() => setResolvingEntry(e)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Resolver incidente
                    </Button>
                  )}
                </div>

                {/* Resolution audit trail */}
                {resolved && e.resolution && (
                  <div className="border-t border-white/5 px-3 pb-3 pt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-text-muted">Tipo</p>
                      <p className="text-xs text-text-primary">{RESOLUTION_TYPE_LABELS[e.resolution.resolutionType]}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-text-muted">Causa</p>
                      <p className="text-xs text-text-primary">{REASON_CATEGORY_LABELS[e.resolution.reasonCategory]}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-text-muted">Operador</p>
                      <p className="text-xs text-text-primary truncate">{e.resolution.resolvedBy.email}</p>
                    </div>
                    <div className="col-span-full">
                      <p className="text-[9px] uppercase tracking-wider text-text-muted">Notas</p>
                      <p className="text-xs text-text-secondary">{e.resolution.notes}</p>
                    </div>
                    {e.resolution.linkedCorrectionEntryId && (
                      <div className="col-span-full">
                        <p className="text-[9px] uppercase tracking-wider text-text-muted">Correction entry</p>
                        <p className="text-xs text-text-primary font-mono">{e.resolution.linkedCorrectionEntryId}</p>
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>
            )
          })}
        </div>
      </section>

      {/* Resolution Modal */}
      {resolvingEntry && firebaseUser && (
        <DLQResolutionModal
          entry={resolvingEntry}
          operatorUid={firebaseUser.uid}
          operatorEmail={firebaseUser.email ?? firebaseUser.uid}
          onClose={() => setResolvingEntry(null)}
          onCommit={commitResolution}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Screen
// ═══════════════════════════════════════════════════════════════════════════════

export function AdminAuditDashboard() {
  const [tab, setTab] = useState<Tab>('explorer')
  const [traceTarget, setTraceTarget] = useState<string | undefined>()

  const jumpToTrace = (correlationId: string) => {
    setTraceTarget(correlationId)
    setTab('trace')
  }

  const tabs: { id: Tab; label: string; icon: typeof Search }[] = [
    { id: 'explorer', label: 'Explorer', icon: Search },
    { id: 'trace', label: 'Trace', icon: GitBranch },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'reconciliation', label: 'Reconciliação + DLQ', icon: Activity },
  ]

  return (
    <PageShell className="space-y-6">
      <div>
        <h1 className="font-display text-display-md font-black text-text-primary">Audit Dashboard</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Financial operations console · Transaction explorer · Correlation trace · Webhook lifecycle · Reconciliation
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-pill px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              tab === id ? 'bg-volt-600 text-white' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'explorer' && <ExplorerTab onTraceRequest={jumpToTrace} />}
      {tab === 'trace' && <TraceTab key={traceTarget} initialCorrelationId={traceTarget} />}
      {tab === 'webhooks' && <WebhooksTab />}
      {tab === 'reconciliation' && <ReconciliationTab />}
    </PageShell>
  )
}
