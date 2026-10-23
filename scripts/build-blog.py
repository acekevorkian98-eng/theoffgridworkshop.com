import argparse
from datetime import date
from html import escape
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = {
    'solar': ('solar', 'Solar'),
    'energy & homesteading': ('solar', 'Solar'),
    'water': ('water', 'Water'),
    'food & farming': ('food', 'Food & Farming'),
    'food': ('food', 'Food & Farming'),
    'building': ('building', 'Building'),
    'building & homesteading': ('building', 'Building'),
    'tools': ('tools', 'Tools & Gear'),
    'skills & tools': ('tools', 'Tools & Gear'),
    'systems & maintenance': ('systems', 'Systems & Maintenance'),
}


def articles(root=ROOT):
    rows = json.loads((root / 'blog/articles.json').read_text())['articles']
    unique = {}
    for row in rows:
        for field in ('slug', 'title', 'date', 'description', 'category', 'difficulty'):
            if not isinstance(row.get(field), str) or not row[field].strip():
                raise ValueError(f'Missing article field: {field}')
        slug = row['slug']
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug):
            raise ValueError(f'Invalid article slug: {slug}')
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', row['date']):
            raise ValueError(f'Invalid publication date: {slug}')
        date.fromisoformat(row['date'])
        if row['difficulty'] not in ('beginner', 'intermediate', 'advanced'):
            raise ValueError(f'Unknown difficulty: {slug}')
        category = CATEGORIES[row['category'].strip().lower()]
        if (root / 'blog' / f'{slug}.html').is_file():
            href = slug
        elif (root / 'guides' / f'{slug}.html').is_file():
            href = f'../guides/{slug}'
        else:
            raise ValueError(f'Article destination is missing: {slug}')
        item = dict(row, href=href, category_id=category[0], category_label=category[1])
        previous = unique.get(slug)
        if previous is None or item['date'] > previous['date']:
            unique[slug] = item
    blog_pages = {path.stem for path in (root / 'blog').glob('*.html') if path.stem != 'index' and not path.name.startswith('_')}
    unlisted = blog_pages - unique.keys()
    if unlisted:
        raise ValueError('Blog pages missing from the registry: ' + ', '.join(sorted(unlisted)))
    return sorted(unique.values(), key=lambda item: (item['date'], item['slug']), reverse=True)


def render(items):
    result = ['        <div class="guide-list" id="article-directory">']
    for item in items:
        published = date.fromisoformat(item['date'])
        formatted = f'{published:%B} {published.day}, {published.year}'
        text = lambda key: escape(re.sub(r'\s*\u2014\s*', ': ', item[key]).replace('\u2013', '-'), quote=True)
        result.append(f'''            <article class="guide-card" data-category="{text('category_id')}">
                <span class="guide-card-category">{text('category_label')}</span>
                <time class="guide-card-date" datetime="{text('date')}">{formatted}</time>
                <h3><a href="{text('href')}">{text('title')}</a></h3>
                <p>{text('description')}</p>
                <div class="guide-card-footer">
                    <span class="difficulty-badge {text('difficulty')}">{escape(item['difficulty'].capitalize())}</span>
                    <a href="{text('href')}">Read Article &rarr;</a>
                </div>
            </article>''')
    result.append('        </div>\n\n')
    return '\n'.join(result)


def build(root=ROOT):
    items = articles(root)
    current = (root / 'blog/index.html').read_text()
    start = current.index('        <div class="guide-list"')
    end = current.index('        <section class="newsletter-section"', start)
    result = current[:start] + render(items) + current[end:]
    result = re.sub(r'<p class="post-count"[^>]*>.*?</p>', f'<p class="post-count" role="status" aria-live="polite">{len(items)} articles</p>', result)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    expected = build()
    path = ROOT / 'blog/index.html'
    if args.check:
        if path.read_text() != expected:
            raise SystemExit('Blog directory is stale. Run python3 scripts/build-blog.py.')
        print('Blog directory is current; all article destinations exist.')
    else:
        path.write_text(expected)
        print('Built blog directory.')
