import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  X, 
  Video, 
  Trophy, 
  CheckCircle2, 
  MessageCircle, 
  Zap, 
  Award 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'
import type { Notification } from '../../types/domain'

interface Props {
  uid: string | undefined
}

export function NotificationsDrawer({ uid }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(uid)
  const navigate = useNavigate()

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'content_published': return <Video className="w-5 h-5 text-ec-violet" />
      case 'challenge_published': return <Trophy className="w-5 h-5 text-accent-yellow" />
      case 'badge_unlocked': return <Award className="w-5 h-5 text-accent-sky" />
      case 'xp_earned': return <Zap className="w-5 h-5 text-orange-400" />
      case 'ranking_updated': return <Trophy className="w-5 h-5 text-orange-400" />
      case 'challenge_mission_completed': return <CheckCircle2 className="w-5 h-5 text-accent-lime" />
      case 'comment_reply': return <MessageCircle className="w-5 h-5 text-text-muted" />
      case 'official_post': return <Bell className="w-5 h-5 text-accent-red" />
      default: return <Bell className="w-5 h-5 text-white/50" />
    }
  }

  const ALLOWED_PREFIXES = ['/app/', '/admin/']

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n.id)
    if (n.actionUrl) {
      // Security: Only navigate to whitelisted internal routes
      const isSafe = ALLOWED_PREFIXES.some(prefix => n.actionUrl!.startsWith(prefix))
      if (isSafe) {
        navigate(n.actionUrl)
      }
    }
    setIsOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.045] text-ec-violet transition-all hover:bg-white/[0.07] active:scale-95"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent-red rounded-full shadow-[0_0_8px_rgba(255,59,48,0.8)] border border-bg-primary" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-surface-1 border-l border-white/5 z-[100] shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl text-white uppercase italic font-bold leading-none">Notificações</h3>
                  {unreadCount > 0 && <p className="text-[10px] text-ec-violet font-bold uppercase tracking-widest mt-1">{unreadCount} não lidas</p>}
                </div>
                <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </div>

              {unreadCount > 0 && (
                <div className="px-5 py-3 border-b border-white/5 flex justify-end">
                  <button onClick={() => markAllAsRead()} className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white transition-colors">
                    Marcar todas como lidas
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-50">
                    <Bell className="w-10 h-10 text-white/20 mb-3" />
                    <p className="text-sm font-bold text-white uppercase italic">Nenhuma novidade</p>
                    <p className="text-xs text-text-muted mt-1">Sua central de notificações está vazia.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full flex items-start gap-4 p-4 rounded-2xl text-left transition-colors ${!n.isRead ? 'bg-ec-violet/[0.03] hover:bg-ec-violet/[0.05]' : 'hover:bg-white/[0.02]'}`}
                      >
                        <div className="mt-1 shrink-0">
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-sm font-bold mb-1 ${!n.isRead ? 'text-white' : 'text-text-primary'}`}>{n.title}</h4>
                          <p className={`text-xs font-body-md line-clamp-2 ${!n.isRead ? 'text-text-muted' : 'text-text-muted/60'}`}>{n.body}</p>
                          <span className="text-[9px] uppercase tracking-widest font-bold text-text-muted/40 block mt-2">
                            {new Date(n.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-ec-violet shrink-0 mt-2" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
