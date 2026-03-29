import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BoardSkeleton } from '../components/UI/BoardSkeleton';

describe('BoardSkeleton', () => {
  it('renders loading indicator with accessible role and label', () => {
    render(<BoardSkeleton />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-label', 'Loading board…');
  });

  it('renders loading text visible to the user', () => {
    render(<BoardSkeleton />);
    expect(screen.getByText('Loading board…')).toBeInTheDocument();
  });

  it('renders animated skeleton tiles', () => {
    const { container } = render(<BoardSkeleton />);
    const tiles = container.querySelectorAll('.animate-pulse');
    // 5 rows × 8 columns = 40 tiles
    expect(tiles.length).toBe(40);
  });
});
