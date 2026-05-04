import { useState, useEffect, useCallback } from 'react'
import { communityFeedService } from '../services/communityFeedService'
import type { CommunityPost } from '../types/domain'
import type { DocumentSnapshot } from 'firebase/firestore'

export function useCommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setLastDoc(null)
    try {
      const result = await communityFeedService.getFeed()
      setPosts(result.posts)
      setLastDoc(result.lastDoc)
      setHasMore(result.posts.length >= 20)
    } catch (error) {
      console.error("Error loading community feed:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !lastDoc) return
    setIsLoadingMore(true)
    try {
      const result = await communityFeedService.getFeed(20, lastDoc)
      setPosts(prev => [...prev, ...result.posts])
      setLastDoc(result.lastDoc)
      setHasMore(result.posts.length >= 20)
    } catch (error) {
      console.error("Error loading more posts:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, lastDoc])

  useEffect(() => {
    reload()
  }, [reload])

  return { posts, isLoading, isLoadingMore, hasMore, reload, loadMore }
}
