import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Button } from './Button'

describe('Button', () => {
  it('exposes its accessible name and handles activation', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<Button onClick={onClick}>Save progress</Button>)

    await user.click(screen.getByRole('button', { name: 'Save progress' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disables interaction while loading', () => {
    render(<Button loading>Saving</Button>)

    expect(screen.getByRole('button', { name: /Saving/ })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading')
  })
})
