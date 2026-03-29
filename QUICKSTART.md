# Kingdom Builder Web - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Installation

```bash
# Clone the repository
git clone https://github.com/cancleeric/kingdom-builder-web.git
cd kingdom-builder-web

# Install dependencies
npm install
```

## Development

```bash
# Start the development server
npm run dev

# Open your browser and navigate to http://localhost:5173
```

## Testing

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## How to Play

1. **Start the Game**: The game initializes with 2 players and displays a hex grid board
2. **Draw a Terrain Card**: Click the "Draw Terrain Card" button to draw your terrain for the turn
3. **Place Settlements**: Click on highlighted hexes (with green borders) to place your 3 settlements
   - First settlement: Can place on any hex of the drawn terrain type
   - Subsequent settlements: Must place adjacent to existing settlements (adjacency rule)
4. **End Turn**: After placing 3 settlements, click "End Turn" to pass to the next player
5. **Continue Playing**: The next player draws a card and repeats the process

## Game Rules

- **Buildable Terrain**: Grass, Forest, Desert, Flower, Canyon
- **Non-buildable**: Mountains (gray) and Water (blue) - cannot place settlements
- **Adjacency Rule**: After your first settlement, you must place new settlements adjacent to your existing ones on the same terrain type
- **Settlements per Turn**: 3 settlements must be placed each turn
- **Total Settlements**: Each player has 40 settlements

## Project Structure

```
kingdom-builder-web/
├── src/
│   ├── core/           # Game logic (hex system, board, rules, terrain)
│   ├── components/     # React components (HexGrid, HexCell)
│   ├── store/          # State management (Zustand)
│   ├── types/          # TypeScript type definitions
│   └── App.tsx         # Main application component
├── tests/              # Unit tests
└── package.json
```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Vitest** - Testing framework
- **SVG** - Hex grid rendering

## Current Status

✅ Phase 1 Complete - Core game mechanics implemented and fully playable!

## Troubleshooting

### Port Already in Use
If port 5173 is already in use, Vite will automatically try the next available port (5174, 5175, etc.)

### Build Errors
Make sure you're using Node.js 18 or higher:
```bash
node --version
```

### Test Failures
Ensure all dependencies are installed:
```bash
npm install
```

## Next Steps (Phase 2)

- Location tiles (Farm, Harbor, Oracle, etc.)
- Special abilities from locations
- Castle scoring mechanism
- Goal cards for victory points
- Game end conditions and scoring

## License

MIT License
