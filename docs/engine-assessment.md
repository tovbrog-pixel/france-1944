# Engine assessment: Lines of Advance, build 2026-11-22c

Tov Binyamin Brog · 22 Nov 2026

The Lines of Advance simulation already runs without graphics. On its seven historical scenarios it ran between 6,500 and 21,000 times faster than real time, well past the design document's 500-times target for headless testing. The work for the France game lies in scaling to a theater map with about three times as many units.

## What carries over unchanged

- **The simulation core is already separate.** `sim.js`, `map.js`, `data.js`, `commanders.js`, `guidance.js`, `assess.js` and `balance.js` contain no browser or three.js references.
- **Two calls run a game.** `createSim(scenario, side, seed, options)` builds it, and `S.advance(minutes)` moves the clock. Side `-1` puts the AI on both sides.
- **Runs repeat exactly.** The simulation draws all chance from a seeded generator (`mulberry`), so one seed gives one result.
- **Graphics, sound and interface live in their own files:** `render.js`, `render2.js`, `render3.js`, `models.js`, `sound.js`, `ui.js`, `tutorial.js` and `index.tpl.html`.

## Measured speed

`tools/speed.js` ran each scenario AI-vs-AI to its scripted end on one CPU core in Claude's workspace, 22 Nov 2026, seed 12345.

| Scenario | Map (km) | Formations | Units | Game hours | Wall time (s) | Times real time |
| --- | --- | --- | --- | --- | --- | --- |
| Falaise | 103 x 100 | 55 | 263 | 228 | 126.1 | 6,511 |
| Sicily | 135 x 105 | 58 | 260 | 200 | 106.6 | 6,752 |
| Market Garden | 62 x 98 | 39 | 157 | 216 | 62.7 | 12,396 |
| Gazala | 120 x 85 | 29 | 181 | 264 | 65.7 | 14,473 |
| Salerno | 56 x 52 | 26 | 132 | 180 | 41.4 | 15,640 |
| Bastogne | 56 x 60 | 23 | 114 | 192 | 41.5 | 16,661 |
| Kasserine | 90 x 70 | 16 | 103 | 96 | 16.3 | 21,265 |
| Tutorial | 44 x 32 | 7 | 34 | 48 | 1.2 | 146,441 |

## Where the time goes

A CPU profile of 72 game hours of Falaise:

| Function | Share of time |
| --- | --- |
| `combatTick` | 37.7% |
| `step` (main loop body) | 28.1% |
| Garbage collection | 4.5% |
| `cmdTick` (commanders) | 4.5% |
| `supplyTick` | 4.4% |
| `ownTick` (ground ownership grid) | 1.0% |

## Scaling to the 1944-45 theater

1. **Echelon shift.** Today a formation is a brigade or regiment and a unit is a battalion. In the France game a formation becomes a division and a unit becomes a regiment, brigade or combat command. The corps and army layer above is new code.
2. **Unit count.** About 210 divisions at about four units each gives 700 to 900 units, three times Falaise. Combat work grows with the number of unit pairs it checks, so a pair-by-pair search would run about ten times slower, near 600 times real time. A spatial grid for combat and enemy searches removes that cost. (Inference: the growth rate needs confirming by profile once the larger order of battle exists.)
3. **Map size.** The Cotentin-to-Elbe map covers about 80 times Falaise's area. Terrain cells at today's 0.5 to 0.75 km would number 1.4 to 3.2 million; at 2 km they number about 200,000. The ground ownership grid moves to 2 km cells as well.
4. **Pathfinding.** `findPath` on a theater grid needs a road and rail network graph for long moves, with the cell grid kept for the last few kilometers. This also carries the transport choice from Tov's review (foot, rail, boat, truck).
5. **Time step.** Today's step runs 0.25 to 1 game minute. Division-scale moves can step at 5 to 15 minutes outside combat, about ten times fewer steps. (Inference: step length needs testing against combat accuracy.)

## Kept out of the repository

- `voice/`: the Lines of Advance tutorial narration (MP3s and `script.json`). The France game's Tennessee tutorial needs new narration.
- `Lines of Advance.html`: the built game. `engine/build.js` rebuilds it from `engine/src`.

## Source trace

| Passage | Source | Status |
| --- | --- | --- |
| Code structure, interface, seeded generator | `engine/src` as received from Tov, 22 Nov 2026 | Read from code |
| Speed table and profile | `tools/speed.js` and a Node CPU profile, run 22 Nov 2026 | Measured |
| Unit counts, area ratio, cell counts | Computed from the design document's figures | Arithmetic |
| Combat growth rate and time-step savings | Engineering judgment | Inference, labeled above |
