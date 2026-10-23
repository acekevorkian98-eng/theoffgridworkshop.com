from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://theoffgridworkshop.com'


class Metadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical, self.open_graph, self.robots, self.schemas, self.errors = [], [], [], [], []
        self.in_schema = False
        self.schema_text = ''

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and 'canonical' in attrs.get('rel', '').lower().split():
            self.canonical.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('property', '').lower() == 'og:url':
            self.open_graph.append(attrs.get('content'))
        if tag == 'meta' and attrs.get('name', '').lower() == 'robots':
            self.robots.extend(re.split(r'[,\s]+', attrs.get('content', '').lower()))
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.in_schema = True
            self.schema_text = ''

    def handle_data(self, data):
        if self.in_schema:
            self.schema_text += data

    def handle_endtag(self, tag):
        if tag == 'script' and self.in_schema:
            try:
                self.schemas.append(json.loads(self.schema_text))
            except json.JSONDecodeError:
                self.errors.append('invalid JSON-LD')
            self.in_schema = False


def expected_url(path, root=ROOT):
    relative = path.relative_to(root)
    if path.name == 'index.html':
        parent = relative.parent.as_posix()
        return ORIGIN + ('/' if parent == '.' else '/' + parent + '/')
    return ORIGIN + '/' + relative.with_suffix('').as_posix()


def route_key(value):
    url = urlsplit(value)
    if url.scheme not in ('http', 'https') or url.hostname not in ('theoffgridworkshop.com', 'www.theoffgridworkshop.com') or url.query:
        return None
    path = url.path
    if path.endswith('/index.html'):
        path = path[:-10]
    elif path.endswith('.html'):
        path = path[:-5]
    return path.rstrip('/') or '/'


def strings(value):
    if isinstance(value, dict):
        for child in value.values():
            yield from strings(child)
    elif isinstance(value, list):
        for child in value:
            yield from strings(child)
    elif isinstance(value, str):
        yield value


def audit(root=ROOT):
    errors, pages = [], {}
    for path in sorted(root.rglob('*.html')):
        relative = path.relative_to(root)
        if any(part.startswith(('_', '.')) for part in relative.parts):
            continue
        page = Metadata()
        page.feed(path.read_text())
        errors.extend(f'{relative}: {message}' for message in page.errors)
        if 'noindex' in page.robots:
            continue
        canonical = expected_url(path, root)
        pages[canonical] = path
        if page.canonical != [canonical]:
            errors.append(f'{relative}: expected one canonical: {canonical}')
        if page.open_graph != [canonical]:
            errors.append(f'{relative}: Open Graph URL differs from canonical')
        for value in strings(page.schemas):
            if not value.startswith(('http://', 'https://')) or route_key(value) != route_key(canonical):
                continue
            fragment = urlsplit(value).fragment
            expected = canonical + ('#' + fragment if fragment else '')
            if value != expected:
                errors.append(f'{relative}: JSON-LD self-reference differs: {value}')
    try:
        urls = [element.text for element in ET.parse(root / 'sitemap.xml').getroot().iter() if element.tag.endswith('loc')]
    except ET.ParseError:
        return errors + ['sitemap.xml: invalid XML'], len(pages), 0
    for url, count in Counter(urls).items():
        if count > 1:
            errors.append(f'sitemap.xml: duplicate URL: {url}')
    errors.extend('sitemap.xml: missing canonical: ' + url for url in sorted(set(pages) - set(urls)))
    errors.extend('sitemap.xml: not an indexable canonical: ' + str(url) for url in sorted(set(urls) - set(pages)))
    return errors, len(pages), len(urls)


if __name__ == '__main__':
    errors, pages, entries = audit()
    if errors:
        print('\n'.join(errors))
        sys.exit(1)
    print(f'Metadata agrees for {pages} indexable pages and {entries} sitemap URLs.')
