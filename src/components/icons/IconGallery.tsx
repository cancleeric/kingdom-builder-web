import { Icon } from './Icon'
import type { IconName } from './Icon'

const LOCATION_ICONS: { name: IconName; label: string }[] = [
  { name: 'castle', label: 'Castle' },
  { name: 'farm', label: 'Farm' },
  { name: 'harbor', label: 'Harbor' },
  { name: 'oasis', label: 'Oasis' },
  { name: 'tower', label: 'Tower' },
  { name: 'paddock', label: 'Paddock' },
  { name: 'barn', label: 'Barn' },
  { name: 'oracle', label: 'Oracle' },
  { name: 'tavern', label: 'Tavern' },
]

const GAME_ICONS: { name: IconName; label: string }[] = [
  { name: 'play', label: 'Play' },
  { name: 'pause', label: 'Pause' },
  { name: 'undo', label: 'Undo' },
  { name: 'redo', label: 'Redo' },
  { name: 'end-turn', label: 'End Turn' },
  { name: 'draw-card', label: 'Draw Card' },
  { name: 'settings', label: 'Settings' },
  { name: 'restart', label: 'Restart' },
]

const STATE_ICONS: { name: IconName; label: string }[] = [
  { name: 'bot', label: 'Bot' },
  { name: 'human', label: 'Human' },
  { name: 'connected', label: 'Connected' },
  { name: 'disconnected', label: 'Disconnected' },
  { name: 'muted', label: 'Muted' },
  { name: 'unmuted', label: 'Unmuted' },
]

const FEATURE_ICONS: { name: IconName; label: string }[] = [
  { name: 'achievement', label: 'Achievement' },
  { name: 'leaderboard', label: 'Leaderboard' },
  { name: 'replay', label: 'Replay' },
  { name: 'tutorial', label: 'Tutorial' },
  { name: 'save', label: 'Save' },
  { name: 'load', label: 'Load' },
]

const NAV_ICONS: { name: IconName; label: string }[] = [
  { name: 'close', label: 'Close' },
  { name: 'chevron', label: 'Chevron' },
  { name: 'menu', label: 'Menu' },
  { name: 'more', label: 'More' },
  { name: 'search', label: 'Search' },
]

function IconGrid({ title, icons }: { title: string; icons: { name: IconName; label: string }[] }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#374151' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {icons.map(({ name, label }) => (
          <div
            key={name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.75rem',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              minWidth: '72px',
            }}
          >
            <Icon name={name} size={24} />
            <span style={{ fontSize: '0.7rem', color: '#6b7280', textAlign: 'center' }}>{label}</span>
            <span style={{ fontSize: '0.6rem', color: '#9ca3af', fontFamily: 'monospace' }}>{name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function IconGallery() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
          Icon Gallery — Kingdom Builder
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          39 stroke-based SVG icons, 24&times;24, currentColor. Usage:{' '}
          <code style={{ background: '#f3f4f6', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.8rem' }}>
            &lt;Icon name="castle" size={'{20}'} /&gt;
          </code>
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '1rem',
          background: '#1f2937',
          borderRadius: '0.5rem',
          color: 'white',
        }}
      >
        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Dark mode preview:</span>
        {LOCATION_ICONS.slice(0, 5).map(({ name }) => (
          <Icon key={name} name={name} size={20} color="white" />
        ))}
      </div>

      <IconGrid title="Location Tiles (9)" icons={LOCATION_ICONS} />
      <IconGrid title="Game Actions (8)" icons={GAME_ICONS} />
      <IconGrid title="State Indicators (6)" icons={STATE_ICONS} />
      <IconGrid title="Features (6)" icons={FEATURE_ICONS} />
      <IconGrid title="Navigation (5)" icons={NAV_ICONS} />

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
          Total: {LOCATION_ICONS.length + GAME_ICONS.length + STATE_ICONS.length + FEATURE_ICONS.length + NAV_ICONS.length} icons
          &nbsp;|&nbsp; All stroke-based, no fill, currentColor &nbsp;|&nbsp; Tree-shake friendly (individual exports)
        </p>
      </div>
    </div>
  )
}
