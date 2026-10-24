# Pocket Grand Prix

Original 3D toy-brick open-wheel arcade racing for browsers. Three fictional circuits, six drivers, five-lap Grands Prix, three-lap time trials with a local personal-best ghost, regenerating boost, slipstreaming, tire wear, and optional 3.5-second pit stops. Three.js rendering with Vite packaging. No external assets, accounts, or runtime network requests.

## Run and build

Requires Node.js 22.12 or later. Run `npm ci` first. `npm run dev` serves http://127.0.0.1:5182/. `npm test` checks race completion, controls, pit stops, finish state, and resource bounds. `npm run build` creates the static `dist/` directory. Hosting build command: `npm run build`; output: `dist`.

## Play

Left/right arrows or A/D move across the racing line relative to the car. The car automatically follows the circuit and accelerates. Down/S brakes; Space boosts; P queues/cancels a pit stop at the next finish line; Escape pauses. Touch buttons support simultaneous steering and braking/boost. Corner assist limits speed for bends and gently recenters the car; with it off, braking is essential. Driving onto grass slows the car. Draft a nearby rival for extra speed. Tire grip degrades through a race; a pit stop restores tires and boost but costs 3.5 seconds. Sound is optional and starts only after a click.

The race pauses when its window loses focus or becomes hidden. Local bests and time-trial ghosts are separate for each circuit and assist setting. Storage unavailable/private-mode failures do not block play. No online multiplayer. The racer uses track-relative arcade physics, not a realistic vehicle simulation.

## Leaderboard integration status

The game-side AIWANNA leaderboard client is implemented, but online boards are **not yet provisioned or live**. `src/leaderboard-config.js` deliberately has empty game and board IDs, so local play makes no score requests. After first publication, create the six boards described by `boardDefinitions`, map their real IDs by stable key in `boards`, and set the real game ID and slug. Rebuild and deploy, then verify a genuine run from the AIWANNA player. The definitions describe desired rules; pass them through the platform's actual configuration schema rather than assuming matching field names.

Only completed three-lap solo time trials rank. Each circuit has assisted and unassisted boards. Integer milliseconds, ascending, personal best only, equal times share rank. All players get identical car, boost and tire settings; there are no AI opponents or drafting in trials. Paused time is excluded. Accepted range: 30 seconds to 10 minutes. Minimum platform run age: 30 seconds. Scores are client-reported casual competition, not cheat-resistant.

The Rankings panel shows local records and, when configured, links to the selected real online board. The game starts a platform run at trial start and submits only after completion, validates the exact parent origin and game ID, and retains credentials only in memory. Start and settlement use separate idempotency keys. Retry preserves the run and final score; failed submissions never prevent local play. Automated tests cover eligibility, six-board separation, disabled configuration, retry idempotency, and wrong-game sessions. Live platform acceptance and physical-phone testing remain outstanding.

All artwork uses original procedural Three.js geometry and a locally generated road texture. Original fictional teams and tracks; no F1 or LEGO branding or licensed assets. Code and artwork created with Codex.

## AIWANNA listing

Title: Pocket Grand Prix

Description: Tiny cars. Big Sunday energy. Race five rivals across three original toy-brick circuits, find your racing line, use slipstream and boost, and time your pit stop. Chase your personal-best ghost in time trial. Keyboard and touch controls; optional corner assistance.

Category: Racing / Action. Tags: 3D, Toy bricks, Racing, Arcade, Single-player. Landscape recommended; responsive portrait controls supported. Typical race: 2–3 minutes. Language: English. Build version: 1.0.0.
