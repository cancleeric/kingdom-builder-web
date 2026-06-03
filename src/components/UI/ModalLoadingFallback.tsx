export function ModalLoadingFallback() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'oklch(0 0 0 / 0.4)' }}
    >
      <div
        className="rounded-2xl p-8 flex flex-col items-center gap-3"
        style={{ backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-medium)' }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--button-primary-bg)', borderTopColor: 'transparent' }}
        />
      </div>
    </div>
  );
}
