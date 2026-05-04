import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Utensils, Flame, Coffee, PlayCircle, Repeat, AlertTriangle, ChevronRight, Moon } from 'lucide-react'
import type { Diet, Workout } from '../../../types/domain'

interface PlanPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'diet' | 'workout'
  data: Diet | Workout
}

export function PlanPreviewModal({ isOpen, onClose, type, data }: PlanPreviewModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-bg-primary rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col max-h-full"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-bg-primary/80 backdrop-blur-md z-10 rounded-t-[2.5rem]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ec-violet/10 flex items-center justify-center border border-ec-violet/20">
                <Zap className="w-5 h-5 text-ec-violet" />
              </div>
              <div>
                <h3 className="font-display text-lg font-black uppercase italic text-white leading-none">Preview Aluno</h3>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Como o plano aparece no app mobile</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-text-muted hover:text-white transition-all hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
            {type === 'diet' ? (
              <DietPreview diet={data as Diet} />
            ) : (
              <WorkoutPreview workout={data as Workout} />
            )}
          </div>

          {/* Footer Warning */}
          <div className="p-6 bg-white/[0.02] border-t border-white/5 text-center rounded-b-[2.5rem]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
              Modo Visualização • Alterações devem ser feitas no editor
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

function DietPreview({ diet }: { diet: Diet }) {
  const calories = diet.calories || 0
  const protein = diet.protein || 0
  const carbs = diet.carbs || 0
  const fat = diet.fat || 0

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-lime/10 border border-accent-lime/20 rounded-full mb-4">
          <span className="w-2 h-2 rounded-full bg-accent-lime animate-pulse"></span>
          <span className="text-[10px] font-bold text-accent-lime uppercase tracking-widest">Plano Ativo</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-black uppercase italic text-white mb-4 leading-tight tracking-tighter">
          {diet.title || 'Dieta Personalizada'}
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed font-medium">
          {diet.notes || 'Protocolo focado em densidade nutricional e performance.'}
        </p>
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="ec-card p-6 rounded-2xl flex flex-col items-center justify-center bg-white/[0.02] border border-white/5">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Calorias</span>
          <span className="font-display text-3xl font-black italic text-accent-lime leading-none">{calories}</span>
          <span className="text-[10px] font-bold text-text-muted uppercase mt-2">kcal/dia</span>
        </div>
        <MacroTile label="Proteína" value={`${protein}g`} color="sky" icon={<Zap className="w-4 h-4" />} />
        <MacroTile label="Carbo" value={`${carbs}g`} color="lime" icon={<Flame className="w-4 h-4" />} />
        <MacroTile label="Gordura" value={`${fat}g`} color="purple" icon={<Utensils className="w-4 h-4" />} />
      </div>

      {/* Meals */}
      <div className="space-y-6">
        <h3 className="font-display text-2xl font-black uppercase italic text-white px-2">Refeições do Dia</h3>
        {diet.meals && diet.meals.length > 0 ? (
          diet.meals.map((meal, idx) => (
            <div key={meal.id || idx} className="ec-card rounded-2xl overflow-hidden border border-white/5 bg-surface-1/40 group">
              <div className="p-5 flex items-center justify-between bg-white/[0.03] border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-sky/10 border border-accent-sky/20 flex items-center justify-center text-accent-sky">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-display text-lg font-black uppercase italic text-white">{meal.name}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      {meal.timeSuggestion || '--:--'} • {meal.items?.reduce((acc, i) => acc + (i.macros?.calories || 0), 0) || 0} kcal
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {meal.items?.map((item, iIdx) => (
                  <div key={iIdx} className="flex items-center justify-between gap-4 border-b border-white/5 last:border-0 pb-4 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-bold">{item.foodName}</p>
                      {item.substitutionOptions && item.substitutionOptions.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Repeat className="w-3 h-3 text-ec-violet" />
                          <p className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">
                            Opções: {item.substitutionOptions.map(s => s.foodName).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-display text-lg font-black italic text-white uppercase">{item.quantity}{item.unit}</span>
                      <p className="text-[9px] font-bold text-text-muted uppercase">{item.macros?.calories || 0} kcal</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <EmptyState message="Nenhuma refeição cadastrada no plano." />
        )}
      </div>

      {/* Safety Warning */}
      <div className="p-8 ec-card rounded-2xl bg-accent-yellow/5 border border-accent-yellow/10 text-center">
        <AlertTriangle className="w-8 h-8 text-accent-yellow mx-auto mb-4" />
        <p className="text-sm text-text-secondary leading-relaxed font-medium max-w-xl mx-auto">
          Este plano alimentar é uma sugestão baseada em perfis médios. Consulte sempre um profissional antes de iniciar mudanças drásticas.
        </p>
      </div>
    </div>
  )
}

function WorkoutPreview({ workout }: { workout: Workout }) {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-accent-lime/10 border border-accent-lime/20 rounded-full text-[10px] font-black text-accent-lime uppercase tracking-widest">
            {workout.goal || 'Foco'} PRO
          </span>
          <span className="px-3 py-1 bg-accent-sky/10 border border-accent-sky/20 rounded-full text-[10px] font-black text-accent-sky uppercase tracking-widest">
            Nível {workout.level === 'beginner' ? '01' : workout.level === 'intermediate' ? '04' : '08'}
          </span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-black uppercase italic text-white mb-4 leading-tight tracking-tighter">
          {workout.title || 'Treino Personalizado'}
        </h1>
        <div className="flex flex-wrap gap-8 mt-8">
          <OverviewItem label="Modalidade" value={workout.modality === 'bodybuilding' ? 'Musculação' : workout.modality || '--'} />
          <div className="w-px h-10 bg-white/10 hidden md:block" />
          <OverviewItem label="Duração" value={`${workout.durationMinutes || '--'} min`} />
          <div className="w-px h-10 bg-white/10 hidden md:block" />
          <OverviewItem label="Frequência" value={`${workout.daysPerWeek || '--'}x Semana`} />
        </div>
      </div>

      {/* Weekly Structure */}
      <div className="space-y-6">
        <h2 className="font-display text-2xl font-black uppercase italic text-white px-2">Estrutura Semanal</h2>
        <div className="grid grid-cols-1 gap-4">
          {workout.days && workout.days.length > 0 ? (
            workout.days.map((day, idx) => (
              <div
                key={day.id || idx}
                className="ec-card rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between bg-surface-1/40 border border-white/5"
              >
                <div className="flex items-center gap-6 mb-4 md:mb-0">
                  <div className="w-14 h-14 rounded-2xl bg-bg-primary border border-white/10 flex items-center justify-center font-display text-2xl font-black text-ec-violet uppercase italic">
                    {(idx + 1).toString().padStart(2, '0')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-ec-violet font-display text-[10px] font-black tracking-widest uppercase">DIA {idx + 1}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20"></span>
                      <span className="text-text-muted font-display text-[10px] font-black tracking-widest uppercase">Estrutura</span>
                    </div>
                    <h3 className="font-display text-xl font-black uppercase italic text-white">
                      {day.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                  <div className="flex gap-6">
                    <div className="text-right">
                      <span className="block text-text-muted text-[10px] uppercase font-black tracking-widest">Exercícios</span>
                      <span className="text-white font-display text-lg font-black uppercase italic">{day.exercises?.length.toString().padStart(2, '0')}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-text-muted text-[10px] uppercase font-black tracking-widest">Séries</span>
                      <span className="text-white font-display text-lg font-black uppercase italic">
                        {day.exercises?.reduce((acc, ex) => acc + (ex.sets || 0), 0).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-ec-violet" />
                </div>
              </div>
            ))
          ) : (
            <div className="ec-card p-12 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-text-muted">
              <Moon className="w-8 h-8 mb-4 opacity-20" />
              <p className="font-display text-sm font-black uppercase tracking-widest">Dias de descanso programados</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Start Button Simulation */}
      <div className="pt-4">
        <button className="w-full bg-ec-violet/20 border border-ec-violet/30 text-ec-violet font-display text-xl font-black uppercase italic py-5 rounded-2xl flex items-center justify-center gap-3 opacity-50 cursor-not-allowed">
          Iniciar Treino (Simulação)
          <PlayCircle className="w-6 h-6 fill-current" />
        </button>
      </div>
    </div>
  )
}

function MacroTile({ label, value, color, icon }: { label: string; value: string; color: 'lime' | 'sky' | 'purple'; icon: React.ReactNode }) {
  const colors = {
    lime: 'text-accent-lime bg-accent-lime/10 border-accent-lime/20',
    sky: 'text-accent-sky bg-accent-sky/10 border-accent-sky/20',
    purple: 'text-accent-purple bg-accent-purple/10 border-accent-purple/20'
  }

  return (
    <div className={`ec-card p-5 rounded-2xl border ${colors[color]} flex flex-col justify-between h-32`}>
      <div className="flex justify-between items-start">
        <span className="font-display text-[10px] font-black uppercase tracking-widest opacity-70">{label}</span>
        <div className="p-1.5 rounded-lg bg-white/5">
          {icon}
        </div>
      </div>
      <div className="font-display text-2xl font-black uppercase italic leading-none">{value}</div>
    </div>
  )
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-text-muted font-display text-[10px] font-black uppercase tracking-widest mb-1">{label}</span>
      <span className="font-display text-2xl font-black uppercase italic text-white">{value}</span>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center">
      <p className="font-display text-sm font-black uppercase tracking-widest text-text-muted italic">{message}</p>
    </div>
  )
}
