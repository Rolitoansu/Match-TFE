import { useTranslation } from 'react-i18next'
import type { StatusTab } from '../model/proposalTypes'

type Props = {
  selectedTab: StatusTab
  onSelectTab: (tab: StatusTab) => void
}

export function ProposalsTabs({ selectedTab, onSelectTab }: Props) {
  const { t } = useTranslation()

  const tabs: Array<{ id: StatusTab; label: string }> = [
    { id: 'all', label: t('proposals.tabs.all') },
    { id: 'open', label: t('proposals.tabs.open') },
    { id: 'in_progress', label: t('proposals.tabs.inProgress') },
    { id: 'completed', label: t('proposals.tabs.completed') },
  ]

  return (
    <div className="mb-8 flex gap-6 overflow-x-auto border-b border-border sm:gap-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelectTab(tab.id)}
          className={`relative min-w-max pb-4 text-sm font-bold transition-all ${
            selectedTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
          {selectedTab === tab.id && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  )
}
