export interface Proposal {
  id: number
  title: string
  description: string
  type: number
  publicationDate: string
  status: 'proposed' | 'in_progress' | 'completed'
  creatorName: string
  creatorSurname: string
  interestCount: number
  likedByCurrentUser: boolean
  interestedUsers?: Array<{
    id: number
    name: string
    surname: string
    email: string | null
    matchStatus: 'pending' | 'accepted' | 'rejected' | null
    likedAt: string
  }>
  tags?: string[]
}

export type StatusTab = 'all' | 'open' | 'in_progress' | 'completed'
export type SortOption = 'recent' | 'oldest' | 'most_interested' | 'title_asc'

export type ProposalFilters = {
  search: string
  selectedTab: StatusTab
  onlyInterested: boolean
  onlyLikedByMe: boolean
  selectedType: number | 'all'
  selectedTag: string
  sortBy: SortOption
}

export const FILTERS_STORAGE_KEY = 'match-tfe.proposals.filters'
export const VALID_STATUS_TABS: StatusTab[] = ['all', 'open', 'in_progress', 'completed']
export const VALID_SORT_OPTIONS: SortOption[] = ['recent', 'oldest', 'most_interested', 'title_asc']

export const DEFAULT_FILTERS: ProposalFilters = {
  search: '',
  selectedTab: 'all',
  onlyInterested: false,
  onlyLikedByMe: false,
  selectedType: 'all',
  selectedTag: 'all',
  sortBy: 'recent',
}
