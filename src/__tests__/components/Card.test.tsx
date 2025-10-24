import React from 'react'
import { render, screen } from '@testing-library/react'
import Card from '@/components/ui/Card'

describe('Card Component', () => {
  it('rend le contenu enfant', () => {
    render(<Card>Test Content</Card>)
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('affiche le titre quand fourni', () => {
    render(<Card title="Test Title">Content</Card>)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('affiche la description quand fournie', () => {
    render(
      <Card title="Title" description="Test Description">
        Content
      </Card>
    )
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('applique les classes personnalises', () => {
    const { container } = render(<Card className="custom-class">Content</Card>)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('applique les styles de base', () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.firstChild
    expect(card).toHaveClass('rounded-lg')
    expect(card).toHaveClass('bg-white')
  })
})
