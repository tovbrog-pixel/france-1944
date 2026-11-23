# Game data

Author: Tov Binyamin Brog

Every file in this folder carries its own sources. Claude adds no record without a source, and anything inferred beyond what a source says carries the status `inference`.

## Map grid

| Item | Value |
| --- | --- |
| Projection | Lambert-93 (EPSG:2154), the French national grid, in metres |
| Slice area | Easting 100 to 920 km, northing 6,660 to 7,110 km: Pointe du Raz to the Meuse, the Loire to Calais |
| Size | 820 x 450 km |
| Game coordinates | x = easting / 1000 - 100; y = 7110 - northing / 1000. Kilometres, x east, y south, matching the Lines of Advance engine |
| Source rasters | 250 m cells, 3,280 x 1,800 |
| Engine cells | 1 km for the slice, set per scenario |

## Record format

Each JSON file has a top-level `sources` list. Each source has an `id`, `title`, `url` where one exists, the date Claude read it (`read`), and `free` (true when the source is free online).

Each record cites sources by id in `src` and carries one `status`:

- `sourced`: the cited source states it.
- `inference`: Claude derived it from sources; the `note` field says how.
- `verify`: taken from a secondary or general source and still to be checked against a primary source.

## Folders

| Folder | Contents | Built by |
| --- | --- | --- |
| `terrain/` | Elevation, water, tree cover and wetland grids (gzip binary) with `grid.json` | `tools/data/terrain.py` on GitHub Actions |
| `network/` | 1944 roads, railways, rivers, canals and towns as polylines in game km | `tools/data/network.py` on GitHub Actions |
| `oob/` | Order of battle: formations, commanders, arrival dates, corps attachments | Compiled by hand from the official histories |
| `air/` | Allied and German airfields by date; troop carrier fleets and German air strength | `tools/data/build-air.py`; `fleet-1944.json` by hand from Ellis and Craven and Cate |

The workspace cannot reach the elevation, land cover and map servers, so the two data scripts run on GitHub Actions, which downloads the public datasets and commits the derived grids back to the repository.

## Licences of the public datasets

| Dataset | Terms | Attribution |
| --- | --- | --- |
| Copernicus DEM GLO-90 | Free use, attribution required | DLR e.V. 2010-2014 and Airbus Defence and Space GmbH 2014-2018, provided under COPERNICUS by the European Union and ESA |
| ESA WorldCover 2021 | CC BY 4.0 | ESA WorldCover project 2021, contains modified Copernicus Sentinel data (2021) |
| OpenStreetMap | ODbL 1.0 | OpenStreetMap contributors. A public release of the game must credit OSM and offer the derived road and rail data under ODbL |
| Jeansoulin, "Un siècle de gares du réseau ferroviaire français" (data.gouv.fr, 2022) | ODbL 1.0 | Robert Jeansoulin. Dates the railway lines for `network/rail-1944.json` (`tools/data/rail1944.py`); the same ODbL credit and share-alike apply |
| HydroRIVERS v1.0 | Free use, attribution required | Lehner and Grill 2013, HydroSHEDS |
