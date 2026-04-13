import type { StatusTab } from '../proposalTypes'

type Props = {
  tabs: Array<{ id: StatusTab; label: string }>
  selectedTab: StatusTab
  onSelectTab: (tab: StatusTab) => void
}

export function ProposalsTabs({ tabs, selectedTab, onSelectTab }: Props) {
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
