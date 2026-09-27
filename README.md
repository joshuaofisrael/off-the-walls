# Off The Walls

A portrait puzzle game built with Expo (React Native). You play as **Max** — an energetic adult with ADD — and bounce him through a satirical salaryman shift until he reaches his ADHD meds.

The campaign jokes about crowded commutes, fluorescent mazes, unpaid overtime, boss pings, and the last train home. Max does not get hurt. A red **REVIEW** stamp just sends the attempt back to your desk so you can aim again. The win is always the amber bottle.

## How to run (Expo Go)

```bash
npm install
npx expo start
```

1. Install **Expo Go** on your phone.
2. Scan the QR code from the terminal (Camera app or Expo Go).
3. Use the same Wi‑Fi as the machine running Metro, or tunnel mode: `npx expo start --tunnel`.

The app is portrait only and stays inside the Expo Go runtime (no custom native modules).

## Controls

- **Drag** from Max to aim. Farther drag means more power. The aim dots shift from fluorescent cyan to overtime red.
- **Release** to launch.
- Max ricochets off partitions, train doors, and meeting paddles until he reaches the bottle (**win**) or the attempt is sent back to the desk (**retry**).
- The HUD shows the chapter, the level, bounces left (⚡), and a cosmetic **UNPAID** clock. The clock does not end the attempt.
- **SND / MUTE** on the title screen, the departures board, and the in-level HUD turns the radio off. The choice is saved on the device.

## Music

Two original loops play in the background. They were synthesized for this game (`npm run compose-bgm` writes `assets/audio/*.wav`). They are not taken from Karoshi or any other soundtrack.

- **Fluorescent** — title, level select, Morning, Commute, Office, and Last Train. Slow drone, sparse lead.
- **Overtime** — Overtime Clock and Boss Ping. Tighter pulse, a sour interval. The beds crossfade when you enter or leave those chapters.

The win banner ducks the volume. On iOS the hardware silent switch is respected. Playback uses `expo-audio` (included in Expo Go for SDK 57). `expo-av` is not part of this SDK.

## Surfaces

| Surface | What it does |
| --- | --- |
| Partitions | Ordinary bounce |
| Green **BOOST** pad | Bounce with extra speed |
| Blue **CC** pad | Banks you back across the floor (reply-all) |
| Train **DOOR** | Slides shut, then open. Wait for the gap |
| Desk / platform belt | Conveyor. Arrows show the push |
| Coffee slick | Brown puddle. You keep your speed |
| **ELEV** shaft | Safe. Lifts you toward the bottle |
| Meeting paddle | Spinning bar that smacks you onward |
| Red **REVIEW** | Performance-review trap. Retry, Max is fine |
| Boss ping | A shove and a notification, mid-flight |

## Levels

Progress unlocks one stop at a time and is stored on the device.

### Morning

1. **Badge In** — aim and bounce
2. **Partition Bounce** — bank around a divider
3. **Elevator Pitch** — safe elevator shaft

### Commute Crush

4. **Closing Doors** — time one pair of train doors
5. **Rush Hour** — two gates, plus a sliding crowd bar
6. **Moving Walkway** — belt into an elevator

### Office Maze

7. **Cubicle Grid** — staggered partition gaps
8. **Coffee Slick** — slide through a spill
9. **Open Plan** — slick, boost pad, and a gap

### Overtime Clock

10. **Meeting Paddle** — a spinning meeting
11. **Unpaid Hours** — desk belt into the meeting
12. **Double Booking** — two paddles at once

### Boss Ping Gauntlet

13. **ASAP ASAP** — boss pings shove Max
14. **CC: Everyone** — reply-all reverse pads
15. **Performance Review** — CC pad and a REVIEW trap

### Last Train

16. **Last Train Home** — belt, doors, and the car elevator
17. **Night Transfer** — slick platform, doors, and a paddle
18. **Platform Meds** — the full shift, then the bottle

## Tech

- Expo SDK 57 + TypeScript
- Custom 2D bounce physics (no native modules — works in Expo Go)
- Original synthesized BGM via `expo-audio` (no microphone permission, no background playback)
- Portrait only

`npx tsc --noEmit` typechecks the app. `npx tsx scripts/solve-levels.ts` checks copy, spawn clearance, and that every level has a winning launch.

## Legal

Joshua Israel Ventures LLC
