import { 
  User as UserIcon, Star, TrendingUp, Trophy, Award, Target, Dumbbell, 
  Utensils, Droplets, Calendar, Ruler, Weight, MapPin,
  Bell, HelpCircle, Headphones, CreditCard,
  LogOut, ChevronRight, Edit3, ShieldCheck
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { useSubscription } from '../../hooks/useSubscription'
import { useWorkout } from '../../hooks/useWorkouts'
import { useDiet } from '../../hooks/useDiets'
import { PageShell } from '../../components/ui/Premium'
import { profileService } from '../../services/profileService'
import { FormInput } from '../../components/ui/FormInput'
import { Button as UIButton } from '../../components/ui/Button'
import { useState } from 'react'
import { motion } from 'framer-motion'

export function ProfileSettingsScreen() {
  const navigate = useNavigate()
  const { user: authUser, logout } = useAuth()
  const { profile } = useProfile()
  const { subscription } = useSubscription()
  const { workout } = useWorkout(profile?.selectedWorkoutId)
  const { diet } = useDiet(profile?.selectedDietId)

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false)
  const [formData, setFormData] = useState({
    displayName: authUser?.displayName || '',
    weight: profile?.weight || 0,
    height: profile?.height || 0,
    goal: profile?.goal || 'hypertrophy',
    photoURL: authUser?.photoURL || ''
  })

  const handleLogout = () => {
    if (!isConfirmingLogout) {
      setIsConfirmingLogout(true)
      return
    }
    logout()
  }

  const handleSave = async () => {
    if (!authUser) return
    setIsSaving(true)
    setProfileFeedback(null)
    try {
      await profileService.updateProfile(authUser.uid, {
        weight: Number(formData.weight),
        height: Number(formData.height),
        goal: formData.goal as any
      })
      setIsEditing(false)
      setProfileFeedback({ type: 'success', message: 'Perfil atualizado com sucesso.' })
    } catch (error) {
      console.error(error)
      setProfileFeedback({ type: 'error', message: 'Erro ao salvar perfil. Revise os dados e tente novamente.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageShell className="!max-w-[520px] pb-32">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-display text-heading-3 text-text-primary uppercase italic">Perfil</h1>
        <button 
          onClick={() => {
            setFormData({
              displayName: authUser?.displayName || '',
              weight: profile?.weight || 0,
              height: profile?.height || 0,
              goal: profile?.goal || 'hypertrophy',
              photoURL: authUser?.photoURL || ''
            })
            setIsEditing(true)
          }}
          className="ec-glass rounded-lg px-4 py-2 text-text-muted text-xs font-bold flex items-center gap-2 hover:text-white transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          Editar Perfil
        </button>
      </header>

      {/* Profile Hero Card */}
      <div className="ec-card rounded-card p-6 flex flex-col items-center text-center mb-4 relative overflow-hidden">
        {/* Avatar */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full border-2 border-ec-violet/30 overflow-hidden bg-bg-primary flex items-center justify-center">
            {authUser?.photoURL ? (
              <img src={authUser.photoURL} alt={authUser.displayName} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-10 h-10 text-text-disabled" />
            )}
          </div>
          <div className="absolute bottom-1 right-1 w-6 h-6 bg-ec-violet rounded-full flex items-center justify-center border-2 border-bg-primary">
            <Star className="w-3 h-3 text-white fill-current" />
          </div>
        </div>

        <h2 className="font-display text-heading-2 text-text-primary mb-1 uppercase italic leading-tight">
          {authUser?.displayName || 'Usuário'}
        </h2>
        <p className="text-sm text-text-muted mb-4">{authUser?.email || 'email@exemplo.com'}</p>

        {/* Achievement Badges */}
        <div className="flex gap-2 flex-wrap justify-center mb-6">
          <Badge color="violet" className="text-[10px]">
            <TrendingUp className="w-3 h-3 mr-1 fill-current" /> 8 dias streak
          </Badge>
          <Badge color="purple" className="text-[10px]">
            <Award className="w-3 h-3 mr-1 fill-current" /> Nível 12
          </Badge>
          <Badge color="sky" className="text-[10px]">
             Membro {subscription?.planId === 'founder_trial' ? 'PRO' : 'FREE'}
          </Badge>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 w-full">
          <StatBox val="--" lbl="Treinos" color="violet" />
          <StatBox val="--" lbl="Check-ins" />
          <StatBox val="--" lbl="XP Total" color="purple" />
          <StatBox val="--" lbl="Desafios" color="violet" />
        </div>
      </div>

      {/* Plan Card */}
      <div className="ec-card ec-highlight-ring rounded-2xl p-4 flex items-center gap-4 mb-8">
        <div className="w-11 h-11 bg-ec-violet/15 rounded-xl flex items-center justify-center shrink-0">
          <Award className="w-6 h-6 text-ec-violet fill-current" />
        </div>
        <div className="flex-1">
          <h4 className="font-display text-sm font-bold text-text-primary uppercase">{subscription?.planName || 'Assinatura Expert'}</h4>
          <p className="text-[11px] text-text-muted font-medium">Expira em: {subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString('pt-BR') : '--'}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/app/billing')}
          className="bg-ec-violet/12 border border-ec-violet/22 text-ec-violet text-[11px] font-bold rounded-lg px-4 py-2 uppercase tracking-widest hover:bg-ec-violet/20 transition-all"
        >
          Gerenciar
        </button>
      </div>

      {/* Program Settings */}
      <div className="mb-8">
        <label className="block text-[11px] font-bold text-text-muted tracking-widest uppercase mb-3 px-1">Meu Programa</label>
        <div className="ec-card rounded-2xl p-2">
          <SettingsRow 
            icon={<Target className="w-4 h-4" />} 
            label="Objetivo Atual" 
            value={profile?.goal || '--'} 
            color="violet" 
          />
          <SettingsDivider />
          <SettingsRow 
            icon={<Dumbbell className="w-4 h-4" />} 
            label="Treino Selecionado" 
            value={workout?.title || 'Selecione'} 
            color="sky" 
          />
          <SettingsDivider />
          <SettingsRow 
            icon={<Utensils className="w-4 h-4" />} 
            label="Dieta Selecionada" 
            value={diet?.title || 'Selecione'} 
            color="violet" 
          />
          <SettingsDivider />
          <SettingsRow 
            icon={<Droplets className="w-4 h-4" />} 
            label="Meta de Água" 
            value={`${(profile?.waterGoalMl || 0) / 1000}L/dia`} 
            color="sky" 
          />
        </div>
      </div>

      {/* Profile Data */}
      <div className="mb-8">
        <label className="block text-[11px] font-bold text-text-muted tracking-widest uppercase mb-3 px-1">Dados do Perfil</label>
        <div className="ec-card rounded-2xl p-2">
          <SettingsRow icon={<Calendar className="w-4 h-4" />} label="Data de Nascimento" value={profile?.birthDate || '--'} />
          <SettingsDivider />
          <SettingsRow icon={<Ruler className="w-4 h-4" />} label="Altura" value={`${profile?.height || '--'} cm`} />
          <SettingsDivider />
          <SettingsRow icon={<Weight className="w-4 h-4" />} label="Peso Atual" value={`${profile?.weight || '--'} kg`} />
          <SettingsDivider />
          <SettingsRow icon={<MapPin className="w-4 h-4" />} label="Cidade" value={profile?.city || '--'} />
        </div>
      </div>

      {/* Notifications */}
      <div className="mb-8">
        <label className="block text-[11px] font-bold text-text-muted tracking-widest uppercase mb-3 px-1">Notificações</label>
        <div className="ec-card rounded-2xl p-2">
          <ToggleRow icon={<Bell className="w-4 h-4" />} label="Lembrete de treino" checked={profile?.notificationsEnabled?.training} color="violet" />
          <SettingsDivider />
          <ToggleRow icon={<Droplets className="w-4 h-4" />} label="Lembretes de água" checked={profile?.notificationsEnabled?.water} color="sky" />
          <SettingsDivider />
          <ToggleRow icon={<Trophy className="w-4 h-4" />} label="Novidades e Desafios" checked={profile?.notificationsEnabled?.community} color="violet" />
        </div>
      </div>

      {/* Account Actions */}
      <div className="mb-12">
        <label className="block text-[11px] font-bold text-text-muted tracking-widest uppercase mb-3 px-1">Conta & Suporte</label>
        <div className="ec-card rounded-2xl p-2">
          {authUser?.role === 'admin' && (
            <>
              <SettingsRow icon={<ShieldCheck className="w-4 h-4 text-ec-violet" />} label="Painel Admin" color="violet" onClick={() => navigate('/admin/subscriptions')} />
              <SettingsDivider />
            </>
          )}
          <SettingsRow icon={<HelpCircle className="w-4 h-4" />} label="Central de Ajuda" />
          <SettingsDivider />
          <SettingsRow icon={<Headphones className="w-4 h-4" />} label="Falar com Suporte" value="Não configurado" />
          <SettingsDivider />
          <SettingsRow icon={<CreditCard className="w-4 h-4" />} label="Gerenciar Assinatura" value="Ativa" onClick={() => navigate('/app/billing')} />
          <SettingsDivider />
          <SettingsRow icon={<LogOut className="w-4 h-4 text-accent-red" />} label="Sair da Conta" onClick={handleLogout} />
          {isConfirmingLogout && (
            <div className="mx-4 mb-3 rounded-xl border border-accent-yellow/35 bg-accent-yellow/10 p-3">
              <p className="text-xs font-bold text-text-primary">Confirmar saída da conta?</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-accent-red px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white"
                >
                  Sair
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingLogout(false)}
                  className="rounded-lg border border-white/12 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-text-primary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {profileFeedback && (
        <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-bold ${
          profileFeedback.type === 'success'
            ? 'border-accent-lime/35 bg-accent-lime/10 text-accent-lime'
            : 'border-accent-red/35 bg-accent-red/10 text-accent-red'
        }`}>
          {profileFeedback.message}
        </div>
      )}

      <p className="text-center text-[10px] text-text-muted uppercase font-bold tracking-widest">Expert Club v2.5.0 • ID: {authUser?.uid || '--'}</p>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ec-card max-w-md w-full p-8 rounded-3xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <UserIcon className="w-32 h-32 text-ec-violet" />
            </div>
            
            <h2 className="font-display text-2xl font-black italic uppercase text-white mb-6">Editar Perfil</h2>
            
            <div className="space-y-4 mb-8">
              <FormInput label="Nome Completo" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Peso (kg)" type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} />
                <FormInput label="Altura (cm)" type="number" value={formData.height} onChange={e => setFormData({...formData, height: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Objetivo Principal</label>
                <select 
                  className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value as any })}
                >
                  <option value="fat_loss">Emagrecimento</option>
                  <option value="hypertrophy">Hipertrofia</option>
                  <option value="recomposition">Recomposição</option>
                  <option value="health">Saúde / Bem-estar</option>
                </select>
              </div>
              <FormInput label="URL da Foto" value={formData.photoURL} onChange={e => setFormData({...formData, photoURL: e.target.value})} placeholder="https://..." />
            </div>

            <div className="flex gap-3">
              <UIButton variant="ghost" className="flex-1" onClick={() => setIsEditing(false)}>Cancelar</UIButton>
              <UIButton className="flex-1" onClick={handleSave} isLoading={isSaving}>Salvar Alterações</UIButton>
            </div>
          </motion.div>
        </div>
      )}
    </PageShell>
  )
}

function StatBox({ val, lbl, color }: { val: string; lbl: string; color?: 'violet' | 'purple' | 'yellow' }) {
  const colorMap = {
    violet: 'text-ec-violet',
    purple: 'text-accent-purple',
    yellow: 'text-accent-yellow',
  }
  return (
    <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl py-4 px-2 text-center">
      <div className={`font-display text-xl font-bold uppercase italic leading-none ${color ? colorMap[color] : 'text-text-primary'}`}>
        {val}
      </div>
      <div className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-2">{lbl}</div>
    </div>
  )
}

function SettingsRow({ icon, label, value, color, onClick }: { icon: React.ReactNode; label: string; value?: string; color?: string; onClick?: () => void }) {
  const colorMap: any = {
    violet: 'bg-ec-violet/10 text-ec-violet',
    sky: 'bg-accent-sky/10 text-accent-sky',
    purple: 'bg-accent-purple/10 text-accent-purple',
    yellow: 'bg-accent-yellow/10 text-accent-yellow',
  }

  const content = (
    <>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color ? colorMap[color] : 'bg-white/5 text-text-muted'}`}>
        {icon}
      </div>
      <span className="flex-1 text-sm font-medium text-text-primary text-left">{label}</span>
      {value && <span className="text-xs text-text-muted font-bold mr-2 uppercase">{value}</span>}
      {onClick && <ChevronRight className="w-4 h-4 text-text-disabled group-hover:text-white transition-colors" />}
    </>
  )

  if (!onClick) {
    return (
      <div className="flex items-center gap-4 w-full p-4 rounded-xl">
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-white/[0.04] transition-all group"
    >
      {content}
    </button>
  )
}

function ToggleRow({ icon, label, checked, color }: { icon: React.ReactNode; label: string; checked?: boolean; color?: string }) {
  return (
    <div className="flex items-center gap-4 w-full p-4 rounded-xl">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color ? 'bg-white/5 text-ec-violet' : 'bg-white/5 text-text-muted'}`}>
        {icon}
      </div>
      <span className="flex-1 text-sm font-medium text-text-primary">{label}</span>
      <div className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-ec-violet' : 'bg-white/10'}`}>
        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </div>
    </div>
  )
}

function SettingsDivider() {
  return <div className="h-px bg-white/[0.05] mx-4" />
}
