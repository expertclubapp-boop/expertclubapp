import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, limit, where, increment, startAfter, DocumentSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { normalizeFirestoreWriteData, nowTimestamp } from '../lib/firebase/date'
import type { CommunityPost, CommunityComment } from '../types/domain'

const POSTS_PER_PAGE = 20
const COMMENTS_PER_PAGE = 30

export const communityFeedService = {
  /** Paginated feed — pass lastDoc from previous page for cursor-based pagination */
  async getFeed(limitCount = POSTS_PER_PAGE, lastDoc?: DocumentSnapshot): Promise<{ posts: CommunityPost[], lastDoc: DocumentSnapshot | null }> {
    const colRef = collection(db, 'community_posts')
    let q;
    if (lastDoc) {
      q = query(
        colRef,
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      )
    } else {
      q = query(
        colRef,
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )
    }
    const snap = await getDocs(q)
    const posts = snap.docs.map(d => d.data() as CommunityPost)
    const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null
    return { posts, lastDoc: newLastDoc }
  },

  /** Admin: Get all posts including hidden/deleted for moderation */
  async getAllPostsForAdmin(limitCount = 100): Promise<CommunityPost[]> {
    const colRef = collection(db, 'community_posts')
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(limitCount))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data() as CommunityPost)
  },

  /** Legacy non-paginated — for pinned posts or simple loads */
  async getAllPublished(limitCount = 50): Promise<CommunityPost[]> {
    const colRef = collection(db, 'community_posts')
    const q = query(colRef, where('status', '==', 'published'), orderBy('createdAt', 'desc'), limit(limitCount))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data() as CommunityPost)
  },

  async createPost(post: Omit<CommunityPost, 'id' | 'createdAt' | 'likesCount' | 'commentsCount' | 'likedBy'>): Promise<string> {
    const colRef = collection(db, 'community_posts')
    const docRef = doc(colRef)
    const newPost = {
      ...post,
      id: docRef.id,
      createdAt: nowTimestamp(),
      likesCount: 0,
      commentsCount: 0,
      likedBy: [],
      status: post.status || 'published'
    }
    await setDoc(docRef, normalizeFirestoreWriteData(newPost))
    return docRef.id
  },

  async toggleLike(postId: string, uid: string): Promise<void> {
    const docRef = doc(db, 'community_posts', postId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return

    const post = snap.data() as CommunityPost
    const hasLiked = post.likedBy?.includes(uid)
    const newLikedBy = hasLiked ? post.likedBy.filter(id => id !== uid) : [...(post.likedBy || []), uid]
    const incrementValue = hasLiked ? -1 : 1

    await updateDoc(docRef, {
      likedBy: newLikedBy,
      likesCount: increment(incrementValue)
    })
  },

  async getComments(postId: string, limitCount = COMMENTS_PER_PAGE): Promise<CommunityComment[]> {
    const colRef = collection(db, `community_posts/${postId}/comments`)
    const q = query(colRef, where('status', '==', 'published'), orderBy('createdAt', 'asc'), limit(limitCount))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data() as CommunityComment)
  },

  async addComment(postId: string, comment: Omit<CommunityComment, 'id' | 'postId' | 'createdAt' | 'status'>): Promise<string> {
    const trimmed = comment.content.trim()
    if (!trimmed || trimmed.length > 500) throw new Error('Comment too long or empty')

    const colRef = collection(db, `community_posts/${postId}/comments`)
    const docRef = doc(colRef)
    const newComment = {
      ...comment,
      content: trimmed,
      id: docRef.id,
      postId,
      status: 'published',
      createdAt: nowTimestamp()
    }
    
    await setDoc(docRef, normalizeFirestoreWriteData(newComment))
    
    const postRef = doc(db, 'community_posts', postId)
    await updateDoc(postRef, {
      commentsCount: increment(1)
    })
    
    return docRef.id
  },

  async deleteOwnComment(postId: string, commentId: string): Promise<void> {
    const commentRef = doc(db, `community_posts/${postId}/comments`, commentId)
    await deleteDoc(commentRef)

    const postRef = doc(db, 'community_posts', postId)
    await updateDoc(postRef, {
      commentsCount: increment(-1)
    })
  },

  // ═══ Admin Moderation ═══
  async pinPost(postId: string, pinned: boolean): Promise<void> {
    const docRef = doc(db, 'community_posts', postId)
    await updateDoc(docRef, { isPinned: pinned })
  },

  async setOfficialPost(postId: string, official: boolean): Promise<void> {
    const docRef = doc(db, 'community_posts', postId)
    await updateDoc(docRef, { isOfficial: official })
  },

  async hidePost(postId: string): Promise<void> {
    const docRef = doc(db, 'community_posts', postId)
    await updateDoc(docRef, { status: 'hidden' })
  },

  async deletePost(postId: string): Promise<void> {
    const docRef = doc(db, 'community_posts', postId)
    await updateDoc(docRef, { status: 'deleted' })
  },

  async hideComment(postId: string, commentId: string): Promise<void> {
    const commentRef = doc(db, `community_posts/${postId}/comments`, commentId)
    await updateDoc(commentRef, { status: 'hidden' })
  },

  async reportPost(postId: string): Promise<void> {
    const docRef = doc(db, 'community_posts', postId)
    await updateDoc(docRef, { reportCount: increment(1) })
  },

  async reportComment(postId: string, commentId: string): Promise<void> {
    const commentRef = doc(db, `community_posts/${postId}/comments`, commentId)
    await updateDoc(commentRef, { reportCount: increment(1) })
  }
}
