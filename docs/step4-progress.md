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
| Bocage | Open farmland inside the 1944 hedgerow region (polygon still to draw from the histories) |

Elevation removes 12 m per unit of tree cover, since the Copernicus model measures treetops.

At 1 km the slice has 188,234 open cells, 50,878 forest cells, 20,280 hill cells and 108,838 sea cells.

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
- US army and corps commanders are marked `verify` until the Breakout and Pursuit text arrives.
- German positions on 6 June and arrival dates are the next pass.

## Still to do in step 4

1. Roads, railways, rivers and towns from the network workflow, then check them against the GSGS sheets.
2. Bocage region and the June 1944 flooded areas from the histories.
3. Corps attachments by date; German positions and arrivals.
4. A Normandy test scenario on the real map, an AI-against-AI run, and a retest of the "no route" halts.

## Source trace

| Passage | Source | Status |
| --- | --- | --- |
| Slice grid, land and sea counts, highest point | `data/terrain/grid.json`, built from Copernicus DEM GLO-90 and ESA WorldCover 2021 | Sourced |
| Terrain classification rules, canopy correction | Claude's settings in `tools/realmap.js` | Inference |
| US division arrival dates | Order of Battle of the US Army, WWII, ETO: Divisions (1945), Statistics pages | Sourced |
| British, Canadian, Polish commanders and dates of change | Ellis, Victory in the West vol. I, Appendix IV | Sourced |
| British, Canadian, Polish arrival dates | Ellis narrative and general history | Verify |
| German corps and divisions met | Ellis, Appendix V Part II | Sourced; 89th and 709th read from damaged OCR (inference) |
| US army and corps commanders | General history | Verify |
