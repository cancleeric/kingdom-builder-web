import type { SVGProps } from 'react'
import { CastleIcon } from './CastleIcon'
import { FarmIcon } from './FarmIcon'
import { HarborIcon } from './HarborIcon'
import { OasisIcon } from './OasisIcon'
import { TowerIcon } from './TowerIcon'
import { PaddockIcon } from './PaddockIcon'
import { BarnIcon } from './BarnIcon'
import { OracleIcon } from './OracleIcon'
import { TavernIcon } from './TavernIcon'
import { PlayIcon } from './PlayIcon'
import { PauseIcon } from './PauseIcon'
import { UndoIcon } from './UndoIcon'
import { RedoIcon } from './RedoIcon'
import { EndTurnIcon } from './EndTurnIcon'
import { DrawCardIcon } from './DrawCardIcon'
import { SettingsIcon } from './SettingsIcon'
import { RestartIcon } from './RestartIcon'
import { BotIcon } from './BotIcon'
import { HumanIcon } from './HumanIcon'
import { ConnectedIcon } from './ConnectedIcon'
import { DisconnectedIcon } from './DisconnectedIcon'
import { MutedIcon } from './MutedIcon'
import { UnmutedIcon } from './UnmutedIcon'
import { AchievementIcon } from './AchievementIcon'
import { LeaderboardIcon } from './LeaderboardIcon'
import { ReplayIcon } from './ReplayIcon'
import { TutorialIcon } from './TutorialIcon'
import { SaveIcon } from './SaveIcon'
import { LoadIcon } from './LoadIcon'
import { CloseIcon } from './CloseIcon'
import { ChevronIcon } from './ChevronIcon'
import { MenuIcon } from './MenuIcon'
import { MoreIcon } from './MoreIcon'
import { SearchIcon } from './SearchIcon'

export type IconName =
  | 'castle'
  | 'farm'
  | 'harbor'
  | 'oasis'
  | 'tower'
  | 'paddock'
  | 'barn'
  | 'oracle'
  | 'tavern'
  | 'play'
  | 'pause'
  | 'undo'
  | 'redo'
  | 'end-turn'
  | 'draw-card'
  | 'settings'
  | 'restart'
  | 'bot'
  | 'human'
  | 'connected'
  | 'disconnected'
  | 'muted'
  | 'unmuted'
  | 'achievement'
  | 'leaderboard'
  | 'replay'
  | 'tutorial'
  | 'save'
  | 'load'
  | 'close'
  | 'chevron'
  | 'menu'
  | 'more'
  | 'search'

type IconProps = {
  name: IconName
  size?: number
  className?: string
} & Omit<SVGProps<SVGSVGElement>, 'name'>

export function Icon({ name, size = 24, ...props }: IconProps) {
  switch (name) {
    case 'castle':        return <CastleIcon size={size} {...props} />
    case 'farm':          return <FarmIcon size={size} {...props} />
    case 'harbor':        return <HarborIcon size={size} {...props} />
    case 'oasis':         return <OasisIcon size={size} {...props} />
    case 'tower':         return <TowerIcon size={size} {...props} />
    case 'paddock':       return <PaddockIcon size={size} {...props} />
    case 'barn':          return <BarnIcon size={size} {...props} />
    case 'oracle':        return <OracleIcon size={size} {...props} />
    case 'tavern':        return <TavernIcon size={size} {...props} />
    case 'play':          return <PlayIcon size={size} {...props} />
    case 'pause':         return <PauseIcon size={size} {...props} />
    case 'undo':          return <UndoIcon size={size} {...props} />
    case 'redo':          return <RedoIcon size={size} {...props} />
    case 'end-turn':      return <EndTurnIcon size={size} {...props} />
    case 'draw-card':     return <DrawCardIcon size={size} {...props} />
    case 'settings':      return <SettingsIcon size={size} {...props} />
    case 'restart':       return <RestartIcon size={size} {...props} />
    case 'bot':           return <BotIcon size={size} {...props} />
    case 'human':         return <HumanIcon size={size} {...props} />
    case 'connected':     return <ConnectedIcon size={size} {...props} />
    case 'disconnected':  return <DisconnectedIcon size={size} {...props} />
    case 'muted':         return <MutedIcon size={size} {...props} />
    case 'unmuted':       return <UnmutedIcon size={size} {...props} />
    case 'achievement':   return <AchievementIcon size={size} {...props} />
    case 'leaderboard':   return <LeaderboardIcon size={size} {...props} />
    case 'replay':        return <ReplayIcon size={size} {...props} />
    case 'tutorial':      return <TutorialIcon size={size} {...props} />
    case 'save':          return <SaveIcon size={size} {...props} />
    case 'load':          return <LoadIcon size={size} {...props} />
    case 'close':         return <CloseIcon size={size} {...props} />
    case 'chevron':       return <ChevronIcon size={size} />
    case 'menu':          return <MenuIcon size={size} {...props} />
    case 'more':          return <MoreIcon size={size} {...props} />
    case 'search':        return <SearchIcon size={size} {...props} />
  }
}
