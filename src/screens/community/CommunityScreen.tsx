import { useState, useRef, useCallback, useEffect } from 'react'
import { 
  MessageCircle, 
  Gavel, 
  LifeBuoy, 
  Heart,
  MessageSquare,
  Image as ImageIcon,
  Pin,
  Flag,
  Send,
  Trash2,
  Loader2,
  ExternalLink,
  X
} from 'lucide-react'
import { toastSuccess, toastError } from '../../components/ui/Toast'
import { communityService, type CommunitySettings } from '../../services/communityService'
import { NotificationsDrawer } from '../../components/ui/NotificationsDrawer'
import { useCommunityFeed } from '../../hooks/useCommunityFeed'
import { communityFeedService } from '../../services/communityFeedService'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { PageShell } from '../../components/ui/Premium'
import type { CommunityPost, CommunityComment } from '../../types/domain'

const POST_COOLDOWN_MS = 30_000

export function CommunityScreen() {
  const { posts, isLoading, isLoadingMore, hasMore, reload, loadMore } = useCommunityFeed()
  const { firebaseUser } = useAuth()
  const [newPostContent, setNewPostContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [settings, setSettings] = useState<CommunitySettings | null>(null)
  const [postToReport, setPostToReport] = useState<string | null>(null)
  const lastPostAtRef = useRef(0)

  useEffect(() => {
    communityService.getSettings().then(setSettings)
  }, [])

  const handlePost = async () => {
    const trimmedContent = newPostContent.trim()
    if (!trimmedContent || !firebaseUser || trimmedContent.length > 1000) return
    
    const now = Date.now()
    if (now - lastPostAtRef.current < POST_COOLDOWN_MS) {
      toastError('Aguarde alguns segundos antes de publicar novamente.')
      return
    }
    
    setIsPosting(true)
    lastPostAtRef.current = now
    try {
      await communityFeedService.createPost({
        authorId: firebaseUser.uid,
        authorName: firebaseUser.displayName || 'Atleta Expert',
        authorPhoto: firebaseUser.photoURL || undefined,
        content: trimmedContent,
        type: 'discussion',
        isPinned: false,
        isOfficial: false,
        status: 'published'
      })
      setNewPostContent('')
      reload()
    } catch (error) {
      console.error("Error posting:", error)
    } finally {
      setIsPosting(false)
    }
  }

  const handleLike = async (postId: string) => {
    if (!firebaseUser) return
    await communityFeedService.toggleLike(postId, firebaseUser.uid)
    reload()
  }

  const handleReport = async (postId: string) => {
    try {
      await communityFeedService.reportPost(postId)
      toastSuccess('Publicação reportada. Obrigado pela colaboração.')
      setPostToReport(null)
    } catch (e) {
      toastError('Erro ao reportar publicação.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  const pinnedPosts = posts.filter(p => p.isPinned)
  const regularPosts = posts.filter(p => !p.isPinned)

  return (
    <PageShell wide className="space-y-8 pt-4 pb-12">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-3xl">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-ec-violet/20 flex items-center justify-center border border-ec-violet/30">
             <MessageCircle className="w-5 h-5 text-ec-violet" />
           </div>
           <div>
             <h1 className="font-display text-xl text-text-primary uppercase italic font-bold leading-none">Comunidade</h1>
             <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mt-1">Troca de experiências</p>
           </div>
         </div>
         <NotificationsDrawer uid={firebaseUser?.uid} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: Feed */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Create Post */}
          <div className="ec-card rounded-3xl p-6 border-white/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden shrink-0">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser?.uid}`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <textarea 
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value.slice(0, 1000))}
                  maxLength={1000}
                  placeholder="Compartilhe sua evolução, dúvida ou dica com o clube..."
                  className="w-full bg-transparent border-none resize-none text-white text-sm font-body-md focus:ring-0 placeholder:text-text-muted/50 min-h-[80px]"
                />
                <div className="flex justify-end pt-1">
                   <span className="text-[10px] text-text-muted/50 font-bold">{newPostContent.length}/1000</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                  <button 
                    disabled 
                    title="Upload de fotos ainda não configurado para esta comunidade"
                    className="flex items-center gap-2 text-text-muted/40 transition-colors text-xs font-bold uppercase tracking-widest cursor-not-allowed"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Anexar Foto</span>
                  </button>
                  <Button 
                    variant="primary" 
                    className="px-8 text-xs font-black uppercase tracking-widest italic"
                    onClick={handlePost}
                    isLoading={isPosting}
                    disabled={!newPostContent.trim()}
                  >
                    Publicar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Pinned Posts */}
          {pinnedPosts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-ec-violet mb-2">
                <Pin className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Fixados pelo Expert</span>
              </div>
              {pinnedPosts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onLike={() => handleLike(post.id)} 
                  onReport={() => setPostToReport(post.id)}
                  onConfirmReport={() => handleReport(post.id)}
                  confirmingReport={postToReport === post.id}
                  onCancelReport={() => setPostToReport(null)}
                  currentUserId={firebaseUser?.uid} 
                  currentUserName={firebaseUser?.displayName || 'Atleta'} 
                  reload={reload} 
                />
              ))}
            </div>
          )}

          {/* Regular Feed */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-text-muted mb-2 border-b border-white/5 pb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Publicações Recentes</span>
            </div>
            {regularPosts.length === 0 ? (
              <div className="text-center py-10 text-text-muted text-sm italic">Nenhuma publicação encontrada. Seja o primeiro a postar!</div>
            ) : (
              regularPosts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onLike={() => handleLike(post.id)} 
                  onReport={() => setPostToReport(post.id)}
                  onConfirmReport={() => handleReport(post.id)}
                  confirmingReport={postToReport === post.id}
                  onCancelReport={() => setPostToReport(null)}
                  currentUserId={firebaseUser?.uid} 
                  currentUserName={firebaseUser?.displayName || 'Atleta'} 
                  reload={reload} 
                />
              ))
            )}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button 
                  variant="ghost" 
                  className="border-white/10 text-xs font-black uppercase tracking-widest"
                  onClick={loadMore}
                  isLoading={isLoadingMore}
                >
                  Carregar mais publicações
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="ec-card rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <Gavel className="w-5 h-5 text-ec-violet" />
              <h3 className="font-display text-lg text-white uppercase italic font-bold">Regras do Clube</h3>
            </div>
            <ul className="space-y-5">
              <li>
                <h4 className="text-xs text-white font-bold uppercase tracking-wider mb-1">01. Sem suporte individual</h4>
                <p className="text-[11px] text-text-muted">A comunidade é para troca de experiências. Não avaliamos dietas ou treinos individuais por aqui.</p>
              </li>
              <li>
                <h4 className="text-xs text-white font-bold uppercase tracking-wider mb-1">02. Foco na execução</h4>
                <p className="text-[11px] text-text-muted">Mostre o que você fez hoje. Suor e disciplina inspiram mais que debates teóricos.</p>
              </li>
              <li>
                <h4 className="text-xs text-white font-bold uppercase tracking-wider mb-1">03. Respeito Mútuo</h4>
                <p className="text-[11px] text-text-muted">Sem julgamentos. Estamos todos na mesma jornada.</p>
              </li>
            </ul>
          </section>

          <div className="bg-ec-violet/10 border border-ec-violet/20 rounded-3xl p-6 text-center">
            <MessageCircle className="w-8 h-8 text-ec-violet mx-auto mb-3" />
            <h3 className="font-display text-lg text-white uppercase italic font-bold mb-2">WhatsApp VIP</h3>
            <p className="text-xs text-text-muted mb-5">Deseja ser notificado mais rápido? Entre no grupo de avisos oficiais.</p>
            {settings?.whatsappGroupUrl ? (
              <Button 
                variant="primary" 
                className="w-full text-xs font-black uppercase italic tracking-widest shadow-[0_4px_14px_rgba(91,75,255,0.3)]"
                onClick={() => window.open(settings.whatsappGroupUrl, '_blank')}
              >
                Entrar no Grupo <ExternalLink className="w-3.5 h-3.5 ml-2" />
              </Button>
            ) : (
              <div title="Grupo VIP ainda não configurado para este clube">
                <Button 
                  disabled 
                  variant="primary" 
                  className="w-full text-xs font-black uppercase italic tracking-widest opacity-50 cursor-not-allowed"
                >
                  Grupo não configurado
                </Button>
              </div>
            )}
          </div>
          
          <section className="text-center pt-4">
            <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-3">Problemas?</p>
            {settings?.supportUrl ? (
              <a 
                href={settings.supportUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-text-primary hover:text-ec-violet transition-colors"
              >
                <LifeBuoy className="w-4 h-4" />
                Falar com o Suporte
              </a>
            ) : (
              <button 
                disabled 
                className="inline-flex items-center gap-2 text-xs font-bold text-text-muted/50 cursor-not-allowed"
                title="Canal de suporte ainda não configurado"
              >
                <LifeBuoy className="w-4 h-4" />
                Suporte indisponível
              </button>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  )
}

// ═══════════════════════════════════════
// PostCard with inline comments
// ═══════════════════════════════════════

interface PostCardProps {
  post: CommunityPost
  onLike: () => void
  onReport: () => void
  onConfirmReport?: () => void
  confirmingReport?: boolean
  onCancelReport?: () => void
  currentUserId?: string
  currentUserName: string
  reload: () => void
}

function PostCard({ 
  post, 
  onLike, 
  onReport, 
  onConfirmReport,
  confirmingReport,
  onCancelReport,
  currentUserId, 
  currentUserName, 
  reload 
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)
  const [commentToReport, setCommentToReport] = useState<string | null>(null)

  const isLiked = post.likedBy?.includes(currentUserId || '')
  const timeAgo = Math.floor((new Date().getTime() - new Date(post.createdAt).getTime()) / 60000)

  const loadComments = useCallback(async () => {
    setIsLoadingComments(true)
    try {
      const data = await communityFeedService.getComments(post.id)
      setComments(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingComments(false)
    }
  }, [post.id])

  const handleToggleComments = () => {
    if (!showComments) loadComments()
    setShowComments(!showComments)
  }

  const handleSubmitComment = async () => {
    const trimmed = newComment.trim()
    if (!trimmed || !currentUserId || trimmed.length > 500) return
    setIsSubmitting(true)
    try {
      await communityFeedService.addComment(post.id, {
        authorId: currentUserId,
        authorName: currentUserName,
        content: trimmed
      })
      setNewComment('')
      loadComments()
      reload() // refresh comment count
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await communityFeedService.deleteOwnComment(post.id, commentId)
      toastSuccess('Comentário excluído.')
      setCommentToDelete(null)
      loadComments()
      reload()
    } catch (e) {
      toastError('Erro ao excluir comentário.')
    }
  }

  const handleReportComment = async (commentId: string) => {
    try {
      await communityFeedService.reportComment(post.id, commentId)
      toastSuccess('Comentário reportado.')
      setCommentToReport(null)
    } catch (e) {
      toastError('Erro ao reportar comentário.')
    }
  }

  return (
    <div className={`ec-card rounded-3xl transition-colors hover:border-white/10 ${post.isPinned ? 'border-ec-violet/30 bg-ec-violet/[0.02]' : 'border-white/5'}`}>
      {/* Post Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-white/5 overflow-hidden">
               <img src={post.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{post.authorName}</span>
                {post.isOfficial && <span className="bg-ec-violet/20 text-ec-violet text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Expert</span>}
              </div>
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{timeAgo < 60 ? `${timeAgo}m atrás` : `${Math.floor(timeAgo/60)}h atrás`}</span>
            </div>
          </div>
          {/* Report button */}
          <div className="relative">
            <button 
              onClick={onReport} 
              className={`p-2 rounded-lg transition-all ${confirmingReport ? 'text-accent-red bg-accent-red/10' : 'text-text-muted/30 hover:text-accent-red hover:bg-accent-red/5'}`} 
              title="Reportar"
            >
              <Flag className="w-4 h-4" />
            </button>
            
            {confirmingReport && (
              <div className="absolute top-full right-0 mt-2 z-20 w-48 ec-glass border border-accent-red/20 rounded-2xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[10px] font-bold text-white uppercase mb-3">Reportar publicação?</p>
                <div className="flex gap-2">
                  <button 
                    onClick={onConfirmReport} 
                    className="flex-1 bg-accent-red text-white text-[9px] font-black uppercase py-2 rounded-lg"
                  >
                    Confirmar
                  </button>
                  <button 
                    onClick={onCancelReport} 
                    className="flex-1 bg-white/5 text-text-muted text-[9px] font-black uppercase py-2 rounded-lg"
                  >
                    Não
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-sm text-text-secondary font-body-md leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>
        
        {post.imageUrl && (
          <div className="w-full h-64 rounded-xl overflow-hidden mb-4 border border-white/5">
            <img src={post.imageUrl} alt="Anexo" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-6 border-t border-white/5 px-6 py-4">
        <button onClick={onLike} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest group">
          <Heart className={`w-4 h-4 transition-all group-hover:scale-110 ${isLiked ? 'fill-ec-violet text-ec-violet' : 'text-text-muted group-hover:text-ec-violet'}`} />
          <span className={isLiked ? 'text-ec-violet' : 'text-text-muted'}>{post.likesCount || 0}</span>
        </button>
        <button onClick={handleToggleComments} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest group transition-colors ${showComments ? 'text-ec-violet' : 'text-text-muted hover:text-white'}`}>
          <MessageSquare className="w-4 h-4" />
          <span>{post.commentsCount || 0}</span>
        </button>
      </div>

      {/* Inline Comments Section */}
      {showComments && (
        <div className="border-t border-white/5 bg-white/[0.01]">
          {isLoadingComments ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 text-ec-violet animate-spin" />
            </div>
          ) : (
            <>
              {/* Comment List */}
              <div className="max-h-64 overflow-y-auto scrollbar-hide">
                {comments.length === 0 ? (
                  <p className="text-center text-xs text-text-muted/50 py-6 italic">Nenhum comentário ainda. Seja o primeiro!</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="flex items-start gap-3 px-6 py-3 hover:bg-white/[0.02] transition-colors group/comment">
                      <div className="w-7 h-7 rounded-full border border-white/5 overflow-hidden shrink-0 mt-0.5">
                        <img src={c.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.authorId}`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{c.authorName}</span>
                          <span className="text-[9px] text-text-muted/40 font-bold uppercase">{Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 60000)}m</span>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap">{c.content}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity shrink-0 relative">
                        {c.authorId === currentUserId && (
                          <div className="flex items-center gap-1">
                            {commentToDelete === c.id ? (
                              <div className="flex items-center gap-1 bg-accent-red/10 rounded-lg p-1 animate-in slide-in-from-right-2">
                                <button onClick={() => handleDeleteComment(c.id)} className="text-[8px] font-black uppercase text-accent-red px-1">Confirmar</button>
                                <button onClick={() => setCommentToDelete(null)} className="text-text-muted/50"><X className="w-3 h-3" /></button>
                              </div>
                            ) : (
                              <button onClick={() => setCommentToDelete(c.id)} className="p-1 rounded text-text-muted/30 hover:text-accent-red transition-colors" title="Excluir">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                        {c.authorId !== currentUserId && (
                          <div className="flex items-center gap-1">
                            {commentToReport === c.id ? (
                              <div className="flex items-center gap-1 bg-accent-yellow/10 rounded-lg p-1 animate-in slide-in-from-right-2">
                                <button onClick={() => handleReportComment(c.id)} className="text-[8px] font-black uppercase text-accent-yellow px-1">Reportar?</button>
                                <button onClick={() => setCommentToReport(null)} className="text-text-muted/50"><X className="w-3 h-3" /></button>
                              </div>
                            ) : (
                              <button onClick={() => setCommentToReport(c.id)} className="p-1 rounded text-text-muted/30 hover:text-accent-red transition-colors" title="Reportar">
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Add Comment Input */}
              <div className="flex items-center gap-3 px-6 py-4 border-t border-white/5">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value.slice(0, 500))}
                  maxLength={500}
                  placeholder="Escrever comentário..."
                  className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-text-muted/40 focus:ring-0"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment() }}}
                />
                <span className="text-[9px] text-text-muted/30 font-bold shrink-0">{newComment.length}/500</span>
                <button 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="p-2 rounded-lg bg-ec-violet/10 text-ec-violet hover:bg-ec-violet/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
