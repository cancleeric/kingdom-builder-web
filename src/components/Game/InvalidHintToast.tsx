/**
 * R30: Lightweight hint toast shown when a player clicks an invalid cell
 * during the PlaceSettlements phase. Explains *why* the placement is invalid.
 *
 * - Controlled entirely by App.tsx state (message / null).
 * - Auto-dismiss timer lives in App; this component is purely presentational.
 * - pointer-events-none so it never blocks board interaction.
 * - aria-live="polite" ensures screen readers announce the hint.
 */

interface InvalidHintToastProps {
  message: string | null;
}

export function InvalidHintToast({ message }: InvalidHintToastProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-36 left-1/2 -translate-x-1/2 z-50 animate-hint-toast-in pointer-events-none"
    >
      <div
        className="rounded-xl shadow-lg px-4 py-2.5 text-sm font-medium text-center max-w-[16rem]"
        style={{
          background: 'var(--toast-bg)',
          color: 'var(--toast-text)',
          border: '1px solid var(--toast-border)',
        }}
      >
        {message}
      </div>
    </div>
  );
}
