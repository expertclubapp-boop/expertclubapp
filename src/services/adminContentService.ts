import type { ExpertContent } from '../types/domain'
import { COLLECTIONS } from '../lib/firebase/paths'
import { createAdminCrudService, makeId } from './adminCrudService'

export const adminContentService = createAdminCrudService<ExpertContent>(COLLECTIONS.CONTENT, 'content')

export function createEmptyContent(): ExpertContent {
  return {
    id: makeId('content'),
    title: '',
    description: '',
    category: 'beginner',
    type: 'youtube',
    tags: [],
    status: 'draft',
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function isValidYoutubeUrl(url: string) {
  return !url || /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url)
}

export function getYoutubeEmbedUrl(url: string) {
  if (!url) return ''
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`
  }
  return ''
}
