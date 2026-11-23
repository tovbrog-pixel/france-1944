#!/usr/bin/env python3
"""Build the slice terrain grids from public datasets. Runs on GitHub Actions.

Inputs (downloaded):
  Copernicus DEM GLO-90 tiles (elevation and its water body mask), AWS open data
  ESA WorldCover 2021 v200 tiles (land cover), AWS open data
Outputs in data/terrain/:
  grid.json        grid definition, sources, statistics
  elev.i16.gz      elevation, metres, int16 little-endian, row 0 = north
  water.u8.gz      0 land, 1 ocean, 2 lake, 3 river (Copernicus water body mask)
  tree.u8.gz       percent of the cell under tree cover (WorldCover class 10)
  built.u8.gz      percent built-up (class 50), modern, for reference only
  wet.u8.gz        percent herbaceous wetland (class 90)
  preview.png      shaded relief with water and forest, for a visual check
"""
import gzip, json, math, os, sys, time, urllib.request, urllib.error
import numpy as np
import rasterio
from rasterio.warp import reproject, Resampling, transform_bounds
from rasterio.transform import from_origin

E0, N1, RES, W, H = 100_000, 7_110_000, 250, 3280, 1800
DST_CRS = 'EPSG:2154'
DST_T = from_origin(E0, N1, RES, RES)
OUT = sys.argv[1] if len(sys.argv) > 1 else 'data/terrain'
TMP = os.environ.get('RUNNER_TEMP', '/tmp') + '/terrain'
os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)

def fetch(url, path):
    if os.path.exists(path): return True
    for k in range(4):
        try:
            with urllib.request.urlopen(url, timeout=120) as r, open(path + '.part', 'wb') as f:
                while True:
                    b = r.read(1 << 20)
                    if not b: break
                    f.write(b)
            os.replace(path + '.part', path); return True
        except urllib.error.HTTPError as e:
            if e.code in (403, 404): return False
            time.sleep(5 * (k + 1))
        except Exception:
            time.sleep(5 * (k + 1))
    raise RuntimeError('download failed: ' + url)

lon0, lat0, lon1, lat1 = transform_bounds(DST_CRS, 'EPSG:4326', E0, N1 - H * RES, E0 + W * RES, N1, densify_pts=50)
print('slice bounds lon %.3f..%.3f lat %.3f..%.3f' % (lon0, lon1, lat0, lat1))

def tile_name(la, lo):
    return ('N%02d_00' % la if la >= 0 else 'S%02d_00' % -la) + '_' + ('E%03d_00' % lo if lo >= 0 else 'W%03d_00' % -lo)

def warp_into(dst, src_path, resampling, band=1, nodata=None, mask_fn=None):
    with rasterio.open(src_path) as s:
        a = s.read(band)
        if mask_fn is not None: a = mask_fn(a)
        tmp = np.full(dst.shape, np.nan, dtype='float32')
        reproject(a.astype('float32'), tmp, src_transform=s.transform, src_crs=s.crs, src_nodata=nodata,
                  dst_transform=DST_T, dst_crs=DST_CRS, dst_nodata=np.nan, resampling=resampling)
    ok = ~np.isnan(tmp); dst[ok] = tmp[ok]; return int(ok.sum())

# ---- elevation and water body mask
elev = np.full((H, W), np.nan, dtype='float32')
wbm = np.full((H, W), np.nan, dtype='float32')
tiles = []
for la in range(math.floor(lat0), math.floor(lat1) + 1):
    for lo in range(math.floor(lon0), math.floor(lon1) + 1):
        n = tile_name(la, lo); base = 'https://copernicus-dem-90m.s3.amazonaws.com/Copernicus_DSM_COG_30_%s_DEM/' % n
        dp = '%s/%s_DEM.tif' % (TMP, n); wp = '%s/%s_WBM.tif' % (TMP, n)
        if not fetch(base + 'Copernicus_DSM_COG_30_%s_DEM.tif' % n, dp):
            print('  no DEM tile', n, '(sea)'); continue
        fetch(base + 'AUXFILES/Copernicus_DSM_COG_30_%s_WBM.tif' % n, wp)
        c = warp_into(elev, dp, Resampling.average)
        if os.path.exists(wp): warp_into(wbm, wp, Resampling.mode)
        tiles.append(n); print('  DEM', n, c, 'cells')

water = np.where(np.isnan(elev), 1, np.nan_to_num(wbm, nan=0)).astype('uint8')
water[water > 3] = 0
sea = water == 1
elev = np.nan_to_num(elev, nan=-10.0)
elev[sea] = np.minimum(elev[sea], -2)
elev_i = np.clip(np.round(elev), -100, 3000).astype('<i2')

# ---- land cover, read from the COG overviews at about 40 m to keep memory small
WC = 'https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_%s_Map.tif'
cover = {k: np.zeros((H, W), dtype='float32') for k in (10, 50, 90)}
have = np.zeros((H, W), dtype=bool)
wc_tiles = []
for la in range(3 * math.floor(lat0 / 3), math.floor(lat1) + 1, 3):
    for lo in range(3 * math.floor(lon0 / 3), math.floor(lon1) + 1, 3):
        n = ('N%02d' % la) + ('E%03d' % lo if lo >= 0 else 'W%03d' % -lo)
        try:
            src = rasterio.open(WC % n)
        except Exception:
            print('  no WorldCover tile', n); continue
        with src as s:
            f = 4; oh, ow = s.height // f, s.width // f
            a = s.read(1, out_shape=(oh, ow), resampling=Resampling.nearest)
            t = s.transform * s.transform.scale(s.width / ow, s.height / oh)
            for k in cover:
                tmp = np.full((H, W), np.nan, dtype='float32')
                reproject((a == k).astype('float32'), tmp, src_transform=t, src_crs=s.crs, dst_transform=DST_T, dst_crs=DST_CRS,
                          dst_nodata=np.nan, resampling=Resampling.average)
                ok = ~np.isnan(tmp); cover[k][ok] = tmp[ok]; have |= ok
        wc_tiles.append(n); print('  WorldCover', n)

pct = {k: np.clip(np.round(v * 100), 0, 100).astype('uint8') for k, v in cover.items()}
for k in pct: pct[k][sea] = 0

def save(name, arr):
    with gzip.open('%s/%s.gz' % (OUT, name), 'wb', compresslevel=9) as f: f.write(arr.tobytes())

save('elev.i16', elev_i); save('water.u8', water); save('tree.u8', pct[10]); save('built.u8', pct[50]); save('wet.u8', pct[90])

land = ~sea
stats = {
    'landCells': int(land.sum()), 'seaCells': int(sea.sum()), 'lakeCells': int((water == 2).sum()), 'riverCells': int((water == 3).sum()),
    'elevMax': int(elev_i.max()), 'elevMeanLand': round(float(elev_i[land].mean()), 1),
    'treeOver50pctCells': int((pct[10] > 50).sum()), 'landCoverMissingCells': int((land & ~have).sum()),
}
grid = {
    'crs': DST_CRS, 'originE': E0, 'originN': N1, 'res': RES, 'w': W, 'h': H, 'rowOrder': 'north to south',
    'game': 'x = easting/1000 - 100, y = 7110 - northing/1000 (km)',
    'files': {'elev.i16.gz': 'metres, int16 LE; Copernicus DSM averaged to 250 m; includes trees and buildings',
              'water.u8.gz': '0 land, 1 ocean, 2 lake, 3 river; Copernicus water body mask, majority per cell; ocean also where no DEM tile exists',
              'tree.u8.gz': 'percent tree cover, ESA WorldCover 2021 class 10 (modern)',
              'built.u8.gz': 'percent built-up, WorldCover class 50 (modern; reference only, 1944 towns come from the 1936 census)',
              'wet.u8.gz': 'percent herbaceous wetland, WorldCover class 90 (modern)'},
    'demTiles': tiles, 'worldCoverTiles': wc_tiles, 'stats': stats,
    'sources': [
        {'id': 'cop-dem-90', 'title': 'Copernicus DEM GLO-90, AWS open data bucket copernicus-dem-90m', 'url': 'https://registry.opendata.aws/copernicus-dem/', 'read': time.strftime('%Y-%m-%d'), 'free': True,
         'attribution': 'DLR e.V. 2010-2014 and Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved'},
        {'id': 'esa-wc-2021', 'title': 'ESA WorldCover 10 m 2021 v200', 'url': 'https://esa-worldcover.org/', 'read': time.strftime('%Y-%m-%d'), 'free': True,
         'attribution': 'ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium; CC BY 4.0'}],
    'inferences': ['The DSM records treetops and rooftops; the engine smooths elevation before use, which is an inference.',
                   'Tree cover and wetland are 2021 data used as a proxy for 1944, to be checked against the GSGS 4250 sheets.'],
}
json.dump(grid, open(OUT + '/grid.json', 'w'), indent=1)

# ---- preview: shaded relief, sea blue, forest green, wetland teal; 1 pixel = 500 m
try:
    from PIL import Image
    e = elev_i[::2, ::2].astype('float32'); dy, dx = np.gradient(e, 500.0)
    shade = np.clip(0.75 + (-dx * 0.7 - dy * 0.7) * 8, 0.35, 1.25)
    base = np.clip(0.55 + e / 600.0, 0.5, 1.0)
    rgb = np.stack([0.80 * base, 0.76 * base, 0.62 * base], -1) * shade[..., None]
    tr = pct[10][::2, ::2] / 100.0; rgb = rgb * (1 - 0.6 * tr[..., None]) + np.array([0.15, 0.40, 0.15]) * 0.6 * tr[..., None]
    wt = pct[90][::2, ::2] / 100.0; rgb = rgb * (1 - wt[..., None]) + np.array([0.3, 0.6, 0.6]) * wt[..., None]
    w2 = water[::2, ::2]; rgb[w2 == 1] = [0.55, 0.70, 0.85]; rgb[(w2 == 2) | (w2 == 3)] = [0.20, 0.35, 0.80]
    Image.fromarray((np.clip(rgb, 0, 1) * 255).astype('uint8')).save(OUT + '/preview.png', optimize=True)
except Exception as ex:
    print('preview skipped:', ex)
print(json.dumps(stats))
