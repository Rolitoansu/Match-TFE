import {
  DEFAULT_FILTERS,
  FILTERS_STORAGE_KEY,
  type Proposal,
  type ProposalFilters,
  type SortOption,
  type StatusTab,
  VALID_SORT_OPTIONS,
  VALID_STATUS_TABS,
} from '../model/proposalTypes'

function isValidStatusTab(value: unknown): value is StatusTab {
  return typeof value === 'string' && VALID_STATUS_TABS.includes(value as StatusTab)
}

function isValidSortOption(value: unknown): value is SortOption {
  return typeof value === 'string' && VALID_SORT_OPTIONS.includes(value as SortOption)
}

export function parseStoredFilters(): ProposalFilters {
  const storedFilters = localStorage.getItem(FILTERS_STORAGE_KEY)

  if (!storedFilters) {
    return DEFAULT_FILTERS
  }

  try {
    const parsed = JSON.parse(storedFilters) as Partial<ProposalFilters>
    const parsedType = Number(parsed.selectedType)

    return {
      search: typeof parsed.search === 'string' ? parsed.search : DEFAULT_FILTERS.search,
      selectedTab: isValidStatusTab(parsed.selectedTab) ? parsed.selectedTab : DEFAULT_FILTERS.selectedTab,
      onlyInterested: Boolean(parsed.onlyInterested),
      onlyLikedByMe: Boolean(parsed.onlyLikedByMe),
      selectedType: Number.isInteger(parsedType) && parsedType > 0 ? parsedType : DEFAULT_FILTERS.selectedType,
      selectedTag: typeof parsed.selectedTag === 'string' ? parsed.selectedTag : DEFAULT_FILTERS.selectedTag,
      sortBy: isValidSortOption(parsed.sortBy) ? parsed.sortBy : DEFAULT_FILTERS.sortBy,
    }
  } catch {
    return DEFAULT_FILTERS
  }
}

export function matchesSelectedTab(status: Proposal['status'], selectedTab: StatusTab) {
  return selectedTab === 'all'
    || (selectedTab === 'open' && status === 'proposed')
    || (selectedTab === 'in_progress' && status === 'in_progress')
    || (selectedTab === 'completed' && status === 'completed')
}

export function sortProposals(proposals: Proposal[], sortBy: SortOption) {
  return [...proposals].sort((left, right) => {
    if (sortBy === 'oldest') {
      return new Date(left.publicationDate).getTime() - new Date(right.publicationDate).getTime()
    }

    if (sortBy === 'most_interested') {
      return right.interestCount - left.interestCount
    }

    if (sortBy === 'title_asc') {
      return left.title.localeCompare(right.title)
    }

    return new Date(right.publicationDate).getTime() - new Date(left.publicationDate).getTime()
  })
}
