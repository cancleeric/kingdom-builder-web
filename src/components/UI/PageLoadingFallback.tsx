export function PageLoadingFallback() {
  return (
    <div
      className="w-screen h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="flex flex-col items-center gap-3"
        style={{ color: 'var(--color-stone-500)' }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--button-primary-bg)', borderTopColor: 'transparent' }}
        />
        <span className="text-sm" style={{ fontFamily: 'var(--font-display)' }}>
          Loading…
        </span>
      </div>
    </div>
  );
}
