import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, Camera, Ruler, TrendingUp, AlertTriangle, CheckCircle as CheckIcon } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { bodyCheckinService } from '../../services/bodyCheckinService'
import type { BodyCheckin } from '../../types/domain'

export function EvolutionCheckinScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [photoFiles, setPhotoFiles] = useState<Record<string, File | null>>({})
  const [formData, setFormData] = useState<Partial<BodyCheckin>>({
    weightKg: undefined,
    measurements: {},
    photoUrls: {},
    routineEvaluation: '',
    mainDifficulty: '',
    mainEvolution: '',
    nextMonthGoal: '',
  })

  const handleUpdate = (field: string, value: any) => {
    setFormData(prev => {
      if (field.includes('.')) {
        const [obj, key] = field.split('.')
        return {
          ...prev,
          [obj]: { ...(prev as any)[obj], [key]: value }
        }
      }
      return { ...prev, [field]: value }
    })
  }

  const handleSubmit = async () => {
    if (!firebaseUser) return
    setIsSubmitting(true)
    
    try {
      const checkinId = crypto.randomUUID()
      const uploadedPhotoUrls: BodyCheckin['photoUrls'] = {}

      for (const [type, file] of Object.entries(photoFiles)) {
        if (!file) continue
        uploadedPhotoUrls[type as keyof BodyCheckin['photoUrls']] = await bodyCheckinService.uploadProgressPhoto(
          firebaseUser.uid,
          checkinId,
          type as keyof BodyCheckin['photoUrls'],
          file,
        )
      }
      
      const checkin: Omit<BodyCheckin, 'uid' | 'createdAt' | 'updatedAt'> = {
        ...formData,
        id: checkinId,
        date: new Date().toISOString().split('T')[0],
        weightKg: Number(formData.weightKg || 0),
        measurements: formData.measurements || {},
        photoUrls: uploadedPhotoUrls,
      }
      
      await bodyCheckinService.save(firebaseUser.uid, checkin)
      
      setShowSuccess(true)
    } catch (error) {
      console.error("Error saving checkin:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-32">
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
              <div className="w-24 h-24 bg-accent-sky/20 text-accent-sky rounded-full flex items-center justify-center mb-6 ring-4 ring-accent-sky/10 mx-auto">
                <CheckIcon className="w-12 h-12" />
              </div>
            </motion.div>
            <h2 className="font-display text-4xl font-black italic uppercase text-white mb-4">Registro Salvo!</h2>
            <p className="text-text-muted text-lg max-w-sm mb-12">Você deu mais um passo importante no acompanhamento da sua evolução.</p>
            <Button variant="primary" className="w-full max-w-sm py-5 text-lg" onClick={() => navigate('/app/progress')}>Ver Minha Evolução</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-50 px-4 py-3 bg-bg-primary/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted hover:bg-white/[0.06] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Passo {step} de 3</p>
            <p className="text-xs font-bold text-white">Registro de Evolução</p>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-6 space-y-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-accent-sky/10 flex items-center justify-center mx-auto mb-4">
                <Ruler className="w-8 h-8 text-accent-sky" />
              </div>
              <h2 className="font-display text-2xl font-black italic uppercase text-white mb-2">Peso e Medidas</h2>
              <p className="text-sm text-text-muted">Registre peso e medidas para comparar no futuro.</p>
            </div>

            <div className="ec-card rounded-2xl p-5 space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Peso Atual (kg)</label>
                <input 
                  type="number" 
                  className="ec-input w-full text-lg font-bold" 
                  placeholder="Ex: 75.5" 
                  value={formData.weightKg || ''}
                  onChange={e => handleUpdate('weightKg', parseFloat(e.target.value))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Cintura (cm)</label>
                  <input type="number" className="ec-input w-full" placeholder="--" value={formData.measurements?.waistCm || ''} onChange={e => handleUpdate('measurements.waistCm', parseFloat(e.target.value))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Abdômen (cm)</label>
                  <input type="number" className="ec-input w-full" placeholder="--" value={formData.measurements?.abdomenCm || ''} onChange={e => handleUpdate('measurements.abdomenCm', parseFloat(e.target.value))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Quadril (cm)</label>
                  <input type="number" className="ec-input w-full" placeholder="--" value={formData.measurements?.hipsCm || ''} onChange={e => handleUpdate('measurements.hipsCm', parseFloat(e.target.value))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Braço (cm)</label>
                  <input type="number" className="ec-input w-full" placeholder="--" value={formData.measurements?.armCm || ''} onChange={e => handleUpdate('measurements.armCm', parseFloat(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="bg-accent-yellow/10 border border-accent-yellow/20 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-accent-yellow shrink-0" />
              <p className="text-[11px] text-text-secondary leading-relaxed">
                <strong className="text-white block mb-1">Evite se pesar todo dia.</strong> 
                Use esse check-in para olhar a tendência. O peso varia por retenção, sono e treino.
              </p>
            </div>

            <Button variant="primary" className="w-full py-5" onClick={() => setStep(2)}>Próximo Passo</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-accent-lime/10 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-accent-lime" />
              </div>
              <h2 className="font-display text-2xl font-black italic uppercase text-white mb-2">Registro Visual</h2>
              <p className="text-sm text-text-muted">A balança engana, as fotos não. Tire fotos usando a mesma iluminação sempre.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                ['front', 'Frente'],
                ['side', 'Lado'],
                ['back', 'Costas'],
                ['extra', 'Extra'],
              ].map(([key, pos]) => (
                <label key={key} className="ec-card rounded-2xl p-4 aspect-[3/4] flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent-lime/30 transition-colors border-dashed border-2 border-white/10">
                  <Camera className="w-8 h-8 text-text-muted mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Foto de {pos}</span>
                  <span className="mt-2 text-[10px] text-accent-lime font-bold">
                    {photoFiles[key] ? 'Selecionada' : 'Enviar foto'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={event => setPhotoFiles(prev => ({ ...prev, [key]: event.target.files?.[0] || null }))}
                  />
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 py-5 border-subtle" onClick={() => setStep(1)}>Voltar</Button>
              <Button variant="primary" className="flex-1 py-5" onClick={() => setStep(3)}>Próximo Passo</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-accent-purple/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-accent-purple" />
              </div>
              <h2 className="font-display text-2xl font-black italic uppercase text-white mb-2">Avaliação de Rotina</h2>
              <p className="text-sm text-text-muted">Como foi este período para você?</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Maior dificuldade</label>
                <input type="text" className="ec-input w-full" placeholder="Ex: Comer doce à noite" value={formData.mainDifficulty || ''} onChange={e => handleUpdate('mainDifficulty', e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Maior vitória</label>
                <input type="text" className="ec-input w-full" placeholder="Ex: Fui treinar mesmo cansado" value={formData.mainEvolution || ''} onChange={e => handleUpdate('mainEvolution', e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Objetivo para o próximo ciclo</label>
                <input type="text" className="ec-input w-full" placeholder="Ex: Beber 3L de água todo dia" value={formData.nextMonthGoal || ''} onChange={e => handleUpdate('nextMonthGoal', e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 py-5 border-subtle" onClick={() => setStep(2)}>Voltar</Button>
              <Button variant="primary" className="flex-1 py-5" onClick={handleSubmit} disabled={isSubmitting} icon={isSubmitting ? undefined : <Check className="w-5 h-5" />}>
                {isSubmitting ? 'Salvando...' : 'Finalizar Check-in'}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
