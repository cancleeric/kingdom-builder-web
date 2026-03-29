import GameSetup from './components/GameSetup/GameSetup'
import TutorialOverlay from './components/Tutorial/TutorialOverlay'
import { useTutorialStore } from './store/tutorialStore'

function App() {
  const { isActive } = useTutorialStore()

  return (
    <>
      <GameSetup onStartGame={() => alert('遊戲即將開始！')} />
      {isActive && <TutorialOverlay />}
    </>
  )
}

export default App
