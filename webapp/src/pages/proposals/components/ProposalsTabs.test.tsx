import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import type { StatusTab } from '../model/proposalTypes'
import { ProposalsTabs } from './ProposalsTabs'

// ─── Mock ─────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TABS: Array<{ id: StatusTab; label: string }> = [
  { id: 'all', label: 'proposals.tabs.all' },
  { id: 'open', label: 'proposals.tabs.open' },
  { id: 'in_progress', label: 'proposals.tabs.inProgress' },
  { id: 'completed', label: 'proposals.tabs.completed' },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

test('renders all four tab labels', async () => {
  const screen = await render(<ProposalsTabs selectedTab="all" onSelectTab={() => {}} />)

  for (const { label } of TABS) {
    await expect.element(screen.getByText(label)).toBeInTheDocument()
  }
})

test('the active tab button carries the primary text colour class', async () => {
  const screen = await render(<ProposalsTabs selectedTab="open" onSelectTab={() => {}} />)

  // Find the button by its accessible role and name to target the element, not a text node
  const activeButton = screen.getByRole('button', { name: 'proposals.tabs.open' })
  await expect.element(activeButton).toHaveClass('text-primary')
})

test('an inactive tab button does not carry the primary text colour class', async () => {
  const screen = await render(<ProposalsTabs selectedTab="all" onSelectTab={() => {}} />)

  const inactiveButton = screen.getByRole('button', { name: 'proposals.tabs.open' })
  await expect.element(inactiveButton).not.toHaveClass('text-primary')
})

test.each(TABS)(
  'clicking the "$id" tab button calls onSelectTab with "$id"',
  async ({ id, label }) => {
    const onSelectTab = vi.fn()

    const screen = await render(
      <ProposalsTabs selectedTab="completed" onSelectTab={onSelectTab} />,
    )

    // Use getByRole to click the button element itself, not a descendant text node
    await screen.getByRole('button', { name: label }).click()
    expect(onSelectTab).toHaveBeenCalledWith(id)
  },
)

test('the active indicator is rendered inside the selected tab button', async () => {
  const screen = await render(<ProposalsTabs selectedTab="in_progress" onSelectTab={() => {}} />)

  const activeButton = screen.getByRole('button', { name: 'proposals.tabs.inProgress' })
  const indicator = activeButton.element().querySelector('div')
  expect(indicator).not.toBeNull()
})

test('no indicator is rendered inside an inactive tab button', async () => {
  const screen = await render(<ProposalsTabs selectedTab="all" onSelectTab={() => {}} />)

  const inactiveButton = screen.getByRole('button', { name: 'proposals.tabs.open' })
  const indicator = inactiveButton.element().querySelector('div')
  expect(indicator).toBeNull()
})
