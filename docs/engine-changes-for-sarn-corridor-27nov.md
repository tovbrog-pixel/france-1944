# Engine changes from France 1944 for Sarn Corridor, 27 November

Tov Binyamin Brog, 27 November 2026

**Update, 27 November, later:** every change below is now in the shared engine, `tovbrog-pixel/lines-of-advance-engine` at fd53776, with an entry in its `CHANGES.md`. Sarn Corridor takes them with `tools/engine.sh pull`; the patch beside this note is no longer needed. Sarn's regression suite matches its baseline with them (run in a scratch copy at 51781ee). Not checked: Sarn's campaign scenario with computer armies, where the longer reach of item 2 applies.

For the chat that develops Sarn Corridor. This note replaces the note of 26 November. It lists every engine change France 1944 made after applying fix 8 (France commit 164ca88). The patch beside it (`engine-changes-for-sarn-corridor-27nov.patch`) is `git diff 164ca88 -- engine/src` at the commit that adds this note. The patch may not apply cleanly to Sarn's newer `command.js`; each item below says what to change by hand.

## 1. Carry these now: faults

| Change | Where | What it cures |
| --- | --- | --- |
| Transit fix | `sim.js`, `arrivals`: the loop takes `!F.transit` as well as `F.arr && !F.active && !F.dead` | A division forming a road or rail column was landed again at its first beach. Every France batch before batch 32 ran with it. Sarn has the same line. |
| Crash guard in the corps review | `command.js`, `review`: `if (bad.st !== 'lost' && pos(q.child))` | One game in twenty crashed when a relieved child formation had no position. Sarn has the same line. |

## 2. Army AI

| Change | Where | Effect in France |
| --- | --- | --- |
| Pocket bonus only for a real pocket | `command.js`, `pocketed(v, s, ring)` | The bonus goes to an objective with own ground at eight points on a ring round it. |
| Unreachable objective set aside for ten days | `command.js`, `v.noWay` | Sarn already has it. |
| Mission axis | `command.js`, `armyTick`, `cfg.axis: { dir, corps, gain, behind }` | An objective ahead on the army's axis scores up to 1 + gain; one behind scores `behind`. Does nothing without `cfg.axis`. |
| A corps with nothing in reach looks farther | `command.js`, `armyTick`, `cfg.far` | A corps the front had left behind kept its last order for up to 355 hours. With the change and the Loire closure, Paris went from 4 of 20 games to 19 or 20 of 20. `cfg.far: false` keeps the old rule. This one changes behaviour by default. |

## 3. Phase lines: boundaries between armies

`S.phaseBlock` in `sim.js` takes three new fields on a phase line: `nat` (a list of formation nationalities the line binds) and `west` or `east` (the line runs north to south, points in order of y, and closes the ground on that side). Does nothing unless a scenario uses them.

## 4. Fortresses

| Change | Where | Effect |
| --- | --- | --- |
| Fortress flag | `sim.js`: `fortress: !!fs.fortress` at setup; the three-kilometre fall-back skips `F.fortress`; `startRetreat` sends a shaken fortress unit to the centre of the works, or the middle of its order line outside any works, and one within 1.5 km of that point stands | The garrison stays in its port. |
| Prepared works | `sim.js`: `S.fortz` from `sc.forts: [{ s, vp, x, y, r, ent }]`; the dig-in rule gives a unit of that side inside the radius the fort's strength within the hour while the objective is held; strength is capped at 1.5 | Cherbourg went from 19 June to 26 June (history 26 June). Brest holds past the end of the scenario. |

Put a fort's centre on the objective itself. France set one 2 km off and lost the port again: a unit standing at the centre was outside the 2.5 km that holds a large objective.

## 5. Theater commander

Rule 9 in `theater.js`: an objective of his own worth `coverPts` or more that stands empty with the enemy within `coverE` km gets a division, a reserve first. Off unless the scenario sets `coverPts`. On trial in France as of this note.

## 6. Scenario settings in France that are not engine changes

The front line (`ownMax`) is off for Overlord. The ground south of the Loire is closed to the Allied AI. Saint-Lô stays closed to 11 July.

## 7. The shared engine

Unchanged from the note of 26 November: one `loa-engine` repository pinned by both games as a submodule, after the German-side work in France. See `docs/design/shared-engine-plan.md`.

## Source trace

| Statement | Source |
| --- | --- |
| Every change and its place in the code | The France 1944 repository at this commit; `git diff 164ca88 -- engine/src`. |
| Batch results quoted | `docs/step5-progress.md`, batches 32 to 40, and the summaries in `docs/tests`. |
| "Sarn has the same line" for the transit and crash faults | Read in the Sarn Corridor clone on 26 November; Sarn may have changed since (not rechecked). |
| The patch may not apply to Sarn's `command.js` | The 26 November patch failed `git apply --check` there; this one was not tried (inference). |
