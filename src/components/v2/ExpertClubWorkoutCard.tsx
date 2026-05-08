import { Clock, Calendar, ChevronRight, Dumbbell } from 'lucide-react'
import { V2Card, V2Badge } from './ExpertClubV2Base'
import { Workout } from '../../types/domain'

export function ExpertClubWorkoutCard({ 
  workout, 
  onClick 
}: { 
  workout: Workout; 
  onClick?: (id: string) => void 
}) {
  return (
    <V2Card 
      className="p-0 overflow-hidden group hover:scale-[1.02] transition-all duration-300"
      onClick={() => onClick?.(workout.id)}
    >
      <div className="relative h-24">
        {(workout as any).thumbnailUrl ? (
          <img 
            src={(workout as any).thumbnailUrl} 
            alt={workout.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-[#f4f1ff] via-[#eef2f8] to-[#ecfdf5] flex items-center justify-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#d7deeb] bg-white text-ec-violet shadow-sm">
              <Dumbbell size={24} />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-white/10 to-transparent" />
        <div className="absolute top-4 left-4">
           <V2Badge tone="violet" className="uppercase font-black text-[9px]">{workout.level || 'Expert'}</V2Badge>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-xl font-black italic text-white uppercase mb-2 group-hover:text-ec-violet transition-colors">
          {workout.title}
        </h3>
        <p className="text-xs text-text-muted mb-4 line-clamp-2">
          {workout.description || `${workout.goal || 'Objetivo'} · ${workout.daysPerWeek || '--'}x por semana`}
        </p>
        
        <div className="flex items-center gap-4 text-text-muted border-t border-white/5 pt-4 mt-auto">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-ec-violet" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{workout.durationMinutes}m</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-white/5 pl-4">
            <Calendar size={14} className="text-ec-violet" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{workout.daysPerWeek}x/sem</span>
          </div>
          <div className="ml-auto text-ec-violet group-hover:translate-x-1 transition-transform">
            <ChevronRight size={20} />
          </div>
        </div>
      </div>
    </V2Card>
  )
}
