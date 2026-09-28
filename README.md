# Off The Walls

A portrait puzzle game built with Expo (React Native). You play as **Max** — an energetic adult with ADD — and bounce him through a satirical salaryman shift until he reaches his ADHD meds.

The campaign jokes about crowded commutes, fluorescent mazes, unpaid overtime, boss pings, and the last train home. Max does not get hurt. A red **REVIEW** stamp just sends the attempt back to your desk so you can aim again. The win is always the amber capsule.

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
- Max ricochets off partitions, train doors, and meeting paddles until he reaches the capsule (**win**) or the attempt is sent back to the desk (**retry**).
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
| **ELEV** shaft | Safe. Lifts you toward the capsule |
| Meeting paddle | Spinning bar that smacks you onward |
| Red **REVIEW** | Performance-review trap. Retry, Max is fine |
| Boss ping | A shove and a notification, mid-flight |

## Levels

Progress unlocks one stop at a time and is stored on the device.

### Morning

1. **Badge In** — aim and bounce
2. **Partition Bounce** — bank around a divider
3. **Elevator Pitch** — safe elevator shaft
4. **Stairwell Bounce** — three landings
5. **Copy Room** — a boost pad by the copier
6. **Service Elevator** — freight shaft on the left

### Commute Crush

7. **Closing Doors** — time one pair of train doors
8. **Rush Hour** — two gates, plus a sliding crowd bar
9. **Moving Walkway** — belt into an elevator
10. **Local Stop** — one wide door
11. **Express Belt** — walkway into the uptown car
12. **Polite Shove** — a sliding crowd bar and an open lane

### Office Maze

13. **Cubicle Grid** — staggered partition gaps
14. **Coffee Slick** — slide through a spill
15. **Open Plan** — slick, boost pad, and a gap
16. **Break Room** — a wide coffee slick
17. **Corner Boost** — two green pads
18. **Quiet Carrel** — short partitions

### Overtime Clock

19. **Meeting Paddle** — a spinning meeting
20. **Unpaid Hours** — desk belt into the meeting
21. **Double Booking** — two paddles at once
22. **Standup Slot** — a shorter meeting
23. **Night Desk** — desk belt into a late elevator
24. **Agenda Item** — boost pad and a side paddle

### Boss Ping Gauntlet

25. **ASAP ASAP** — boss pings shove Max
26. **CC: Everyone** — reply-all reverse pads
27. **Performance Review** — CC pad and a REVIEW trap
28. **One More Thing** — a single ping
29. **Reply All** — a CC pad you can route around
30. **Red Stamp** — a corner REVIEW and a boost pad

### Last Train

31. **Last Train Home** — belt, doors, and the car elevator
32. **Night Transfer** — slick platform, doors, and a paddle
33. **Platform Meds** — the full shift, then the capsule
34. **Side Platform** — the left-hand car
35. **After Hours** — slick, boost, and a late ping
36. **Capsule Call** — belt, door, elevator, capsule

## Tech

- Expo SDK 57 + TypeScript
- Custom 2D bounce physics (no native modules — works in Expo Go)
- Original synthesized BGM via `expo-audio` (no microphone permission, no background playback)
- Portrait only

`npx tsc --noEmit` typechecks the app. `npx tsx scripts/solve-levels.ts` checks copy, spawn clearance, and that every level has a winning launch.

## Legal

Joshua Israel Ventures LLC
