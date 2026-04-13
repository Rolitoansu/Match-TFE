import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import useAuth from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { ProposalCard } from './components/ProposalCard'
import { ProposalsFiltersPanel } from './components/ProposalsFiltersPanel'
import { ProposalsHeader } from './components/ProposalsHeader'
import { ProposalsTabs } from './components/ProposalsTabs'
import { matchesSelectedTab, parseStoredFilters, sortProposals } from './proposalFilters'
import {
  DEFAULT_FILTERS,
  FILTERS_STORAGE_KEY,
  type Proposal,
  type ProposalFilters,
  type SortOption,
  type StatusTab,
} from './proposalTypes'

export default function Proposals() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [filters, setFilters] = useState<ProposalFilters>(parseStoredFilters)
  const oppositeRolePluralLabel = user?.role === 'student'
    ? t('proposals.roles.professorsPlural')
    : t('proposals.roles.studentsPlural')

  const {
    search,
    selectedTab,
    onlyInterested,
    onlyLikedByMe,
    selectedType,
    selectedTag,
    sortBy,
  } = filters
  
  useEffect(() => {
    async function fetchProposals() {
      try {
        const { data: { proposals } } = await api.get('/project/proposals')
        setProposals(proposals)
      } catch (error) {
        console.error('Error fetching proposals:', error)
      }
    }

    fetchProposals()
  }, [])

  useEffect(() => {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters))
  }, [filters])

  const availableTags = useMemo(() => {
    const uniqueTags = new Set<string>()

    proposals.forEach((proposal) => {
      for (const tag of proposal.tags ?? []) {
        uniqueTags.add(tag)
      }
    })

    return [...uniqueTags].sort((left, right) => left.localeCompare(right))
  }, [proposals])

  const filteredProposals = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return proposals.filter((proposal) => {
      const matchesSearch = !normalizedSearch
        || proposal.title.toLowerCase().includes(normalizedSearch)
        || proposal.description.toLowerCase().includes(normalizedSearch)
        || (proposal.tags ?? []).some((tag) => tag.toLowerCase().includes(normalizedSearch))

      const matchesTab = matchesSelectedTab(proposal.status, selectedTab)

      const matchesInterestFilter = !onlyInterested || proposal.interestCount > 0
      const matchesLikedFilter = !onlyLikedByMe || proposal.likedByCurrentUser
      const matchesTypeFilter = selectedType === 'all' || proposal.type === selectedType
      const matchesTagFilter = selectedTag === 'all' || (proposal.tags ?? []).includes(selectedTag)

      return matchesSearch
        && matchesTab
        && matchesInterestFilter
        && matchesLikedFilter
        && matchesTypeFilter
        && matchesTagFilter
    })
  }, [proposals, search, selectedTab, onlyInterested, onlyLikedByMe, selectedType, selectedTag])

  const sortedProposals = useMemo(() => sortProposals(filteredProposals, sortBy), [filteredProposals, sortBy])

  useEffect(() => {
    if (selectedTag !== 'all' && !availableTags.includes(selectedTag)) {
      setFilters((previousFilters) => ({ ...previousFilters, selectedTag: 'all' }))
    }
  }, [availableTags, selectedTag])

  const tabs: Array<{ id: StatusTab; label: string }> = [
    { id: 'all', label: t('proposals.tabs.all') },
    { id: 'open', label: t('proposals.tabs.open') },
    { id: 'in_progress', label: t('proposals.tabs.inProgress') },
    { id: 'completed', label: t('proposals.tabs.completed') },
  ]

  const statusLabel: Record<Proposal['status'], string> = {
    proposed: t('proposals.status.open'),
    in_progress: t('proposals.status.inProgress'),
    completed: t('proposals.status.completed'),
  }

  const tfgTypeLabelById: Record<number, string> = {
    1: t('tfgTypes.research'),
    2: t('tfgTypes.hardwareSoftwareDevelopment'),
    3: t('tfgTypes.professionalExperience'),
    4: t('tfgTypes.qualitySecuritySystemsDesignAndImplementation'),
    5: t('tfgTypes.specificHardwareSoftwareImplementation'),
    6: t('tfgTypes.otherWorks'),
  }

  const sortOptions: Array<{ value: SortOption; label: string }> = [
    { value: 'recent', label: t('proposals.sort.recent') },
    { value: 'oldest', label: t('proposals.sort.oldest') },
    { value: 'most_interested', label: t('proposals.sort.mostInterested') },
    { value: 'title_asc', label: t('proposals.sort.titleAZ') },
  ]

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
  }

  function updateFilter<Key extends keyof ProposalFilters>(key: Key, value: ProposalFilters[Key]) {
    setFilters((previousFilters) => ({ ...previousFilters, [key]: value }))
  }

  return (
    <div className="mx-auto max-w-300 p-4 sm:p-6 lg:p-10">
      <ProposalsHeader
        title={t('proposals.title')}
        subtitle={t('proposals.subtitle', { rolePlural: oppositeRolePluralLabel })}
        newProposalLabel={t('proposals.newProposal')}
        searchPlaceholder={t('proposals.searchPlaceholder')}
        search={search}
        onSearchChange={(value) => updateFilter('search', value)}
        onCreateProposal={() => navigate('/proposals/new')}
      />

      <ProposalsFiltersPanel
        selectedType={selectedType}
        selectedTag={selectedTag}
        sortBy={sortBy}
        availableTags={availableTags}
        onlyInterested={onlyInterested}
        onlyLikedByMe={onlyLikedByMe}
        tfgTypeOptions={[
          { value: 1, label: t('tfgTypes.research') },
          { value: 2, label: t('tfgTypes.hardwareSoftwareDevelopment') },
          { value: 3, label: t('tfgTypes.professionalExperience') },
          { value: 4, label: t('tfgTypes.qualitySecuritySystemsDesignAndImplementation') },
          { value: 5, label: t('tfgTypes.specificHardwareSoftwareImplementation') },
          { value: 6, label: t('tfgTypes.otherWorks') },
        ]}
        sortOptions={sortOptions}
        labels={{
          tfgType: t('proposals.filters.tfgType'),
          allTypes: t('proposals.filters.allTypes'),
          tag: t('proposals.filters.tag'),
          allTags: t('proposals.filters.allTags'),
          sortBy: t('proposals.filters.sortBy'),
          clear: t('proposals.filters.clear'),
          onlyInterested: t('proposals.onlyInterested'),
          onlyLikedByMe: t('proposals.filters.onlyLikedByMe'),
        }}
        onTypeChange={(value) => updateFilter('selectedType', value)}
        onTagChange={(value) => updateFilter('selectedTag', value)}
        onSortChange={(value) => updateFilter('sortBy', value)}
        onOnlyInterestedChange={(value) => updateFilter('onlyInterested', value)}
        onOnlyLikedByMeChange={(value) => updateFilter('onlyLikedByMe', value)}
        onReset={resetFilters}
      />

      <ProposalsTabs
        tabs={tabs}
        selectedTab={selectedTab}
        onSelectTab={(tab) => updateFilter('selectedTab', tab)}
      />

      <div className="grid grid-cols-1 gap-4">
        {sortedProposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            statusLabel={statusLabel}
            tfgTypeLabelById={tfgTypeLabelById}
            assignmentLabels={{
              assigned: t('proposals.assignment.assigned'),
              hasInterested: t('proposals.assignment.hasInterested'),
              noInterested: t('proposals.assignment.noInterested'),
            }}
            fieldLabels={{
              publishedBy: t('proposalDetails.publishedBy'),
              tfgType: t('proposals.fields.tfgType'),
              status: t('proposals.fields.status'),
              interested: t('proposals.fields.interested'),
            }}
            badgeLabels={{
              match: t('proposals.badges.match'),
              like: t('proposals.badges.like'),
              more: t('proposals.more'),
              interestRegistered: t('proposals.interestRegistered'),
            }}
            viewDetailsLabel={t('proposals.viewDetails')}
            onViewDetails={(proposalId) => navigate(`/proposals/details/${proposalId}`)}
          />
        ))}

        {sortedProposals.length === 0 && (
          <div className="bg-white border border-border rounded-3xl p-8 text-center text-sm text-muted-foreground">
            {t('proposals.emptyFiltered')}
          </div>
        )}
      </div>
    </div>
  )
}