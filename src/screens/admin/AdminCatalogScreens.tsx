import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Copy, Archive, Eye } from 'lucide-react'
import { PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useAdminDiets } from '../../hooks/admin/useAdminDiets'
import { useAdminWorkouts } from '../../hooks/admin/useAdminWorkouts'
import { useAdminContent } from '../../hooks/admin/useAdminContent'
import { useAdminChallenges } from '../../hooks/admin/useAdminChallenges'
import { useAdminPlans } from '../../hooks/admin/useAdminPlans'
import { useAdminBadges } from '../../hooks/admin/useAdminBadges'
import { adminDietService, createEmptyDiet } from '../../services/adminDietService'
import { adminWorkoutService, createEmptyWorkout } from '../../services/adminWorkoutService'
import { adminContentService, createEmptyContent, getYoutubeEmbedUrl, isValidYoutubeUrl } from '../../services/adminContentService'
import { adminChallengeService, createEmptyChallenge } from '../../services/adminChallengeService'
import { adminBadgeService, createEmptyBadge } from '../../services/adminBadgeService'
import { adminPlanService, createEmptyPlan } from '../../services/adminPlanService'
import { makeId, sanitizeTags } from '../../services/adminCrudService'
import { Badge, Challenge, ExpertContent, Diet, Plan, Workout } from '../../types/domain'
import { AdminSearchFilter, AdminState, AdminToolbar, ConfirmButton, Field, parseJson, StatusSelect, TextArea, TextInput, toJson } from './AdminShared'
import { DietPrescriptor } from './components/DietPrescriptor'
import { WorkoutPrescriptor } from './components/WorkoutPrescriptor'
import { PlanPreviewModal } from './components/PlanPreviewModal'
import { HistoryDrawer } from './components/HistoryDrawer'
import { History, Save, Send, AlertCircle, CheckCircle2 } from 'lucide-react'

type Resource = 'diets' | 'workouts' | 'content' | 'challenges' | 'plans' | 'badges'

const config = {
  diets: { title: 'Dietas', newPath: '/admin/diets/new', editPath: (id: string) => `/admin/diets/${id}` },
  workouts: { title: 'Treinos', newPath: '/admin/workouts/new', editPath: (id: string) => `/admin/workouts/${id}` },
  content: { title: 'Conteúdos', newPath: '/admin/content/new', editPath: (id: string) => `/admin/content/${id}` },
  challenges: { title: 'Desafios', newPath: '/admin/challenges/new', editPath: (id: string) => `/admin/challenges/${id}` },
  plans: { title: 'Planos', newPath: '/admin/plans', editPath: () => '/admin/plans' },
  badges: { title: 'Badges', newPath: '/admin/badges/new', editPath: (id: string) => `/admin/badges/${id}` },
} as const

export function AdminDietsScreen() { const h = useAdminDiets(); return <ResourceList resource="diets" items={h.items} isLoading={h.isLoading} error={h.error} reload={h.reload} /> }
export function AdminWorkoutsScreen() { const h = useAdminWorkouts(); return <ResourceList resource="workouts" items={h.items} isLoading={h.isLoading} error={h.error} reload={h.reload} /> }
export function AdminContentScreen() { const h = useAdminContent(); return <ResourceList resource="content" items={h.items} isLoading={h.isLoading} error={h.error} reload={h.reload} /> }
export function AdminChallengesScreen() { const h = useAdminChallenges(); return <ResourceList resource="challenges" items={h.items} isLoading={h.isLoading} error={h.error} reload={h.reload} /> }
export function AdminBadgesScreen() { const h = useAdminBadges(); return <ResourceList resource="badges" items={h.items} isLoading={h.isLoading} error={h.error} reload={h.reload} /> }
export function AdminPlansScreen() { const h = useAdminPlans(); return <InlinePlanManager items={h.items} isLoading={h.isLoading} error={h.error} reload={h.reload} /> }

function ResourceList<T extends { id: string; title?: string; name?: string; status?: string; updatedAt?: string; createdAt?: string; tags?: string[] }>({ resource, items, isLoading, error, reload }: {
  resource: Resource; items: T[]; isLoading: boolean; error: string | null; reload: () => void
}) {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const actor = { uid: firebaseUser?.uid, email: firebaseUser?.email }

  const filtered = useMemo(() => items.filter(item => {
    const title = item.title || item.name || item.id
    return title.toLowerCase().includes(search.toLowerCase()) && (status === 'all' || item.status === status)
  }), [items, search, status])

  async function duplicate(item: T) {
    const clone = { ...item, id: makeId(resource.slice(0, -1)), title: `${item.title || item.name} (cópia)`, status: 'draft' }
    await serviceFor(resource)!.save(actor, clone as never)
    await reload()
  }

  return (
    <PageShell wide>
      <AdminToolbar title={config[resource].title} eyebrow="CRUD operacional" action={<Button className="md:w-auto" onClick={() => navigate(config[resource].newPath)} icon={<Plus className="h-4 w-4" />}>Novo</Button>} />
      <AdminSearchFilter search={search} onSearch={setSearch} status={status} onStatus={setStatus} />
      <AdminState isLoading={isLoading} error={error} empty={filtered.length === 0}>
        <div className="ec-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>{['Nome', 'Status', 'Tags', 'Atualizado', 'Ações'].map(h => <th key={h} className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td className="p-4"><p className="text-sm font-bold text-white">{item.title || item.name || item.id}</p><p className="text-[10px] text-text-muted">{item.id}</p></td>
                    <td className="p-4 text-xs text-text-secondary">{statusPt(item.status)}</td>
                    <td className="p-4 text-xs text-text-muted">{item.tags?.slice(0, 4).join(', ') || '-'}</td>
                    <td className="p-4 text-xs text-text-muted">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-white" onClick={() => navigate(config[resource].editPath(item.id))}><Eye className="h-4 w-4" /></button>
                        <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-white" onClick={() => duplicate(item)}><Copy className="h-4 w-4" /></button>
                        <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-accent-yellow" onClick={async () => { if (window.confirm('Arquivar este item?')) { await serviceFor(resource)!.archive(actor, item.id); reload() } }}><Archive className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminState>
    </PageShell>
  )
}

export function AdminDietEditorScreen() {
  const { dietId } = useParams()
  return <DietEditor id={dietId} />
}

function DietEditor({ id }: { id?: string }) {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const [item, setItem] = useState<Diet>(createEmptyDiet())
  const [mealsJson, setMealsJson] = useState('[]')
  const [shoppingJson, setShoppingJson] = useState('[]')
  const [versions, setVersions] = useState<Diet[]>([])
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<Diet | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const actor = { uid: firebaseUser?.uid, email: firebaseUser?.email }

  useEffect(() => { 
    if (id && id !== 'new') {
      adminDietService.get(id).then(found => { 
        if (found) { 
          setItem(found)
          setMealsJson(toJson(found.meals))
          setShoppingJson(toJson(found.shoppingList || [])) 
        } 
      }) 
      adminDietService.getVersions(id).then(setVersions)
    } 
  }, [id])


  async function save() {
    setIsSaving(true)
    try {
      const next = { ...item, status: 'draft' as const, meals: parseJson(mealsJson, []), shoppingList: parseJson(shoppingJson, []), mealsPerDay: parseJson(mealsJson, []).length || item.mealsPerDay }
      await adminDietService.save(actor, next)
      setItem(next)
      // No navigate, keep editing draft
    } finally {
      setIsSaving(false)
    }
  }

  async function publish() {
    if (!window.confirm('Deseja publicar esta versão? Ela ficará ativa imediatamente para os alunos.')) return
    setIsSaving(true)
    try {
      const next = { ...item, meals: parseJson(mealsJson, []), shoppingList: parseJson(shoppingJson, []), mealsPerDay: parseJson(mealsJson, []).length || item.mealsPerDay }
      await adminDietService.publish(actor, next)
      navigate('/admin/diets')
    } finally {
      setIsSaving(false)
    }
  }


  return (
    <PageShell wide>
      <AdminToolbar 
        title={item.title || 'Nova dieta'} 
        eyebrow="Editor de dieta" 
        action={
          <div className="flex gap-2">
            <Button variant="ghost" className="w-auto border-white/10" onClick={() => setIsHistoryOpen(true)} icon={<History className="h-4 w-4" />}>Histórico</Button>
            <Button className="md:w-auto" onClick={save} isLoading={isSaving} icon={<Save className="h-4 w-4" />}>Salvar Rascunho</Button>
          </div>
        } 
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="ec-card rounded-2xl p-5 lg:col-span-2 grid gap-4 md:grid-cols-2">
          <Field label="Título"><TextInput value={item.title} onChange={e => setItem({ ...item, title: e.target.value, status: 'draft' })} /></Field>
          <div className="flex flex-col justify-center">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-text-muted">Status do Plano</span>
            <div className="flex items-center gap-3">
              <StatusBadge status={item.status} />
              {item.status === 'published' && <span className="text-[10px] font-bold text-accent-lime uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ativo para alunos</span>}
              {item.status === 'draft' && item.version > 0 && <span className="text-[10px] font-bold text-accent-yellow uppercase flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Alterações Pendentes</span>}
            </div>
          </div>
          <Field label="Objetivo"><select className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white" value={item.goal} onChange={e => setItem({ ...item, goal: e.target.value as never })}><option value="fat_loss">Emagrecimento</option><option value="hypertrophy">Hipertrofia</option><option value="health">Manutenção</option><option value="recomposition">Recomposição</option></select></Field>
          <Field label="Estilo"><select className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white" value={item.style || 'simple'} onChange={e => setItem({ ...item, style: e.target.value as never })}><option value="simple">Simples</option><option value="low_carb">Low Carb</option><option value="intermittent_fasting">Jejum</option><option value="vegetarian">Vegetariana</option><option value="economic">Econômica</option></select></Field>
          <Field label="Calorias"><TextInput type="number" value={item.calories} onChange={e => setItem({ ...item, calories: Number(e.target.value) })} /></Field>
          <Field label="Nível"><select className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white" value={item.level} onChange={e => setItem({ ...item, level: e.target.value as never })}><option value="beginner">Iniciante</option><option value="intermediate">Intermediário</option><option value="advanced">Avançado</option></select></Field>
          <Field label="Proteína"><TextInput type="number" value={item.protein} onChange={e => setItem({ ...item, protein: Number(e.target.value) })} /></Field>
          <Field label="Carboidratos"><TextInput type="number" value={item.carbs} onChange={e => setItem({ ...item, carbs: Number(e.target.value) })} /></Field>
          <Field label="Gordura"><TextInput type="number" value={item.fat} onChange={e => setItem({ ...item, fat: Number(e.target.value) })} /></Field>
          <Field label="Tags"><TextInput value={item.tags.join(', ')} onChange={e => setItem({ ...item, tags: sanitizeTags(e.target.value) })} /></Field>
          <Field label="Observações"><TextArea value={item.notes || ''} onChange={e => setItem({ ...item, notes: e.target.value })} className="min-h-24" /></Field>
          
          <div className="md:col-span-2 mt-8">
            <h3 className="font-display text-2xl font-black uppercase italic text-white mb-6 border-b border-white/5 pb-4">Plano Alimentar</h3>
            <DietPrescriptor 
              diet={item} 
              onChange={updated => {
                setItem(updated)
                setMealsJson(toJson(updated.meals))
              }} 
            />
          </div>
          
          <div className="md:col-span-2 opacity-50 pointer-events-none mt-12">
            <Field label="Debug: Lista de compras JSON (Gerado automaticamente)"><TextArea value={shoppingJson} onChange={e => setShoppingJson(e.target.value)} className="min-h-24 font-mono" /></Field>
          </div>
        </section>
        <aside className="ec-card rounded-2xl p-5">
          <h2 className="font-display text-xl font-bold uppercase italic text-white">Publicação</h2>
          <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-muted">
               <span>Versão Atual</span>
               <span className="text-white">v{item.version}</span>
             </div>
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-muted">
               <span>Última Publicação</span>
               <span className="text-white">{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('pt-BR') : 'Nunca'}</span>
             </div>
          </div>

          <p className="mt-6 text-sm text-text-muted italic">Ao publicar, o rascunho atual substituirá a versão ativa e será notificado aos alunos vinculados.</p>
          
          <div className="mt-6 space-y-3">
            <Button onClick={publish} variant="primary" icon={<Send className="w-4 h-4" />} isLoading={isSaving}>Publicar Agora</Button>
            <Button variant="ghost" onClick={() => { setPreviewData(item); setIsPreviewOpen(true) }} icon={<Eye className="w-4 h-4" />}>Preview aluno</Button>
            <ConfirmButton variant="destructive" message="Excluir dieta definitivamente?" onConfirm={() => adminDietService.remove(actor, item.id).then(() => navigate('/admin/diets'))}>Excluir</ConfirmButton>
          </div>
        </aside>
      </div>

      <PlanPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        type="diet" 
        data={previewData || item} 
      />

      <HistoryDrawer 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        type="diet" 
        versions={versions} 
        onRollback={async (v) => {
          if (window.confirm('Restaurar esta versão como rascunho? Isso não alterará o plano ativo até que você publique.')) {
            await adminDietService.rollback(actor, item.id, v as Diet)
            window.location.reload()
          }
        }}
        onPreview={(v) => {
          setPreviewData(v as Diet)
          setIsPreviewOpen(true)
        }}
      />
    </PageShell>
  )
}

export function AdminWorkoutEditorScreen() {
  const { workoutId } = useParams()
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const [item, setItem] = useState<Workout>(createEmptyWorkout())
  const [daysJson, setDaysJson] = useState('[]')
  const [versions, setVersions] = useState<Workout[]>([])
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<Workout | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const actor = { uid: firebaseUser?.uid, email: firebaseUser?.email }

  useEffect(() => { 
    if (workoutId && workoutId !== 'new') {
      adminWorkoutService.get(workoutId).then(found => { 
        if (found) { 
          setItem(found)
          setDaysJson(toJson(found.days)) 
        } 
      }) 
      adminWorkoutService.getVersions(workoutId).then(setVersions)
    } 
  }, [workoutId])

  async function save() { 
    setIsSaving(true)
    try {
      const next = { ...item, status: 'draft' as const, days: parseJson(daysJson, []) }
      await adminWorkoutService.save(actor, next)
      setItem(next)
    } finally {
      setIsSaving(false)
    }
  }

  async function publish() {
    if (!window.confirm('Deseja publicar esta versão? Ela ficará ativa imediatamente para os alunos.')) return
    setIsSaving(true)
    try {
      const next = { ...item, days: parseJson(daysJson, []) }
      await adminWorkoutService.publish(actor, next)
      navigate('/admin/workouts')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageShell wide>
      <AdminToolbar 
        title={item.title || 'Novo treino'} 
        eyebrow="Editor de treino" 
        action={
          <div className="flex gap-2">
            <Button variant="ghost" className="w-auto border-white/10" onClick={() => setIsHistoryOpen(true)} icon={<History className="h-4 w-4" />}>Histórico</Button>
            <Button className="md:w-auto" onClick={save} isLoading={isSaving} icon={<Save className="h-4 w-4" />}>Salvar Rascunho</Button>
          </div>
        } 
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="ec-card rounded-2xl p-5 lg:col-span-2 grid gap-4 md:grid-cols-2">
          <Field label="Título"><TextInput value={item.title} onChange={e => setItem({ ...item, title: e.target.value, status: 'draft' })} /></Field>
          <div className="flex flex-col justify-center">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-text-muted">Status do Plano</span>
            <div className="flex items-center gap-3">
              <StatusBadge status={item.status} />
              {item.status === 'published' && <span className="text-[10px] font-bold text-accent-lime uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ativo para alunos</span>}
              {item.status === 'draft' && item.version > 0 && <span className="text-[10px] font-bold text-accent-yellow uppercase flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Alterações Pendentes</span>}
            </div>
          </div>
          <Field label="Objetivo"><select className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white" value={item.goal} onChange={e => setItem({ ...item, goal: e.target.value as never })}><option value="hypertrophy">Hipertrofia</option><option value="fat_loss">Emagrecimento</option><option value="recomposition">Recomposição</option><option value="conditioning">Condicionamento</option><option value="health">Saúde</option></select></Field>
          <Field label="Modalidade"><select className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white" value={item.modality || 'bodybuilding'} onChange={e => setItem({ ...item, modality: e.target.value as never })}><option value="bodybuilding">Musculação</option><option value="crossfit">Crossfit</option><option value="functional">Funcional</option><option value="home">Em Casa</option><option value="mixed">Misto</option></select></Field>
          <Field label="Dias por semana"><TextInput type="number" value={item.daysPerWeek} onChange={e => setItem({ ...item, daysPerWeek: Number(e.target.value) })} /></Field>
          <Field label="Tempo por treino"><TextInput type="number" value={item.durationMinutes} onChange={e => setItem({ ...item, durationMinutes: Number(e.target.value) })} /></Field>
          <Field label="Foco"><TextInput value={(item.focus || []).join(', ')} onChange={e => setItem({ ...item, focus: sanitizeTags(e.target.value) })} /></Field>
          <Field label="Tags"><TextInput value={item.tags.join(', ')} onChange={e => setItem({ ...item, tags: sanitizeTags(e.target.value) })} /></Field>
          
          <div className="md:col-span-2 mt-8">
            <h3 className="font-display text-2xl font-black uppercase italic text-white mb-6 border-b border-white/5 pb-4">Planejamento de Treino</h3>
            <WorkoutPrescriptor 
              workout={item} 
              onChange={updated => {
                setItem(updated)
                setDaysJson(toJson(updated.days))
              }} 
            />
          </div>

          <div className="md:col-span-2 opacity-50 pointer-events-none mt-12">
            <Field label="Debug: Dias, exercícios, séries, reps e descanso JSON"><TextArea value={daysJson} onChange={e => setDaysJson(e.target.value)} className="min-h-48 font-mono" /></Field>
          </div>
        </section>
        <aside className="ec-card rounded-2xl p-5">
          <h2 className="font-display text-xl font-bold uppercase italic text-white">Publicação</h2>
          <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-muted">
               <span>Versão Atual</span>
               <span className="text-white">v{item.version}</span>
             </div>
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-muted">
               <span>Última Publicação</span>
               <span className="text-white">{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('pt-BR') : 'Nunca'}</span>
             </div>
          </div>

          <p className="mt-6 text-sm text-text-muted italic">Ao publicar, o rascunho atual substituirá a versão ativa e será notificado aos alunos vinculados.</p>
          
          <div className="mt-6 space-y-3">
            <Button onClick={publish} variant="primary" icon={<Send className="w-4 h-4" />} isLoading={isSaving}>Publicar Agora</Button>
            <Button variant="ghost" onClick={() => { setPreviewData(item); setIsPreviewOpen(true) }} icon={<Eye className="w-4 h-4" />}>Preview aluno</Button>
            <ConfirmButton variant="destructive" message="Excluir treino definitivamente?" onConfirm={() => adminWorkoutService.remove(actor, item.id).then(() => navigate('/admin/workouts'))}>Excluir</ConfirmButton>
          </div>
        </aside>
      </div>

      <PlanPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        type="workout" 
        data={previewData || item} 
      />

      <HistoryDrawer 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        type="workout" 
        versions={versions} 
        onRollback={async (v) => {
          if (window.confirm('Restaurar esta versão como rascunho? Isso não alterará o plano ativo até que você publique.')) {
            await adminWorkoutService.rollback(actor, item.id, v as Workout)
            window.location.reload()
          }
        }}
        onPreview={(v) => {
          setPreviewData(v as Workout)
          setIsPreviewOpen(true)
        }}
      />
    </PageShell>
  )
}

export function AdminContentEditorScreen() {
  const { contentId } = useParams()
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const [item, setItem] = useState<ExpertContent>(createEmptyContent())
  const actor = { uid: firebaseUser?.uid, email: firebaseUser?.email }
  
  useEffect(() => { 
    if (contentId && contentId !== 'new') {
      adminContentService.get(contentId).then(found => found && setItem(found))
    }
  }, [contentId])

  const embedUrl = useMemo(() => getYoutubeEmbedUrl(item.youtubeUrl || ''), [item.youtubeUrl])

  async function save(status?: ExpertContent['status']) { 
    if (item.type === 'youtube' && !isValidYoutubeUrl(item.youtubeUrl || '')) {
      alert('URL do YouTube inválida.')
      return
    }
    const next = { 
      ...item, 
      status: status || item.status, 
      updatedAt: new Date().toISOString(),
      publishedAt: status === 'published' ? new Date().toISOString() : item.publishedAt
    }
    await adminContentService.save(actor, next)
    navigate('/admin/content')
  }

  return (
    <PageShell wide>
      <AdminToolbar 
        title={item.title || 'Novo conteúdo'} 
        eyebrow="Editor de conteúdo" 
        action={<Button className="md:w-auto" onClick={() => save()}>{contentId ? 'Salvar' : 'Criar'}</Button>} 
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="ec-card rounded-2xl p-5 lg:col-span-2 grid gap-4 md:grid-cols-2">
          <Field label="Título"><TextInput value={item.title} onChange={e => setItem({ ...item, title: e.target.value })} /></Field>
          <Field label="Status"><StatusSelect value={item.status} onChange={value => setItem({ ...item, status: value as never })} /></Field>
          <Field label="Categoria">
            <select className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white" value={item.category} onChange={e => setItem({ ...item, category: e.target.value as never })}>
              <option value="nutrition">Nutrição</option>
              <option value="training">Treino</option>
              <option value="mindset">Mindset</option>
              <option value="hormones">Hormônios</option>
              <option value="supplements">Suplementos</option>
              <option value="beginner">Iniciante</option>
              <option value="challenge">Desafio</option>
              <option value="live">Live</option>
              <option value="guide">Guia</option>
            </select>
          </Field>
          <Field label="Tipo">
            <select className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white" value={item.type} onChange={e => setItem({ ...item, type: e.target.value as never })}>
              <option value="youtube">YouTube</option>
              <option value="video">Vídeo (Outro)</option>
              <option value="article">Artigo</option>
              <option value="pdf">PDF</option>
              <option value="live">Live</option>
              <option value="external_link">Link Externo</option>
            </select>
          </Field>
          {item.type === 'youtube' && <Field label="URL YouTube"><TextInput value={item.youtubeUrl || ''} onChange={e => setItem({ ...item, youtubeUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." /></Field>}
          {(item.type === 'external_link' || item.type === 'pdf') && <Field label="URL Externa"><TextInput value={item.externalUrl || ''} onChange={e => setItem({ ...item, externalUrl: e.target.value })} /></Field>}
          <Field label="Thumbnail URL"><TextInput value={item.thumbnailUrl || ''} onChange={e => setItem({ ...item, thumbnailUrl: e.target.value })} /></Field>
          <Field label="Duração (minutos)"><TextInput type="number" value={item.durationMinutes || ''} onChange={e => setItem({ ...item, durationMinutes: Number(e.target.value) })} /></Field>
          <Field label="Destaque"><select className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white" value={item.featured ? 'true' : 'false'} onChange={e => setItem({ ...item, featured: e.target.value === 'true' })}><option value="false">Não</option><option value="true">Sim</option></select></Field>
          <Field label="Tags"><TextInput value={(item.tags || []).join(', ')} onChange={e => setItem({ ...item, tags: sanitizeTags(e.target.value) })} /></Field>
          <div className="md:col-span-2"><Field label="Descrição"><TextArea value={item.description || ''} onChange={e => setItem({ ...item, description: e.target.value })} className="min-h-32" /></Field></div>
          
          {item.type === 'youtube' && embedUrl && (
            <div className="md:col-span-2 mt-4">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-text-muted">Preview do Vídeo</span>
              <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black">
                <iframe src={embedUrl} className="h-full w-full" allowFullScreen title="YouTube Preview" />
              </div>
              <p className="mt-2 text-xs text-text-muted italic">Nota: Vídeos não listados reduzem exposição externa, mas ainda funcionam no app.</p>
            </div>
          )}
        </section>
        <aside className="ec-card rounded-2xl p-5 space-y-3">
          <Button onClick={() => save('published')}>Publicar</Button>
          <Button variant="ghost" onClick={() => navigate(`/app/content`)}>Ver Galeria</Button>
          <ConfirmButton variant="destructive" message="Excluir conteúdo definitivamente?" onConfirm={() => adminContentService.remove(actor, item.id).then(() => navigate('/admin/content'))}>Excluir</ConfirmButton>
        </aside>
      </div>
    </PageShell>
  )
}

export function AdminChallengeEditorScreen() {
  const { challengeId } = useParams()
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const [item, setItem] = useState<Challenge>(createEmptyChallenge())
  const [missionsJson, setMissionsJson] = useState('[]')
  const [rulesJson, setRulesJson] = useState('[]')
  const actor = { uid: firebaseUser?.uid, email: firebaseUser?.email }
  
  useEffect(() => { 
    if (challengeId && challengeId !== 'new') {
      adminChallengeService.get(challengeId).then(found => { 
        if (found) { 
          setItem(found)
          setMissionsJson(toJson(found.missions)) 
          setRulesJson(toJson(found.rules))
        } 
      }) 
    } 
  }, [challengeId])

  async function save(status?: Challenge['status']) { 
    const next = { 
      ...item, 
      status: status || item.status, 
      missions: parseJson(missionsJson, []),
      rules: parseJson(rulesJson, [])
    }
    await adminChallengeService.save(actor, next)
    navigate('/admin/challenges') 
  }

  return (
    <PageShell wide>
      <AdminToolbar 
        title={item.title || 'Novo desafio'} 
        eyebrow="Editor de desafio" 
        action={<Button className="md:w-auto" onClick={() => save()}>{challengeId ? 'Salvar' : 'Criar'}</Button>} 
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="ec-card rounded-2xl p-5 lg:col-span-2 grid gap-4 md:grid-cols-2">
          <Field label="Título"><TextInput value={item.title} onChange={e => setItem({ ...item, title: e.target.value })} /></Field>
          <Field label="Status">
            <select className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white" value={item.status} onChange={e => setItem({ ...item, status: e.target.value as never })}>
              <option value="draft">Rascunho</option>
              <option value="active">Ativo</option>
              <option value="completed">Concluído</option>
              <option value="archived">Arquivado</option>
            </select>
          </Field>
          <Field label="Mês (YYYY-MM)"><TextInput value={item.monthKey} onChange={e => setItem({ ...item, monthKey: e.target.value })} /></Field>
          <Field label="Tema">
            <select className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white" value={item.theme} onChange={e => setItem({ ...item, theme: e.target.value as never })}>
              <option value="consistency">Constância</option>
              <option value="fat_loss">Perda de Gordura</option>
              <option value="hypertrophy">Hipertrofia</option>
              <option value="hydration">Hidratação</option>
              <option value="training">Treino</option>
              <option value="nutrition">Nutrição</option>
              <option value="beginner">Iniciante</option>
            </select>
          </Field>
          <Field label="Início"><TextInput type="datetime-local" value={item.startsAt.slice(0, 16)} onChange={e => setItem({ ...item, startsAt: new Date(e.target.value).toISOString() })} /></Field>
          <Field label="Fim"><TextInput type="datetime-local" value={item.endsAt.slice(0, 16)} onChange={e => setItem({ ...item, endsAt: new Date(e.target.value).toISOString() })} /></Field>
          <Field label="Ranking Habilitado"><select className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white" value={item.rankingEnabled ? 'true' : 'false'} onChange={e => setItem({ ...item, rankingEnabled: e.target.value === 'true' })}><option value="true">Sim</option><option value="false">Não</option></select></Field>
          <Field label="Badges (IDs separados por vírgula)"><TextInput value={item.badges.join(', ')} onChange={e => setItem({ ...item, badges: sanitizeTags(e.target.value) })} /></Field>
          <div className="md:col-span-2"><Field label="Descrição"><TextArea value={item.description} onChange={e => setItem({ ...item, description: e.target.value })} className="min-h-24" /></Field></div>
          <div className="md:col-span-2"><Field label="Regras (Array JSON)"><TextArea value={rulesJson} onChange={e => setRulesJson(e.target.value)} className="min-h-24 font-mono" /></Field></div>
          <div className="md:col-span-2"><Field label="Missões JSON (Array de ChallengeMission)"><TextArea value={missionsJson} onChange={e => setMissionsJson(e.target.value)} className="min-h-72 font-mono" /></Field></div>
        </section>
        <aside className="ec-card rounded-2xl p-5 space-y-3">
          <Button onClick={() => save('active')}>Ativar Desafio</Button>
          <Button variant="ghost" onClick={() => navigate('/app/challenges')}>Ver Desafios</Button>
          <ConfirmButton variant="destructive" message="Excluir desafio?" onConfirm={() => adminChallengeService.remove(actor, item.id).then(() => navigate('/admin/challenges'))}>Excluir</ConfirmButton>
        </aside>
      </div>
    </PageShell>
  )
}

export function AdminBadgeEditorScreen() {
  const { badgeId } = useParams()
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const [item, setItem] = useState<Badge>(createEmptyBadge())
  const actor = { uid: firebaseUser?.uid, email: firebaseUser?.email }
  
  useEffect(() => { if (badgeId && badgeId !== 'new') adminBadgeService.get(badgeId).then(found => found && setItem(found)) }, [badgeId])
  
  async function save() { 
    await adminBadgeService.save(actor, { ...item, updatedAt: new Date().toISOString() })
    navigate('/admin/badges') 
  }

  return (
    <PageShell wide>
      <AdminToolbar title={item.title || 'Nova badge'} eyebrow="Editor de badge" action={<Button className="md:w-auto" onClick={() => save()}>{badgeId ? 'Salvar' : 'Criar'}</Button>} />
      <section className="ec-card rounded-2xl p-5 grid gap-4 md:grid-cols-2">
        <Field label="Título"><TextInput value={item.title} onChange={e => setItem({ ...item, title: e.target.value })} /></Field>
        <Field label="Status"><select className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white" value={item.status} onChange={e => setItem({ ...item, status: e.target.value as never })}><option value="active">Ativa</option><option value="inactive">Inativa</option></select></Field>
        <Field label="Ícone/Emoji"><TextInput value={item.icon} onChange={e => setItem({ ...item, icon: e.target.value })} /></Field>
        <Field label="Raridade">
          <select className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white" value={item.rarity} onChange={e => setItem({ ...item, rarity: e.target.value as never })}>
            <option value="common">Comum</option>
            <option value="rare">Rara</option>
            <option value="epic">Épica</option>
            <option value="legendary">Lendária</option>
          </select>
        </Field>
        <Field label="Tipo de Critério">
          <select className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white" value={item.criteriaType} onChange={e => setItem({ ...item, criteriaType: e.target.value as never })}>
            <option value="manual">Manual</option>
            <option value="challenge_points">Pontos de Desafio</option>
            <option value="streak">Streak (Dias seguidos)</option>
            <option value="workout_count">Total de Treinos</option>
            <option value="diet_adherence">Aderência à Dieta</option>
            <option value="content_completed">Conteúdos Assistidos</option>
          </select>
        </Field>
        <Field label="Valor do Critério"><TextInput type="number" value={item.criteriaValue} onChange={e => setItem({ ...item, criteriaValue: Number(e.target.value) })} /></Field>
        <div className="md:col-span-2"><Field label="Descrição"><TextArea value={item.description} onChange={e => setItem({ ...item, description: e.target.value })} className="min-h-24" /></Field></div>
        <ConfirmButton variant="destructive" message="Excluir badge?" onConfirm={() => adminBadgeService.remove(actor, item.id).then(() => navigate('/admin/badges'))}>Excluir</ConfirmButton>
      </section>
    </PageShell>
  )
}


function InlinePlanManager({ items, isLoading, error, reload }: { items: Plan[]; isLoading: boolean; error: string | null; reload: () => void }) {
  return <InlineManager title="Planos" items={items} isLoading={isLoading} error={error} reload={reload} createEmpty={createEmptyPlan} service={adminPlanService} fields={['name','slug','price','status','trialDays','mercadoPagoPlanId','mercadoPagoPreapprovalPlanId','features']} />
}

function InlineManager({ title, items, isLoading, error, reload, createEmpty, service, fields }: any) {
  const { firebaseUser } = useAuth()
  const [draft, setDraft] = useState<any>(createEmpty())
  const [search, setSearch] = useState('')
  const actor = { uid: firebaseUser?.uid, email: firebaseUser?.email }
  const filtered = items.filter((i: any) => (i.name || i.title || i.slug || i.id).toLowerCase().includes(search.toLowerCase()))
  const update = (key: string, value: string) => {
    if (key === 'protein' || key === 'carbs' || key === 'fat') setDraft({ ...draft, macros: { ...draft.macros, [key]: Number(value) } })
    else if (key === 'features' || key === 'muscleGroups') setDraft({ ...draft, [key]: sanitizeTags(value) })
    else if (['kcal','price','trialDays','sets','restSeconds'].includes(key)) setDraft({ ...draft, [key]: Number(value) })
    else setDraft({ ...draft, [key]: value })
  }
  return (
    <PageShell wide>
      <AdminToolbar title={title} eyebrow="CRUD operacional" />
      <section className="ec-card mb-6 rounded-2xl p-5">
        <h2 className="mb-4 font-display text-xl font-bold uppercase italic text-white">Criar ou editar</h2>
        <div className="grid gap-3 md:grid-cols-4">
          {fields.map((field: string) => <Field key={field} label={label(field)}><TextInput value={valueFor(draft, field)} onChange={e => update(field, e.target.value)} /></Field>)}
        </div>
        <div className="mt-4 flex gap-3"><Button className="w-auto" onClick={async () => { await service.save(actor, draft); setDraft(createEmpty()); reload() }}>Salvar</Button><Button variant="ghost" className="w-auto" onClick={() => setDraft(createEmpty())}>Limpar</Button></div>
      </section>
      <AdminSearchFilter search={search} onSearch={setSearch} />
      <AdminState isLoading={isLoading} error={error} empty={filtered.length === 0}>
        <div className="grid gap-3">
          {filtered.map((item: any) => <div key={item.id} className="ec-card flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-bold text-white">{item.name || item.title}</p><p className="text-xs text-text-muted">{item.category || item.status || item.slug}</p></div><div className="flex gap-2"><Button variant="ghost" className="w-auto" onClick={() => setDraft(item)}>Editar</Button><ConfirmButton variant="destructive" message="Arquivar item?" onConfirm={() => service.archive(actor, item.id).then(reload)}>Arquivar</ConfirmButton></div></div>)}
        </div>
      </AdminState>
    </PageShell>
  )
}

function serviceFor(resource: Resource) {
  return { diets: adminDietService, workouts: adminWorkoutService, content: adminContentService, challenges: adminChallengeService, plans: adminPlanService, badges: adminBadgeService }[resource]
}

function StatusBadge({ status }: { status?: string }) {
  const colors = {
    draft: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20',
    published: 'bg-accent-lime/10 text-accent-lime border-accent-lime/20',
    archived: 'bg-text-muted/10 text-text-muted border-text-muted/20',
    active: 'bg-accent-lime/10 text-accent-lime border-accent-lime/20',
    inactive: 'bg-text-muted/10 text-text-muted border-text-muted/20'
  }
  const color = colors[status as keyof typeof colors] || colors.draft
  return (
    <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${color}`}>
      {statusPt(status)}
    </span>
  )
}

function statusPt(status?: string) { return ({ draft: 'Rascunho', published: 'Publicado', active: 'Ativo', inactive: 'Inativo', archived: 'Arquivado' } as Record<string,string>)[status || ''] || '-' }
function label(key: string) { return ({ name:'Nome', category:'Categoria', basePortion:'Porção', kcal:'Calorias', protein:'Proteína', carbs:'Carboidrato', fat:'Gordura', substitutionGroup:'Grupo de substituição', status:'Status', muscleGroups:'Grupos musculares', modality:'Modalidade', equipment:'Equipamento', level:'Nível', sets:'Séries', reps:'Reps', restSeconds:'Descanso', videoUrl:'Vídeo URL', slug:'Slug', price:'Preço', trialDays:'Dias teste', mercadoPagoPlanId:'ID Mercado Pago', mercadoPagoPreapprovalPlanId:'ID recorrência', features:'Benefícios' } as Record<string,string>)[key] || key }
function valueFor(item: any, key: string) { if (['protein','carbs','fat'].includes(key)) return item.macros?.[key] ?? ''; if (Array.isArray(item[key])) return item[key].join(', '); return item[key] ?? '' }
