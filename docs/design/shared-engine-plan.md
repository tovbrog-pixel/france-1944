# One shared engine for France 1944 and Sarn Corridor

Tov Binyamin Brog, 25 November 2026

Decision: the engine gets one repository that both games pull in at a pinned commit (Option 1). This note records how far the two copies differ today and the steps to merge them.

## How far the two engines differ

Compared: france-1944 at 8a55163 and sarn-corridor at 56691c8 (25 November, 9:36 PM ET). Both hold the same 25 files in `engine/src`; neither has a file the other lacks. Sixteen files are identical. Nine differ:

| File | Lines only in France | Lines only in Sarn | What differs |
| --- | --- | --- | --- |
| `sim.js` | 23 | 41 | Sarn: battalion weight of regiment-sized units, retry of curable refusals, difficulty levels. France: fix 8 follow-ups, pacing |
| `command.js` | 10 | 27 | Sarn: concentration at the decisive point, squared axes, echelons. France: Granville guard, narrowed pocket bonus |
| `doctrine.js` | 3 | 46 | Sarn: alignment halts that end when a laggard stalls, guard by battalion weight |
| `divisions.js` | 2 | 91 | Sarn: division templates for its three powers |
| `ui.js` | 4 | 7 | Small |
| `render3.js` | 2 | 7 | Small |
| `index.tpl.html` | 2 | 3 | Small |
| `air.js`, `map.js`, `transport.js`, `tutorial.js` | 1 each | 1 each | One line each |

A line in this code often holds several statements, so the counts understate the size a little.

Tools: `load-engine.js`, `regress.js` and `speed.js` are identical. `build-preview.js`, `build-app.js` and `batch-summary.js` differ. France has 16 tools Sarn lacks (the command, transport, air and tutorial tests among them); Sarn has 7 France lacks (map generator, coherence checker).

## Steps

1. Reconcile the nine files into one engine. Sarn's copy is the base, since it carries more new work; France's 48 lines go on top. Each side's behaviour changes go behind scenario settings where they are not already.
2. Move game content out of the engine: the Tennessee tutorial (`tutorial.js`), Sarn's division templates (`divisions.js`) and any scenario lists in `scenarios.js`.
3. Create the repository `loa-engine` with `engine/src`, the shared tools and tests, and a workflow that runs the regression and command tests on every push.
4. Add it to each game as a git submodule pinned to one commit. Each game's page builder and batch runner read the engine from there.
5. Confirm in each game: regression baselines match, tests pass, one 20-game batch against the last batch on the old copy.
6. Rule for both chats from then on: an engine change is one commit in `loa-engine`, naming the game that asked for it; each game moves its pin when its own batch passes.

## Constraints

- This chat cannot write to the Sarn Corridor repository. Its chat does the Sarn side of steps 4 and 5.
- Both chats should stop engine changes while step 1 runs, or the merge chases a moving target. Sarn Corridor committed engine changes four times on 25 November.

## Done, 27 November 2026

The Sarn Corridor chat created the shared repository on 25 November as `tovbrog-pixel/lines-of-advance-engine` and merged the two copies there: France's engine at 01917bd plus Sarn's opt-in parts. Each game holds it as a git subtree in `engine/src`, in place of the submodule this plan named; `tools/engine.sh pull` and `tools/engine.sh push` move changes. On 27 November France pushed its changes since 01917bd to the shared repository (commit fd53776) and switched its own `engine/src` to the subtree.

| Check | Result |
| --- | --- |
| Sarn Corridor's regression suite on the engine with France's changes | Matches Sarn's baseline (run in a scratch copy of the Sarn clone at 51781ee). |
| France command, transport and transit tests | Pass. |
| Exercise Cumberland on five seeds | Blue wins all five: 60-20, 50-30, 80-0, 50-30, 70-10. |
| France regression baselines | Eight scenarios changed, because France takes the square axis and coherence changes of 25 November for the first time. Re-recorded. |
| Overlord page check | Passes. |
| 20-game batch on the shared engine against batch 41 | Batch 42, queued. |

Still to do on the Sarn side, by its chat: `tools/engine.sh pull` to take fd53776, then its own checks. Not checked here: Sarn's campaign scenario with computer armies, where the army AI's longer reach applies.

## Source trace

| Item | Basis |
| --- | --- |
| File comparison and line counts | Observed: `diff` of the two `engine/src` folders |
| What differs in each file | Observed from the first lines of each diff; a full reading comes in step 1 |
| Sarn as the base for the merge | Inference from the line counts |
| A day of work | Estimate |
