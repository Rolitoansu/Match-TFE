import { test, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import LandingPage from './LandingPage'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

vi.mock('@mui/material', () => ({
    Button: ({ children, href, className }: { children: React.ReactNode; href?: string; className?: string }) => (
        <a href={href} className={className}>{children}</a>
    ),
}))

test('should render the landing page', async () => {
    const screen = await render(<LandingPage />)

    expect(screen.getByText('Match-TFE')).toBeInTheDocument()
    expect(screen.getByText('landing.subtitle')).toBeInTheDocument()
    expect(screen.getByText('landing.featureMatch')).toBeInTheDocument()
    expect(screen.getByText('landing.featureConnect')).toBeInTheDocument()
})