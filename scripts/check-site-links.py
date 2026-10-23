import argparse
from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import unquote, urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://theoffgridworkshop.com'
CSS_STRING = r'''(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')'''
CSS_TOKENS = re.compile(
    r'/\*.*?\*/|(?P<import>@import\b(?:\s|/\*.*?\*/)*(?P<import_value>' + CSS_STRING + r'))'
    r'|\burl\(\s*(?P<url_value>' + CSS_STRING + r'|(?:\\.|[^\s()\'"\\])+)\s*\)'
    r'|' + CSS_STRING, re.S | re.I
)


def css_unescape(value):
    if value[:1] in ('"', "'"):
        value = value[1:-1]

    def replace(match):
        if match[1]:
            number = int(match[1], 16)
            return chr(number) if 0 < number <= 0x10FFFF and not 0xD800 <= number <= 0xDFFF else '\uFFFD'
        return '' if match[2] else match[3]

    return re.sub(r'\\(?:([0-9a-fA-F]{1,6})(?:\r\n|[ \t\r\n\f])?|(\r\n|[\n\r\f])|(.))', replace, value)


def css_references(source):
    for match in CSS_TOKENS.finditer(source):
        value = match['url_value'] if match['url_value'] is not None else match['import_value']
        if value is not None:
            yield css_unescape(value), source.count('\n', 0, match.start()) + 1


def srcset_urls(source):
    position = 0
    while position < len(source):
        while position < len(source) and (source[position].isspace() or source[position] == ','):
            position += 1
        start = position
        while position < len(source) and not source[position].isspace():
            position += 1
        value = source[start:position]
        if not value:
            break
        if value.endswith(','):
            yield value.rstrip(',')
            continue
        yield value
        depth = 0
        while position < len(source):
            character = source[position]
            position += 1
            if character == '(':
                depth += 1
            elif character == ')':
                depth = max(0, depth - 1)
            elif character == ',' and depth == 0:
                break


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.names, self.references = [], set(), []
        self.base = None
        self.in_style = False

    def reference(self, kind, value, line=None):
        if value:
            self.references.append((kind, value, line or self.getpos()[0]))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        if tag == 'a':
            self.reference('link', attrs.get('href'))
            if attrs.get('name'):
                self.names.add(attrs['name'])
        if tag == 'base' and self.base is None and attrs.get('href'):
            self.base = attrs['href']
        if tag in ('img', 'script', 'source', 'video', 'audio', 'track', 'iframe', 'embed', 'input'):
            self.reference('asset', attrs.get('src'))
        if tag == 'video':
            self.reference('asset', attrs.get('poster'))
        if tag == 'object':
            self.reference('asset', attrs.get('data'))
        if tag in ('img', 'source'):
            for value in srcset_urls(attrs.get('srcset', '')):
                self.reference('responsive_image', value)
        if tag == 'link':
            relations = set(attrs.get('rel', '').lower().split())
            if relations & {'stylesheet', 'icon', 'apple-touch-icon', 'manifest', 'preload', 'modulepreload'}:
                self.reference('stylesheet' if 'stylesheet' in relations else 'asset', attrs.get('href'))
            for value in srcset_urls(attrs.get('imagesrcset', '')):
                self.reference('responsive_image', value)
        if attrs.get('style'):
            for value, _ in css_references(attrs['style']):
                self.reference('css_asset', value)
        self.in_style = self.in_style or tag == 'style'

    def handle_endtag(self, tag):
        if tag == 'style':
            self.in_style = False

    def handle_data(self, data):
        if self.in_style:
            for value, line in css_references(data):
                self.reference('css_asset', value, self.getpos()[0] + line - 1)


def audit(root=ROOT):
    root = root.resolve()
    pages, styles, issues = {}, {}, []

    def issue(path, kind, value, detail, line=None):
        item = {'source': path.relative_to(root).as_posix(), 'kind': kind, 'url': value, 'detail': detail}
        if line is not None:
            item['line'] = line
        issues.append(item)

    for path in sorted(root.rglob('*.html')):
        relative = path.relative_to(root)
        if any(part.startswith(('_', '.')) for part in relative.parts):
            continue
        if not path.resolve().is_relative_to(root):
            issue(path, 'outside_root', '', 'Page resolves outside the checkout')
            continue
        page = Page()
        try:
            page.feed(path.read_text(encoding='utf-8'))
        except (OSError, UnicodeError) as error:
            issue(path, 'unreadable_page', '', str(error))
            continue
        pages[path] = page
        for identity, count in Counter(page.ids).items():
            if count > 1:
                issue(path, 'duplicate_id', identity, f'ID occurs {count} times')

    if not pages:
        issue(root, 'no_pages', '', 'No readable public HTML pages found')
    checked = Counter()

    def check(path, kind, value, line, base):
        try:
            url = urlsplit(urljoin(base, value))
        except ValueError:
            issue(path, 'invalid_url', value, 'Cannot parse URL', line)
            return
        if url.scheme not in ('http', 'https') or url.hostname not in ('theoffgridworkshop.com', 'www.theoffgridworkshop.com'):
            return
        checked[kind] += 1
        target = (root / unquote(url.path).lstrip('/')).resolve()
        if not target.is_relative_to(root):
            issue(path, 'outside_root', value, 'Reference resolves outside the checkout', line)
            return
        if target.is_dir():
            target /= 'index.html'
        if not target.exists() and not target.suffix and kind == 'link':
            target = target.with_suffix('.html')
        if not target.is_file():
            issue(path, 'missing_link' if kind == 'link' else 'missing_asset', value, 'Local target does not exist', line)
            return
        fragment = unquote(url.fragment.split(':~:', 1)[0])
        if kind == 'link' and fragment and target in pages:
            if fragment not in pages[target].ids and fragment not in pages[target].names:
                issue(path, 'missing_fragment', value, f'No target named {fragment}', line)
        if kind == 'stylesheet' or (kind == 'css_asset' and target.suffix.lower() == '.css'):
            if target not in styles:
                styles[target] = True
                try:
                    css = target.read_text(encoding='utf-8')
                except (OSError, UnicodeError) as error:
                    issue(target, 'unreadable_stylesheet', value, str(error))
                    return
                css_base = ORIGIN + '/' + target.relative_to(root).as_posix()
                for child, child_line in css_references(css):
                    check(target, 'css_asset', child, child_line, css_base)

    for path, page in pages.items():
        page_url = ORIGIN + '/' + path.relative_to(root).as_posix()
        try:
            base = urljoin(page_url, page.base) if page.base else page_url
        except ValueError:
            issue(path, 'invalid_base', page.base, 'Cannot parse base URL')
            continue
        for kind, value, line in page.references:
            check(path, kind, value, line, base)
    return {'pages': len(pages), 'stylesheets': len(styles), 'references': dict(sorted(checked.items())), 'issues': issues}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Check public local links, fragments and literal asset references without network requests.')
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--json', action='store_true', help='Print the complete result as JSON')
    args = parser.parse_args()
    if not args.root.is_dir():
        parser.error('The checkout root must be an existing directory')
    report = audit(args.root)
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"Checked {report['pages']} public pages, {report['stylesheets']} local stylesheets; {len(report['issues'])} issues.")
        for item in report['issues']:
            print(f"{item['source']}:{item.get('line', 1)} [{item['kind']}] {item['url']} - {item['detail']}")
    raise SystemExit(1 if report['issues'] else 0)
