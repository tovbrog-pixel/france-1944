# Step 4 progress: slice data

Author: Tov Binyamin Brog

Step 4 builds the data for the slice from D-Day to 1 September 1944: real terrain, the 1944 road and rail network, the order of battle with arrival dates, and commanders. Each data file carries its own sources (see `data/README.md`).

## How the data gets built

Claude's workspace cannot reach the elevation, map or archive servers. Three GitHub Actions workflows do the downloading instead and commit the results to the repository:

| Workflow | Script | Downloads | Writes |
| --- | --- | --- | --- |
| Terrain data | `tools/data/terrain.py` | Copernicus DEM GLO-90 tiles and water mask; ESA WorldCover 2021 | `data/terrain/` |
| Network data | `tools/data/network.py` | OpenStreetMap regional extracts; HydroRIVERS; INSEE 1936 census; commune centroids | `data/network/` |
| Source texts | `tools/data/sources.py` | Full texts of the official histories and order of battle references from archive.org and HyperWar | `sources/` |

The data workflows do not trigger the Windows build.

## Slice map

The slice covers 820 x 450 km in the Lambert-93 grid: Pointe du Raz to the Meuse, and the Loire to Calais. It includes the Channel coast of England. `data/terrain/preview.png` shows the result.

| Grid | Value |
| --- | --- |
| Source cells | 250 m, 3,280 x 1,800 |
| Land cells | 4,164,810 |
| Highest point | 797 m |
| Engine cells | 1 km for the slice (820 x 450), 0.5 km possible |

`tools/realmap.js` turns the 250 m grids into engine cells for any window of the slice. The rules:

| Engine terrain | Rule (each an inference, open to tuning) |
| --- | --- |
| Sea | Half or more of the 250 m cells are sea |
| Heavy forest | Tree cover 80% or more |
| Light forest | Tree cover 55% or more |
| Hills | Elevation range inside a 1 km cell of 55 m or more |
| Marsh | Herbaceous wetland 30% or more |
| Impassable water | Lakes and wide rivers 45% or more |
| Bocage | Open farmland inside the 1944 hedgerow region (`data/terrain/overlays-1944.json`) |
| Flooded (marsh) | Ground at or below 6 to 8 m inside the four June 1944 inundation zones |

Elevation removes 12 m per unit of tree cover, since the Copernicus model measures treetops.

At 1 km the slice has 177,723 open cells, 50,875 forest cells, 20,280 hill cells, 10,086 bocage cells, 659 marsh cells and 108,838 sea cells.

### 1944 overlays

`data/terrain/overlays-1944.json` holds the hedgerow region and the German inundations of June 1944, each with its source passage:

- **Bocage:** the Cotentin, the Bessin and the Bocage south to Pontorson, Fougeres, Mayenne and Alencon, bounded on the east by the open Caen country (Bayeux, Villers-Bocage, Thury-Harcourt, Falaise, Argentan, Sees). Harrison names the five regions; Ellis and Blumenson describe the open country east of the Orne, the bocage around Vire, Mortain and Domfront, and the change to open country in Brittany. Claude drew the line from those descriptions.
- **Flooded ground:** the strip behind Utah Beach, the Douve and Merderet, the lower Aure (Harrison) and the Dives valley and delta (Ellis). Low ground inside each zone becomes marsh.

### Roads, railways, rivers and towns

The network workflow produced `data/network/`:

| Layer | Contents | Notes |
| --- | --- | --- |
| Roads | Class 3 (trunk and primary) 38,320 km; class 2 (secondary) 53,135 km; class 1 (tertiary) 119,343 km | Modern alignments as a proxy for 1944, motorways removed. The engine loads classes 3 and 2 |
| Railways | 1,860 main-line pieces, 595 branch pieces, plus about 8,400 km of abandoned and razed lines | OSM draws many double tracks as two lines, so the totals count some track twice. Some abandoned local lines closed before 1944; to check against the GSGS sheets |
| Rivers | 5,701 reaches with mean discharge of 1 m3/s or more | Rivers of 8 m3/s or more stop vehicles without a bridge (setting `majorQ`) |
| Towns | 1,505 French communes of 2,000 or more people in the 1936 census; 367 other places | Size 3 at 50,000, size 2 at 10,000 |

### Normandy test on the real map

`tools/normandy-test.js` loads a 200 x 190 km window (Cap de la Hague to Lisieux, the coast to Domfront) at 0.5 km cells, with 24 Allied and 16 German divisions from `data/oob` on a test line from Lessay to Caen. The placement is a test, not a historical scenario.

| Measure | Result |
| --- | --- |
| Map content | 3,973 road pieces, 823 rail pieces, 504 river reaches, 148 towns, 112 bridges found by the engine |
| Forces | 40 divisions, 628 battalions |
| Speed | 24 game hours in 62 seconds, 1,396 times real time, in Claude's workspace |
| "No route" halts | At most 2 divisions at once, none at the end |

The Falaise "no route" problem from step 3 does not appear on the real network.

### Engine changes

- New terrain class `BOCAGE` (15): foot movement 0.7, vehicles 0.15 off road, cover 0.55 (the same as a town).
- `buildMap` takes a real raster (`sc.raster`) in place of the sketch terrain, and uses surveyed lines as drawn (`sc.realLines`).
- All eight original scenarios still match the regression baseline.

## Order of battle, first version

`tools/data/build-oob.js` writes `data/oob/allied-1944.json` and `data/oob/german-1944.json`.

| File | Contents | Sources |
| --- | --- | --- |
| Allied | 22 US and one French division with arrival dates; 16 British, Canadian and Polish divisions with commanders and dates of change; 18 army group, army and corps headquarters; 12 independent brigades | US Theater Historian order of battle (1945); Ellis, Victory in the West vol. I, Appendix IV |
| German | 4 armies, 13 corps and 51 divisions met between 6 June and 31 August | Ellis Appendix V |

Status of the records:

- US arrival dates are sourced from the "Arrived Continent" lines. Each was checked against its D+ day.
- British and Canadian arrival dates are marked `verify`. Ellis gives them only loosely; Joslen or Stacey will settle them.
- US army and corps commanders and the 1 August command changes are sourced from Blumenson, Breakout and Pursuit.
- 20 German divisions have 6 June positions from Harrison, Cross-Channel Attack. Eleven are marked `inference`, since Claude placed each at the centre of the area the text names; the other nine are marked `verify`, since part of the placement comes from general history.
- All 51 German divisions now carry an arrival record with source and page (table below).

### German arrivals

Each record gives the first date the source puts the division, or its first battle group, at the Normandy battle area. Divisions from outside the slice get an entry point at the map edge in the direction the source gives; Claude chose the point, so it is marked `inference`. Page numbers come from the running heads of the OCR text and may be one or two pages off.

| Status | Divisions | Meaning |
| --- | --- | --- |
| Sourced | 33 | The text states the date or the event that sets it |
| Inference | 5 | Claude read the date from narrative wording: 3rd Parachute, 17th SS Panzer Grenadier, 9th SS and 10th SS Panzer, 16th Luftwaffe Field |
| Verify | 13 | Date still open or only approximate: 77th, 48th, 6th Parachute, 17th and 18th Luftwaffe Field, 344th, 3rd and 15th Panzer Grenadier, and the coastal 47th, 49th, 226th, 245th and 348th |

| Date | Arrivals (sourced unless marked) |
| --- | --- |
| 6 June, in place | 709th, 243rd, 91st, 352nd, 716th, 21st Panzer, 711th; 343rd at Brest |
| 7-13 June | 12th SS Panzer (7), 346th battle group (7), Panzer Lehr (8), 77th (10, verify), 3rd Parachute battle group (10, inference), 17th SS (12, inference), 2nd Panzer (13) |
| 17-29 June | Battle groups of 265th, 275th, 353rd (17); 266th battle group (22); 1st SS and 2nd SS Panzer (28); 9th and 10th SS Panzer (29, inference) |
| July | 276th (5), 16th Luftwaffe Field (7, inference), 277th (10), 272nd (13), 271st (17), 5th Parachute battle group (19), 326th (22), 116th Panzer (24) |
| August | 84th and 363rd (2), 2nd Parachute toward Normandy then back to Brest (1-8), 9th Panzer, 708th and 331st (6), 89th (7), 85th (10), 48th and 6th Parachute (15, verify), 17th and 18th Luftwaffe Field and 344th (20, verify) |

The main passages: Ellis pp. 236-237, 262, 274, 279-282, 319, 378, 405-423; Blumenson's footnote on the four infantry divisions that relieved five panzer divisions between 10 and 22 July (p. 223), his account of early August (pp. 435-443) and his Map IX; Harrison pp. 254-260, 334, 372-376.

## Still to do in step 4

1. Positions for the five Fifteenth Army coast divisions and dates for the 13 `verify` German records.
2. Corps attachments by date (US Theater Historian assignment tables, Ellis).
3. British and Canadian arrival dates from a primary source.
4. A check of roads and railways against the GSGS sheets, with abandoned lines that closed before 1944 removed.
5. Airfields and the troop carrier fleet for June to August 1944 (Craven and Cate vol. III is now in `sources/`).

## Source trace

| Passage | Source | Status |
| --- | --- | --- |
| Slice grid, land and sea counts, highest point | `data/terrain/grid.json`, built from Copernicus DEM GLO-90 and ESA WorldCover 2021 | Sourced |
| Terrain classification rules, canopy correction | Claude's settings in `tools/realmap.js` | Inference |
| US division arrival dates | Order of Battle of the US Army, WWII, ETO: Divisions (1945), Statistics pages | Sourced |
| British, Canadian, Polish commanders and dates of change | Ellis, Victory in the West vol. I, Appendix IV | Sourced |
| British, Canadian, Polish arrival dates | Ellis narrative and general history | Verify |
| German corps and divisions met | Ellis, Appendix V Part II | Sourced; 89th and 709th read from damaged OCR (inference) |
| US army and corps commanders, 1 Aug command changes, 2e DB arrival | Blumenson, Breakout and Pursuit | Sourced; 2e DB exact landing date verify |
| Bocage region, flooded zones | Harrison pp. 180-182, 284, 287, 367; Ellis; Blumenson | Inference (line drawn by Claude from the descriptions) |
| German 6 June positions | Harrison pp. 146-373; Blumenson for Brest, Lorient and Morlaix | Inference or verify, per record |
| German arrival dates | Ellis, Blumenson, Harrison, with pages in each record | 33 sourced, 5 inference, 13 verify |
| German entry points at the map edge | Claude's choice from the direction in the source | Inference |
| Road, rail, river and town totals; test results | `data/network/` build log; `tools/normandy-test.js` run | Sourced |
| Modern roads and OSM railways as 1944 proxies | Claude's method | Inference |
