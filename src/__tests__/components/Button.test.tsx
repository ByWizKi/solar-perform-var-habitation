import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '@/components/ui/Button'

describe('Button Component', () => {
  it('rend correctement avec le texte fourni', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('appelle onClick quand cliqu', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('est dsactiv quand disabled est true', () => {
    const handleClick = jest.fn()
    render(
      <Button disabled onClick={handleClick}>
        Click me
      </Button>
    )

    const button = screen.getByText('Click me')
    expect(button).toBeDisabled()

    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applique la variante primary par dfaut', () => {
    render(<Button>Primary Button</Button>)
    const button = screen.getByText('Primary Button')
    expect(button.className).toContain('bg-blue-600')
  })

  it('applique la variante secondary', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    const button = screen.getByText('Secondary Button')
    expect(button.className).toContain('bg-gray-600')
  })

  it('applique la variante outline', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByText('Outline Button')
    expect(button.className).toContain('border')
  })

  it('applique la taille correcte', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByText('Small').className).toContain('h-8')

    rerender(<Button size="md">Medium</Button>)
    expect(screen.getByText('Medium').className).toContain('h-10')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByText('Large').className).toContain('h-12')
  })
})
