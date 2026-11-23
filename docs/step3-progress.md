# Step 3 progress: engine fork

Tov Binyamin Brog · 22 Nov 2026

The engine now runs 43% faster at the France game's unit count, and corps and army commanders can split one order among their formations without crossing routes. All eight Lines of Advance scenarios still give results identical to the original engine.

## Done

| Item | What changed | Check |
| --- | --- | --- |
| Regression check | `tools/regress.js` fingerprints each scenario's end state after 48 game hours, seed 12345, against `tools/regress-baseline.json` | All 8 match after every change below |
| Stress test | `tools/stress.js`: Falaise with every formation's units tripled, 756 units on the same map | Baseline 1,814 times real time |
| Combat pair search | A 31 km spatial grid plus a squared-distance test before the exact distance; pairs still visited in original order | Stress test 2,600 times real time, up 43% |
| Ground ownership grid | Cell size now set per scenario (`ownCell`), default 0.5 km as before | Regression unchanged |
| Corps and army layer | New `engine/src/command.js`: staff planning time, sectors split left to right by fighting strength, a reserve held back by cautious commanders, parallel routes, armies over corps | `tools/test-command.js`: 0 route crossings for a 4-formation corps and for a 2-corps army |

## How a corps order works now

1. The player draws one line of advance and one objective line for the corps.
2. The corps staff plans for 40 to 120 minutes, depending on the commander's skill; an army staff takes half again as long.
3. The commander faces the objective and orders his divisions left to right by where they stand, so their routes run side by side.
4. He splits the objective line into sectors in proportion to each division's fighting units.
5. With three or more divisions and a cautious style (aggression below 0.65), he holds one back. The reserve keeps its own lane and halts 6 km short of the objective.
6. Each division then plans its own order through the existing engine, with its own staff delay.

## Measured

| Test | Result |
| --- | --- |
| Stress test before changes | 756 units, 24 game h in 47.6 s, 1,814 times real time |
| Stress test after changes | 756 units, 24 game h in 33.2 s, 2,600 times real time |
| Where the stress test spends its time now | Combat 72% (pair checks 60%), commanders 10%, supply 8%, movement 4% |
| Corps test, Falaise, 4 formations | 3 sectors and 1 reserve; no route crossings among them |
| Army test, 2 corps of 2 | Army staff 92 min; both corps passed orders on; no route crossings |

All timings come from one CPU core in Claude's workspace. Tov's laptop ran the original engine about seven times faster.

## Known issue

One formation in each command test halted with "no route" on the Falaise map. The message comes from the existing pathfinder, so the command layer did not cause it; the road and rail routing work below should cure it.

## Remaining step 3 work

1. **Echelon shift:** unit types for regiments, brigades and combat commands, with frontages and firepower at that size.
2. **Road and rail routing:** a network graph for long moves, with commanders choosing foot, rail, boat or truck (Tov's review).
3. **Command AI:** corps and army commanders who replan when a division is spent, commit the reserve, and report up.
4. **Time step:** test 5 to 15 minute steps outside combat against combat accuracy.
5. **Theater stress test:** replace the tripled-Falaise proxy with a placeholder Normandy theater once step 4 data exists.

## Source trace

| Passage | Source | Status |
| --- | --- | --- |
| Regression, stress and command test results | `tools/regress.js`, `tools/stress.js`, `tools/test-command.js`, run 22 Nov 2026 | Measured |
| Time breakdown | Timed copy of the engine on the stress test, 8 game hours | Measured |
| Laptop speed ratio | Laptop test report, 22 Nov 2026, in `docs/engine-assessment.md` | Measured |
| Staff times, reserve rule, 6 km halt | Design values chosen for this first version | Starting values for testing |
| Cause of the "no route" halts | Reading of the engine's messages | Inference |
