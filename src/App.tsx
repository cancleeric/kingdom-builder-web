import { useEffect, useState } from 'react'
import './App.css'
import { BoardView } from './components/BoardView'
import { TERRAIN_META } from './core/terrain'
import { useGameStore } from './store/gameStore'

function App() {
  const board = useGameStore((state) => state.board)
  const turn = useGameStore((state) => state.turn)
  const status = useGameStore((state) => state.status)
  const availablePlacements = useGameStore((state) => state.availablePlacements)
  const score = useGameStore((state) => state.score)
  const nextTurn = useGameStore((state) => state.nextTurn)
  const terrainCard = TERRAIN_META[turn.terrainCard]
  const [showTransition, setShowTransition] = useState(false)

  useEffect(() => {
    if (turn.number === 1 && turn.phase !== 'turn-transition') {
      return
    }

    if (turn.phase !== 'turn-transition') {
      return
    }

    setShowTransition(true)

    const timer = window.setTimeout(() => {
      setShowTransition(false)
    }, 1600)

    return () => {
      window.clearTimeout(timer)
    }
  }, [turn.number, turn.phase])

  const completedSteps = 3 - turn.housesRemaining

  return (
    <main className="app-shell">
      {showTransition ? (
        <div className="turn-transition" role="status" aria-live="polite">
          <p className="turn-transition-label">Next turn</p>
          <strong>{`輪到 ${turn.playerName}`}</strong>
          <span>{`地形卡：${terrainCard.label}`}</span>
        </div>
      ) : null}

      <section className="hero-panel">
        <div>
          <p className="eyebrow">Kingdom Builder Web</p>
          <h1>先把核心回合做成可玩的六角格原型。</h1>
          <p className="hero-copy">
            目前已實作地形卡、合法位置判定、每回合 3 間房屋放置，以及城堡接觸得分。
          </p>
        </div>

        <div className="turn-card">
          <span className="turn-label">Turn status</span>
          <div className="status-banner" data-phase={turn.phase}>
            <p className="status-banner-title">{status.title}</p>
            <p className="status-banner-detail">{status.detail}</p>
          </div>
          <strong
            className="terrain-chip terrain-chip-large"
            style={{ ['--chip-color' as string]: terrainCard.color }}
          >
            {terrainCard.label}
          </strong>
          <div className="step-indicator" aria-label={`本回合已完成 ${completedSteps} / 3 步`}>
            {Array.from({ length: 3 }, (_, index) => {
              const state = index < completedSteps ? 'done' : index === completedSteps ? 'active' : 'idle'

              return <span key={index} className={`step-dot step-dot-${state}`} />
            })}
          </div>
          <div className="turn-stats">
            <span>{`Turn ${turn.number}`}</span>
            <span>{`${turn.housesRemaining} houses left`}</span>
            <span>{`${availablePlacements.length} legal tiles`}</span>
          </div>
          <button className="secondary-button" onClick={nextTurn}>
            Skip terrain card
          </button>
        </div>
      </section>

      <section className="board-layout">
        <div className="board-panel">
          <BoardView board={board} legalMoves={availablePlacements} />
          <p className="status-line">{status.detail}</p>
        </div>

        <aside className="sidebar">
          <section className="sidebar-card">
            <h2>Round status</h2>
            <dl className="score-grid">
              <div>
                <dt>Score</dt>
                <dd>{score}</dd>
              </div>
              <div>
                <dt>Settlements</dt>
                <dd>{board.filter((tile) => tile.hasSettlement).length}</dd>
              </div>
              <div>
                <dt>Castles touched</dt>
                <dd>{board.filter((tile) => tile.castle && tile.hasSettlement).length}</dd>
              </div>
            </dl>
          </section>

          <section className="sidebar-card">
            <h2>Terrain legend</h2>
            <ul className="legend-list">
              {Object.values(TERRAIN_META).map((terrain) => (
                <li key={terrain.id}>
                  <span
                    className="terrain-chip"
                    style={{ ['--chip-color' as string]: terrain.color }}
                  >
                    {terrain.label}
                  </span>
                  <span>{terrain.description}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="sidebar-card">
            <h2>MVP rules</h2>
            <ul className="rules-list">
              <li>每回合抽一種地形，必須在該地形放置 3 間房屋。</li>
              <li>若可相鄰既有聚落，放置位置必須優先相鄰。</li>
              <li>水域與山脈不可建造。</li>
              <li>房屋接觸城堡時，立即累積 3 分。</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  )
}

export default App
