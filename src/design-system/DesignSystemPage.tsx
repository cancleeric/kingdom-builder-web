const scaleSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const

type ScaleName = 'warm-cream' | 'wine' | 'ink-green' | 'amber' | 'stone'

const scales: ScaleName[] = ['warm-cream', 'wine', 'ink-green', 'amber', 'stone']

const typeScale = [
  { token: 'display-2xl', sample: 'Kingdom Chronicle Display 2XL', family: 'var(--font-display)', lineHeight: 'var(--line-height-display)' },
  { token: 'display-xl', sample: 'Kingdom Chronicle Display XL', family: 'var(--font-display)', lineHeight: 'var(--line-height-display)' },
  { token: 'display-lg', sample: 'Kingdom Chronicle Display LG', family: 'var(--font-display)', lineHeight: 'var(--line-height-display)' },
  { token: 'display-md', sample: 'Kingdom Chronicle Display MD', family: 'var(--font-display)', lineHeight: 'var(--line-height-display)' },
  { token: 'display-sm', sample: 'Kingdom Chronicle Display SM', family: 'var(--font-display)', lineHeight: 'var(--line-height-display)' },
  { token: 'body-lg', sample: 'Body LG — The kingdom expands beyond the valley.', family: 'var(--font-body)', lineHeight: 'var(--line-height-body)' },
  { token: 'body-md', sample: 'Body MD — The kingdom expands beyond the valley.', family: 'var(--font-body)', lineHeight: 'var(--line-height-body)' },
  { token: 'body-sm', sample: 'Body SM — The kingdom expands beyond the valley.', family: 'var(--font-body)', lineHeight: 'var(--line-height-body)' },
  { token: 'label', sample: 'LABEL / STATUS', family: 'var(--font-body)', lineHeight: 'var(--line-height-label)' },
  { token: 'mono-num', sample: 'MONO-NUM 0123456789', family: 'var(--font-mono)', lineHeight: 'var(--line-height-body)' },
]

function ColorScale({ name }: { name: ScaleName }) {
  return (
    <section>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: '0.75rem' }}>{name}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, minmax(0, 1fr))', gap: '0.5rem' }}>
        {scaleSteps.map((step) => {
          const swatchVar = `var(--color-${name}-${step})`
          return (
            <div key={step}>
              <div
                style={{
                  background: swatchVar,
                  borderRadius: 'var(--radius-8)',
                  height: '3rem',
                  border: '1px solid var(--card-border)',
                }}
              />
              <div style={{ marginTop: '0.25rem', fontSize: 'var(--type-label)', fontFamily: 'var(--font-mono)' }}>{step}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function buttonStyle(variant: 'primary' | 'secondary' | 'ghost' | 'danger', size: 'sm' | 'md' | 'lg') {
  const variantStyles = {
    primary: {
      background: 'var(--button-primary-bg)',
      color: 'var(--button-text)',
      border: '1px solid transparent',
    },
    secondary: {
      background: 'var(--button-secondary-bg)',
      color: 'var(--button-text)',
      border: '1px solid transparent',
    },
    ghost: {
      background: 'var(--button-ghost-bg)',
      color: 'var(--color-text)',
      border: '1px solid var(--button-border)',
    },
    danger: {
      background: 'var(--button-danger-bg)',
      color: 'var(--button-text)',
      border: '1px solid transparent',
    },
  }

  const sizeStyles = {
    sm: {
      padding: 'var(--button-size-sm-y) var(--button-size-sm-x)',
      fontSize: 'var(--type-body-sm)',
    },
    md: {
      padding: 'var(--button-size-md-y) var(--button-size-md-x)',
      fontSize: 'var(--type-body-md)',
    },
    lg: {
      padding: 'var(--button-size-lg-y) var(--button-size-lg-x)',
      fontSize: 'var(--type-body-lg)',
    },
  }

  return {
    ...variantStyles[variant],
    ...sizeStyles[size],
    borderRadius: 'var(--radius-12)',
    boxShadow: 'var(--shadow-soft)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
  } as const
}

export function DesignSystemPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '2rem',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        backgroundColor: 'var(--color-bg)',
        backgroundImage: 'var(--texture-parchment)',
      }}
    >
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--type-display-lg)', margin: 0 }}>Design System Tokens</h1>
      <p style={{ fontSize: 'var(--type-body-md)', marginTop: '0.5rem' }}>
        OKLCH palette, typography, shape/elevation, and component primitives for Kingdom Builder UI.
      </p>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--type-display-sm)' }}>Color scales</h2>
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {scales.map((name) => (
            <ColorScale key={name} name={name} />
          ))}
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--type-display-sm)' }}>Semantic + player aliases</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, minmax(0, 1fr))', gap: '0.5rem' }}>
          {[
            ['bg', 'var(--color-bg)'],
            ['surface', 'var(--color-surface)'],
            ['text', 'var(--color-text)'],
            ['success', 'var(--color-success)'],
            ['warning', 'var(--color-warning)'],
            ['danger', 'var(--color-danger)'],
            ['info', 'var(--color-info)'],
            ['player-red', 'var(--color-player-red)'],
            ['player-blue', 'var(--color-player-blue)'],
            ['player-green', 'var(--color-player-green)'],
            ['player-yellow', 'var(--color-player-yellow)'],
          ].map(([label, color]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ background: color, height: '3rem', borderRadius: 'var(--radius-8)', border: '1px solid var(--card-border)' }} />
              <div style={{ marginTop: '0.25rem', fontSize: 'var(--type-label)', fontFamily: 'var(--font-mono)' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--type-display-sm)' }}>Typography scale</h2>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {typeScale.map(({ token, sample, family, lineHeight }) => (
            <p
              key={token}
              style={{
                margin: 0,
                fontFamily: family,
                fontSize: `var(--type-${token})`,
                lineHeight,
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--type-label)', marginRight: '0.5rem' }}>{token}</span>
              {sample}
            </p>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--type-display-sm)' }}>Shape & elevation</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
          {[
            ['radius-8 + soft', 'var(--radius-8)', 'var(--shadow-soft)'],
            ['radius-12 + medium', 'var(--radius-12)', 'var(--shadow-medium)'],
            ['radius-20 + lifted', 'var(--radius-20)', 'var(--shadow-lifted)'],
          ].map(([label, radius, shadow]) => (
            <div key={label} style={{ borderRadius: radius, boxShadow: shadow, background: 'var(--color-surface)', padding: '1rem', border: '1px solid var(--card-border)' }}>
              {label}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--type-display-sm)' }}>Component tokens</h2>

        <h3 style={{ marginBottom: '0.5rem' }}>Buttons (4 variants × 3 sizes)</h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <div key={size} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {(['primary', 'secondary', 'ghost', 'danger'] as const).map((variant) => (
                <button key={`${size}-${variant}`} type="button" style={buttonStyle(variant, size)}>
                  {variant} {size}
                </button>
              ))}
            </div>
          ))}
        </div>

        <h3 style={{ margin: '1.25rem 0 0.5rem' }}>Cards</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem' }}>
          <article style={{ borderRadius: 'var(--radius-14)', border: '1px solid var(--card-border)', background: 'var(--card-bg)', padding: '1rem' }}>Card default</article>
          <article style={{ borderRadius: 'var(--radius-14)', border: '1px solid var(--card-border)', background: 'var(--card-bg)', boxShadow: 'var(--card-elevated-shadow)', padding: '1rem' }}>Card elevated</article>
          <article style={{ borderRadius: 'var(--radius-14)', border: '1px solid var(--card-outline-border)', background: 'transparent', padding: '1rem' }}>Card outline</article>
        </div>

        <h3 style={{ margin: '1.25rem 0 0.5rem' }}>Chip / Badge</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ background: 'var(--chip-bg)', color: 'var(--chip-text)', borderRadius: 'var(--radius-full)', padding: '0.25rem 0.625rem', fontSize: 'var(--type-body-sm)' }}>Chip token</span>
          <span style={{ background: 'var(--badge-bg)', color: 'var(--badge-text)', borderRadius: 'var(--radius-8)', padding: '0.25rem 0.5rem', fontSize: 'var(--type-label)', fontWeight: 700 }}>BADGE</span>
        </div>

        <h3 style={{ margin: '1.25rem 0 0.5rem' }}>Progress bar</h3>
        <div style={{ maxWidth: '24rem', height: '0.75rem', borderRadius: 'var(--radius-full)', background: 'var(--progress-track)', overflow: 'hidden' }}>
          <div style={{ width: '64%', height: '100%', background: 'var(--progress-fill)' }} />
        </div>

        <h3 style={{ margin: '1.25rem 0 0.5rem' }}>Toast</h3>
        <div style={{ maxWidth: '24rem', borderRadius: 'var(--radius-12)', background: 'var(--toast-bg)', color: 'var(--toast-text)', border: '1px solid var(--toast-border)', boxShadow: 'var(--shadow-medium)', padding: '0.75rem 1rem' }}>
          <strong style={{ display: 'block' }}>Saved</strong>
          <span style={{ fontSize: 'var(--type-body-sm)' }}>Design tokens are now available across components.</span>
        </div>
      </section>
    </main>
  )
}
