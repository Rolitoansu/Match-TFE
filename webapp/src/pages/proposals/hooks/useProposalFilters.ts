import { useCallback, useEffect, useState } from 'react'
import { parseStoredFilters } from '../utils/proposalFilters'
import { DEFAULT_FILTERS, FILTERS_STORAGE_KEY, type ProposalFilters } from '../model/proposalTypes'

export function useProposalFilters() {
  const [filters, setFilters] = useState<ProposalFilters>(parseStoredFilters)

  useEffect(() => {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters))
  }, [filters])

  const updateFilter = useCallback(<Key extends keyof ProposalFilters>(key: Key, value: ProposalFilters[Key]) => {
    setFilters((previousFilters) => ({ ...previousFilters, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const ensureSelectedTagIsAvailable = useCallback((availableTags: string[]) => {
    setFilters((previousFilters) => {
      if (previousFilters.selectedTag === 'all') {
        return previousFilters
      }

      if (availableTags.includes(previousFilters.selectedTag)) {
        return previousFilters
      }

      return { ...previousFilters, selectedTag: 'all' }
    })
  }, [])

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    ensureSelectedTagIsAvailable,
  }
}
