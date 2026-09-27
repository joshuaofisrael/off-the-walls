# Off The Walls

A portrait iPhone puzzle game built with Expo (React Native). You play as **Max** — an energetic adult with ADD — and bounce him off walls, pads, and chaos to reach his ADHD meds (pill bottle). Warm, affirming tone. Never mocking.

## How to run (Expo Go on iPhone)

```bash
cd /workspace/off-the-walls
npm install
npx expo start
```

1. Install **Expo Go** from the App Store on your iPhone.
2. Scan the QR code from the terminal (Camera app or Expo Go).
3. Same Wi‑Fi as the machine running Metro, or use tunnel mode: `npx expo start --tunnel`.

## Controls

- **Drag** from Max to aim (farther drag = more power).
- **Release** to launch.
- Max **ricochets** off walls until he hits the pill bottle (**win**) or runs out of bounce energy / hits a hazard (**retry**).
- HUD shows level name + bounces left (⚡).

## Levels

1. **Morning Brain** — learn aim & bounce  
2. **Narrow Focus** — tight corridors  
3. **Bounce Pad Lab** — green pads boost speed  
4. **Ping! Ping! Ping!** — notification distractors nudge Max  
5. **Moving Targets** — moving platforms + hazard  
6. **Meds Unlocked** — final gauntlet  

Progress unlocks sequentially (stored on device).

## Tech

- Expo SDK 57 + TypeScript  
- Custom 2D bounce physics (no native modules — works in Expo Go)  
- Portrait only  

## Legal

Joshua Israel Ventures LLC
