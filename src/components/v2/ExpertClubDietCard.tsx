import { Flame, Clock, Utensils, ChevronRight } from 'lucide-react'
import { V2Card, V2Badge, V2IconBubble } from './ExpertClubV2Base'
import { Diet } from '../../types/domain'

export function ExpertClubDietCard({ 
  diet, 
  onClick 
}: { 
  diet: Diet; 
  onClick?: (id: string) => void 
}) {
  return (
    <V2Card 
      className="p-5 group hover:scale-[1.02] transition-all duration-300 border-white/5"
      onClick={() => onClick?.(diet.id)}
    >
      <div className="flex justify-between items-start mb-6">
        <V2IconBubble icon={Utensils} tone="violet" size={16} />
        <V2Badge tone="violet" className="px-2.5 py-1 text-xs font-black uppercase">{diet.goal || 'Performance'}</V2Badge>
      </div>

      <h3 className="text-xl font-black italic text-white uppercase mb-2 group-hover:text-ec-violet transition-colors">
        {diet.title}
      </h3>
      <p className="text-xs text-text-muted mb-6 line-clamp-2">{diet.description}</p>
      
      <div className="flex items-center gap-4 text-text-muted border-t border-white/5 pt-4 mt-auto">
        <div className="flex items-center gap-1.5">
          <Flame size={14} className="text-ec-violet" />
          <span className="text-xs font-bold uppercase tracking-widest text-white">{diet.calories} KCAL</span>
        </div>
        <div className="flex items-center gap-1.5 border-l border-white/5 pl-4">
          <Clock size={14} className="text-ec-violet" />
          <span className="text-xs font-bold uppercase tracking-widest text-white">{diet.meals?.length || diet.mealsPerDay || 0} REFEIÇÕES</span>
        </div>
        <div className="ml-auto text-ec-violet group-hover:translate-x-1 transition-transform">
          <ChevronRight size={20} />
        </div>
      </div>
    </V2Card>
  )
}
