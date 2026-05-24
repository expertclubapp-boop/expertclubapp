import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { WorkoutTechnique, SeriesPreset, WorkoutSetGroup } from '../types/domain'

export const presetsService = {
  // ─── Custom Techniques ──────────────────────────────────────────────────

  async listCustomTechniques(): Promise<WorkoutTechnique[]> {
    const q = query(collection(db, COLLECTIONS.WORKOUT_TECHNIQUES), orderBy('createdAt', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkoutTechnique))
  },

  async createTechnique(data: {
    name: string
    description: string
    instructions: string
  }): Promise<string> {
    const now = new Date().toISOString()
    const ref = await addDoc(collection(db, COLLECTIONS.WORKOUT_TECHNIQUES), {
      ...data,
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    })
    return ref.id
  },

  async updateTechnique(
    id: string,
    data: Partial<Pick<WorkoutTechnique, 'name' | 'description' | 'instructions'>>
  ): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.WORKOUT_TECHNIQUES, id), {
      ...data,
      updatedAt: new Date().toISOString(),
    })
  },

  async deleteTechnique(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.WORKOUT_TECHNIQUES, id))
  },

  // ─── Series Presets ──────────────────────────────────────────────────────

  async listSeriesPresets(): Promise<SeriesPreset[]> {
    const q = query(collection(db, COLLECTIONS.SERIES_PRESETS), orderBy('createdAt', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SeriesPreset))
  },

  async createSeriesPreset(data: {
    name: string
    groups: WorkoutSetGroup[]
    createdBy?: string
  }): Promise<string> {
    const now = new Date().toISOString()
    const ref = await addDoc(collection(db, COLLECTIONS.SERIES_PRESETS), {
      name: data.name,
      groups: data.groups,
      createdBy: data.createdBy ?? '',
      createdAt: now,
      updatedAt: now,
    })
    return ref.id
  },

  async updateSeriesPreset(
    id: string,
    data: Partial<Pick<SeriesPreset, 'name' | 'groups'>>
  ): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.SERIES_PRESETS, id), {
      ...data,
      updatedAt: new Date().toISOString(),
    })
  },

  async deleteSeriesPreset(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.SERIES_PRESETS, id))
  },
}
