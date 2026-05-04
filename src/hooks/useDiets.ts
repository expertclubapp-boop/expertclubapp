import { useState, useEffect } from 'react'
import { dietService } from '../services/dietService'
import type { Diet } from '../types/domain'

export function useDiets() {
  const [diets, setDiets] = useState<Diet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await dietService.getAllPublished()
        setDiets(data)
      } catch (err) {
        setError('Falha ao carregar dietas')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  return { diets, isLoading, error }
}

export function useDiet(id?: string) {
  const [diet, setDiet] = useState<Diet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setIsLoading(false)
      return
    }
    
    const dietId = id
    async function load() {
      try {
        const data = await dietService.getById(dietId)
        setDiet(data)
      } catch (err) {
        setError('Falha ao carregar detalhes da dieta')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  return { diet, isLoading, error }
}
