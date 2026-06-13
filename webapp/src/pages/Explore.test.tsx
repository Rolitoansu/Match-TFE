import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { MemoryRouter } from 'react-router-dom'
const getMock = vi.hoisted(() => vi.fn())
const postMock = vi.hoisted(() => vi.fn())

vi.mock('axios', () => {
  const interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  }

  const instance = {
    get: getMock,
    post: postMock,
    interceptors,
  }

  return {
    default: {
      create: vi.fn(() => instance),
      isAxiosError: vi.fn(() => false),
    },
    create: vi.fn(() => instance),
    isAxiosError: vi.fn(() => false),
  }
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}))

const navigateMock = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

const { default: Explore } = await import('./Explore')

function makeProposal(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: 'Neural Networks Research',
    description: 'An exploration into deep learning.',
    type: 1,
    publicationDate: '2024-01-10T00:00:00Z',
    status: 'proposed',
    creatorId: 10,
    creatorName: 'Dr. María',
    creatorSurname: 'López',
    creatorBiography: null,
    liked: false,
    matchStatus: null,
    tags: ['AI', 'Python'],
    ...overrides,
  }
}

function makeExploreResponse(overrides: Record<string, unknown> = {}) {
  return {
    viewerRole: 'student',
    proposals: [makeProposal()],
    matchedProposal: null,
    ...overrides,
  }
}

function renderExplore() {
  return render(
    <MemoryRouter>
      <Explore />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  navigateMock.mockReset()
  getMock.mockReset()
  postMock.mockReset()
})

test('shows a loading indicator while the data is being fetched', async () => {
  getMock.mockReturnValue(new Promise(() => {}))

  const screen = await renderExplore()
  await expect.element(screen.getByText('explore.loading')).toBeInTheDocument()
})

test('shows an error message when the API call fails', async () => {
  getMock.mockRejectedValue(new Error('network error'))

  const screen = await renderExplore()
  await expect.element(screen.getByText('explore.errors.load')).toBeInTheDocument()
})

test('shows the empty state view when there are no proposals', async () => {
  getMock.mockResolvedValue({ data: makeExploreResponse({ proposals: [] }) })

  const screen = await renderExplore()
  await expect.element(screen.getByText('explore.empty.title')).toBeInTheDocument()
})

test('renders the current proposal card with its title and creator name', async () => {
  getMock.mockResolvedValue({ data: makeExploreResponse() })

  const screen = await renderExplore()
  await expect.element(screen.getByText('Neural Networks Research')).toBeInTheDocument()
  await expect.element(screen.getByText('Dr. María López')).toBeInTheDocument()
})

test('the like button calls the like endpoint and advances to the next proposal', async () => {
  const second = makeProposal({
    id: 2,
    title: 'Robotics Lab',
    creatorName: 'Prof. Juan',
    creatorSurname: 'García',
  })

  getMock.mockResolvedValue({
    data: makeExploreResponse({ proposals: [makeProposal(), second] }),
  })
  postMock.mockResolvedValue({ data: { liked: true, matchStatus: null } })

  const screen = await renderExplore()
  await expect.element(screen.getByText('Neural Networks Research')).toBeInTheDocument()
  await screen.getByText('explore.actions.like').click()

  await vi.waitFor(() => {
    expect(postMock).toHaveBeenCalledWith(
      expect.stringContaining('/project/proposals/1/like'),
    )
  })
  await expect.element(screen.getByText('Robotics Lab')).toBeInTheDocument()
})

test('the pass button calls the pass endpoint and advances to the next proposal', async () => {
  const second = makeProposal({
    id: 2,
    title: 'Robotics Lab',
    creatorName: 'Prof. Juan',
    creatorSurname: 'García',
  })

  getMock.mockResolvedValue({
    data: makeExploreResponse({ proposals: [makeProposal(), second] }),
  })
  postMock.mockResolvedValue({ data: {} })

  const screen = await renderExplore()
  await expect.element(screen.getByText('Neural Networks Research')).toBeInTheDocument()
  await screen.getByText('explore.actions.pass').click()

  await vi.waitFor(() => {
    expect(postMock).toHaveBeenCalledWith(
      expect.stringContaining('/project/proposals/1/pass'),
    )
  })
  await expect.element(screen.getByText('Robotics Lab')).toBeInTheDocument()
})

test('shows the matched proposal view when the user already has a match', async () => {
  getMock.mockResolvedValue({
    data: makeExploreResponse({
      matchedProposal: {
        id: 50,
        title: 'Quantum Computing',
        description: 'A matched project.',
        type: 1,
        publicationDate: '2024-03-01T00:00:00Z',
        status: 'in_progress',
        tags: ['quantum'],
        counterpartId: 20,
        counterpartName: 'Prof. Ana',
        counterpartSurname: 'Ruiz',
        counterpartEmail: 'ana@university.edu',
      },
    }),
  })

  const screen = await renderExplore()
  await expect.element(screen.getByText('explore.matched.title')).toBeInTheDocument()
  await expect.element(screen.getByText('Quantum Computing')).toBeInTheDocument()
})
