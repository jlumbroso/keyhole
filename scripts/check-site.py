"""Check the exact product-page artifact and its local navigation."""
from pathlib import Path
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'docs/manual/scripts'))
from build import Document, elements

site = ROOT / 'site'
allowed = {'index.html', 'styles.css', 'favicon.svg', '.nojekyll'}
actual = {str(p.relative_to(site)) for p in site.rglob('*') if p.is_file()}
assert actual == allowed, f'Unexpected product artifact: {actual ^ allowed}'
assert not any(p.is_symlink() for p in site.rglob('*')), 'No symlinks in the public artifact'
doc = Document((site / 'index.html').read_text())
nodes = list(elements(doc.root))
ids = [n.attrs['id'] for n in nodes if 'id' in n.attrs]
assert len(ids) == len(set(ids)), 'Duplicate product-page IDs'
assert sum(n.tag == 'h1' for n in nodes) == 1, 'One product-page title required'
assert not any(n.tag in {'script', 'iframe', 'form'} for n in nodes), 'Product remains static'
for node in nodes:
    if node.tag == 'img':
        assert 'alt' in node.attrs, 'Images need alt text'
    for attr in ('href', 'src'):
        if attr not in node.attrs:
            continue
        url = urlsplit(node.attrs[attr])
        if url.scheme:
            assert url.scheme == 'https', f'Unexpected external protocol: {url.scheme}'
        else:
            if url.path:
                target = (site / url.path).resolve()
                assert target.is_relative_to(site.resolve()) and target.is_file(), 'Missing local asset'
            if url.fragment:
                assert url.fragment in ids, 'Missing product-page anchor'
print('Product page: explicit public-file allowlist, HTML, local links, and anchors checked.')
