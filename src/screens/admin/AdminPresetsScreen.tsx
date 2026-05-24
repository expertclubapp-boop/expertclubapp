import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Zap, LayoutList, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { AdminToolbar } from './AdminShared'
import { BUILT_IN_TECHNIQUES } from '../../data/workoutTechniques'
import { presetsService } from '../../services/presetsService'
import { toastError } from '../../components/ui/Toast'
import type { WorkoutTechnique, SeriesPreset, WorkoutSetGroup } from '../../types/domain'

// ─── Shared UI ───────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
        active
          ? 'bg-accent-lime text-bg-primary'
          : 'text-text-muted hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1 block">
      {children}
    </label>
  )
}

function FormInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-accent-lime outline-none placeholder:text-white/20"
    />
  )
}

function FormTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-accent-lime outline-none resize-none placeholder:text-white/20"
    />
  )
}

// ─── Techniques Tab ──────────────────────────────────────────────────────────

type TechniqueForm = { name: string; description: string; instructions: string }
const EMPTY_FORM: TechniqueForm = { name: '', description: '', instructions: '' }

function TechniqueCard({
  technique,
  onEdit,
  onDelete,
}: {
  technique: WorkoutTechnique
  onEdit?: () => void
  onDelete?: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-black text-white">{technique.name}</span>
            {technique.isBuiltIn && (
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-accent-lime/10 text-accent-lime border border-accent-lime/20">
                Padrão
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted">{technique.description}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-text-muted hover:text-white"
            title={expanded ? 'Recolher' : 'Ver instruções'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {!technique.isBuiltIn && onEdit && (
            <button onClick={onEdit} className="p-1.5 text-text-muted hover:text-white" title="Editar">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {!technique.isBuiltIn && onDelete && (
            <button onClick={onDelete} className="p-1.5 text-text-muted hover:text-accent-red" title="Excluir">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/8">
          <p className="text-xs text-white/70 leading-relaxed whitespace-pre-line">{technique.instructions}</p>
        </div>
      )}
    </div>
  )
}

function TechniqueFormPanel({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: TechniqueForm
  onSave: (form: TechniqueForm) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<TechniqueForm>(initial ?? EMPTY_FORM)
  const set = (k: keyof TechniqueForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }))
  const valid = form.name.trim() && form.description.trim() && form.instructions.trim()

  return (
    <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-5 space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-accent-lime">
        {initial ? 'Editar Técnica' : 'Nova Técnica'}
      </h3>
      <div>
        <FieldLabel>Nome</FieldLabel>
        <FormInput value={form.name} onChange={set('name')} placeholder="Ex: Drop Set" />
      </div>
      <div>
        <FieldLabel>Descrição curta</FieldLabel>
        <FormInput value={form.description} onChange={set('description')} placeholder="Uma linha explicando o que é" />
      </div>
      <div>
        <FieldLabel>Instruções completas</FieldLabel>
        <FormTextarea
          value={form.instructions}
          onChange={set('instructions')}
          placeholder="Passo a passo da técnica, contexto de uso, dicas..."
          rows={4}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="primary" className="text-xs px-4 py-2" onClick={() => valid && onSave(form)} disabled={!valid || saving}>
          <Check className="w-3 h-3 mr-1" />
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button variant="ghost" className="text-xs px-4 py-2" onClick={onCancel}>
          <X className="w-3 h-3 mr-1" />
          Cancelar
        </Button>
      </div>
    </div>
  )
}

function TechniquesTab() {
  const [customTechniques, setCustomTechniques] = useState<WorkoutTechnique[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<WorkoutTechnique | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    presetsService.listCustomTechniques().then((list) => {
      setCustomTechniques(list)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleCreate(form: TechniqueForm) {
    setSaving(true)
    try {
      const id = await presetsService.createTechnique(form)
      const now = new Date().toISOString()
      setCustomTechniques((prev) => [
        ...prev,
        { id, ...form, isBuiltIn: false, createdAt: now, updatedAt: now },
      ])
      setCreating(false)
    } catch {
      toastError('Erro ao salvar técnica.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(form: TechniqueForm) {
    if (!editing) return
    setSaving(true)
    try {
      await presetsService.updateTechnique(editing.id, form)
      setCustomTechniques((prev) =>
        prev.map((t) => (t.id === editing.id ? { ...t, ...form, updatedAt: new Date().toISOString() } : t))
      )
      setEditing(null)
    } catch {
      toastError('Erro ao atualizar técnica.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta técnica?')) return
    try {
      await presetsService.deleteTechnique(id)
      setCustomTechniques((prev) => prev.filter((t) => t.id !== id))
    } catch {
      toastError('Erro ao excluir técnica.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Built-in */}
      <section>
        <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">
          Técnicas padrão
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {BUILT_IN_TECHNIQUES.map((t) => (
            <TechniqueCard key={t.id} technique={t} />
          ))}
        </div>
      </section>

      {/* Custom */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            Técnicas personalizadas ({customTechniques.length})
          </h2>
          {!creating && !editing && (
            <Button variant="primary" className="text-xs px-4 py-2" onClick={() => setCreating(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Nova técnica
            </Button>
          )}
        </div>

        {creating && (
          <div className="mb-4">
            <TechniqueFormPanel
              onSave={handleCreate}
              onCancel={() => setCreating(false)}
              saving={saving}
            />
          </div>
        )}

        {loading ? (
          <p className="text-sm text-text-muted">Carregando...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {customTechniques.map((t) =>
              editing?.id === t.id ? (
                <div key={t.id}>
                  <TechniqueFormPanel
                    initial={{ name: t.name, description: t.description, instructions: t.instructions }}
                    onSave={handleUpdate}
                    onCancel={() => setEditing(null)}
                    saving={saving}
                  />
                </div>
              ) : (
                <TechniqueCard
                  key={t.id}
                  technique={t}
                  onEdit={() => setEditing(t)}
                  onDelete={() => handleDelete(t.id)}
                />
              )
            )}
          </div>
        )}

        {!loading && customTechniques.length === 0 && !creating && (
          <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center">
            <Zap className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">Nenhuma técnica personalizada criada ainda.</p>
            <p className="text-xs text-text-muted/60 mt-1">Use a metodologia padrão ou crie as suas próprias.</p>
          </div>
        )}
      </section>
    </div>
  )
}

// ─── Series Presets Tab ───────────────────────────────────────────────────────

const EMPTY_GROUP: WorkoutSetGroup = { label: '', sets: 1, reps: '' }

function GroupRow({
  group,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  group: WorkoutSetGroup
  index: number
  onChange: (g: WorkoutSetGroup) => void
  onRemove: () => void
  canRemove: boolean
}) {
  return (
    <div className="flex items-center gap-2 bg-black/40 border border-white/8 rounded-xl p-2">
      <span className="text-[10px] text-text-muted font-black w-4 text-center">{index + 1}</span>
      <input
        type="text"
        value={group.label}
        onChange={(e) => onChange({ ...group, label: e.target.value })}
        placeholder="Nome (ex: Aquecimento)"
        className="flex-1 bg-transparent text-xs text-white placeholder:text-white/20 outline-none"
      />
      <input
        type="number"
        value={group.sets}
        min={1}
        onChange={(e) => onChange({ ...group, sets: Math.max(1, Number(e.target.value)) })}
        className="w-10 bg-black border border-white/10 rounded px-1 py-1 text-xs text-white text-center outline-none"
        title="Séries"
      />
      <span className="text-text-muted text-xs">×</span>
      <input
        type="text"
        value={group.reps}
        onChange={(e) => onChange({ ...group, reps: e.target.value })}
        placeholder="Reps"
        className="w-14 bg-black border border-white/10 rounded px-1 py-1 text-xs text-white text-center outline-none"
      />
      {canRemove && (
        <button onClick={onRemove} className="p-1 text-text-muted hover:text-accent-red">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

function presetSummary(groups: WorkoutSetGroup[]) {
  return groups
    .map((g) => `${g.sets}×${g.reps}${g.label ? ` ${g.label}` : ''}`)
    .join(' + ')
}

function SeriesPresetCard({
  preset,
  onEdit,
  onDelete,
}: {
  preset: SeriesPreset
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white mb-1">{preset.name}</p>
          <p className="text-xs text-text-muted font-mono">{presetSummary(preset.groups)}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 text-text-muted hover:text-white" title="Editar">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-text-muted hover:text-accent-red" title="Excluir">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {preset.groups.map((g, i) => (
          <span
            key={i}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 text-white/60 border border-white/8"
          >
            {g.sets}×{g.reps} {g.label}
          </span>
        ))}
      </div>
    </div>
  )
}

type PresetForm = { name: string; groups: WorkoutSetGroup[] }
const EMPTY_PRESET_FORM: PresetForm = {
  name: '',
  groups: [
    { label: 'Aquecimento', sets: 1, reps: '15' },
    { label: 'Trabalho', sets: 3, reps: '8-12' },
  ],
}

function SeriesPresetFormPanel({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: PresetForm
  onSave: (form: PresetForm) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<PresetForm>(
    initial ?? { name: EMPTY_PRESET_FORM.name, groups: EMPTY_PRESET_FORM.groups.map((g) => ({ ...g })) }
  )

  const updateGroup = (i: number, g: WorkoutSetGroup) =>
    setForm((f) => ({ ...f, groups: f.groups.map((x, idx) => (idx === i ? g : x)) }))
  const addGroup = () =>
    setForm((f) => ({ ...f, groups: [...f.groups, { ...EMPTY_GROUP }] }))
  const removeGroup = (i: number) =>
    setForm((f) => ({ ...f, groups: f.groups.filter((_, idx) => idx !== i) }))

  const valid =
    form.name.trim() &&
    form.groups.length > 0 &&
    form.groups.every((g) => g.label.trim() && g.reps.trim() && g.sets >= 1)

  return (
    <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-5 space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-accent-lime">
        {initial ? 'Editar Preset' : 'Novo Preset de Séries'}
      </h3>
      <div>
        <FieldLabel>Nome do preset</FieldLabel>
        <FormInput
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholder="Ex: Força — 5x5 + Back-off"
        />
      </div>
      <div>
        <FieldLabel>Grupos de séries</FieldLabel>
        <div className="space-y-2">
          {form.groups.map((g, i) => (
            <GroupRow
              key={i}
              group={g}
              index={i}
              onChange={(updated) => updateGroup(i, updated)}
              onRemove={() => removeGroup(i)}
              canRemove={form.groups.length > 1}
            />
          ))}
        </div>
        <button
          onClick={addGroup}
          className="mt-2 text-xs text-text-muted hover:text-accent-lime flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Adicionar grupo
        </button>
      </div>
      {form.groups.length > 0 && form.groups.every((g) => g.reps) && (
        <p className="text-[10px] text-text-muted font-mono border-t border-white/8 pt-3">
          Preview: {presetSummary(form.groups)}
        </p>
      )}
      <div className="flex gap-2 pt-1">
        <Button
          variant="primary"
          className="text-xs px-4 py-2"
          onClick={() => valid && onSave(form)}
          disabled={!valid || saving}
        >
          <Check className="w-3 h-3 mr-1" />
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button variant="ghost" className="text-xs px-4 py-2" onClick={onCancel}>
          <X className="w-3 h-3 mr-1" />
          Cancelar
        </Button>
      </div>
    </div>
  )
}

function SeriesPresetsTab() {
  const [presets, setPresets] = useState<SeriesPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<SeriesPreset | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    presetsService.listSeriesPresets().then((list) => {
      setPresets(list)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleCreate(form: PresetForm) {
    setSaving(true)
    try {
      const id = await presetsService.createSeriesPreset(form)
      const now = new Date().toISOString()
      setPresets((prev) => [...prev, { id, ...form, createdBy: '', createdAt: now, updatedAt: now }])
      setCreating(false)
    } catch {
      toastError('Erro ao salvar preset.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(form: PresetForm) {
    if (!editing) return
    setSaving(true)
    try {
      await presetsService.updateSeriesPreset(editing.id, form)
      setPresets((prev) =>
        prev.map((p) =>
          p.id === editing.id ? { ...p, ...form, updatedAt: new Date().toISOString() } : p
        )
      )
      setEditing(null)
    } catch {
      toastError('Erro ao atualizar preset.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este preset?')) return
    try {
      await presetsService.deleteSeriesPreset(id)
      setPresets((prev) => prev.filter((p) => p.id !== id))
    } catch {
      toastError('Erro ao excluir preset.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          Presets agilizam a prescrição — aplique com um clique no editor de treinos.
        </p>
        {!creating && !editing && (
          <Button variant="primary" className="text-xs px-4 py-2" onClick={() => setCreating(true)}>
            <Plus className="w-3 h-3 mr-1" />
            Novo preset
          </Button>
        )}
      </div>

      {creating && (
        <SeriesPresetFormPanel
          onSave={handleCreate}
          onCancel={() => setCreating(false)}
          saving={saving}
        />
      )}

      {loading ? (
        <p className="text-sm text-text-muted">Carregando...</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {presets.map((p) =>
            editing?.id === p.id ? (
              <div key={p.id} className="md:col-span-2 xl:col-span-3">
                <SeriesPresetFormPanel
                  initial={{ name: p.name, groups: p.groups.map((g) => ({ ...g })) }}
                  onSave={handleUpdate}
                  onCancel={() => setEditing(null)}
                  saving={saving}
                />
              </div>
            ) : (
              <SeriesPresetCard
                key={p.id}
                preset={p}
                onEdit={() => setEditing(p)}
                onDelete={() => handleDelete(p.id)}
              />
            )
          )}
        </div>
      )}

      {!loading && presets.length === 0 && !creating && (
        <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center">
          <LayoutList className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">Nenhum preset criado ainda.</p>
          <p className="text-xs text-text-muted/60 mt-1">
            Ex: 1×15 Aquecimento + 3×8-12 Trabalho + 1×15 Back-off
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Tab = 'techniques' | 'presets'

export function AdminPresetsScreen() {
  const [tab, setTab] = useState<Tab>('techniques')

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <AdminToolbar
        eyebrow="Biblioteca"
        title="Presets & Técnicas"
        description="Gerencie as técnicas de treino e os presets de séries disponíveis na prescrição."
      />

      <div className="flex items-center gap-2 mb-8 border-b border-white/8 pb-4">
        <TabButton
          active={tab === 'techniques'}
          onClick={() => setTab('techniques')}
          icon={Zap}
          label="Técnicas"
        />
        <TabButton
          active={tab === 'presets'}
          onClick={() => setTab('presets')}
          icon={LayoutList}
          label="Presets de Séries"
        />
      </div>

      {tab === 'techniques' ? <TechniquesTab /> : <SeriesPresetsTab />}
    </div>
  )
}
