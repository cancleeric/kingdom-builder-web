/**
 * Official Kingdom Builder player colors.
 */
export const PLAYER_COLORS = ['#F97316', '#3B82F6', '#F8FAFC', '#1F2937'] as const;
export type PlayerColor = typeof PLAYER_COLORS[number];

export const PLAYER_COLOR_NAMES: Record<PlayerColor, string> = {
  '#F97316': '橙色',
  '#3B82F6': '藍色',
  '#F8FAFC': '白色',
  '#1F2937': '黑色',
};

/**
 * Configuration for a single player set in the setup screen.
 */
export interface PlayerConfig {
  id: number;
  name: string;
  color: PlayerColor;
}

export const SETUP_STORAGE_KEY = 'kb_player_setup';

/** Default player configs for a given count. */
export function defaultPlayerConfigs(count: 2 | 3 | 4): PlayerConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `玩家${i + 1}`,
    color: PLAYER_COLORS[i],
  }));
}

/** Load last-used configs from localStorage, or return defaults. */
export function loadSavedConfigs(): PlayerConfig[] | null {
  try {
    const raw = localStorage.getItem(SETUP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlayerConfig[];
    if (!Array.isArray(parsed) || parsed.length < 2 || parsed.length > 4) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persist player configs to localStorage. */
export function saveConfigs(configs: PlayerConfig[]): void {
  try {
    localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(configs));
  } catch {
    // ignore write errors (e.g. private browsing)
  }
}
