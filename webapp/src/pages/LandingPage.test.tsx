import { test, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import LandingPage from './LandingPage'

test('should render the landing page', async () => {
    const screen = await render(<LandingPage />)
    expect(screen.getByText('Match-TFE')).toBeInTheDocument()
})