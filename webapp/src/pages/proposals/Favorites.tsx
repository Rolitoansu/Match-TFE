import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart } from 'lucide-react'
import api from '../../api/axios'
import { ProposalCard } from './components/ProposalCard'
import { useFavorites } from './hooks/useFavorites'
import type { Proposal } from './model/proposalTypes'

export default function Favorites() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toggleFavorite, isFavorite } = useFavorites()
  const [proposals, setProposals] = useState<Proposal[]>([])

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

  const favoriteProposals = proposals.filter((p) => isFavorite(p.id))

  return (
    <div className="mx-auto max-w-300 p-4 sm:p-6 lg:p-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart size={28} className="text-rose-600" fill="currentColor" />
          <h1 className="text-3xl font-bold text-foreground">{t('proposals.favorites.title')}</h1>
        </div>
        <p className="text-muted-foreground">{t('proposals.favorites.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {favoriteProposals.length > 0 ? (
          favoriteProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onViewDetails={(proposalId) => navigate(`/proposals/details/${proposalId}`)}
              isFavorite={isFavorite(proposal.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))
        ) : (
          <div className="bg-white border border-border rounded-3xl p-8 text-center text-sm text-muted-foreground">
            <Heart size={32} className="mx-auto mb-2 text-rose-200" />
            {t('proposals.favorites.empty')}
          </div>
        )}
      </div>
    </div>
  )
}
