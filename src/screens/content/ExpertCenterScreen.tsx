import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  PlayCircle, 
  Search, 
  Calendar, 
  Download, 
  Dumbbell, 
  Utensils, 
  Zap, 
  FileText,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  ChevronLeft
} from 'lucide-react'
import { NotificationsDrawer } from '../../components/ui/NotificationsDrawer'
import { useContent } from '../../hooks/useContent'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { PageShell } from '../../components/ui/Premium'
import { getYoutubeEmbedUrl } from '../../services/adminContentService'
import type { ExpertContent } from '../../types/domain'

export function ExpertCenterScreen() {
  const { contentId: routeContentId } = useParams()
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const { items, progress, isLoading, saveProgress } = useContent()
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [activeContent, setActiveContent] = useState<ExpertContent | null>(null)

  const categories = ['Todos', 'Treino', 'Nutrição', 'Mentalidade', 'Hormônios', 'Suplementos']

  useEffect(() => {
    if (routeContentId && items.length > 0) {
      const found = items.find(i => i.id === routeContentId)
      if (found) setActiveContent(found)
    }
  }, [routeContentId, items])

  const filteredItems = selectedCategory === 'Todos' 
    ? items 
    : items.filter(i => {
        const categoryMap: Record<string, string> = {
          'Treino': 'training',
          'Nutrição': 'nutrition',
          'Mentalidade': 'mindset',
          'Hormônios': 'hormones',
          'Suplementos': 'supplements'
        }
        return i.category === categoryMap[selectedCategory]
      })

  const featured = items.find(i => i.featured && i.status === 'published')

  const handleOpenContent = (item: ExpertContent) => {
    setActiveContent(item)
    navigate(`/app/content/${item.id}`, { replace: true })
    if (!progress[item.id]) {
      saveProgress(item.id, 'started')
    }
  }

  const handleCloseContent = () => {
    setActiveContent(null)
    navigate('/app/content', { replace: true })
  }

  const handleMarkAsCompleted = async (id: string) => {
    await saveProgress(id, 'completed')
    // Optional: show a toast or celebration
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <PageShell wide>
        <div className="flex items-center justify-between mb-8">
           <div>
             <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-ec-violet">Conteudos</p>
             <h1 className="font-display text-h2 text-text-primary uppercase italic font-bold">Expert Center</h1>
           </div>
           <div className="flex gap-4 items-center">
              <button
                type="button"
                disabled
                title="Busca de conteudos ainda nao esta conectada neste modulo."
                className="text-text-muted transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Search className="w-6 h-6" />
              </button>
              <NotificationsDrawer uid={firebaseUser?.uid} />
           </div>
        </div>

        {/* Hero: Featured */}
        {featured && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-h3 text-white italic font-bold uppercase">Destaque da Semana</h2>
              <span className="text-[9px] font-bold text-ec-violet bg-ec-violet/10 px-3 py-1 rounded-full border border-ec-violet/20 uppercase tracking-[0.2em]">Exclusivo</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div 
                className="ec-card ec-student-image-hero md:col-span-8 relative group overflow-hidden rounded-2xl aspect-video md:aspect-auto md:h-[420px] cursor-pointer"
                onClick={() => handleOpenContent(featured)}
              >
                <img 
                  src={featured.thumbnailUrl || "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1200"} 
                  alt="Featured" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent opacity-90" />
                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <div className="flex items-center gap-3 mb-4">
                    {featured.type === 'live' && (
                      <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> AO VIVO
                      </span>
                    )}
                    <span className="text-white/70 text-xs font-bold uppercase tracking-widest">{featured.category}</span>
                  </div>
                  <h3 className="font-display text-h1 text-white mb-6 leading-tight uppercase italic">{featured.title}</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button variant="primary" className="px-8 py-3 font-bold italic" icon={<PlayCircle className="w-5 h-5" />}>
                      Assistir Agora
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-4 flex flex-col gap-6">
                <div className="ec-card flex-1 p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Calendar className="w-16 h-16 text-ec-violet" />
                  </div>
                  <p className="text-ec-violet text-[10px] font-bold uppercase tracking-widest mb-2">Comunidade</p>
                  <h4 className="font-display text-lg text-white mb-4 italic font-bold">Participe das discussões e tire dúvidas.</h4>
                  <button onClick={() => navigate('/app/community')} className="text-text-muted text-[10px] font-bold uppercase tracking-widest border border-white/10 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">Abrir comunidade</button>
                </div>
                <div className="ec-card flex-1 p-6 rounded-2xl relative overflow-hidden group ec-highlight-ring">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Zap className="w-16 h-16 text-ec-violet" />
                  </div>
                  <p className="text-ec-violet text-[10px] font-bold uppercase tracking-widest mb-2">Desafio Ativo</p>
                  <h4 className="font-display text-lg text-white mb-2 italic font-bold">Desafio de 21 Dias</h4>
                  <p className="text-text-muted text-[10px] mb-4 uppercase tracking-widest font-bold">Ganhe XP e Badges exclusivas.</p>
                  <button onClick={() => navigate('/app/challenges')} className="bg-ec-violet text-white p-2.5 rounded-xl inline-flex hover:scale-110 transition-all font-bold text-[10px] uppercase tracking-tighter">
                    Ver Desafio
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="mb-12 flex flex-wrap gap-3">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`
                px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border
                ${selectedCategory === c ? 'bg-ec-violet border-ec-violet text-white' : 'bg-surface-1 border-subtle text-text-muted hover:border-ec-violet/50'}
              `}
            >
              {c}
            </button>
          ))}
        </section>

        {/* Content Rows */}
        <section className="space-y-16">
          {filteredItems.length === 0 ? (
            <div className="py-20 text-center ec-card rounded-3xl border-dashed">
              <PlayCircle className="w-16 h-16 text-text-muted/20 mx-auto mb-6" />
              <h3 className="font-display text-h3 text-white uppercase italic font-bold mb-2">Nenhum conteúdo encontrado</h3>
              <p className="text-text-muted text-sm max-w-sm mx-auto font-body-md">Ainda não há conteúdos disponíveis nesta categoria. Volte em breve para novas aulas e materiais da Expert Club.</p>
            </div>
          ) : (
            ['training', 'nutrition', 'mindset', 'supplements', 'hormones'].map(cat => {
              const displayCat = ({
                training: 'Treino',
                nutrition: 'Nutrição',
                mindset: 'Mentalidade',
                supplements: 'Suplementos',
                hormones: 'Hormônios'
              } as Record<string, string>)[cat] || cat
              const catItems = filteredItems.filter(i => i.category === cat)
              
              if (catItems.length === 0) return null
              
              const CategoryIcon = ({
                training: Dumbbell,
                nutrition: Utensils,
                mindset: Zap,
                supplements: PlayCircle,
                hormones: BarChart3
              } as Record<string, any>)[cat] || PlayCircle

              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-h3 text-white flex items-center gap-3 uppercase italic font-bold">
                      <CategoryIcon className="w-6 h-6 text-ec-violet" />
                      {displayCat}
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {catItems.map(item => (
                      <VideoCard 
                        key={item.id} 
                        item={item} 
                        isCompleted={progress[item.id]?.status === 'completed'}
                        onPlay={() => handleOpenContent(item)} 
                      />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </section>

        {/* Protocols & Materials */}
        <section className="mt-20">
          <h2 className="font-display text-h2 text-white mb-8 uppercase italic font-bold">Protocolos & Materiais</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MaterialCard icon={<FileText />} title="Manual de Suplementação 2024" desc="Guia completo de evidências e dosagens." info="PDF • 12MB" />
            <MaterialCard icon={<BarChart3 />} title="Planilha de Volume Semanal" desc="Controle sua progressão de carga avançada." info="XLSX • 2MB" />
            <MaterialCard icon={<Zap />} title="Protocolo Jejum Metabólico" desc="Guia teórico e prático para definição." info="PDF • 8MB" />
          </div>
        </section>

        {/* Content Viewer Modal */}
        {activeContent && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-0 md:p-4 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-5xl min-h-screen md:min-h-0 md:rounded-3xl border-0 md:border md:border-white/10 bg-bg-primary overflow-hidden shadow-2xl flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/5">
                <button onClick={handleCloseContent} className="flex items-center gap-2 text-text-muted hover:text-white transition-colors group">
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-widest">Voltar</span>
                </button>
                <div className="flex items-center gap-3">
                  {progress[activeContent.id]?.status === 'completed' ? (
                    <span className="flex items-center gap-1.5 text-ec-violet text-[10px] font-black uppercase tracking-widest bg-ec-violet/10 px-3 py-1 rounded-full border border-ec-violet/20">
                      <CheckCircle2 className="w-3 h-3" /> Assistido
                    </span>
                  ) : (
                    <Button 
                      variant="primary" 
                      className="h-8 px-4 text-[10px] font-black uppercase tracking-widest italic"
                      onClick={() => handleMarkAsCompleted(activeContent.id)}
                    >
                      Marcar como Assistido (+50 XP)
                    </Button>
                  )}
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 flex flex-col">
                {/* Video/Embed Player */}
                <div className="aspect-video bg-black relative group">
                  {activeContent.type === 'youtube' && (
                    <iframe
                      src={getYoutubeEmbedUrl(activeContent.youtubeUrl || '')}
                      title={activeContent.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )}
                  {activeContent.type === 'external_link' && (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                      <ExternalLink className="w-16 h-16 text-ec-violet mb-4 opacity-20" />
                      <h4 className="text-white font-display text-xl mb-4 italic font-bold uppercase">{activeContent.title}</h4>
                      <p className="text-text-muted mb-8 max-w-md mx-auto">Este conteúdo é externo e deve ser acessado clicando no botão abaixo.</p>
                      <Button 
                        variant="primary" 
                        onClick={() => window.open(activeContent.externalUrl, '_blank')}
                        icon={<ExternalLink className="w-4 h-4" />}
                      >
                        Abrir Link Externo
                      </Button>
                    </div>
                  )}
                  {activeContent.type === 'pdf' && (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                      <FileText className="w-16 h-16 text-ec-violet mb-4 opacity-20" />
                      <h4 className="text-white font-display text-xl mb-4 italic font-bold uppercase">{activeContent.title}</h4>
                      <Button 
                        variant="primary" 
                        onClick={() => window.open(activeContent.externalUrl, '_blank')}
                        icon={<Download className="w-4 h-4" />}
                      >
                        Baixar PDF
                      </Button>
                    </div>
                  )}
                </div>

                {/* Content Info */}
                <div className="p-6 md:p-10">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <span className="text-ec-violet text-[10px] font-bold uppercase tracking-widest">{activeContent.category}</span>
                    {activeContent.durationMinutes && <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest">{activeContent.durationMinutes} minutos</span>}
                  </div>
                  <h2 className="font-display text-h2 md:text-h1 text-white mb-6 uppercase italic font-bold leading-tight">{activeContent.title}</h2>
                  <div className="prose prose-invert max-w-none prose-sm">
                    <p className="text-text-secondary leading-relaxed font-body-md whitespace-pre-wrap">{activeContent.description}</p>
                  </div>
                  
                  {activeContent.tags && activeContent.tags.length > 0 && (
                    <div className="mt-10 flex flex-wrap gap-2">
                      {activeContent.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-bold text-text-muted/60 border border-white/5 px-2 py-1 rounded bg-white/5 uppercase tracking-widest">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </PageShell>
  )
}

function VideoCard({ item, isMock, isCompleted, onPlay }: any) {
  if (isMock) {
    return (
      <div className="group opacity-40 grayscale transition-all">
        <div className="relative aspect-video rounded-xl overflow-hidden mb-3 border border-white/5 bg-surface-2" />
        <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    )
  }

  return (
    <button className="group text-left disabled:cursor-not-allowed disabled:opacity-60" onClick={onPlay} disabled={!onPlay}>
      <div className="relative aspect-video rounded-xl overflow-hidden mb-3 border border-white/5">
        <img 
          src={item.thumbnailUrl || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400"} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayCircle className="text-ec-violet w-12 h-12" />
        </div>
        {isCompleted && (
          <div className="absolute top-2 left-2 bg-ec-violet text-white p-1 rounded-full shadow-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}
        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] px-2 py-0.5 rounded font-bold tracking-widest uppercase">
          {item.durationMinutes ? `${item.durationMinutes}m` : 'EXCL'}
        </span>
      </div>
      <h5 className="text-text-primary font-bold text-sm line-clamp-2 group-hover:text-ec-violet transition-colors font-display italic uppercase">
        {item.title}
      </h5>
      <p className="text-text-muted text-[10px] mt-1 font-bold uppercase tracking-widest">{item.category} • há 2 dias</p>
    </button>
  )
}

function MaterialCard({ icon, title, desc, info }: any) {
  return (
    <div className="ec-card p-6 rounded-2xl flex items-start gap-4 transition-all group">
      <div className="bg-ec-violet/10 p-3 rounded-xl text-ec-violet group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="text-text-primary font-display font-bold text-sm italic uppercase mb-1">{title}</h4>
        <p className="text-text-muted text-xs mb-3 font-body-md">{desc}</p>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-bold text-text-muted/40 uppercase tracking-widest">{info}</span>
          <button
            type="button"
            disabled
            title="Download de materiais ainda não está disponível neste módulo."
            className="text-text-muted text-[10px] font-black uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-70"
          >
            Download indisponível
          </button>
        </div>
      </div>
    </div>
  )
}
