import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import useAuth from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { ProposalCard } from './components/ProposalCard'
import { ProposalsFiltersPanel } from './components/ProposalsFiltersPanel'
import { ProposalsHeader } from './components/ProposalsHeader'
import { ProposalsTabs } from './components/ProposalsTabs'
import { matchesSelectedTab, sortProposals } from './utils/proposalFilters'
import { exportToCSV, exportToPDF } from './utils/exportProposals'
import { type Proposal } from './model/proposalTypes'
import { useProposalFilters } from './hooks/useProposalFilters'

export default function Proposals() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const { filters, updateFilter, resetFilters, ensureSelectedTagIsAvailable } = useProposalFilters()
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
    ensureSelectedTagIsAvailable(availableTags)
  }, [availableTags, ensureSelectedTagIsAvailable])

  return (
    <div className="mx-auto max-w-300 p-4 sm:p-6 lg:p-10">
      <ProposalsHeader
        rolePlural={oppositeRolePluralLabel}
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
        onTypeChange={(value) => updateFilter('selectedType', value)}
        onTagChange={(value) => updateFilter('selectedTag', value)}
        onSortChange={(value) => updateFilter('sortBy', value)}
        onOnlyInterestedChange={(value) => updateFilter('onlyInterested', value)}
        onOnlyLikedByMeChange={(value) => updateFilter('onlyLikedByMe', value)}
        onReset={resetFilters}
        onExportCSV={() => exportToCSV(sortedProposals, `propuestas_${new Date().toISOString().split('T')[0]}.csv`)}
        onExportPDF={() => exportToPDF(sortedProposals, `propuestas_${new Date().toISOString().split('T')[0]}.pdf`).catch(() => {})}
      />

      <ProposalsTabs
        selectedTab={selectedTab}
        onSelectTab={(tab) => updateFilter('selectedTab', tab)}
      />

      <div className="grid grid-cols-1 gap-4">
        {sortedProposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
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