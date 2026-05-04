import { motion } from 'framer-motion'
import { Diet } from '../../types/domain'
import { Badge } from './Badge'
import { Button } from './Button'

interface DietCardProps {
  diet: Diet
  onView: (id: string) => void
  isFeatured?: boolean
}

export function DietCard({ diet, onView, isFeatured }: DietCardProps) {
  if (isFeatured) {
    return (
      <motion.div 
        whileHover={{ scale: 1.01, y: -2 }}
        transition={{ duration: 0.22 }}
        className="ec-card lg:col-span-2 group relative overflow-hidden rounded-card transition-all p-1 cursor-pointer"
        onClick={() => onView(diet.id)}
      >
        <div className="relative h-full flex flex-col md:flex-row min-h-[320px]">
          <div className="w-full md:w-2/5 h-64 md:h-auto overflow-hidden rounded-l-[19px]">
            <img 
              src={`https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=800`} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              alt={diet.title}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-1 via-surface-1/40 to-transparent md:block hidden"></div>
          </div>
          <div className="flex-1 p-8 flex flex-col justify-between relative z-10">
            <div>
              <Badge color="lime" className="mb-4 uppercase">
                {diet.level} • {diet.goal}
              </Badge>
              <h3 className="font-display text-heading-2 text-text-primary mb-2 uppercase italic">{diet.title}</h3>
              <p className="text-text-secondary text-body-sm mb-6 max-w-sm">{diet.notes || diet.description || 'Plano nutricional otimizado para sua performance.'}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-text-primary font-bold text-2xl">{diet.calories}</span>
                <span className="text-text-muted text-[10px] uppercase tracking-widest font-bold">kcal / dia</span>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <span className="block text-accent-sky font-bold font-display uppercase italic">{diet.protein}g</span>
                  <span className="block text-[8px] uppercase text-text-muted font-bold">Prot</span>
                </div>
                <div className="text-center">
                  <span className="block text-accent-lime font-bold font-display uppercase italic">{diet.carbs}g</span>
                  <span className="block text-[8px] uppercase text-text-muted font-bold">Carb</span>
                </div>
                <div className="text-center">
                  <span className="block text-accent-purple font-bold font-display uppercase italic">{diet.fat}g</span>
                  <span className="block text-[8px] uppercase text-text-muted font-bold">Fat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      whileHover={{ scale: 1.018, y: -2 }}
      transition={{ duration: 0.22 }}
      className="ec-card group rounded-card p-6 transition-all flex flex-col cursor-pointer"
      onClick={() => onView(diet.id)}
    >
      <div className="h-48 rounded-lg overflow-hidden mb-6 relative">
        <img 
          src={`https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800`} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          alt={diet.title}
        />
        <div className="absolute top-3 left-3">
          <Badge color="purple" className="uppercase">{diet.level}</Badge>
        </div>
      </div>
      <div className="flex-1">
        <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-3 block">{diet.goal}</span>
        <h3 className="font-display text-heading-3 text-text-primary mb-4 uppercase italic leading-tight">{diet.title}</h3>
        <div className="flex justify-between items-center bg-bg-primary/65 rounded-lg p-4 border border-white/[0.06]">
          <div>
            <span className="block text-text-primary font-bold text-lg">{diet.calories}</span>
            <span className="block text-[9px] uppercase text-text-muted font-bold tracking-widest">Daily Kcal</span>
          </div>
          <div className="flex gap-2">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-accent-lime font-display italic">PROT: {diet.protein}g</span>
              <span className="text-[10px] text-text-muted font-bold uppercase">EQUILIBRADO</span>
            </div>
          </div>
        </div>
      </div>
      <Button variant="ghost" className="mt-6 uppercase py-3">Ver Detalhes</Button>
    </motion.div>
  )
}
