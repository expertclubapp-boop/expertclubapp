import { useEffect, useMemo, useState, useCallback } from 'react'
import { Download, WalletCards, ShieldAlert, Pin, ShieldCheck, EyeOff, Trash2 } from 'lucide-react'
import { PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useAdminCommunity } from '../../hooks/admin/useAdminCommunity'
import { adminCommunityService } from '../../services/adminCommunityService'
import { adminAuditLogService } from '../../services/adminAuditLogService'
import { adminCommissionService } from '../../services/adminCommissionService'
import { adminAffiliateService } from '../../services/adminAffiliateService'
import { communityFeedService } from '../../services/communityFeedService'
import type { AffiliatePayout, AuditLog, CommunityPost } from '../../types/domain'
import { AdminSearchFilter, AdminState, AdminToolbar, Field, TextArea, TextInput } from './AdminShared'

// ════════════════════════════════════════════════════
// MODERATION PANEL
// ════════════════════════════════════════════════════
export function AdminCommunityScreen() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('') // 'published', 'hidden', 'deleted', 'reported'

  const reload = useCallback(() => {
    setIsLoading(true)
    communityFeedService.getAllPostsForAdmin(100).then(setPosts).finally(() => setIsLoading(false))
  }, [])

  useEffect(() => { reload() }, [reload])

  const filtered = useMemo(() => {
    return posts.filter(p => {
      const matchSearch = `${p.authorName} ${p.content} ${p.id}`.toLowerCase().includes(search.toLowerCase())
      const matchFilter = 
        filter === 'reported' ? (p.reportCount && p.reportCount > 0) :
        filter ? p.status === filter : true
      return matchSearch && matchFilter
    })
  }, [posts, search, filter])

  const handleAction = async (action: () => Promise<void>) => {
    await action()
    reload()
  }

  return (
    <PageShell wide>
      <AdminToolbar title="Moderação" eyebrow="Comunidade" description="Modere publicações, fixe avisos e oculte posts indevidos." />
      
      <AdminSearchFilter 
        search={search} onSearch={setSearch} 
        status={filter} onStatus={setFilter} 
        statuses={[['', 'Todos'], ['published', 'Publicados'], ['hidden', 'Ocultos'], ['reported', 'Denunciados']]} 
      />
      
      <AdminState isLoading={isLoading} empty={filtered.length === 0}>
        <div className="grid gap-3">
          {filtered.map(p => (
            <div key={p.id} className={`ec-card flex flex-col gap-3 rounded-2xl p-4 border ${p.reportCount ? 'border-accent-red/30' : 'border-white/5'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-sm">{p.authorName}</span>
                    {p.isOfficial && <span className="bg-ec-violet/20 text-ec-violet text-[10px] font-black px-1.5 py-0.5 rounded uppercase">Oficial</span>}
                    {p.isPinned && <span className="bg-accent-yellow/20 text-accent-yellow text-[10px] font-black px-1.5 py-0.5 rounded uppercase">Fixado</span>}
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${p.status === 'published' ? 'bg-accent-lime/10 text-accent-lime' : 'bg-text-muted/10 text-text-muted'}`}>{p.status}</span>
                    {p.reportCount ? <span className="text-accent-red text-xs font-bold flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> {p.reportCount} denúncias</span> : null}
                  </div>
                  <p className="text-xs text-text-secondary mt-2 line-clamp-2">{p.content}</p>
                </div>
                
                {/* Actions */}
                <div className="flex flex-col gap-2 items-end shrink-0">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" className="px-3 h-8 text-xs" onClick={() => handleAction(() => communityFeedService.pinPost(p.id, !p.isPinned))} icon={<Pin className="w-3 h-3"/>}>{p.isPinned ? 'Desfixar' : 'Fixar'}</Button>
                    <Button variant="ghost" className="px-3 h-8 text-xs" onClick={() => handleAction(() => communityFeedService.setOfficialPost(p.id, !p.isOfficial))} icon={<ShieldCheck className="w-3 h-3"/>}>{p.isOfficial ? 'Remover Selo' : 'Selo Oficial'}</Button>
                  </div>
                  <div className="flex items-center gap-1">
                    {p.status !== 'hidden' && <Button variant="ghost" className="px-3 h-8 text-xs text-orange-400 hover:bg-orange-400/10" onClick={() => handleAction(() => communityFeedService.hidePost(p.id))} icon={<EyeOff className="w-3 h-3"/>}>Ocultar</Button>}
                    {p.status !== 'deleted' && <Button variant="ghost" className="px-3 h-8 text-xs text-accent-red hover:bg-accent-red/10" onClick={() => handleAction(() => communityFeedService.deletePost(p.id))} icon={<Trash2 className="w-3 h-3"/>}>Deletar</Button>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminState>
    </PageShell>
  )
}

// ════════════════════════════════════════════════════
// SETTINGS PANEL
// ════════════════════════════════════════════════════
export function AdminSettingsScreen() {
  const { firebaseUser } = useAuth()
  const { settings, isLoading, error, reload } = useAdminCommunity()
  const [draft, setDraft] = useState(settings)
  const actor = { uid: firebaseUser?.uid, email: firebaseUser?.email }
  useEffect(() => setDraft(settings), [settings])

  return (
    <PageShell wide>
      <AdminToolbar title="Comunidade" eyebrow="Configurações" description="Links, suporte, regras e boas-vindas que aparecem no app do aluno." />
      <AdminState isLoading={isLoading} error={error} empty={!draft}>
        {draft && (
          <section className="ec-card rounded-2xl p-5 grid gap-4 md:grid-cols-2">
            <Field label="Link WhatsApp"><TextInput value={draft.whatsappGroupUrl} onChange={e => setDraft({ ...draft, whatsappGroupUrl: e.target.value })} /></Field>
            <Field label="Link suporte"><TextInput value={draft.supportUrl} onChange={e => setDraft({ ...draft, supportUrl: e.target.value })} /></Field>
            <Field label="Instagram"><TextInput value={draft.instagramUrl} onChange={e => setDraft({ ...draft, instagramUrl: e.target.value })} /></Field>
            <Field label="Status"><select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as never })} className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white"><option value="active">Ativa</option><option value="inactive">Inativa</option></select></Field>
            <div className="md:col-span-2"><Field label="Texto de boas-vindas"><TextArea value={draft.welcomeText} onChange={e => setDraft({ ...draft, welcomeText: e.target.value })} className="min-h-28" /></Field></div>
            <div className="md:col-span-2"><Field label="Regras, uma por linha"><TextArea value={draft.rules.join('\n')} onChange={e => setDraft({ ...draft, rules: e.target.value.split('\n').filter(Boolean) })} className="min-h-36" /></Field></div>
            <Button className="md:w-auto" onClick={() => adminCommunityService.save(actor, draft).then(reload)}>Salvar comunidade</Button>
          </section>
        )}
      </AdminState>
    </PageShell>
  )
}

// ════════════════════════════════════════════════════
// AUDIT LOGS
// ════════════════════════════════════════════════════
export function AdminAuditLogsScreen() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [targetType, setTargetType] = useState('')

  useEffect(() => {
    adminAuditLogService.list(targetType ? { targetType } : undefined).then(setLogs).finally(() => setIsLoading(false))
  }, [targetType])

  const filtered = useMemo(() => logs.filter(log => `${log.actorEmail} ${log.action} ${log.targetType} ${log.targetId}`.toLowerCase().includes(search.toLowerCase())), [logs, search])
  return (
    <PageShell wide>
      <AdminToolbar title="Auditoria" eyebrow="Segurança" description="Histórico append-only de ações administrativas." />
      <AdminSearchFilter search={search} onSearch={setSearch} status={targetType} onStatus={setTargetType} statuses={[['', 'Todos'], ['user', 'Usuários'], ['subscription', 'Assinaturas'], ['diet', 'Dietas'], ['workout', 'Treinos'], ['content', 'Conteúdos'], ['challenge', 'Desafios'], ['payout', 'Pagamentos'], ['affiliate', 'Afiliadas']]} />
      <AdminState isLoading={isLoading} empty={filtered.length === 0}>
        <div className="ec-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="border-b border-white/10 bg-white/5"><tr>{['Quem', 'Ação', 'Alvo', 'Antes/depois', 'Data'].map(h => <th key={h} className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(log => <tr key={log.id}><td className="p-4 text-xs text-white">{log.actorEmail}</td><td className="p-4 text-xs text-text-secondary">{log.action}</td><td className="p-4 text-xs text-text-muted">{log.targetType} · {log.targetId}</td><td className="p-4 text-[10px] text-text-muted">{summarize(log.after)}</td><td className="p-4 text-xs text-text-muted">{String(log.createdAt)}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </AdminState>
    </PageShell>
  )
}

// ════════════════════════════════════════════════════
// PAYOUTS
// ════════════════════════════════════════════════════
export function AdminPayoutsScreen() {
  const { firebaseUser } = useAuth()
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const actor = { uid: firebaseUser?.uid, email: firebaseUser?.email }
  const reload = () => adminCommissionService.listPayouts().then(setPayouts).finally(() => setIsLoading(false))
  useEffect(() => { reload() }, [])
  const filtered = payouts.filter(p => `${p.affiliateId} ${p.status} ${p.id}`.toLowerCase().includes(search.toLowerCase()))
  const exportCsv = () => {
    const csv = ['id,affiliateId,amount,status,createdAt', ...filtered.map(p => `${p.id},${p.affiliateId},${p.amount},${p.status},${p.createdAt}`)].join('\n')
    navigator.clipboard
      .writeText(csv)
      .then(() => setCopyStatus('CSV copiado para a area de transferencia.'))
      .catch(() => setCopyStatus('Nao foi possivel copiar o CSV.'))
  }
  return (
    <PageShell wide>
      <AdminToolbar title="Pagamentos" eyebrow="Financeiro" action={<Button className="md:w-auto" variant="ghost" onClick={exportCsv} icon={<Download className="h-4 w-4" />}>Exportar CSV</Button>} />
      {copyStatus && (
        <p className="mb-4 rounded-xl border border-accent-sky/20 bg-accent-sky/10 px-4 py-3 text-sm font-bold text-accent-sky">
          {copyStatus}
        </p>
      )}
      <AdminSearchFilter search={search} onSearch={setSearch} />
      <AdminState isLoading={isLoading} empty={filtered.length === 0}>
        <div className="grid gap-3">
          {filtered.map(p => (
            <div key={p.id} className="ec-card flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3"><WalletCards className="h-5 w-5 text-accent-lime" /><div><p className="font-bold text-white">R$ {p.amount.toFixed(2)}</p><p className="text-xs text-text-muted">{p.affiliateId} · {p.id}</p></div></div>
              <div className="flex items-center gap-3"><span className="text-xs font-bold uppercase text-text-muted">{paymentStatusPt(p.status)}</span>{p.status === 'pending' && <Button className="w-auto" onClick={() => adminAffiliateService.markPayoutPaid(actor, p.id).then(reload)}>Marcar pago</Button>}</div>
            </div>
          ))}
        </div>
      </AdminState>
    </PageShell>
  )
}

function summarize(value: unknown) {
  if (!value) return '-'
  const text = JSON.stringify(value)
  return text.length > 140 ? `${text.slice(0, 140)}...` : text
}

function paymentStatusPt(status: string) {
  return ({ pending: 'Pendente', paid: 'Pago', failed: 'Falhou', cancelled: 'Cancelado' } as Record<string, string>)[status] || status
}
