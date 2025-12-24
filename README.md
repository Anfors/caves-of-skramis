# Caves of Skramis

A 2D top-down roguelite dungeon crawler built with TypeScript. Explore procedurally generated dungeons, fight fantasy creatures, and progress through increasingly difficult floors in this turn-based grid game.

## 🎮 Game Features

- **Turn-Based Combat**: Strategic gameplay where every move counts
- **Procedural Generation**: Each floor is uniquely generated using seeded randomization
- **Fantasy-Folklore Setting**: Battle goblins, orcs, trolls, skeletons, and wraiths
- **Progression System**: Gain experience, level up, and grow stronger
- **Save Code System**: Generate a code on death to restore your level progression
- **Responsive Design**: Playable on both desktop and mobile browsers
- **No Database Required**: All progression stored in save codes

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Anfors/caves-of-skramis.git
cd caves-of-skramis
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:8080
```

### Building for Production

To create a production build:
```bash
npm run build
```

The built files will be in the `dist/` directory, which can be deployed to any static hosting service.

## 🎯 How to Play

### Objective

Explore the dungeon, defeat enemies, collect experience, and descend to deeper floors. When you die, you can generate a save code that preserves your level and stats for your next run.

### Controls

#### Desktop
- **Arrow Keys** or **WASD**: Move your character
- **Spacebar**: Wait/skip turn

#### Mobile
- **Touch/Tap**: Tap in the direction you want to move
- **On-screen buttons**: Use the UI buttons for game management

### Game Mechanics

#### Movement
- Move one tile at a time on the grid
- Moving into an enemy initiates combat
- Moving onto stairs descends to the next floor

#### Combat
- Turn-based: You attack, then enemies counter-attack
- Damage = Attack - Defense (minimum 1)
- Defeat enemies to gain experience

#### Progression
- **Experience**: Gain 10 XP × enemy level per kill
- **Level Up**: Requires level × 100 XP
- **Level Benefits**:
  - +20 Max Health (fully restored)
  - +2 Attack
  - +1 Defense

#### Save System
- Click **"Get Save Code"** to generate your progression code
- Copy and save the code
- Click **"Load Save Code"** to restore your character
- Save codes preserve: Level, Experience, Current Floor

## 🏗️ Project Structure

```
caves-of-skramis/
├── src/
│   ├── game/
│   │   ├── types.ts              # Type definitions and interfaces
│   │   ├── gameEngine.ts         # Core game logic and state management
│   │   └── dungeonGenerator.ts   # Procedural dungeon generation
│   ├── ui/
│   │   ├── renderer.ts           # Canvas rendering system
│   │   └── uiController.ts       # DOM UI management
│   ├── utils/
│   │   ├── random.ts             # Seeded random number generator
│   │   └── saveCode.ts           # Save code encoding/decoding
│   ├── index.html                # HTML entry point
│   └── index.ts                  # Main application entry
├── dist/                         # Built files (generated)
├── node_modules/                 # Dependencies (generated)
├── .eslintrc.json               # ESLint configuration
├── .prettierrc.json             # Prettier configuration
├── .gitignore                   # Git ignore rules
├── package.json                 # Project metadata and scripts
├── tsconfig.json                # TypeScript configuration
├── webpack.config.js            # Webpack build configuration
└── README.md                    # This file
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run type-check` - Type check without building

### Code Quality

The project uses:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Webpack** for bundling

### Game Architecture

#### GameEngine
The core game loop and state management system. Handles:
- Player movement and actions
- Enemy AI and movement
- Combat resolution
- Level progression
- Floor transitions

#### DungeonGenerator
Procedural generation using:
- Room-based algorithm
- Corridor connections
- Seeded randomization for reproducibility
- Dynamic enemy placement based on floor difficulty

#### Renderer
Canvas-based rendering system:
- Tile-based graphics (16x16 pixels)
- Camera system following the player
- Viewport of 40×30 tiles
- Entity layering (tiles → entities → player)

#### Save System
Base64-encoded JSON with checksum:
- Compact representation
- Validation against tampering
- Easy to copy/paste
- No server required

## 🎨 Customization

### Adjusting Difficulty

Edit `src/game/gameEngine.ts`:
```typescript
// Starting stats
stats: {
  maxHealth: 100,  // Increase for easier gameplay
  attack: 5,       // Increase for more damage
  defense: 2,      // Increase for less damage taken
  // ...
}
```

### Dungeon Size

Edit `src/game/dungeonGenerator.ts`:
```typescript
constructor(seed: string, width = 50, height = 50) {
  // Adjust width and height
}
```

### Visual Style

Edit `src/index.html` for CSS styling or `src/ui/renderer.ts` for canvas rendering.

## 🐛 Troubleshooting

### Game won't start
- Ensure all dependencies are installed: `npm install`
- Check browser console for errors
- Try a different browser (Chrome, Firefox recommended)

### Save code doesn't work
- Ensure you copied the entire code including the checksum
- Codes are case-sensitive
- Codes from different game versions may not be compatible

## 📜 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- Inspired by classic roguelikes like NetHack and Rogue
- Built with TypeScript and Canvas API
- Procedural generation techniques from roguelike development community
