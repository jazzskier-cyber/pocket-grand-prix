# Pocket Grand Prix

Original 3D toy-brick open-wheel arcade racing for browsers. Three fictional circuits, six drivers, five-lap Grands Prix, three-lap time trials with a local personal-best ghost, regenerating boost, slipstreaming, tire wear, and optional 3.5-second pit stops. Three.js rendering with Vite packaging. No external assets, accounts, or runtime network requests.

## Run and build

Requires Node.js 22.12 or later. Run `npm ci` first. `npm run dev` serves http://127.0.0.1:5182/. `npm test` checks race completion, controls, pit stops, finish state, and resource bounds. `npm run build` creates the static `dist/` directory. Hosting build command: `npm run build`; output: `dist`.

## Play

Left/right arrows or A/D move across the racing line relative to the car. The car automatically follows the circuit and accelerates. Down/S brakes; Space boosts; P queues/cancels a pit stop at the next finish line; Escape pauses. Touch buttons support simultaneous steering and braking/boost. Corner assist limits speed for bends and gently recenters the car; with it off, braking is essential. Driving onto grass slows the car. Draft a nearby rival for extra speed. Cars are solid: you cannot drive through rivals, so pull out to pass; side-by-side contact pushes cars apart and rivals change lanes to overtake. Tire grip degrades through a race; a pit stop restores tires and boost but costs 3.5 seconds. Sound is optional and starts only after a click.

The race pauses when its window loses focus or becomes hidden. Local bests and time-trial ghosts are separate for each circuit and assist setting. Storage unavailable/private-mode failures do not block play. No online multiplayer. The racer uses track-relative arcade physics, not a realistic vehicle simulation.

## AIWANNA integration

Published at https://www.aiwanna.games/games/b3f91cd4cc13ec1f947ac2f809f1ae2a-2c49ebfa.

**Leaderboard: one board, the Triple Crown.** Score = your best *flying* lap (lap 2 onward, so no standing start) on each of the three circuits, summed in integer milliseconds; lower wins. Laps from Grand Prix and time trial both count, with or without corner assist. You enter once all three circuits have a flying lap; any later race that improves a circuit's best lap submits the new total. A platform run starts at every race start and is settled at the finish only when the total improved. The handshake asks every official AIWANNA domain (www.aiwanna.games, aiwanna.games, ai-made.games, 1gp-game-platform.vercel.app) and talks to whichever one answers. Opened outside AIWANNA, the game keeps laps on the device and skips ranking. The six earlier per-circuit trial boards are disabled. Scores are client-reported casual competition, not cheat-resistant.

**Cloud saves** are enabled (schema version 1). `src/cloud-save.js` exports personal bests for every circuit, mode and assist setting, the best flying lap per circuit, and time-trial ghosts while the snapshot stays under the size limit (the longest ghosts are dropped first). The SDK loads progress before the first race; standalone play stays local-only.

## AIWANNA listing

Title: Pocket Grand Prix

Description: Tiny cars. Big Sunday energy. Race five rivals across three original toy-brick circuits, find your racing line, use slipstream and boost, and time your pit stop. Chase your personal-best ghost in time trial. Keyboard and touch controls; optional corner assistance.

Category: Racing / Action. Tags: 3D, Toy bricks, Racing, Arcade, Single-player. Landscape recommended; responsive portrait controls supported. Typical race: 2–3 minutes. Language: English. Build version: 1.0.0.

## Store kit

`1gp-kit/media` holds the published cover, screenshots and preview video. `1gp-kit/capture` is a capture-only page (open `/1gp-kit/capture/preview.html` on `npm run dev`) that records real races driven by a simple autopilot; it is not part of the build.
