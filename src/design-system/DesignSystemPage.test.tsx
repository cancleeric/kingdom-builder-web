import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DesignSystemPage } from './DesignSystemPage'

describe('DesignSystemPage', () => {
  it('renders all required token preview sections', () => {
    render(<DesignSystemPage />)

    expect(screen.getByRole('heading', { name: 'Design System Tokens' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Color scales' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Semantic + player aliases' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Typography scale' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Shape & elevation' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Component tokens' })).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'primary sm' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(12)
    expect(screen.getByRole('heading', { name: 'warm-cream' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'stone' })).toBeInTheDocument()
    expect(screen.getAllByText('50')).toHaveLength(5)
    expect(screen.getByText('Card elevated')).toBeInTheDocument()
    expect(screen.getByText('Chip token')).toBeInTheDocument()
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })
})
