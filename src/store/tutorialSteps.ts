import type { TutorialStep } from '../types/tutorial';

/**
 * The six tutorial steps that guide a new player through Kingdom Builder rules.
 * Each step focuses on one concept and specifies which board cells to highlight.
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'board-intro',
    stepNumber: 1,
    title: '認識棋盤',
    description:
      'Kingdom Builder 的棋盤由四個象限組成，包含多種地形：' +
      '草地（Grass）、峽谷（Canyon）、沙漠（Desert）、花田（Flower）、森林（Forest）。' +
      '水域與山脈無法建造房屋。城堡格子相鄰的房屋每間得 3 分。' +
      '地點板塊（Location Tile）格子相鄰時可獲得特殊能力。',
    highlightCells: [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 2, r: 0 },
      { q: 0, r: 1 },
      { q: 1, r: 1 },
    ],
    targetElementId: 'tutorial-board',
    tooltipPosition: 'right',
    allowedActions: ['next', 'skip'],
  },
  {
    id: 'hand-cards',
    stepNumber: 2,
    title: '手牌說明',
    description:
      '每回合開始時翻開一張地形卡。這張卡決定本回合你必須在哪種地形上放置房屋。' +
      '例如：翻到「草地」卡，本回合只能在草地格子放置房屋。' +
      '每回合必須放置 3 間房屋（若沒有特殊板塊加成）。',
    targetElementId: 'tutorial-hand',
    tooltipPosition: 'top',
    allowedActions: ['next', 'prev', 'skip'],
  },
  {
    id: 'placement-rules',
    stepNumber: 3,
    title: '放置規則',
    description:
      '若你已有房屋與本回合地形相鄰，新房屋必須緊靠現有房屋旁邊——這稱為「相鄰優先規則」。' +
      '只有在該地形上完全沒有可鄰接現有房屋時，才可以自由選擇任意格子放置。' +
      '點擊下方已高亮的格子，練習放置一間房屋。',
    highlightCells: [
      { q: 2, r: 1 },
      { q: 3, r: 1 },
      { q: 3, r: 2 },
    ],
    targetElementId: 'tutorial-board',
    tooltipPosition: 'right',
    allowedActions: ['next', 'prev', 'place', 'skip'],
  },
  {
    id: 'location-tiles',
    stepNumber: 4,
    title: '地點板塊獲得',
    description:
      '棋盤上有特殊的「地點板塊」格子（如農場、港口、神殿等）。' +
      '當你的房屋放置在地點格子旁邊時，你立即獲得一張對應的地點板塊。' +
      '板塊賦予你額外行動，例如：農場板塊讓你每回合多放 1 間房屋。',
    highlightCells: [
      { q: 4, r: 0 },
      { q: 4, r: 1 },
    ],
    targetElementId: 'tutorial-location-tiles',
    tooltipPosition: 'left',
    allowedActions: ['next', 'prev', 'skip'],
  },
  {
    id: 'scoring-cards',
    stepNumber: 5,
    title: '目標卡計分',
    description:
      '每場遊戲隨機抽取 3 張目標卡，決定得分方式。常見目標卡包括：' +
      '「漁夫」— 每列中靠近水域的房屋得分；' +
      '「礦工」— 山脈旁的房屋得分；' +
      '「騎士」— 每橫排跨越最多象限的連續房屋得分。' +
      '遊戲結束時同時計算 3 張目標卡加上城堡分數。',
    targetElementId: 'tutorial-scoring-cards',
    tooltipPosition: 'bottom',
    allowedActions: ['next', 'prev', 'skip'],
  },
  {
    id: 'round-flow',
    stepNumber: 6,
    title: '回合流程',
    description:
      '完整回合流程：\n' +
      '① 翻開地形卡\n' +
      '② 使用地點板塊能力（選填）\n' +
      '③ 在對應地形放置 3 間（或更多）房屋\n' +
      '④ 確認回合結束\n\n' +
      '當所有玩家的房屋放完後，遊戲結束，計算總分，分數最高者獲勝！\n' +
      '恭喜完成教學，祝你建造出最強王國！',
    targetElementId: 'tutorial-round-display',
    tooltipPosition: 'top',
    allowedActions: ['prev', 'skip', 'next'],
  },
];
