import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomDrawer } from '../components/UI/BottomDrawer';

describe('BottomDrawer', () => {
  it('renders with closed state by default', () => {
    render(
      <BottomDrawer title="遊戲面板">
        <p>Content</p>
      </BottomDrawer>
    );
    const content = screen.getByText('Content');
    const contentWrapper = content.closest('#bottom-drawer-content');
    expect(contentWrapper).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders with open state when defaultOpen is true', () => {
    render(
      <BottomDrawer title="遊戲面板" defaultOpen>
        <p>Content</p>
      </BottomDrawer>
    );
    const contentWrapper = screen.getByText('Content').closest('#bottom-drawer-content');
    expect(contentWrapper).toHaveAttribute('aria-hidden', 'false');
  });

  it('toggles open/closed when header is clicked', () => {
    render(
      <BottomDrawer title="遊戲面板">
        <p>Content</p>
      </BottomDrawer>
    );

    const header = screen.getByRole('button', { name: /遊戲面板/ });
    const contentWrapper = screen.getByText('Content').closest('#bottom-drawer-content');

    // Initially closed
    expect(contentWrapper).toHaveAttribute('aria-hidden', 'true');

    // Click to open
    fireEvent.click(header);
    expect(contentWrapper).toHaveAttribute('aria-hidden', 'false');

    // Click to close
    fireEvent.click(header);
    expect(contentWrapper).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders the title in the handle', () => {
    render(
      <BottomDrawer title="回合資訊">
        <p>Content</p>
      </BottomDrawer>
    );
    expect(screen.getByText('回合資訊')).toBeInTheDocument();
  });

  it('shows aria-expanded on the header button', () => {
    render(
      <BottomDrawer title="遊戲面板" defaultOpen={false}>
        <p>Content</p>
      </BottomDrawer>
    );
    const header = screen.getByRole('button', { name: /遊戲面板/ });
    expect(header).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  it('swipe up opens the drawer', () => {
    render(
      <BottomDrawer title="遊戲面板">
        <p>Content</p>
      </BottomDrawer>
    );
    const header = screen.getByRole('button', { name: /遊戲面板/ });
    const contentWrapper = screen.getByText('Content').closest('#bottom-drawer-content');

    // Simulate swipe up (startY > endY by >30px)
    fireEvent.touchStart(header, {
      touches: [{ clientY: 200 }],
      changedTouches: [{ clientY: 200 }],
    });
    fireEvent.touchEnd(header, {
      touches: [],
      changedTouches: [{ clientY: 160 }], // moved up 40px
    });

    expect(contentWrapper).toHaveAttribute('aria-hidden', 'false');
  });

  it('swipe down closes the drawer', () => {
    render(
      <BottomDrawer title="遊戲面板" defaultOpen>
        <p>Content</p>
      </BottomDrawer>
    );
    const header = screen.getByRole('button', { name: /遊戲面板/ });
    const contentWrapper = screen.getByText('Content').closest('#bottom-drawer-content');

    // Initially open
    expect(contentWrapper).toHaveAttribute('aria-hidden', 'false');

    // Simulate swipe down (startY < endY by >30px)
    fireEvent.touchStart(header, {
      touches: [{ clientY: 160 }],
      changedTouches: [{ clientY: 160 }],
    });
    fireEvent.touchEnd(header, {
      touches: [],
      changedTouches: [{ clientY: 210 }], // moved down 50px
    });

    expect(contentWrapper).toHaveAttribute('aria-hidden', 'true');
  });
});
