import { useState, useEffect } from 'react'
import { contentService } from '../services/contentService'
import type { ExpertContent, ContentProgress } from '../types/domain'
import { useAuth } from '../contexts/AuthContext'

export function useContent(category?: string) {
  const { user } = useAuth()
  const [items, setItems] = useState<ExpertContent[]>([])
  const [progress, setProgress] = useState<Record<string, ContentProgress>>({})
  const [isLoading, setIsLoading] = useState(true)

  const reload = async () => {
    setIsLoading(true)
    try {
      const data = category 
        ? await contentService.getByCategory(category)
        : await contentService.getAllPublished()
      setItems(data)

      if (user) {
        const userProgress = await contentService.getUserProgress(user.uid)
        const progressMap: Record<string, ContentProgress> = {}
        userProgress.forEach(p => {
          progressMap[p.contentId] = p
        })
        setProgress(progressMap)
      }
    } catch (error) {
      console.error("Error loading content:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [category, user?.uid])

  const saveProgress = async (contentId: string, status: 'started' | 'completed') => {
    if (!user) return
    const now = new Date().toISOString()
    const p: ContentProgress = {
      uid: user.uid,
      contentId,
      status,
      updatedAt: now
    }
    if (status === 'started') p.startedAt = now
    if (status === 'completed') p.completedAt = now
    await contentService.saveProgress(user.uid, p)
    setProgress(prev => ({ ...prev, [contentId]: p }))
  }

  return { items, progress, isLoading, reload, saveProgress }
}
