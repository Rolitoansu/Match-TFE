import { useState, useCallback, useEffect } from 'react'

const FAVORITES_KEY = 'match-tfe.favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setFavorites(Array.isArray(parsed) ? parsed : [])
      } catch {
        setFavorites([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  const toggleFavorite = useCallback((proposalId: number) => {
    setFavorites((prev) =>
      prev.includes(proposalId) ? prev.filter((id) => id !== proposalId) : [...prev, proposalId]
    )
  }, [])

  const isFavorite = useCallback((proposalId: number) => {
    return favorites.includes(proposalId)
  }, [favorites])

  const addFavorite = useCallback((proposalId: number) => {
    setFavorites((prev) => (prev.includes(proposalId) ? prev : [...prev, proposalId]))
  }, [])

  const removeFavorite = useCallback((proposalId: number) => {
    setFavorites((prev) => prev.filter((id) => id !== proposalId))
  }, [])

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    addFavorite,
    removeFavorite,
  }
}
