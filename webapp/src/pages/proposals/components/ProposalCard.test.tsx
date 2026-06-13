import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import type { Proposal } from '../model/proposalTypes'
import { ProposalCard } from './ProposalCard'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

function makeProposal(overrides: Partial<Proposal> = {}): Proposal {
  return {
    id: 1,
    title: 'Blockchain for Supply Chain',
    description: 'A study on blockchain applications.',
    type: 2,
    publicationDate: '2024-03-01T00:00:00Z',
    status: 'proposed',
    creatorName: 'Carlos',
    creatorSurname: 'Pérez',
    interestCount: 4,
    likedByCurrentUser: false,
    passedByCurrentUser: false,
    tags: ['blockchain', 'logistics'],
    ...overrides,
  }
}

test('renders the proposal title and the creator name', async () => {
  const screen = await render(
    <ProposalCard proposal={makeProposal()} onViewDetails={() => {}} />,
  )

  await expect.element(screen.getByText('Blockchain for Supply Chain')).toBeInTheDocument()
  await expect.element(screen.getByText(/Carlos\s+Pérez/)).toBeInTheDocument()
})

test('the view details button calls onViewDetails with the proposal id', async () => {
  const onViewDetails = vi.fn()

  const screen = await render(
    <ProposalCard proposal={makeProposal({ id: 7 })} onViewDetails={onViewDetails} />,
  )

  await screen.getByText('proposals.viewDetails').click()
  expect(onViewDetails).toHaveBeenCalledWith(7)
})

test('renders the like button when onToggleLike is provided', async () => {
  const onToggleLike = vi.fn()

  const screen = await render(
    <ProposalCard
      proposal={makeProposal()}
      onViewDetails={() => {}}
      onToggleLike={onToggleLike}
    />,
  )

  const likeButton = screen.getByTitle('proposals.addLike')
  await expect.element(likeButton).toBeInTheDocument()
})

test('clicking the like button calls onToggleLike with the proposal id', async () => {
  const onToggleLike = vi.fn()

  const screen = await render(
    <ProposalCard
      proposal={makeProposal({ id: 3 })}
      onViewDetails={() => {}}
      onToggleLike={onToggleLike}
    />,
  )

  await screen.getByTitle('proposals.addLike').click()
  expect(onToggleLike).toHaveBeenCalledWith(3)
})

test('the like button is disabled while a like request is in progress', async () => {
  const screen = await render(
    <ProposalCard
      proposal={makeProposal()}
      onViewDetails={() => {}}
      onToggleLike={() => {}}
      isLikeLoading={true}
    />,
  )

  const likeButton = screen.getByTitle('proposals.addLike')
  await expect.element(likeButton).toBeDisabled()
})

test('the like button is disabled when the proposal has already been passed', async () => {
  const screen = await render(
    <ProposalCard
      proposal={makeProposal({ passedByCurrentUser: true })}
      onViewDetails={() => {}}
      onToggleLike={() => {}}
    />,
  )

  const likeButton = screen.getByTitle('proposals.addLike')
  await expect.element(likeButton).toBeDisabled()
})

test('the pass button is disabled when the proposal is already liked by the user', async () => {
  const screen = await render(
    <ProposalCard
      proposal={makeProposal({ likedByCurrentUser: true })}
      onViewDetails={() => {}}
      onToggleLike={() => {}}
      onTogglePass={() => {}}
    />,
  )

  const passButton = screen.getByTitle('explore.actions.pass')
  await expect.element(passButton).toBeDisabled()
})

test('shows "proposals.status.open" label for a proposed status', async () => {
  const screen = await render(
    <ProposalCard proposal={makeProposal({ status: 'proposed' })} onViewDetails={() => {}} />,
  )

  await expect.element(screen.getByText('proposals.status.open')).toBeInTheDocument()
})

test('shows "proposals.status.inProgress" label for an in_progress status', async () => {
  const screen = await render(
    <ProposalCard proposal={makeProposal({ status: 'in_progress' })} onViewDetails={() => {}} />,
  )

  await expect.element(screen.getByText('proposals.status.inProgress')).toBeInTheDocument()
})

test('shows "proposals.status.completed" label for a completed status', async () => {
  const screen = await render(
    <ProposalCard proposal={makeProposal({ status: 'completed' })} onViewDetails={() => {}} />,
  )

  await expect.element(screen.getByText('proposals.status.completed')).toBeInTheDocument()
})

test('does not render the like button when neither onToggleLike nor onToggleFavorite is provided', async () => {
  const screen = await render(
    <ProposalCard proposal={makeProposal()} onViewDetails={() => {}} />,
  )

  expect(screen.getByTitle('proposals.addLike').query()).toBeNull()
})
