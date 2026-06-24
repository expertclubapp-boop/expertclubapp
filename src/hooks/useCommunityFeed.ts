import { useState, useEffect, useCallback, useRef } from 'react'
import { communityFeedService } from '../services/communityFeedService'
import type { CommunityPost } from '../types/domain'
import type { DocumentSnapshot } from 'firebase/firestore'

export interface CommunityFeedState {
  posts: CommunityPost[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: string | null
  reload: () => void
  loadMore: () => void
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes('requires an index')) return 'index_missing'
    if (err.message.includes('permissions') || err.message.includes('PERMISSION_DENIED')) return 'permissions'
    if (err.message.includes('network') || err.message.includes('unavailable')) return 'offline'
  }
  return 'unknown'
}

export function useCommunityFeed(): CommunityFeedState {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null)
  // Prevents state updates after unmount
  const mountedRef = useRef(true)
  useEffect(() => { return () => { mountedRef.current = false } }, [])

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setLastDoc(null)
    try {
      const result = await communityFeedService.getFeed()
      if (!mountedRef.current) return
      setPosts(result.posts)
      setLastDoc(result.lastDoc)
      setHasMore(result.posts.length >= 20)
    } catch (err) {
      if (!mountedRef.current) return
      console.error('Community feed load error:', err)
      setError(extractErrorMessage(err))
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !lastDoc) return
    setIsLoadingMore(true)
    try {
      const result = await communityFeedService.getFeed(20, lastDoc)
      if (!mountedRef.current) return
      setPosts(prev => [...prev, ...result.posts])
      setLastDoc(result.lastDoc)
      setHasMore(result.posts.length >= 20)
    } catch (err) {
      if (!mountedRef.current) return
      console.error('Community feed load-more error:', err)
    } finally {
      if (mountedRef.current) setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, lastDoc])

  useEffect(() => {
    reload()
  }, [reload])

  return { posts, isLoading, isLoadingMore, hasMore, error, reload, loadMore }
}
