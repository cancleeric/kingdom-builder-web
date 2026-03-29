import { useState, useRef } from 'react';

export interface BottomDrawerProps {
  /** Title shown in the drawer handle */
  title: string;
  children: React.ReactNode;
  /** Default open state */
  defaultOpen?: boolean;
}

/**
 * Collapsible bottom drawer for mobile UI panels.
 * On mobile (<768px) the game controls live here.
 */
export function BottomDrawer({ title, children, defaultOpen = false }: BottomDrawerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const startYRef = useRef<number | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Swipe-up/down to toggle
  function handleTouchStart(e: React.TouchEvent) {
    startYRef.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (startYRef.current === null) return;
    const delta = startYRef.current - e.changedTouches[0].clientY;
    if (delta > 30) setIsOpen(true);   // swipe up
    if (delta < -30) setIsOpen(false); // swipe down
    startYRef.current = null;
  }

  return (
    <div
      ref={drawerRef}
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden"
      aria-label={title}
    >
      {/* Handle / header */}
      <div
        className="flex items-center justify-between bg-gray-800 text-white px-4 py-3 rounded-t-2xl cursor-pointer touch-manipulation select-none"
        role="button"
        aria-expanded={isOpen}
        aria-controls="bottom-drawer-content"
        tabIndex={0}
        onClick={() => setIsOpen((o) => !o)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen((o) => !o)}
      >
        {/* Drag indicator */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-500 rounded-full" />
        <span className="font-semibold text-sm">{title}</span>
        <span
          className="text-gray-400 text-lg leading-none transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden
        >
          ▲
        </span>
      </div>

      {/* Drawer body */}
      <div
        id="bottom-drawer-content"
        className={`bg-gray-900 text-white overflow-y-auto transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
