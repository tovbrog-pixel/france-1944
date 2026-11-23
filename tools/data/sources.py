#!/usr/bin/env python3
"""Fetch public-domain and Crown-copyright source texts for step 4 into sources/. Runs on GitHub Actions.

Reads tools/data/sources.json:
  archive:  archive.org identifiers; every *_djvu.txt file in the item is saved as text
  search:   archive.org title searches; hits are listed in sources/search-results.json for a later pass
  pdf:      direct PDF links; converted to text with pdftotext -layout
  mirror:   HyperWar book folders; every .html page in the folder is saved and converted to text
Writes sources/manifest.json with URL, date read, bytes and SHA-256 of each saved file.
"""
import hashlib, json, os, re, subprocess, sys, time, urllib.parse, urllib.request

CFG = json.load(open('tools/data/sources.json'))
OUT = 'sources'
os.makedirs(OUT, exist_ok=True)
MAN_P = OUT + '/manifest.json'
man = json.load(open(MAN_P)) if os.path.exists(MAN_P) else {}
UA = {'User-Agent': 'france-1944 research fetch (private game project)'}

def get(url, binary=False, tries=4):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180) as r:
                b = r.read()
                return b if binary else b.decode('utf-8', 'replace')
        except Exception as e:
            print('  retry', k + 1, url, e); time.sleep(4 * (k + 1))
    return None

def record(path, url, note=''):
    b = open(path, 'rb').read()
    man[os.path.relpath(path, OUT)] = {'url': url, 'read': time.strftime('%Y-%m-%d'), 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(), 'note': note}

def html_text(h):
    h = re.sub(r'(?is)<(script|style).*?</\1>', ' ', h)
    h = re.sub(r'(?i)<br\s*/?>|</p>|</tr>|</h\d>|</li>|</div>', '\n', h)
    h = re.sub(r'(?i)</t[dh]>', '\t', h)
    h = re.sub(r'<[^>]+>', '', h)
    for a, b in (('&nbsp;', ' '), ('&amp;', '&'), ('&lt;', '<'), ('&gt;', '>'), ('&quot;', '"'), ('&#39;', "'"), ('&mdash;', '--'), ('&ndash;', '-')):
        h = h.replace(a, b)
    h = re.sub(r'&#(\d+);', lambda m: chr(int(m.group(1))), h)
    return re.sub(r'\n\s*\n\s*\n+', '\n\n', h)

# archive.org items: full-text files
for ident in CFG.get('archive', []):
    meta = get('https://archive.org/metadata/' + ident)
    if not meta: print('no metadata', ident); continue
    meta = json.loads(meta); files = [f['name'] for f in meta.get('files', []) if f['name'].endswith('_djvu.txt')]
    title = meta.get('metadata', {}).get('title', '')
    print(ident, title, files)
    for fn in files:
        url = 'https://archive.org/download/%s/%s' % (ident, urllib.parse.quote(fn))
        t = get(url)
        if t is None: continue
        p = '%s/archive/%s__%s' % (OUT, ident, re.sub(r'[^A-Za-z0-9._-]', '_', fn)); os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, 'w').write(t); record(p, url, title)

# archive.org searches
res = {}
for q in CFG.get('search', []):
    url = 'https://archive.org/advancedsearch.php?' + urllib.parse.urlencode({'q': q, 'fl[]': ['identifier', 'title', 'date', 'mediatype'], 'rows': 25, 'output': 'json'}, doseq=True)
    t = get(url)
    res[q] = json.loads(t)['response']['docs'] if t else 'failed'
json.dump(res, open(OUT + '/search-results.json', 'w'), indent=1)

# PDFs to text
for item in CFG.get('pdf', []):
    b = get(item['url'], binary=True)
    if b is None or not b.startswith(b'%PDF'): print('no pdf', item['url'], (b or b'')[:200]); continue
    pdf = '/tmp/' + item['name'] + '.pdf'; open(pdf, 'wb').write(b)
    p = '%s/pdf/%s.txt' % (OUT, item['name']); os.makedirs(os.path.dirname(p), exist_ok=True)
    if subprocess.run(['pdftotext', '-layout', pdf, p]).returncode == 0: record(p, item['url'], item.get('title', ''))

# HyperWar folders
for item in CFG.get('mirror', []):
    base = item['url'].rstrip('/') + '/'
    idx = get(base + 'index.html') or get(base)
    if idx is None: print('no index', base); continue
    pages = ['index.html'] + sorted(set(re.findall(r'href="([^"#?:]+\.html)"', idx)) - {'index.html'})
    d = '%s/hyperwar/%s' % (OUT, item['name']); os.makedirs(d, exist_ok=True)
    for pg in pages:
        if '/' in pg.strip('./') and not pg.startswith(item.get('allowSub', '~')): continue
        h = get(urllib.parse.urljoin(base, pg))
        if h is None: continue
        p = d + '/' + re.sub(r'[^A-Za-z0-9._-]', '_', pg).replace('.html', '.txt')
        open(p, 'w').write(html_text(h)); record(p, urllib.parse.urljoin(base, pg), item.get('title', ''))
        time.sleep(0.4)
    print(item['name'], len(pages), 'pages')

json.dump(man, open(MAN_P, 'w'), indent=1, sort_keys=True)
print('saved', len(man), 'files')
