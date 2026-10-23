import argparse
from dataclasses import dataclass, field
from html import escape
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}


@dataclass(eq=False)
class Element:
    tag: str
    attrs: dict
    start: int
    start_end: int
    parent: object
    end_start: int | None = None
    children: list = field(default_factory=list)
    text: list = field(default_factory=list)

    def ancestors(self):
        node = self.parent
        while node:
            yield node
            node = node.parent

    def has_class(self, name):
        return name in self.attrs.get('class', '').split()

    def descendants(self):
        for child in self.children:
            yield child
            yield from child.descendants()


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.source = source
        self.offsets = [0] + [match.end() for match in re.finditer('\n', source)]
        self.stack, self.elements = [], []

    def position(self):
        line, column = self.getpos()
        return self.offsets[line - 1] + column

    def handle_starttag(self, tag, attrs):
        start = self.position()
        parent = self.stack[-1] if self.stack else None
        node = Element(tag, dict(attrs), start, start + len(self.get_starttag_text()), parent)
        if parent:
            parent.children.append(node)
        self.elements.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_data(self, data):
        for node in self.stack:
            if node.tag in ('h2', 'h3'):
                node.text.append(data)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index].tag == tag:
                self.stack[index].end_start = self.position()
                self.stack = self.stack[:index]
                break


def inside_contents(node):
    return any(parent.has_class('toc-container') or parent.attrs.get('id') == 'table-of-contents' for parent in node.ancestors())


def excluded_heading(node):
    return inside_contents(node) or any('hidden' in parent.attrs or parent.attrs.get('aria-hidden') == 'true' for parent in (node, *node.ancestors()))


def render_page(source):
    document = Document(source)
    document.feed(source)
    article = next((node for node in document.elements if node.has_class('article-content')), None)
    if article is None:
        return source, 0
    targets = []
    for node in document.elements:
        if node.attrs.get('id') == 'table-of-contents':
            targets.append((node, True))
        if node.has_class('sidebar-widget'):
            title = next((child for child in node.children if child.tag == 'h3'), None)
            if title and ''.join(title.text).strip() in ('In This Article', 'In This Review'):
                listing = next((child for child in node.children if child.tag == 'ul'), None)
                if listing:
                    targets.append((listing, False))
    targets = [(node, inline) for node, inline in targets if node.end_start is not None and (node.attrs.get('data-toc-generated') == 'true' or not any(child.tag == 'a' for child in node.descendants()))]
    if not targets:
        return source, 0
    all_headings = [node for node in article.descendants() if node.tag in ('h2', 'h3')]
    headings = [(index, node) for index, node in enumerate(all_headings) if not excluded_heading(node)]
    if len(headings) < 2:
        return source, 0
    used_ids = {node.attrs['id'] for node in document.elements if node.attrs.get('id')}
    changes = []
    anchors = []
    for index, node in headings:
        identity = node.attrs.get('id')
        if not identity:
            identity = f'section-{index}'
            suffix = 2
            while identity in used_ids:
                identity = f'section-{index}-{suffix}'
                suffix += 1
            used_ids.add(identity)
            opening = source[node.start:node.start_end]
            changes.append((node.start, node.start_end, opening[:-1] + f' id="{escape(identity, quote=True)}">'))
        label = ' '.join(''.join(node.text).split())
        anchors.append((identity, label, node.tag == 'h3'))
    for node, inline in targets:
        rows = []
        for identity, label, subheading in anchors:
            attrs = (' class="toc-item toc-sub"' if subheading else ' class="toc-item"') if inline else (' style="padding-left: 1rem;"' if subheading else '')
            rows.append(f'<li{attrs}><a href="#{quote(identity, safe="-._~")}">{escape(label)}</a></li>')
        content = '\n'.join(rows)
        if inline:
            content = '<ul class="toc-list">\n' + content + '\n</ul>'
        changes.append((node.start_end, node.end_start, '\n' + content + '\n'))
        if node.attrs.get('data-toc-generated') != 'true':
            opening = source[node.start:node.start_end]
            changes.append((node.start, node.start_end, opening[:-1] + ' data-toc-generated="true">'))
    previous_end = -1
    for start, end, _ in sorted(changes):
        if start < previous_end:
            raise ValueError('Overlapping contents edits')
        previous_end = end
    for start, end, replacement in sorted(changes, reverse=True):
        source = source[:start] + replacement + source[end:]
    return source, len(targets)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    stale, lists = [], 0
    for path in sorted(ROOT.rglob('*.html')):
        if any(part.startswith(('_', '.')) for part in path.relative_to(ROOT).parts):
            continue
        original = path.read_bytes().decode('utf-8')
        rendered, count = render_page(original)
        lists += count
        if rendered != original:
            stale.append(str(path.relative_to(ROOT)))
            if not args.check:
                path.write_bytes(rendered.encode('utf-8'))
    if args.check and stale:
        raise SystemExit(f'Contents lists are stale in {len(stale)} pages. Run python3 scripts/build-contents.py.')
    print(f'{lists} generated contents lists checked; {len(stale)} pages ' + ('need changes.' if args.check else 'updated.'))
