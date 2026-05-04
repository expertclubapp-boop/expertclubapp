import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, History, User, Clock, RotateCcw, Eye, FileText, Zap, Dumbbell, Coffee } from 'lucide-react'
import type { Diet, Workout } from '../../../types/domain'

interface HistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  type: 'diet' | 'workout'
  versions: (Diet | Workout)[]
  onRollback: (version: Diet | Workout) => void
  onPreview: (version: Diet | Workout) => void
}

export function HistoryDrawer({ isOpen, onClose, type, versions, onRollback, onPreview }: HistoryDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[401] h-full w-full max-w-md border-l border-white/10 bg-bg-primary shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-sky/10 flex items-center justify-center border border-accent-sky/20">
                  <History className="w-5 h-5 text-accent-sky" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black uppercase italic text-white leading-none">Histórico</h3>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Versões publicadas anteriormente</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Versions List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <FileText className="w-12 h-12 text-white/5 mb-4" />
                  <p className="font-display text-sm font-bold uppercase tracking-widest text-text-muted">Nenhuma versão publicada</p>
                </div>
              ) : (
                versions.map((v, idx) => (
                  <div key={v.version} className="ec-card rounded-2xl p-5 border border-white/5 bg-surface-1/40 group hover:border-accent-sky/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-accent-sky font-display text-xs font-black uppercase">v{v.version}</span>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 bg-accent-lime/10 border border-accent-lime/20 rounded-full text-[8px] font-black text-accent-lime uppercase tracking-widest">Ativa</span>
                          )}
                        </div>
                        <h4 className="text-white font-bold text-sm leading-tight">{v.title}</h4>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold uppercase tracking-tighter">
                          <Clock className="w-3 h-3" />
                          {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString('pt-BR') : '--'}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold uppercase tracking-tighter mt-0.5">
                          <User className="w-3 h-3" />
                          {v.publishedBy?.split('@')[0] || 'Sistema'}
                        </div>
                      </div>
                    </div>

                    {/* Summary Pills */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {type === 'diet' ? (
                        <DietSummaryView summary={(v as Diet).summary} />
                      ) : (
                        <WorkoutSummaryView summary={(v as Workout).summary} />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => onPreview(v)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Visualizar
                      </button>
                      <button 
                        onClick={() => onRollback(v)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-sky/10 border border-accent-sky/20 rounded-xl text-[10px] font-black text-accent-sky uppercase tracking-widest hover:bg-accent-sky/20 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restaurar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-white/[0.02]">
              <p className="text-[10px] text-text-muted font-medium leading-relaxed">
                A restauração cria um novo rascunho baseado na versão selecionada. O plano ativo dos alunos não é alterado até que o novo rascunho seja publicado.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function DietSummaryView({ summary }: { summary?: any }) {
  if (!summary) return null
  return (
    <>
      <Pill icon={<Zap className="w-3 h-3" />} text={`${summary.totalKcal} kcal`} />
      <Pill icon={<Coffee className="w-3 h-3" />} text={`${summary.mealsCount} ref`} />
    </>
  )
}

function WorkoutSummaryView({ summary }: { summary?: any }) {
  if (!summary) return null
  return (
    <>
      <Pill icon={<Dumbbell className="w-3 h-3" />} text={`${summary.workoutsCount} treinos`} />
      <Pill icon={<Clock className="w-3 h-3" />} text={`${summary.totalSets} séries`} />
    </>
  )
}

function Pill({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-text-muted uppercase tracking-wider">
      {icon}
      {text}
    </div>
  )
}
