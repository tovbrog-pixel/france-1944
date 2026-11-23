#!/usr/bin/env python3
"""Build the operations orders and annexes (docs/orders/*.md) into PDFs in docs/orders/pdf.
Needs pandoc, Google Chrome (headless print) and pypdf. Every PDF carries Tov Binyamin Brog as author and creator.
    python3 tools/build-orders.py
"""
import pathlib, subprocess, tempfile
from pypdf import PdfReader, PdfWriter

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / 'docs' / 'orders', ROOT / 'docs' / 'orders' / 'pdf'
AUTHOR = 'Tov Binyamin Brog'
CSS = """
@page { size: Letter; margin: 0.9in 1in; }
body { font-family: 'Courier New', Courier, monospace; font-size: 11pt; line-height: 1.35; color: #111; }
h1.title { font-size: 13pt; text-align: center; margin: 0 0 0.6em; }
h2 { font-size: 11.5pt; margin: 1.2em 0 0.4em; border-bottom: 1px solid #444; }
p { margin: 0.45em 0; }
table { border-collapse: collapse; width: 100%; font-size: 9.5pt; margin: 0.6em 0; page-break-inside: avoid; }
th, td { border: 1px solid #777; padding: 3px 5px; vertical-align: top; text-align: left; }
th { background: #e8e6df; }
hr { border: 0; border-top: 1px dashed #666; margin: 1.4em 0 0.8em; }
code { font-size: 9.5pt; }
"""

def build(md):
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp); css = tmp / 'o.css'; css.write_text(CSS)
        html = tmp / (md.stem + '.html')
        subprocess.run(['pandoc', str(md), '-f', 'markdown-smart+hard_line_breaks', '-s', '--css', str(css), '--embed-resources', '-o', str(html), '--metadata', 'lang=en-US'], check=True)
        raw = tmp / 'raw.pdf'
        subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--no-pdf-header-footer', '--print-to-pdf=' + str(raw), html.as_uri()],
                       check=True, capture_output=True)
        r = PdfReader(str(raw)); w = PdfWriter()
        for p in r.pages: w.add_page(p)
        title = next((l.split(':', 1)[1].strip().strip('"') for l in md.read_text().splitlines() if l.startswith('title:')), md.stem)
        w.add_metadata({'/Title': title, '/Author': AUTHOR, '/Creator': AUTHOR, '/Producer': AUTHOR})
        OUT.mkdir(parents=True, exist_ok=True); out = OUT / (md.stem + '.pdf')
        with open(out, 'wb') as f: w.write(f)
        return out, len(r.pages)

if __name__ == '__main__':
    for md in sorted(SRC.glob('*.md')):
        out, n = build(md); print(out.relative_to(ROOT), n, 'pages')
