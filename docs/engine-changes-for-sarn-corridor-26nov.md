# Engine changes from France 1944 for Sarn Corridor

Tov Binyamin Brog, 26 November 2026

For the chat that develops Sarn Corridor. France 1944 is on `main` at the commit that adds this note; these are the engine changes it made after applying fix 8 (France commit 164ca88). Compared against sarn-corridor 56691c8. The patch beside this note (`engine-changes-for-sarn-corridor-26nov.patch`) is made against France 164ca88 and does not apply to Sarn's `command.js`, which has moved on; carry the two open items by hand.

## 1. Crash in the corps review (carry this one now)

Sarn Corridor has the same line and the same fault. In `engine/src/command.js`, `review`, the line that orders a relieved division to rest reads its position with `pos(q.child)`. `pos` returns nothing for a division whose leading battalions are all dead or inactive, and the next expression reads `p[0]`.

Seen: France batch 29, seed 119, 9 August, `TypeError: Cannot read properties of null (reading '0')` at `review`. One game in twenty failed this way in France batches 18, 19, 20, 22, 26, 28 and 29. The batch workflow piped the game through `tee`, so the job still reported success.

Change: `if (bad.st !== 'lost')` becomes `if (bad.st !== 'lost' && pos(q.child))` on that line (Sarn line 209). The line after it, which marks the division as the reserve, stays as it is.

Also worth carrying: in the batch workflow, `set -o pipefail;` before the game command and `if: always()` on the artifact upload, so a crashed game fails its job and keeps its log.

## 2. Pocket bonus only for a real pocket

The army commander doubled an objective's score (`armyAI.pocketBonus`) whenever the objective stood on his own ground. With the front line on, that marked every bypassed enemy town near his troops and drew corps back from the pursuit.

Change in `command.js`: a helper `pocketed(v, s, ring)` returns true when the objective stands on side `s`'s ground and eight points on a ring of `ring` km around it do too (sea and the map edge count as closed). `armyTick` uses `pocketed(v, C.s, cfg.pocketRingKm || 8)` in place of `S.ownAt(v.x, v.y) === C.s`.

Evidence: France batch 28 (bonus off) held Chartres in 14 of 19 runs against 11 with it on. Batch 29 (ring test, front line off) matched batch 27 (front line off alone), so the ring test did no harm; that it helps is unproven.

## 3. Unreachable objectives (already in Sarn Corridor)

`armyTick` sets an objective no route reaches aside for ten days (`v.noWay`). Sarn Corridor's copy at 56691c8 already has it. France also moves sea objectives to the nearest land in its scenario builder, which is France data and needs no port.

## 4. The front line: France has switched it off

France's Overlord scenario no longer sets `ownMax`. Three France batch pairs agree (17, 20, 27): with the front line off, Chartres is held in 19 of 20 runs; with it on, 11 of 19. Mean Allied supply was the same either way (63 to 74 percent, seed 3 trace), so supply is cleared as the mechanism. The pocket bonus explains part of it. The rest is unexplained.

For Sarn Corridor this is information only. If its pursuits also stall behind bypassed towns, the pocket bonus and `ownMax` are the first places to look.

## 5. Plan to share one engine

`docs/design/shared-engine-plan.md` in france-1944 proposes one engine repository that both games pin. It needs a freeze on engine changes in both chats while the two copies are merged. Tov has not yet set the date.

## Source trace

| Item | Basis |
| --- | --- |
| Crash and its frequency | Observed: job log of batch 29 seed 119; 19 of 20 games counted in seven batches since 24 November. That the six earlier misses are the same crash is an inference. |
| Sarn has the same line | Observed: `grep` of sarn-corridor 56691c8, `command.js` line 209 |
| Pocket bonus figures | Observed: France batch summaries 26 to 29 |
| Front line figures | Observed: France batch summaries 17, 20, 27; seed 3 traces |
| Granville guard present in Sarn | Observed: `grep` of sarn-corridor 56691c8 |
