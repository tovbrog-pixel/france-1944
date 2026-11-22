# France 1944-45 Campaign Game: Design Document

Tov Binyamin Brog · 22 Nov 2026

Living version: [Claude doc](https://claude.ai/artifact/BBukMc5RtidWtd62p5LK4p). This file is the repository copy.

## Concept and scope

The game covers the Allied campaign in northwest Europe from D-Day, 6 June 1944, to the German surrender in May 1945, at division level. It runs as a stand-alone desktop game on the Lines of Advance engine and rules, with its own project, data and manuals.

- **Scale:** divisions are the maneuver units; regiments, brigades and combat commands are the sub-units the player sees deployed.
- **Command:** the player gives army and corps orders, with drill-down to single divisions.
- **Map:** one continuous theater from the Cotentin to the Elbe, southern France included.
- **Sides:** Allied roles at release; German roles reserved for a later expansion.

About 90 Allied divisions stood in the theater by spring 1945, against 60-plus German divisions on paper. Corps and army orders keep that count playable for a player who dislikes micromanagement.

## Player roles and command handovers

Four roles are playable, and each follows the historical chain of command, so each plays as a different game. When the player holds one role, the AI plays the other three.

| Role | Commands | Main levers | Limits from above |
| --- | --- | --- | --- |
| Eisenhower | SHAEF from D-Day; direct ground command from 1 Sep 1944 | Political score; resources and supply priority; army-level direction and objectives; heavy bomber targeting to mid-Sep 1944; Dragoon timing; airborne reserve; replacement priority; from 1 Sep, broad front or narrow thrust | Combined Chiefs; relief risk |
| Montgomery | All Allied ground forces to 1 Sep 1944, then 21st Army Group | Army and corps orders; lobbying Eisenhower for priority | Eisenhower's directives; standing with Brooke and Eisenhower |
| Bradley | First US Army, then 12th Army Group from 1 Aug 1944 | Army and corps orders; protesting a lost army at political cost | Montgomery to 1 Sep, then Eisenhower |
| Patton | The Fortitude ghost army (FUSAG) under Eisenhower's direction, then Third Army from 1 Aug 1944 | Deception measures during Fortitude; corps orders; exploitation past objectives | Eisenhower during Fortitude, then Bradley's boundaries and axes; standing with Eisenhower |

Scripted handovers move forces between roles:

- **20 Dec 1944:** First and Ninth Armies pass to Montgomery during the Bulge.
- **January 1945:** First Army returns to Bradley; Ninth Army stays with Montgomery until April 1945.

Devers' 6th Army Group comes under Eisenhower once activated on 15 Sep 1944 and always runs as AI. French politics in the south still fire events with Devers as AI, such as the Colmar Pocket and the French First Army under de Lattre.

**Fortitude phase.** Patton chooses deception measures (radio traffic, dummy camps, public appearances, double-agent leaks) within limits Eisenhower sets. A German belief meter decides how long the Fifteenth Army stays at the Pas de Calais, and overdoing it risks exposure. Patton's role then skips to 1 August 1944.

## Command model

The player draws lines of advance and objective lines for armies or corps, and AI commanders below divide the work. The Lines of Advance idea moves up one or two echelons.

1. **Role (player):** sets army group or army objectives, supply priority and support allocation.
2. **Army:** the player or an AI army commander assigns corps sectors and axes.
3. **Corps:** the player usually works here; the corps commander splits lines among divisions.
4. **Division:** the AI division commander deploys regiments, brigades or combat commands, as units do in Lines of Advance.
5. **Sub-units:** shown deployed on the map with their attached support.

Rules carried over from Lines of Advance:

- On-arrival instructions (hold, dig in, rest and refit, exploit, delay, reserve) with a time limit.
- Crossing lines of advance disrupts and delays both units.
- Each order shows on the map as a slightly transparent symbol.
- Commanders can refuse orders they cannot carry out; the player can relieve them.

**Orders on the map and movement.** Orders draw as arrows. Commanders move by the most logical means: overland on foot, by rail, by boat, or by truck and other vehicles on roads.

**Exceeding orders, within limits.** A subordinate role may push past its objective up to a depth set in the data. Its boundary and axis stay fixed. Success forgives the overreach; failure costs standing with the superior. AI superiors issue orders to the player as boundaries, axes, objectives and phase lines.

## Political score

Eisenhower's political score decides what he receives from above and whether he keeps his command. It is kept as standing with four audiences, so one decision can win in one capital and lose in another.

| Audience | Speaks for it | Raises standing | Lowers standing |
| --- | --- | --- | --- |
| Washington | Marshall, Roosevelt | Steady advance at bearable US losses; US armies given the main effort | Heavy US losses for little gain; US armies placed under Montgomery |
| London | Churchill, Brooke | A British main effort; Antwerp opened early; a drive on Berlin | Sidelining 21st Army Group; V-weapon attacks left unanswered |
| Paris | de Gaulle | Liberating Paris; holding Strasbourg; visible French roles | Bypassing Paris; giving up Strasbourg |
| Moscow | Stalin | Keeping to the agreed zones | Racing into the Soviet zone |

How the score acts on play:

- **Resources:** standing at each phase break sets what the Combined Chiefs grant in divisions, landing craft, supply tonnage and air priority.
- **Relief:** each audience's standing runs from 0 to 100, and Eisenhower's composite weights Washington 40%, London 30%, Paris 15% and Moscow 15%. A warning comes when the composite falls below 40 at a phase review or any one audience drops below 20. Relief follows if the composite is still below 40 at the next review, or falls below 25 at any time. Eisenhower's relief ends the campaign with a grade. Other roles may continue under the AI replacement or switch roles.
- **Coalition friction:** events fire on dates or conditions, such as Paris (Aug 1944), Montgomery's demands for priority (Sep 1944), the Bulge command shift (Dec 1944), Strasbourg and Montgomery's press conference (Jan 1945), and the Berlin decision (Mar to Apr 1945).
- **Reasons shown:** every change is logged with its cause, in the style of the lessons ledger.

Each subordinate role carries a smaller standing score with its superiors: Patton with Eisenhower, Montgomery with Brooke and Eisenhower. Bradley answers to Eisenhower, and to Montgomery until 1 September 1944. A subordinate is warned below 35, and relieved below 35 at the next review or below 20 at any time. All thresholds are starting values for balance testing.

## Race to Berlin and the Soviet clock

Reaching Berlin before the Red Army earns battle points and costs political standing. A Soviet clock sets how much time the player has.

- **Soviet clock:** a data file of Soviet front lines by date, starting from the historical schedule. German divisions moved west speed the Soviet advance; divisions sent east slow it.
- **Berlin's price:** a Berlin drive raises London standing and lowers Washington and Moscow standing. Staff advice cites Bradley's estimate that taking Berlin could cost 100,000 casualties.
- **Occupation zones:** zone lines appear on the map in early 1945. Ground taken inside another ally's zone scores battle points and carries a handover cost at the end.
- **Ending:** the campaign ends at the German surrender, and a German resistance index decides when.
- **Early collapse:** the index starts at 100. It falls as Germany loses the Ruhr, the Saar, Silesia (on the Soviet clock), fuel stocks and destroyed divisions, and as Allied armies cross the Rhine on a broad front. Below 25, German units begin surrendering on contact. Below 10, or when Berlin falls, a general surrender follows within 7 days. At the historical pace the index reaches those marks in early May 1945, so a stronger player finishes sooner.

## Time, phases and campaign length

A full campaign runs about 60 hours of play. D-Day to 8 May 1945 spans 336 days, or 8,064 game hours, so the clock averages about 2.2 game hours per real minute. It slows when units are in contact and speeds through lulls.

The grand campaign runs from the D-Day landings to the German surrender on one continuous map. Each of the nine phases below also serves as a starting scenario that runs from its start date through to the German surrender.

1. **Fortitude and the lodgment:** 6 Jun to 24 Jul 1944
2. **Cobra, the breakout and Falaise:** 25 Jul to 21 Aug 1944
3. **Pursuit across France, with Dragoon in the south:** 22 Aug to mid-Sep 1944
4. **Market Garden and the supply crisis:** 17 Sep to early Oct 1944
5. **The autumn battles (Aachen, the Hürtgen, Lorraine, the Scheldt):** Oct to 15 Dec 1944
6. **The Bulge and Nordwind:** 16 Dec 1944 to late Jan 1945
7. **The Rhineland:** Feb to Mar 1945
8. **The Rhine crossings and the Ruhr:** 7 Mar to 18 Apr 1945
9. **The race to the Elbe and Berlin:** mid-Apr to 8 May 1945

Phase breaks are decision points: supply priority, replacements, airborne allocation and a political review. Phase dates are working boundaries for design and need checking against the official histories.

## Logistics and replacements

Supply is the senior commander's main lever. The game reproduces the September 1944 fuel halt unless the player opens a port sooner.

- **Ports:** the Mulberry harbors and beaches, Cherbourg, Antwerp (open to shipping from late November 1944) and Marseille for the south.
- **Inland movement:** engineers repair rail lines over time, and truck lines such as the Red Ball Express fill the gap. Distance from port consumes tonnage.
- **Allocation:** the player sets tonnage priority by army group or army at phase breaks and on demand. AI superiors set it for subordinate roles.
- **Replacements:** the infantry replacement pool runs short in late 1944. Divisions lose combat value as veteran strength falls, and rest in reserve restores part of it.

## Air and support at division scale

The player allocates air and support at army group and army level. Division commanders call in what reaches them, weather permitting.

| Asset | Who allocates | Effect in play |
| --- | --- | --- |
| Heavy bombers, strategic | Eisenhower to mid-Sep 1944, then Combined Chiefs priorities | Rail and bridge interdiction; the oil campaign cuts German fuel |
| Heavy bombers, tactical | Army group request | Carpet bombing for set-piece attacks such as Cobra and Goodwood, with a short-bombing risk |
| Tactical air forces | Assigned to armies | Close support and armed reconnaissance; grounded by weather |
| Airborne divisions | Theater reserve | Drops limited by airlift, with recovery time after each |
| Naval gunfire | Early phases | Fire support within range of the coast |
| Corps artillery, separate tank and tank destroyer battalions | Army to corps | Attached to divisions by corps commanders |
| Engineer bridging | Army | River crossings; the Rhine needs the most |
| French Resistance and Fortitude deception | Scripted, shaped by player choices | Delays German reserves |

The German AI holds its own levers: V-weapons against Antwerp, Operation Bodenplatte on 1 January 1945, fuel shortages and Hitler's no-retreat orders. V-weapon attacks that the Allies leave unanswered, by bombing the launch sites or overrunning the launch areas, cost standing in London.

## Map, terrain and rendering

One continuous 3D map runs from the Cotentin to the Elbe, roughly 1,000 by 800 km, loaded in tiles as the camera moves. The player can zoom and tilt the map but never drops to ground level.

- **Elevation:** public digital elevation data. The 1944 roads, railways and bridges are built by hand from period maps, since modern road networks differ.
- **Terrain:** the Lines of Advance set (towns, roads, rivers, bridges, forest, hills), plus bocage, polders and flooded ground.
- **Detail by zoom:** unit symbols at theater zoom; deployed sub-units, vehicles, aircraft and effects near the camera, at the Lines of Advance visual standard.
- **Weather:** set by region and date. Autumn mud slows movement, and Ardennes fog grounds aircraft.
- **Sound:** a background soundtrack that shifts with the situation. Movement and battle sounds grow louder and more specific as the camera zooms in: engines and gunfire, aircraft overhead, fighters passing low, bombs whistling and exploding.

## AI commanders

Five top-level AI personalities run every role the player does not hold: Eisenhower, Montgomery, Bradley, Patton and Devers. Corps and division commanders sit below them. This AI work is the largest risk in the design.

- **Personalities (design intent):** Montgomery plans set-piece battles and lobbies for priority. Patton presses against his limits and seizes openings.
- **Lessons ledger:** carried over from Lines of Advance. Each commander learns within a campaign; enemy lessons stay hidden until the end.
- **Replacements:** a new commander may be better and brings his own lessons. Relief costs disruption that depends on timing.
- **German AI:** OB West commits reserves, counterattacks (Mortain, the Bulge) and withdraws, inside Hitler's constraints and under the Soviet clock's pull on its divisions.

## Training scenario

The tutorial is a Blue-versus-Red maneuver in the Tennessee maneuver area in 1943, with an umpire as the advisor. Second Army ran division and corps maneuvers there from 1941 to 1944, including Cumberland River crossings.

The player commands a corps of two to four divisions. The umpire recommends moves, explains each control and source of information, and points out friction as it happens. The tutorial covers:

- Corps and army orders, on-arrival instructions and limits
- Supply allocation
- Air and support requests
- Reading political standing and its causes

## Manuals as operations orders

Each role receives its own operations order in the field order form of FM 101-5 (19 August 1940), paragraphs 66 and 67, and all four share one set of annexes. The tutorial does the teaching; the orders serve as reference.

1. **Information:** enemy and friendly information (the game world and order of battle)
2. **Decision and coordinating details of the plan:** victory conditions and phases
3. **Tactical missions for subordinate units:** how to issue orders, phase lines and on-arrival instructions; the closing subparagraph x carries instructions for two or more units
4. **Administrative matters:** supply and replacements
5. **Signal communication and command posts:** the interface and controls

Each order carries the 1940 heading (issuing headquarters, place, date and hour, serial number, map reference) and ending (commander's signature, OFFICIAL authentication by the G-3, annex list, distribution).

Eisenhower's order opens from the Combined Chiefs' directive to him of 12 February 1944. Montgomery's, Bradley's and Patton's orders come down the chain from it.

Annexes: A, task organization; B, intelligence estimate; C, operations overlay; D, air plan; E, fire support; F, supply and replacements; G, signal and controls. All ship as PDF in the docs folder.

## Package and technical architecture

The game ships as a desktop installer: the web engine wrapped in a desktop shell, with data, map, audio, manuals and saves in separate files. The simulation runs apart from the graphics, so tests can run it alone at high speed.

```
Data files (JSON) ──┐                        ┌──> Renderer (3D map in desktop shell)
                    ├──> Simulation core <───┤      returns player orders
Map tiles ──────────┘    (orders, combat,    └──< Test harness (AI-vs-AI, no graphics)
                          supply, AI)
                              │
                         Save files (stamped with data version)
```

| Folder | Holds | Format |
| --- | --- | --- |
| app | Executable and desktop shell | Tauri |
| engine | Simulation core and renderer modules | JavaScript |
| data | Order of battle, commanders, arrival schedules, equipment, political events, Soviet clock, phases | JSON |
| map | Elevation and terrain tiles; 1944 roads, railways and bridges | Image tiles, GeoJSON |
| audio | Music and ambient sound; short effects | OGG; WAV |
| docs | Operations orders and annexes | PDF |
| User folder | Saves and settings, stamped with the data version | JSON |

- **Shell:** Tauri, decided 22 Nov 2026. It runs on the Edge WebView2 engine built into Windows and keeps the installer small.
- **Editable data:** a corrected order of battle needs no code change. Saves record the data version, so old saves still load.
- **Code storage:** a private GitHub repository, with large files (audio, map tiles) in Git LFS.
- **Builds:** the Windows installer comes from GitHub Actions or a build on the laptop.

## Testing approach

Balance testing keeps the Lines of Advance method of multi-run AI-vs-AI tests followed by fixes, run headless at hundreds of times normal speed.

- Each phase start doubles as a test fixture.
- A batch of 20 runs per phase compares front lines and political standing with the historical record.
- Full-campaign runs go overnight now and then.
- Difficulty levels and randomness get tuned from the batch results.

Difficulty levels: tutorial, green, veteran and advanced. Randomness stays within historical limits: weather, supply disruptions, events in Germany (including a small chance the 20 July plot succeeds), commander casualties, port damage and storms, and intelligence quality, where Ultra intercepts sometimes reveal German plans and sometimes miss them.

## Build plan

The first playable target is a slice from D-Day to 1 September 1944, which covers every role's entry and both 1944 handovers.

1. **Design review:** Tov marks up this document.
2. **Technical proof:** desktop shell, a tiled 3D map from the beaches to the Seine, 150 placeholder divisions moving, and the simulation running headless at 500 times normal speed, all on Tov's laptop.
3. **Engine fork:** copy Lines of Advance at its current version, split simulation from rendering, add corps and army echelons.
4. **Slice data:** June to August 1944 order of battle, commanders, arrival dates, roads and rail, and political events, each file with its sources.
5. **Vertical slice:** D-Day to 1 Sep 1944 with its operations orders and the Tennessee tutorial, then AI-vs-AI testing and fixes.
6. **Extension:** add phases in order through the surrender.

## Open questions

All ten were resolved in Tov's review on 22 Nov 2026; each decision now sits in its section.

- [x] How the Fortitude phase plays for the Patton role: deception measures under Eisenhower's direction (Player roles)
- [x] Which controls Eisenhower uses before 1 Sep 1944: resources, army-level direction and objectives, heavy bombers, Dragoon timing, airborne reserve, replacement priority (Player roles)
- [x] How corps and army orders draw on the map: arrows, with commanders choosing the transport (Command model)
- [x] Thresholds for relief warnings and relief: set by Claude at Tov's direction (Political score)
- [x] Conditions that let a strong player bring the German collapse forward: German resistance index, set by Claude at Tov's direction (Race to Berlin)
- [x] Difficulty levels and the range of randomness (Testing approach)
- [x] Scope of music and sound (Map, terrain and rendering)
- [x] Tauri or Electron: Tauri (Package)
- [x] FM 101-5 (1940) paragraph titles: audited against the manual (Manuals)
- [x] French politics in the south with Devers as AI: yes (Player roles)

## Source trace and inferences

Every design decision in this document comes from Tov's direction on 22 November 2026, in chat and in his review of the Word draft. Historical facts come from general history and need checking against primary sources before data work begins.

| Passage | Source | Status |
| --- | --- | --- |
| Roles, handovers, political score drivers, Berlin model, Dragoon as AI, limits on exceeding orders, 60-hour length, package format | Tov's choices in chat, 22 Nov 2026 | Decided |
| Command dates (Montgomery to 1 Sep 1944, 12th Army Group and Third Army on 1 Aug 1944, 6th Army Group on 15 Sep 1944, Bulge transfers) | General history | To verify: US Army official histories (Green Books) |
| Phase dates, Antwerp opening, Bodenplatte date, Tennessee maneuvers | General history | To verify: official histories |
| Bradley's 100,000-casualty estimate for Berlin | Bradley's postwar account, as commonly cited | To verify against his memoir |
| Combined Chiefs directive of 12 Feb 1944 | General history | To verify against the document |
| FM 101-5 field order form and paragraph titles | [FM 101-5, 19 Aug 1940](https://patcosta.com/wp-content/uploads/2024/07/FM-101-5-Staff-Officers-Field-Manual-The-Staff-and-Combat-Orders-Aug-1940.pdf), pars. 66-67, read 22 Nov 2026 | Sourced |
| Rommel wounded 17 Jul 1944; McNair killed 25 Jul 1944; Channel storm 19-22 Jun 1944 | General history | To verify: official histories |
| Division counts (about 90 Allied, 60-plus German on paper) | General history | Approximate |
| GitHub plan allowances | [GitHub Actions billing](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions), [Git LFS billing](https://docs.github.com/en/billing/concepts/product-billing/git-lfs), read 22 Nov 2026 | Sourced |

**Inferences, labeled:**

- 8,064 game hours and 2.2 game hours per minute: computed from the dates and the 60-hour target.
- The 500-times headless speed target and the overnight full-campaign runs: engineering estimates.
- Commander personalities in the AI section: design intent drawn from general history, not tested.
- Relief thresholds, audience weights and the German resistance index values: set by Claude at Tov's direction as starting values for balance testing.
