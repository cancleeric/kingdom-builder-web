import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../hooks/useTheme';

describe('useTheme', () => {
  let originalMatchMedia: typeof window.matchMedia;

  function mockMatchMedia(prefersDark: boolean) {
    const listeners: ((e: MediaQueryListEvent) => void)[] = [];
    const mq = {
      matches: prefersDark,
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
        listeners.push(cb);
      },
      removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
        const idx = listeners.indexOf(cb);
        if (idx !== -1) listeners.splice(idx, 1);
      },
      dispatchChange: (matches: boolean) => {
        listeners.forEach(cb => cb({ matches } as MediaQueryListEvent));
      },
    };
    window.matchMedia = vi.fn().mockReturnValue(mq);
    return mq;
  }

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to light when no saved preference and system is light', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('defaults to dark when no saved preference and system prefers dark', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('reads saved preference from localStorage', () => {
    mockMatchMedia(false);
    localStorage.setItem('kb-theme', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
  });

  it('toggleTheme switches from light to dark and saves to localStorage', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('kb-theme')).toBe('dark');
  });

  it('toggleTheme switches from dark to light and saves to localStorage', () => {
    mockMatchMedia(false);
    localStorage.setItem('kb-theme', 'dark');
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('kb-theme')).toBe('light');
  });

  it('follows system preference change when no saved preference', () => {
    const mq = mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    act(() => {
      mq.dispatchChange(true);
    });
    expect(result.current.theme).toBe('dark');
  });

  it('does NOT follow system preference when user has explicit preference saved', () => {
    localStorage.setItem('kb-theme', 'light');
    const mq = mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    act(() => {
      mq.dispatchChange(true);
    });
    // Should remain light because user explicitly saved 'light'
    expect(result.current.theme).toBe('light');
  });
});
