# Lines of Advance: Operational Command 1943-44
## An independent review from an old grognard

Reviewed build: /home/claude/game/src as of 22 November 2026. I made no changes there. All experiments ran on a copy in /tmp/review/game, with damage counters added to that copy's sim.js (counters only; no rule changes). Scripts are in /tmp/review/scripts.

How I judged results, per the designer's clarification: a result that differs from 1943-44 is fine in itself. I flag a result only when (a) the process behind it breaks the period's limits, or (b) computer-versus-computer games with no player input drift away from the historical baseline in a consistent direction, which means the model moves the result before the player does anything.

---

## 1. Overall verdict

This is a real operational wargame. Its idea comes straight from Command Ops 2: you give intent (a line of advance and an objective line), and subordinate commanders with names, ratings, doctrine and lessons turn it into battalion movement, fire and supply. The scale sits between Command Ops and Decisive Campaigns, and it runs in real time with pause. Few designs take friction this seriously: staff time for orders, cost for changing an order under way, crossing columns, relief of commanders, and supply columns you can see and interdict.

It will appeal to the Command Ops and Close Combat crowd who want to command formations, and to anyone who liked the "lines" approach of TOAW's later versions. Hex-and-counter purists who want odds tables and full control over every battalion will chafe. The game's hard limit today is credibility under stress. When a pocket forms or a battle goes long, the model produces collapses and loss exchanges that a reader of Cole or Blumenson will not accept, and the assessment screen was calibrated to absorb those numbers, so it does not flag them. Fix the encirclement and loss-exchange problems below and this stands beside the good computer operational games. Leave them and the history-minded player will stop trusting the end screen after his second Bastogne.

## 2. Strengths

- **Command by intent.** Lines of advance, an objective line, "on arrival" instructions and a queued next leg give the right feel of corps command. Commanders halt, refuse, report odds and ask for help. Relief has a price that depends on the moment (sim.js 206-227). That beats anything SSI shipped.
- **Friction that teaches.** Staff delays scale with commander skill and national doctrine (sim.js 9, 161). Crossing lines of advance cost time and order (sim.js 162). The Germans issue orders fastest and the Italians slowest. A new player learns why reserve positioning and road discipline mattered.
- **Physical supply.** Columns drive real roads, avoid enemy ground, turn back from blocks, die to ambush and air interdiction, and carry less when forced off the road (sim.js 594-660). Captured depots yield booty. That is better supply modelling than most commercial titles at this scale.
- **Armour model with sense in it.** Penetration runs against effective armour, with flank shots from outside a 60-degree front arc and mixed-gun units such as the Firefly troop (data.js 94-103, sim.js 546-556). A 75mm Sherman scores against a Panther only from the side, which matches the record.
- **River crossings and breaching by the manual.** Boat waves, bridge sets at FM rates, mine lanes at about 200 m an hour, night as the time to breach (sim.js 903-1081). A player who reads the help learns real technique.
- **Orders of battle.** I spot-checked well over a hundred unit and commander names across Kasserine, Salerno, Market Garden and Bastogne, and nearly all are right, down to Team SNAFU, Kampfgruppe Knaust and the 9th Division artillery's arrival at Thala on the evening of 21 February.
- **Help text and briefings.** Clear, period-flavoured, and honest about simplification. The guidance from higher headquarters is the best briefing writing I have seen in a hobby game.

## 3. Evidence base

I read the help card, all scenario briefings, data.js, scenarios.js, guidance.js, assess.js and the core of sim.js, and I skimmed ui.js. I ran 15 computer-versus-computer games across all seven historical scenarios, plus targeted tests: one side passive, a march-rate test with the enemy removed, an all-staff Allied test, a deep armoured raid into the Axis rear at Kasserine, and an hour-by-hour Bastogne trace. The raid stalled against Kampfgruppe DAK and was ground down, so I found no supply-cutting exploit there.

Computer-versus-computer results (loss fraction is losses as a share of each side's whole order of battle, from ASSESS; I is the history index, which should centre on zero when no player intervenes):

| Scenario | Allied loss fraction | Axis loss fraction | I per run |
|---|---|---|---|
| Kasserine (3 runs) | 0.10 / 0.13 / 0.11 | 0.24 / 0.29 / 0.31 | +0.01 / -0.75 / +0.44 |
| Salerno (2) | 0.23 / 0.31 | 0.56 / 0.49 | +0.43 / -0.22 |
| Market Garden (2) | 0.26 / 0.27 | 0.42 / 0.45 | -0.18 / -0.35 |
| Bastogne (2) | 0.13 / 0.27 | 0.48 / 0.48 | -0.17 / -1.56 |
| Falaise (2) | 0.14 / 0.14 | 0.55 / 0.52 | +0.27 / +0.19 |
| Gazala (2) | 0.33 / 0.20 | 0.33 / 0.29 | +0.08 / +0.02 |
| Sicily (2) | 0.12 / 0.19 | 0.34 / 0.41 | -0.11 / +0.04 |

Gazala and Sicily behave well. The others show the drifts discussed below.

Passive tests at Kasserine confirm that decisions matter. With the Allies passive, the Axis won both runs (I -0.21 and -0.33) and lost about 17 percent of its force. With the Axis passive, the Allies won both (I +0.46 and +0.47). With the Allied staff active, the Axis lost 24 to 31 percent. So the player's choices move the result, but see recommendation 14 on how much noise surrounds them.

---

## 4. Recommended improvements, by priority

### Simulation model

**1. Encircled forces collapse within hours. (Highest priority; criteria a and b.)**
- *Problem:* in Bastogne run 2 (seed 8919, no player), the 101st Airborne and CCB 10th Armored were reported cut off at 11:13 on 21 December. The first battalion surrendered at 16:20, CCB's headquarters at 19:31, and Bastogne fell at 22:04 the same day. By 05:26 on 22 December the division command post had surrendered. At the moment of the first surrenders the defending battalions averaged 76 percent strength, 62 percent cohesion, 58 percent morale and about 60 percent ammunition (trace from /tmp/review/scripts/bas.js).
- *Why it matters:* the defining operational lesson of 1944 is that a good formation, encircled but supplied by air and led firmly, holds for days (Bastogne five days, the Arnhem perimeter nine). The model turns encirclement into near-instant collapse, so the player learns the wrong lesson and every pocket scenario tilts toward the encircler.
- *Evidence:* four mechanisms combine.
  - Surrender fires the instant any battalion in an isolated formation dips below 8 percent cohesion or 14 percent morale with an enemy within 1 km (sim.js 526). Cohesion swings fast in a close fight, so one bad combat minute ends the battalion.
  - Isolation drains 0.0004 strength every 10 minutes from every battalion even with full stocks (sim.js 633), about 5.8 percent a day, and three times that when starving. In that Bastogne run, isolation took 4.4 battalion-equivalents from the Allies, more than the entire German artillery inflicted (4.15).
  - The morale cascade compounds it: each broken neighbour within 2.5 km subtracts 0.07 from the morale target (sim.js 572) and each break hits everyone within 2 km for 0.05 at once (sim.js 527).
  - Formation stocks run dry before encirclement. The 101st's regiments went from about 80 percent stock at 18:00 on 20 December to zero by 15:00 on 21 December while still connected, because units fire at full rate until empty (see recommendation 4).
- *Suggested change:* make surrender a sustained state: below threshold for at least 2 hours, ammunition under 10 percent, enemy superiority of at least 3 to 1 within 2 km, and no friendly formation within reach. Cut the isolation drain to about 1 percent a day while medical supplies last (track a medical stock that air drops refill), and stop it altogether for airborne and elite troops for the first 48 hours. Cap the neighbour cascade at -0.1 and scale it by distance.

**2. Losses drift against the German side in nearly every scenario. (Criterion b.)**
- *Problem:* with no player, the German side loses two to four times the Allied loss fraction in five of seven scenarios, including battles the Germans opened on their own terms (Kasserine and Bastogne). German loss fractions of 42 to 56 percent at Salerno, Market Garden, Bastogne and Falaise far exceed the historical record. At Kasserine the historical exchange (guidance.js cites Allied 10,000 of 30,000 against Axis 2,000 of 22,000 for 14-24 February) is inverted: the game's Axis loses about 2.5 times the Allied fraction.
- *Why it matters:* this is the model moving the result before the player touches it. It also flattens national differences: the 1943 German army in Tunisia should trade well against a green II Corps.
- *Evidence:* table in section 3. guidance.js line 7 states the casualty budgets were "Calibrated to the game's own loss rates in computer-versus-computer runs", which is why the end screen calls these results normal. Kasserine damage counters (seed 1000) show the Axis losing 0.99 battalion-equivalents to isolation alone and 1.0 to Allied counter-battery (see recommendation 5).
- *Suggested change:* take a target exchange for each scenario from the record (Howe, Blumenson, Cole and MacDonald give usable figures), then tune the drivers that bleed the attacker: isolation drain, counter-battery, surrender, and the absence of any defender penalty for ground he must hold under fire. Only after that, set budgets from history. Keep a regression test that runs ten games per scenario and fails if the mean history index leaves the band of -0.15 to +0.15.

**3. No march fatigue. (Criterion a.)**
- *Problem:* an infantry regiment (135th Infantry, Kasserine) marched 44 km in 15 hours with no loss of cohesion and arrived fit to fight. Nothing stops it marching around the clock: foot speed is 4.2 km/h times terrain, times 0.7 at night (sim.js 462, 483), about 100 km a day on a good road.
- *Why it matters:* at this scale the approach march decides battles. US and British infantry made 25 to 30 km a day on sustained marches and 40 or more only as a forced march with stragglers and exhausted men. A player who can shift a foot regiment 50 km overnight with no cost will out-manoeuvre any historical opponent, and the AI cannot punish it.
- *Evidence:* /tmp/review/scripts/march.js output: "h15 straight-line 43.1 km ... coh 70", the same cohesion as at the start.
- *Suggested change:* add a fatigue value per battalion. Accumulate it for each hour on the move beyond about 8 a day (faster at night and off roads), charge cohesion and combat power against it, and recover it only at rest. Show it on the card as "Fresh / Tired / Exhausted / Spent". Motorised and tracked units fatigue more slowly, and their limit becomes maintenance and fuel.

**4. Units fire at full rate until empty.**
- *Problem:* ammunition burns at a fixed rate per minute of firing (sim.js 11, 561) whatever the stock or the situation. A regiment in steady contact empties a full formation stock in well under a day.
- *Why it matters:* fire discipline under shortage was a command decision in every pocket and every overextended advance. At Bastogne artillery fire was rationed to a few rounds per gun per day for days. In the model, shortage arrives as a cliff edge, which feeds recommendation 1.
- *Suggested change:* scale the rate of fire by formation stock and isolation (full rate above 50 percent, half below 25 percent, a quarter when isolated), with a small loss of combat power. Let the player set a fire-discipline level on the card.

**5. Counter-battery fire without sound or flash ranging.**
- *Problem:* firing artillery becomes visible at about 6 km to any front-line unit in open country (spotting factor 1.5 for recent fire, sim.js 507), and general-support batteries prefer artillery targets (sim.js 539). Batteries then shred each other: Allied artillery killed 1.0 battalion-equivalents of German artillery at Kasserine and 1.86 at Bastogne.
- *Why it matters:* counter-battery in 1943-44 depended on sound ranging, flash spotting, air observation and patrol reports, with hours of delay to locate batteries. Instant visual location from the front line gives the side with more guns a decisive extra edge and helps drive recommendation 2.
- *Suggested change:* locate enemy batteries only through air observation or a counter-battery picture that builds over 30 to 90 minutes of enemy fire (faster for US and British corps with sound-ranging units from 1943, slower for Italians). Show located batteries as a separate marker.

**6. Frontage judged at the line's midpoint only.**
- *Problem:* S.frontage and lineSlots read terrain only at the middle of the objective line (sim.js 256-258, 263-265). A line that runs mostly through forest with an open midpoint gets 2 km per battalion, and the reverse gets 1 km.
- *Why it matters:* small, but the frontage cap is one of the game's best features, and the card's advice should match the ground.
- *Suggested change:* sample the line every 250 m and take the length-weighted mean of 1 km and 2 km.

### AI

**7. Each attacking formation follows a single scripted axis.**
- *Problem:* the computer side's plans are fixed paths and lines per formation; only their timing varies (sim.js 71, 855, plus the plan multiplier at line 33). After one replay, the player knows where 21. Panzer and 10. Panzer will come.
- *Why it matters:* replay value and the honesty of the "opponent that learns" claim in the intro. A human who knows the axis can pre-position and win without generalship.
- *Suggested change:* give each attacking side two to four alternative plans per scenario (the historical one plus plausible alternatives from the record, such as Rommel's preferred Tebessa thrust at Kasserine), chosen at setup and weighted by difficulty. Add a re-plan trigger: if the main effort stalls for 12 hours, the staff shifts the Schwerpunkt to the sector with the best known odds.

**8. The player's staff is weaker than the enemy's.**
- *Problem:* "Hand to staff" formations never reinforce a threatened objective (sim.js 862 requires the computer side), never break out of a pocket (sim.js 857, same condition), and draw only engineers from the support pool (sim.js 884). The help card promises that the staff "picks its own objectives when the plan runs out".
- *Why it matters:* a player who hands a sector to the staff, as a corps commander would, gets weaker handling than the computer side gets with the same troops. My two all-staff Kasserine runs came out mixed against the AI-run games on the same seeds (-0.74 against +0.01, and +0.05 against -0.75), so the case rests on the code; the seed-to-seed swing (recommendation 14) hides the effect in so few runs.
- *Suggested change:* give player-side staff the same threat reinforcement and breakout logic, gated by a "staff may commit reserves" tick box, and let the player choose whether the staff may draw on the support pool.

**9. Staff orders cross each other dozens of times a game.**
- *Problem:* batch logs show 88 and 108 crossing events in the two Falaise runs and 107 and 161 at Market Garden, each costing up to 60 minutes and 0.25 disruption to both formations (sim.js 162). Examples from Market Garden: the Coldstream Guards Group crossed the Irish Guards, the Grenadier Guards and the 506th in a single order at 12:30.
- *Why it matters:* road discipline on a single axis was the staff's core job. The computer penalises itself and the player's staff with friction a competent staff would plan away, which also skews the corridor scenarios.
- *Suggested change:* before issuing an automatic order, test it with S.crossings and try the alternative route or a delay until the other column has passed. Record a staff "march table" so formations on one road go in sequence.

### Interface and information

**10. The halt report misstates the reason.**
- *Problem:* evaluate() halts a formation when odds are good but cohesion is below 0.42, then prints "Unable to proceed ... (odds 23.1 to 1). Request artillery, air or reinforcement" (sim.js 339-342). My Kasserine trace shows Stark Force sending odds of 18.4 and 23.1 to 1 as reasons to stop.
- *Why it matters:* the player sends guns and aircraft to a problem that only rest will fix.
- *Suggested change:* report the true cause: "Odds are good, but the battalions are too disorganised to attack. Need about N hours out of contact."

**11. No staff estimate before an order is issued.**
- *Problem:* the card shows staff delay and frontage, and the route preview shows the road and river warnings. It does not show time to the objective, the odds the commander will see on arrival, the odds he wants, or how long supply will last.
- *Why it matters:* the old boardgame player had the odds table; the Command Ops player has the estimated time of arrival and the staff's assessment. This game hides the commander's own decision rule (ratio against need, sim.js 336), so the player cannot predict a halt or refusal.
- *Suggested change:* when a line is drawn, show "Arrival about 14:30 (6 h 20 min). Known enemy on the objective: 3 battalions, estimated odds 1.6 to 1; Col. X wants 1.4 to 1. Supply for about 14 hours of fighting." Use the same functions the sim uses (evaluate, the path length and F.pace).

**12. No way to set how hard an attack presses.**
- *Problem:* the only lever on a cautious commander is relief. There is no per-order posture.
- *Why it matters:* operational command means deciding when to accept losses. Command Ops and the Decisive Campaigns games both let you set an attack's priority. Here a 0.35-aggression commander such as Stark halts each counterattack the staff orders (my Kasserine trace shows a dozen such halts in one night), and the player can do nothing short of sacking him.
- *Suggested change:* add an order posture row: Probe, Deliberate, Determined, Whatever the cost. It moves the need threshold in evaluate (sim.js 336) and the fall-back thresholds (sim.js 444-446), and it changes lesson weights and morale costs afterwards.

**13. Combat results stay invisible.**
- *Problem:* the log reports attacks and lost units, and it gives no engagement summary. Strength bars show the result without the cause.
- *Why it matters:* the player cannot learn which weapon or tactic worked. My counters show artillery inflicting most casualties, which is historically sound, but the player never sees it.
- *Suggested change:* after each attack (when lessonTick closes F.att), log a one-line after-action report: "Attack on Thala, 14:00-16:00: our losses about 9 percent, enemy about 14 percent; most losses to artillery; two tanks lost to flank fire." Add a "losses by cause" table to the end screen.

### Victory and assessment

**14. Dice outweigh decisions.**
- *Problem:* with no player decisions, Kasserine ranged from I = -0.75 (Decisive Axis victory) to +0.44 (Allied victory) across five runs (three AI-run, two staff-run), and Bastogne from -0.17 to -1.56. That spread of 1.2 exceeds the effect of passive against active play at Kasserine (about 0.7).
- *Why it matters:* the player cannot tell whether his generalship or the random draw produced his verdict, which undercuts the "compared with history" end screen.
- *Suggested change:* narrow the sources of swing (the random main effort and late formation choice at sim.js 80-86 and the surrender cliff are the biggest), and grade the player against a baseline: precompute ten staff-versus-staff runs per scenario and difficulty, then show "Your result: better than 8 of 10 staff-run battles." The sim is seeded and headless, so this is cheap.

**15. Budgets calibrated to the model hide model error.**
- *Problem:* guidance.js line 7 sets casualty budgets from computer-versus-computer runs. Even so, both Market Garden runs ended "Pyrrhic Axis victory" because German losses reached 1.84 and 1.97 times the German budget.
- *Why it matters:* the assessment cannot detect drift it was tuned to absorb, and players will trust a judge that has been taught to excuse the model.
- *Suggested change:* after recommendation 2, set budgets and the historical loss ratio (hr) from the record, and keep the model honest with the regression test.

---

## 5. Quick wins and larger projects

Quick wins (an afternoon each):
- Recommendation 10: correct the halt message.
- Recommendation 6: sample frontage along the line.
- Recommendation 8: open threat reinforcement, breakout and pool attachment to player staff, behind a tick box.
- Recommendation 1, first step: require a sustained state for surrender and cut the isolation drain to about 1 percent a day.
- Recommendation 13, first step: one after-action line per attack from data already held in F.att.
- The data fixes in section 6.

Larger projects:
- Recommendations 2 and 15: loss-exchange calibration against the record, with a regression harness (batch.js already provides most of it).
- Recommendation 3: march fatigue, with its UI.
- Recommendations 4 and 5: fire discipline and a counter-battery picture.
- Recommendation 7: alternative enemy plans and re-planning on a stalled main effort.
- Recommendations 11 and 12: the staff estimate panel and the attack posture.
- Recommendation 14: the baseline distribution for grading.

## 6. Historical and data errors

| Item | Where | Finding | Confidence | Basis |
|---|---|---|---|---|
| Reuben Tucker's rank | scenarios.js 172 | Listed as Lt. Col. for Market Garden; the same file has him as Col. at Salerno (line 108) and Sicily (line 527). He was a colonel by 1943. | High | Own knowledge; internal inconsistency checked in file |
| Howard Johnson and Roy Lindquist | scenarios.js 168, 174 | Both commanded their regiments as colonels in September 1944. | Medium | Own knowledge |
| 907th Glider FA Bn | Bastogne, scenarios.js 246 area | Modelled as us_fa105 (M2A1, 11.2 km). The 907th fought at Bastogne with the short 105mm M3 howitzer, range about 7.6 km. The 321st GFA (line 247) had 75mm pack howitzers and should use us_pfa. | Medium | Own knowledge; I searched ([Wikipedia, 907th GFAB](https://en.wikipedia.org/wiki/907th_Glider_Field_Artillery_Battalion); [ww2-airborne.us, 321st](https://ww2-airborne.us/units/321/321.html)) and neither page states the equipment, so this remains unconfirmed |
| 22nd Armoured Brigade motor battalion | scenarios.js 111 | Lists 1/7th Queen's. The brigade's motor battalion was 1st Rifle Brigade; the Queen's battalions belonged to 131st Brigade. | Medium | Own knowledge |
| M18 penetration | data.js 18 | pen 100 while the equipment note says 116mm for the 76mm M1, and us_tk_m4b uses 116 for the same gun (data.js 96). | High | Checked in file |
| Pz IV company as StuG | scenarios.js 115 | "Pz.Kp (Pz IV)" uses the ge_stug kind, so it gets StuG armour and no turret flexibility. A simplification worth a dedicated kind. | High | Checked in file |
| Cohesion ceiling | sim.js 524 | Cohesion caps at 0.4 + 0.6 x morale, so formations out of contact sit near 70-77 percent forever. The rule is sound. Label the bar against the ceiling so a new player reads it correctly. | High | Checked in file and in runs |

Items I checked and found correct (own knowledge unless noted): Kasserine commanders (Stark, Robinett, McQuillin, Dunphie, Nicholson, Fechet, Greer, Buelowius, von Broich, Hildebrandt) and the 9th Division artillery's arrival time; Salerno regimental and brigade orders of battle, the 504th and 505th drop times and Darby's Ranger force; Market Garden's British and German orders of battle, including Kampfgruppen Walther, Henke, Knaust, Spindler and von Tettau; Bastogne's teams, artillery pool (755th and 969th FA) and relief time of 16:50 on 26 December; gun ranges for the 105mm, 155mm, 25-pdr, 5.5-in, leFH 18, sFH 18, Nebelwerfer and pack howitzer; frontal and side armour for the main tank types.

## 7. What I learned that the designer may want to keep

- Gazala and Sicily already sit close to the historical baseline in computer-versus-computer play (I between -0.11 and +0.08). Whatever balance work went into them is the template for the others.
- Artillery inflicts the largest share of casualties in every trace I ran, which matches the period. Keep that while fixing counter-battery.
- The passive-side tests show the model responds to decisions. The work ahead is to make those decisions stand out from the noise, and to keep the model from deciding the result on its own.
