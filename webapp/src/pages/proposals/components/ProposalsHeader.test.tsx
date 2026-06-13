import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { ProposalsHeader } from './ProposalsHeader'

// ─── Mock ─────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}))

// ─── Tests ────────────────────────────────────────────────────────────────────

test('renders the proposals title', async () => {
  const screen = await render(
    <ProposalsHeader
      rolePlural="professors"
      search=""
      onSearchChange={() => {}}
      onCreateProposal={() => {}}
    />,
  )

  await expect.element(screen.getByText('proposals.title')).toBeInTheDocument()
})

test('renders the subtitle with the provided rolePlural value', async () => {
  const screen = await render(
    <ProposalsHeader
      rolePlural="students"
      search=""
      onSearchChange={() => {}}
      onCreateProposal={() => {}}
    />,
  )

  await expect.element(
    screen.getByText('proposals.subtitle:{"rolePlural":"students"}'),
  ).toBeInTheDocument()
})

test('the search input shows the current search value', async () => {
  const screen = await render(
    <ProposalsHeader
      rolePlural="professors"
      search="deep learning"
      onSearchChange={() => {}}
      onCreateProposal={() => {}}
    />,
  )

  const input = screen.getByRole('textbox')
  await expect.element(input).toHaveValue('deep learning')
})

test('onSearchChange is called when the user types in the search field', async () => {
  const onSearchChange = vi.fn()

  const screen = await render(
    <ProposalsHeader
      rolePlural="professors"
      search=""
      onSearchChange={onSearchChange}
      onCreateProposal={() => {}}
    />,
  )

  await screen.getByRole('textbox').fill('robotics')
  expect(onSearchChange).toHaveBeenCalled()
})

test('onCreateProposal is called when the new proposal button is clicked', async () => {
  const onCreateProposal = vi.fn()

  const screen = await render(
    <ProposalsHeader
      rolePlural="professors"
      search=""
      onSearchChange={() => {}}
      onCreateProposal={onCreateProposal}
    />,
  )

  // Use getByRole to target the button element directly (not a child text node)
  await screen.getByRole('button').click()
  expect(onCreateProposal).toHaveBeenCalledTimes(1)
})
