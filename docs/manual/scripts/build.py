"""Build the Keyhole manual using only Python's standard library.

The authored chapter fragments feed both complete HTML pages and Markdown.
Only the explicit public outputs below enter _site; repository guidance,
inbox records, design studies, and purchased font files never enter it.
"""
import argparse
import html
import json
import re
import shutil
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlencode, urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / '_site'
BASE = 'https://jlumbroso.github.io/keyhole-docs/'
FONT_CSS = 'https://jlumbroso.github.io/berkeley-mono/v2.004/berkeley-mono.css'
STATUS = 'Keyhole 0.1.0 · previews labeled separately'
DATE = '24 October 2026'
PRODUCT = 'https://jlumbroso.github.io/keyhole/'
REPOSITORY = 'https://github.com/jlumbroso/keyhole'
SOURCE_NOTICE = 'Source access currently requires a repository invitation.'
CHAPTER_SLUGS = ('overview', 'first-secret', 'for-assistants', 'render-mcp',
                 'neon-mcp', 'assistant-settings',
                 'keeping-secrets-out-of-the-conversation', 'troubleshooting')
ASSETS = ('manual.css', 'manual.js', 'favicon.svg', 'LICENSE.keyhole', 'NOTICE.third-party')
VOID = {'img', 'br', 'hr', 'meta', 'link', 'input', 'source', 'wbr'}


@dataclass
class Element:
    tag: str
    attrs: dict = field(default_factory=dict)
    children: list = field(default_factory=list)


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = Element('root')
        self.stack = [self.root]
        self.feed(source)
        self.close()
        assert len(self.stack) == 1, f'Unclosed HTML element: {self.stack[-1].tag}'

    def handle_starttag(self, tag, attrs):
        node = Element(tag, dict(attrs))
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        assert self.stack[-1].tag == tag, f'Unbalanced HTML: </{tag}> inside <{self.stack[-1].tag}>'
        self.stack.pop()

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def elements(node):
    if isinstance(node, Element):
        yield node
        for child in node.children:
            yield from elements(child)


def text_content(node):
    return node if isinstance(node, str) else ''.join(text_content(c) for c in node.children)


def markdown(node, page_url):
    """Render the small, explicit semantic HTML vocabulary used by the chapters."""
    if isinstance(node, str):
        return re.sub(r'\s+', ' ', node)
    tag = node.tag
    body = ''.join(markdown(child, page_url) for child in node.children).strip()
    if tag == 'pre':
        content = text_content(node)
        runs = re.findall(r'`+', content)
        fence = '`' * max(3, 1 + max(map(len, runs), default=0))
        return '\n\n' + fence + '\n' + content + ('' if content.endswith('\n') else '\n') + fence + '\n\n'
    if tag == 'code':
        content = text_content(node)
        fence = '`' * (1 + max(map(len, re.findall(r'`+', content)), default=0))
        padding = ' ' if content.startswith(('`', ' ')) or content.endswith(('`', ' ')) else ''
        return fence + padding + content + padding + fence
    if tag in {'h1', 'h2', 'h3', 'h4', 'h5', 'h6'}:
        return '\n\n' + '#' * int(tag[1]) + ' ' + body + '\n\n'
    if tag in {'p', 'figcaption', 'caption'}:
        return '\n\n' + body + '\n\n'
    if tag == 'a':
        return '[' + body + '](' + urljoin(page_url, node.attrs['href']) + ')'
    if tag == 'img':
        return '\n\n![' + node.attrs.get('alt', '') + '](' + urljoin(page_url, node.attrs['src']) + ')\n\n'
    if tag in {'strong', 'b'}:
        return '**' + body + '**'
    if tag in {'em', 'i'}:
        return '*' + body + '*'
    if tag == 'kbd':
        return '`' + body + '`'
    if tag in {'ul', 'ol'}:
        items = [c for c in node.children if isinstance(c, Element) and c.tag == 'li']
        lines = []
        for i, item in enumerate(items, 1):
            prefix = f'{i}. ' if tag == 'ol' else '- '
            value = ''.join(markdown(c, page_url) for c in item.children).strip()
            lines.append(prefix + value.replace('\n', '\n  '))
        return '\n\n' + '\n'.join(lines) + '\n\n'
    if tag == 'table':
        rows = []
        for row in elements(node):
            if row.tag == 'tr':
                cells = [c for c in row.children if isinstance(c, Element) and c.tag in {'th', 'td'}]
                rows.append([re.sub(r'\s+', ' ', markdown(c, page_url)).replace('|', '\\|').strip() for c in cells])
        assert rows and all(len(row) == len(rows[0]) for row in rows), 'Uneven table'
        result = ['| ' + ' | '.join(rows[0]) + ' |', '| ' + ' | '.join('---' for _ in rows[0]) + ' |']
        result.extend('| ' + ' | '.join(row) + ' |' for row in rows[1:])
        caption = next((markdown(n, page_url) for n in elements(node) if n.tag == 'caption'), '')
        return '\n\n' + caption.strip() + '\n\n' + '\n'.join(result) + '\n\n'
    if tag == 'br':
        return ' '
    if tag == 'blockquote' or (tag == 'div' and node.attrs.get('class') == 'note'):
        return '\n\n' + '\n'.join('> ' + line for line in body.splitlines()) + '\n\n'
    return body if tag in {'td', 'th', 'li', 'span'} else '\n\n' + body + '\n\n'


def filename(chapter):
    return 'index.html' if chapter['slug'] == 'overview' else chapter['slug'] + '.html'


def esc(value):
    return html.escape(str(value), quote=True)


def source_path(chapter):
    if chapter['slug'] == 'keeping-secrets-out-of-the-conversation':
        return 'docs/manual/keeping-secrets-out-of-the-conversation.md'
    return 'docs/manual/content/' + chapter['slug'] + '.html'


def source_reference(chapter):
    return chapter.get('source') or REPOSITORY + '/blob/main/' + source_path(chapter)


def read_chapters():
    chapters = json.loads((ROOT / 'content/chapters.json').read_text(encoding='utf-8'))
    assert isinstance(chapters, list), 'Chapter metadata must be a list'
    assert tuple(c['slug'] for c in chapters) == CHAPTER_SLUGS, 'Unexpected chapter list or order'
    for chapter in chapters:
        for key in ('nav', 'title', 'dek'):
            assert isinstance(chapter[key], str) and chapter[key].strip(), f'Missing chapter {key}'
        assert isinstance(chapter['margin'], list), 'Chapter notes must be a list'
        for note in chapter['margin']:
            assert all(isinstance(note[key], str) for key in ('title', 'text')), 'Invalid chapter note'
        reference = source_reference(chapter)
        assert isinstance(reference, str) and urlsplit(reference).scheme == 'https', 'Source reference must use HTTPS'
    return chapters


def check_canonical_markdown(fragment):
    """Keep the established harness guide's examples and citations intact."""
    canonical = ROOT / 'keeping-secrets-out-of-the-conversation.md'
    assert canonical.is_file() and not canonical.is_symlink(), 'Missing regular canonical Markdown guide'
    source = canonical.read_text(encoding='utf-8')
    blocks = []
    fence = None
    code = []
    for line in source.splitlines(keepends=True):
        if fence is None:
            match = re.match(r'^ {0,3}(`{3,}|~{3,})[^\n]*\n?$', line)
            if match:
                fence = match[1]
                code = []
        elif re.fullmatch(r' {0,3}' + re.escape(fence[0]) + '{' + str(len(fence)) + r',}[ \t]*\n?', line):
            blocks.append(''.join(code))
            fence = None
        else:
            code.append(line)
    assert fence is None, 'Unclosed code fence in canonical Markdown guide'
    rendered_blocks = [text_content(n) for n in elements(fragment) if n.tag == 'pre']
    assert rendered_blocks == blocks, 'Canonical Markdown code blocks changed or reordered in HTML'

    # The guide uses inline Markdown links; include reference-style and autolinks
    # too, so adding either form cannot silently remove a cited destination.
    destinations = set(re.findall(r'\]\((https?://[^\s)]+)', source))
    destinations.update(re.findall(r'(?m)^ {0,3}\[[^\]]+\]:\s*<?(https?://[^\s>]+)', source))
    destinations.update(re.findall(r'<(https?://[^\s>]+)>', source))
    rendered_links = {n.attrs['href'] for n in elements(fragment) if n.tag == 'a' and 'href' in n.attrs}
    assert destinations <= rendered_links, 'Canonical Markdown citations missing from HTML: ' + ', '.join(sorted(destinations - rendered_links))


def render(chapter, chapters, body, exported):
    index = chapters.index(chapter)
    nav = ''.join(f'<a href="{filename(c)}"' + (' aria-current="page"' if c == chapter else '') + f'><span class="nav-number">{i:02}</span>{esc(c["nav"])}</a>' for i, c in enumerate(chapters, 1))
    margin = ''.join(f'<div><strong>{esc(m["title"])}</strong><p>{esc(m["text"])}</p></div>' for m in chapter['margin'])
    previous = f'<a href="{filename(chapters[index-1])}">← {esc(chapters[index-1]["nav"])}</a>' if index else '<a href="manual.md">Full manual as Markdown</a>'
    following = f'<a href="{filename(chapters[index+1])}">{esc(chapters[index+1]["nav"])} →</a>' if index < len(chapters)-1 else '<a href="index.html">Back to the beginning ↑</a>'
    markdown_name = 'index.md' if index == 0 else chapter['slug'] + '.md'
    # JSON script data is inert, but a literal </script> would still close its
    # HTML element. Escape every less-than sign before embedding authored text.
    embedded_markdown = json.dumps(exported, ensure_ascii=False).replace('<', '\\u003c')
    edit_url = REPOSITORY + '/edit/main/' + source_path(chapter)
    suggestion_url = REPOSITORY + '/issues/new?' + urlencode({
        'title': '[Docs] ' + chapter['nav'],
        'body': 'Page: ' + BASE + filename(chapter) + '\n\nPassage or missing topic:\n\nSuggested correction:\n\nDo not include credentials or secret-bearing configuration files.',
    })
    return f'''<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{esc(chapter['title'])} · Keyhole manual</title>
  <meta name="description" content="{esc(chapter['dek'])}">
  <link rel="canonical" href="{BASE + filename(chapter)}">
  <link rel="alternate" type="text/markdown" href="{markdown_name}">
  <link rel="describedby" href="llms.txt">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="{FONT_CSS}">
  <link rel="stylesheet" href="assets/manual.css">
  <script src="assets/manual.js" defer></script>
</head>
<body>
  <a class="skip" href="#reading">Skip to the chapter</a>
  <header class="masthead">
    <a class="brand" href="index.html"><img src="assets/favicon.svg" width="32" height="32" alt=""><span>Keyhole<span class="brand-period" aria-hidden="true">.</span></span><span class="divider" aria-hidden="true"></span><span class="manual">Manual</span></a>
    <nav class="masthead-links" aria-label="Project"><a href="{PRODUCT}">Product page ↗</a><a href="{REPOSITORY}">GitHub ↗</a></nav>
  </header>
  <div class="book">
    <aside class="contents"><div class="contents-inner">
      <p class="label">Contents</p>
      <nav aria-label="Chapters">{nav}</nav>
      <p class="version">{STATUS}<br>Updated {DATE}</p>
      <div class="theme-control" hidden><span class="label">Appearance</span><div class="switch" role="group" aria-label="Color theme"><button type="button" data-theme-choice="light" aria-pressed="true">Paper</button><button type="button" data-theme-choice="dark" aria-pressed="false">After dark</button></div></div>
      <a class="download-all" href="manual.md">Read as Markdown ↓</a>
    </div></aside>
    <main class="reading" id="reading" tabindex="-1">
      <article class="chapter">
        <header class="chapter-head"><p class="label">{esc(chapter.get('label', f'{index + 1:02} / {chapter["nav"]}'))}</p><h1>{esc(chapter['title'])}</h1><p class="dek">{esc(chapter['dek'])}</p>
          <div class="page-tools"><button type="button" class="copy-page" hidden>Copy Page For LLM</button><a class="view-markdown" href="{markdown_name}">View Markdown</a><span id="page-copy-status" role="status"></span></div>
          <div class="page-copy-fallback" hidden><label for="page-markdown-fallback">Chapter Markdown</label><p id="page-copy-help">Automatic copy is unavailable. The full chapter Markdown is selected below; use your keyboard to copy it.</p><textarea id="page-markdown-fallback" readonly rows="12" aria-describedby="page-copy-help" spellcheck="false"></textarea></div>
        </header>
        <div class="chapter-grid"><div class="prose">{body}<nav class="next" aria-label="Adjacent chapters">{previous}{following}</nav></div><aside class="margin" aria-label="Chapter notes">{margin}</aside></div>
        <footer class="colophon">{STATUS} · Updated {DATE}.<br><a href="{esc(source_reference(chapter))}">Source reference</a> · <a href="{chapter['slug']}.md">This chapter as Markdown</a><br><a class="edit-page" href="{edit_url}">Edit on GitHub</a> · <a class="suggest-correction" href="{esc(suggestion_url)}">Suggest a correction</a> · <a href="{REPOSITORY}/issues">Questions and problems</a><br>{SOURCE_NOTICE}</footer>
      </article>
    </main>
  </div>
  <footer class="site-footer"><a href="assets/LICENSE.keyhole">Keyhole · Apache License 2.0</a><a href="assets/NOTICE.third-party">Attribution</a></footer>
  <script type="application/json" id="chapter-markdown">{embedded_markdown}</script>
</body>
</html>
'''


def check_site(chapters):
    assert SITE.is_dir() and not SITE.is_symlink(), 'Generated site must be a real directory'
    assert not any(p.is_symlink() for p in SITE.rglob('*')), 'Symlink in public artifact'
    expected = {filename(c) for c in chapters} | {c['slug'] + '.md' for c in chapters}
    expected |= {'manual.md', 'index.md', 'llms.txt', '404.html', '.nojekyll', 'robots.txt', 'sitemap.xml'}
    expected |= {'assets/' + name for name in ASSETS}
    actual = {str(p.relative_to(SITE)) for p in SITE.rglob('*') if p.is_file()}
    assert actual == expected, f'Publication boundary changed: {actual ^ expected}'
    documents = {p.name: Document(p.read_text(encoding='utf-8')).root for p in SITE.glob('*.html')}
    ids = {}
    for name, document in documents.items():
        found = [n.attrs['id'] for n in elements(document) if 'id' in n.attrs]
        assert len(found) == len(set(found)), f'Duplicate ID in {name}'
        ids[name] = set(found)
    for name, document in documents.items():
        for node in elements(document):
            if node.tag == 'img':
                assert 'alt' in node.attrs, f'Missing image alternative: {name}'
            for attribute in ('href', 'src'):
                value = node.attrs.get(attribute)
                if not value:
                    continue
                url = urlsplit(value)
                if url.scheme or url.netloc:
                    assert url.scheme in {'https', 'http', 'mailto'}, f'Unexpected URL: {value}'
                    continue
                target = unquote(url.path) or name
                resolved = (SITE / target).resolve()
                assert resolved.is_relative_to(SITE.resolve()), f'Link escapes publication: {value}'
                assert resolved.is_file(), f'Missing local target in {name}: {value}'
                if url.fragment and target in ids:
                    assert unquote(url.fragment) in ids[target], f'Missing anchor: {name}: {value}'
    for chapter in chapters:
        source = Document((ROOT / 'content' / (chapter['slug'] + '.html')).read_text(encoding='utf-8')).root
        if chapter['slug'] == 'keeping-secrets-out-of-the-conversation':
            check_canonical_markdown(source)
        exported = (SITE / (chapter['slug'] + '.md')).read_text(encoding='utf-8')
        page = documents[filename(chapter)]
        embedded = [n for n in elements(page) if n.attrs.get('id') == 'chapter-markdown']
        assert len(embedded) == 1 and embedded[0].attrs.get('type') == 'application/json', 'Missing chapter copy data'
        assert '<' not in text_content(embedded[0]), 'Unescaped HTML delimiter in chapter copy data'
        assert json.loads(text_content(embedded[0])) == exported, 'Copied chapter differs from Markdown export'
        assert SOURCE_NOTICE in exported, 'Missing source-access notice in Markdown'
        assert STATUS in exported, 'Missing release status in Markdown'
        alternate = [n for n in elements(page) if n.tag == 'link' and n.attrs.get('rel') == 'alternate']
        assert len(alternate) == 1 and alternate[0].attrs.get('type') == 'text/markdown', 'Missing Markdown alternate'
        assert (SITE / alternate[0].attrs['href']).read_text(encoding='utf-8') == exported, 'Markdown alternate differs from chapter'
        assert any(n.tag == 'link' and n.attrs.get('rel') == 'describedby' and n.attrs.get('href') == 'llms.txt' for n in elements(page)), 'Missing llms.txt discovery link'
        for node in elements(source):
            if node.tag == 'code':
                assert text_content(node) in exported, 'Command or setting lost from Markdown'
            for attribute in ('href', 'src'):
                if attribute in node.attrs:
                    target = urljoin(BASE + filename(chapter), node.attrs[attribute])
                    assert '](' + target + ')' in exported, 'Link lost from portable Markdown'
        assert f'[Online chapter]({BASE + filename(chapter)})' in exported, 'Missing chapter URL'
        assert f'[Source reference]({source_reference(chapter)})' in exported, 'Missing source reference'
        edit_links = [n.attrs.get('href') for n in elements(page) if n.tag == 'a' and n.attrs.get('class') == 'edit-page']
        assert edit_links == [REPOSITORY + '/edit/main/' + source_path(chapter)], 'Incorrect source editing link'
    assert (SITE / 'index.md').read_bytes() == (SITE / (chapters[0]['slug'] + '.md')).read_bytes(), 'Homepage Markdown alias differs'
    llms = (SITE / 'llms.txt').read_text(encoding='utf-8')
    assert llms.startswith('# Keyhole manual\n\n> '), 'Missing llms.txt title or summary'
    links = re.findall(r'^- \[[^\]]+\]\(([^)]+)\)', llms, flags=re.MULTILINE)
    assert len(links) == len(chapters) + 1, 'Incomplete llms.txt file list'
    assert set(links) == {BASE + c['slug'] + '.md' for c in chapters} | {BASE + 'manual.md'}, 'Unexpected llms.txt link'
    for link in links:
        assert (SITE / link.removeprefix(BASE)).is_file(), f'Missing llms.txt target: {link}'
    print(f'Manual build: {len(chapters)} HTML chapters, exact copy data, Markdown exports, llms.txt, links and public-file allowlist checked.')


def build():
    chapters = read_chapters()
    assert not SITE.is_symlink(), 'Generated site must not be a symlink'
    SITE.mkdir(exist_ok=True)
    assert not any(p.is_symlink() for p in SITE.rglob('*')), 'Unexpected symlink in build output'
    # Delete only old generated regular files beneath this fixed output folder.
    for old in SITE.rglob('*'):
        assert not old.is_symlink(), 'Unexpected symlink in build output'
        if old.is_file():
            old.unlink()
    (SITE / 'assets').mkdir(exist_ok=True)
    for name in ASSETS:
        asset = ROOT / 'assets' / name
        assert asset.is_file() and not asset.is_symlink(), f'Missing regular public asset: {name}'
        shutil.copyfile(asset, SITE / 'assets' / name)
    exports = []
    for chapter in chapters:
        chapter_path = ROOT / 'content' / (chapter['slug'] + '.html')
        assert chapter_path.is_file() and not chapter_path.is_symlink(), 'Missing regular chapter: ' + chapter['slug']
        source = chapter_path.read_text(encoding='utf-8')
        tree = Document(source).root
        assert not any(n.tag in {'script', 'style', 'h1', 'iframe'} for n in elements(tree))
        exported = '# ' + chapter['title'] + '\n\n' + chapter['dek'] + '\n\n' + markdown(tree, BASE + filename(chapter)).strip()
        exported += '\n\n## Chapter notes\n\n' + '\n\n'.join('**' + m['title'] + '**\n\n' + m['text'] for m in chapter['margin'])
        exported += f'\n\n{STATUS}. Updated {DATE}. [Online chapter]({BASE + filename(chapter)}). [Source reference]({source_reference(chapter)}).\n\n{SOURCE_NOTICE}\n'
        (SITE / (chapter['slug'] + '.md')).write_text(exported, encoding='utf-8')
        (SITE / filename(chapter)).write_text(render(chapter, chapters, source, exported), encoding='utf-8')
        exports.append(exported)
    (SITE / 'index.md').write_text(exports[0], encoding='utf-8')
    (SITE / 'manual.md').write_text('# Keyhole manual\n\n' + '\n\n---\n\n'.join(exports), encoding='utf-8')
    llms = f'''# Keyhole manual

> Help an assistant initiate a credential handoff: display a guide with Porthole, request names through Keyhole, and keep secret values out of the conversation. Includes Render and Neon MCP setup guides.

{STATUS}. Updated {DATE}. Install the released extension from the overview chapter; preview contracts are not included in 0.1.0.

{SOURCE_NOTICE}

The released 0.1.0 supports manual entry into .env. Request links, inbox records and secret_status are an implemented, unreleased preview; consult the model reference before calling them. Harness-specific writers are not yet implemented. OAuth may avoid the need to copy a service token at all.

Each chapter includes its notes, release status, and source reference. The complete manual contains the same {len(chapters)} chapters. Keep real credentials out of conversations, screenshots, copied settings, and documentation reports.

## Chapters

'''
    llms += '\n'.join(f'- [{c["nav"]}]({BASE}{c["slug"]}.md): {c["dek"]}' for c in chapters)
    llms += f'\n\n## Complete manual\n\n- [Full manual]({BASE}manual.md): All {len(chapters)} chapters in one Markdown file.\n'
    (SITE / 'llms.txt').write_text(llms, encoding='utf-8')
    (SITE / '.nojekyll').write_text('', encoding='utf-8')
    (SITE / 'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: ' + BASE + 'sitemap.xml\n', encoding='utf-8')
    (SITE / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join('<url><loc>' + BASE + filename(c) + '</loc></url>' for c in chapters) + '</urlset>\n', encoding='utf-8')
    (SITE / '404.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found · Keyhole manual</title></head><body><main><h1>This page is not here.</h1><p><a href="' + BASE + '">Return to the Keyhole manual.</a></p></main></body></html>', encoding='utf-8')
    check_site(chapters)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Check the existing generated site without rebuilding')
    args = parser.parse_args()
    if args.check:
        check_site(read_chapters())
    else:
        build()
