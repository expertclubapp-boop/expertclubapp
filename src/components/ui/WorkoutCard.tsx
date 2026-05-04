import { motion } from 'framer-motion'
import { Clock, Zap, Calendar } from 'lucide-react'
import { Workout } from '../../types/domain'
import { Badge } from './Badge'

interface WorkoutCardProps {
  workout: Workout
  onClick: (id: string) => void
}

export function WorkoutCard({ workout, onClick }: WorkoutCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.018, y: -2 }}
      transition={{ duration: 0.22 }}
      className="ec-card rounded-card overflow-hidden flex flex-col group cursor-pointer transition-all duration-300"
      onClick={() => onClick(workout.id)}
    >
      <div className="h-48 relative overflow-hidden">
        <img 
          src={`https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800`} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          alt={workout.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent"></div>
        <div className="absolute bottom-4 left-6">
          <Badge color="lime" className="uppercase border-accent-lime/20">{workout.goal}</Badge>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-between gap-6">
        <div>
          <h3 className="font-display text-heading-3 text-text-primary mb-2 group-hover:text-accent-lime transition-colors uppercase italic leading-tight">
            {workout.title}
          </h3>
          <p className="text-text-secondary text-body-sm line-clamp-2">
            Protocolo de alta performance focado em {workout.goal === 'hypertrophy' ? 'hipertrofia máxima' : 'condicionamento expert'}.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-bg-primary/55 p-3">
          <Stat icon={<Clock className="w-3 h-3" />} label="Duração" value={`${workout.durationMinutes} min`} />
          <Stat icon={<Zap className="w-3 h-3" />} label="Nível" value={workout.level} color="sky" />
          <Stat icon={<Calendar className="w-3 h-3" />} label="Freq" value={`${workout.daysPerWeek}x/sem`} />
        </div>
      </div>
    </motion.div>
  )
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] text-text-muted uppercase tracking-widest font-bold mb-1">{label}</span>
      <span className={`font-display text-[11px] font-bold uppercase italic flex items-center gap-1 ${color === 'sky' ? 'text-accent-sky' : 'text-text-primary'}`}>
        {icon} {value}
      </span>
    </div>
  )
}
