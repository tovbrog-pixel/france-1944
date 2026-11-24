# Town and city fighting for Sarn Corridor, from the France 1944 build

Tov Binyamin Brog · 24 November 2026

Instructions for the Sarn Corridor build. This adds the town and city rules built in france-1944 on 24 November 2026. Apply the patch, make four hand edits, add the scenario settings, then test.

- Patch: https://raw.githubusercontent.com/tovbrog-pixel/france-1944/main/docs/town-and-city-fighting-for-sarn-corridor.patch
- Full design note: https://github.com/tovbrog-pixel/france-1944/blob/main/docs/design/town-and-city-fighting.md

The patch changes `engine/src/sim.js` and `engine/src/command.js` and adds `engine/src/urban.js`. It was checked with `git apply --check` against the `main` branch of sarn-corridor as it stood at 12:20 Eastern on 24 November 2026. If those files have changed since, apply the changes by hand from the descriptions below.

## The rules

Tov set rules 1 to 3 and asked for rules 4 and 5 to be added.

1. **Taking a town means a unit in the town.** An objective with a built-up area on the map (town or city cells) changes hands when one side's formed troops stand in its built-up cells, or within `centreKm` of its point, and none of the other side's do, for three checks in a row. Places with fewer than `minCells` built-up cells keep the engine's 1.2 km rule.
2. **Cities have districts.** A city listed in `sc.districts` is several objectives. The module shares out the built-up cells by flooding from each district's point through built-up ground, so a river forms a boundary. Where two floods meet, the nearer point takes the cell.
3. **A town fight favors an infantry assault, with armor in support.**
   - Tanks firing into a town with no friendly infantry within `supKm` have their fire on soft targets multiplied by `armSoft`.
   - Infantry attacking a town with friendly tanks within `supKm` have their fire multiplied by `combined`.
   - Infantry within 0.5 km of a tank, when either stands in a town, have their anti-tank fire multiplied by `faust`, or by `faustGuarded` when the tank has friendly infantry within `supKm`.
   - "Infantry" means the unit classes `inf`, `mech`, `eng` and `cdo`.
4. **The general speaks up.** An armored division or brigade (a third or more of its leading battalions are tanks) ordered into an enemy-held town reports once per order: "My tanks will be exposed in the streets of X. I recommend infantry lead the assault, with armor in support." He obeys.
5. **The corps commander gives the town to infantry.** When a corps objective line crosses the built-up area of an enemy-held town:
   - with three or more divisions, at least two of them infantry, he holds his armored division in reserve, wherever it stands in the line;
   - otherwise, with an armored division forward beside an infantry division, he moves the boundary so the town lies in the infantry division's sector, and the armor keeps at least 1.5 km beside it;
   - an order with `reserve: false` skips the first case;
   - an objective with no town on it is divided as before.

The patch also carries one earlier, smaller rule, `sc.capBig { pts, r }`: an objective worth `pts` or more changes hands only when the holder has no troops within `r` km. It applies only to objectives that have no built-up area, so it matters only when the urban module is off. France 1944 added it after 60 AI-vs-AI games showed one battalion flipping Caen back and forth for weeks.

## Settings

Defaults in `engine/src/urban.js`; a scenario overrides them with `sc.urban`. Every number is a game setting for balance testing. None comes from a source.

| Setting | Default | Meaning |
| --- | --- | --- |
| `minCells` | 4 | Built-up cells an objective needs before rule 1 applies. Districts are exempt |
| `maxKm` | 8 | How far from its point an objective's built-up area may reach |
| `centreKm` | 0.7 | Troops this close to the point count as in the town |
| `armSoft` | 0.6 | Tanks firing into a town without infantry beside them |
| `combined` | 1.25 | Infantry attacking a town with tanks beside them |
| `supKm` | 0.8 | Distance at which tanks and infantry support each other |
| `faust` | 2.5 | Infantry anti-tank fire at close range in a town |
| `faustGuarded` | 1.4 | The same, when the tank has its own infantry |
| `cacheMin` | 5 | Minutes a unit's "who is beside me" answer is reused |

France 1944 runs at 1 km cells. `minCells` and `maxKm` assume that scale; check them against Sarn Corridor's cell size.

## Hand edits

1. **`engine/src/sim.js`, the module table in `S.setup`.** The patch leaves this line alone because the two games list different modules. Add to the table:
   `urban: typeof attachUrban === 'function' && attachUrban`
2. **`tools/load-engine.js`:** add `'urban.js'` to the file list after `'doctrine.js'`, and `attachUrban` to the `__api` object.
3. **`tools/build-app.js`:** add `'urban.js'` to `engineFiles` after `'doctrine.js'`.
4. **`tools/build-preview.js`:** add `'urban.js'` to `order` after `'doctrine.js'`. If the page builder copies a fixed list of scenario settings, add `'urban'`, `'districts'` and `'capBig'` to it. France 1944 once shipped a page that silently lacked whole modules because of such a list, and now copies every setting.

## Scenario settings

```js
modules: [/* existing modules */ 'urban'],
districts: [{ city: 'Name of the city', parts: ['District A', 'District B'] }],
// optional: urban: { minCells: 4, ... }, capBig: { pts: 20, r: 2.5 },
```

To make a city into districts:

1. Give each district its own entry in `sc.vp` (`[name, x, y, points, owner]`), with its point on a built-up cell of that district. Split the city's former points among them.
2. List the district names under one city in `sc.districts`.
3. Put the points on opposite banks of a river, or well apart, so the flood divides the cells sensibly. Print each objective's `cells` after `S.setup()` to check the split.
4. Point any port, supply source or scripted condition that names the city at the right district. In France 1944 the Cherbourg port opens when the arsenal district falls.

France 1944's own districts, for reference: Caen (north bank of the Orne, 18 points) and Vaucelles (south bank, 12); Cherbourg (the city, 20) and Arsenal de Cherbourg (10).

## What the patch changes, for applying by hand

- **`engine/src/urban.js` (new).** Builds each objective's built-up area and the districts at start; provides `S.townAt(x, y)`, `S.urbanNear(unit, 'arm' | 'inf')` and `S.urbanCellVP`; gives the general's warning.
- **`sim.js`, objective list.** Each objective gains `capR` from `sc.capBig`.
- **`sim.js`, the capture loop.** A unit counts toward an objective when it stands in the objective's cells or within `centreKm` of its point, where the objective has cells; otherwise within 1.2 km as before. The `capR` hold applies only to objectives without cells.
- **`sim.js`, `fireAt`.** The three town-fighting multipliers of rule 3, just before the damage is computed, for direct fire only.
- **`command.js`, `planCommandOrder`.** Finds the stretches of the objective line inside an enemy-held town; chooses the armored division as reserve or moves sector boundaries (rule 5); returns a note that `release` reports.

## Steps

1. Save the patch as `urban.patch` in the repository root and run `git apply urban.patch`.
2. Make the four hand edits.
3. Run `node tools/regress.js`. Scenarios that do not list the `urban` module should match their baselines; France 1944's did.
4. Add `'urban'` and any districts to the Sarn Corridor scenario. Record new baselines for that scenario.
5. Check the corps rules: give a corps of two infantry divisions and one armored division an objective line across an enemy-held town and read the plan from `S.planCommandOrder(C, [], line, {})`. The armored division should be the reserve and `plan.note` should say so. Repeat with `{ reserve: false }`: the infantry division beside the armor should hold the town's stretch of the line.
6. Order an armored division alone into an enemy-held town and look for the general's warning in the reports.
7. Run the AI-vs-AI batch and compare capture dates and losses with the last batch.

## What France 1944 tested, and what it did not

- Rules 4 and 5 were tested on the tutorial corps (two infantry divisions and one armored) with the module switched on for the test. All three cases in step 5 behaved as described, and the warning appeared.
- A 17-day Overlord game ran without error, and the page check passed with the module loaded.
- The corps rules had not yet fired in a campaign game when this was written, and no 20-game batch had measured the module. Batch 15 was queued for that.
- The multipliers have not been tuned.

## Left out, and queued

Left out of this version: rubble from heavy bombing; armor slowed in streets; the objective line snapping to a district's edge; a division that may not leave a half-taken district until relieved.

Queued as France 1944's next design note: automatic districts for any large city split along its river; a fortress decision for the computer's high command, with garrisons that hold when cut off; an open-city decision with a political effect; siege rules.

## Source trace

| Passage | Source | Status |
| --- | --- | --- |
| Rules 1 to 5 | Tov, in the France 1944 conversation of 24 November 2026; `docs/design/town-and-city-fighting.md` in france-1944 | Sourced (owner decisions) |
| What the code does | `engine/src/urban.js`, `sim.js` and `command.js` in france-1944 at the commit that added this file | Sourced (code) |
| Patch applies to sarn-corridor | `git apply --check` on sarn-corridor `main` files fetched at 12:20 Eastern, 24 November 2026; the three patched files parse | Sourced (test run); the patched engine was not run inside Sarn Corridor |
| Caen changing hands in 60 games | France 1944 batches 9 to 11, `docs/tests/` | Sourced |
| Tests listed above | Runs in the France 1944 workspace, 24 November 2026 | Sourced (test runs) |
| Every multiplier, distance and threshold | Claude's settings | Inference (game settings) |
| Infantry-led town fighting as 1944 practice | General history | Verify against FM 31-50 (1944) |
