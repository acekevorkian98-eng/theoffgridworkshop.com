# Local integrity checks

From the checkout root, run these read-only checks before handing off changes:

```sh
python3 scripts/build-blog.py --check
python3 scripts/build-contents.py --check
python3 scripts/check-site-metadata.py
python3 scripts/check-site-links.py
```

The link checker needs Python 3.9 or newer and uses only the standard library.
It checks public HTML routes, local HTML fragments, duplicate IDs, referenced
assets, responsive-image candidates and literal CSS `url()`/`@import` targets.
Local stylesheet imports are followed once, including cycles. Root-relative,
relative and same-site absolute URLs are resolved within the checkout; external
URLs are skipped. Dot directories and underscore-prefixed templates/directories
are excluded. It does not execute JavaScript, validate general HTML/CSS syntax,
fetch external services or assess article claims.

Use `--json` for machine-readable output or `--root /path/to/checkout` to inspect
another copy. Any reported problem returns exit code 1; an empty checkout also
fails. The checker creates no files. Run its fixture tests with:

```sh
python3 scripts/tests/test_site_links.py
```

# Blog directory

`blog/articles.json` is the article registry. After updating it, run:

```sh
python3 scripts/build-blog.py
python3 scripts/build-blog.py --check
```

Commit the registry and generated `blog/index.html` together. The HTML contains
the complete archive; JavaScript only filters it. The build resolves existing
blog and guide destinations, keeps the newest dated entry for duplicate slugs,
sorts by publication date and escapes registry text. It fails on missing pages,
unknown categories, invalid slugs, dates or difficulties.
It also rejects public blog HTML pages missing from the registry. Keep unfinished
drafts outside the public blog directory.

Add new category mappings in `build-blog.py` and matching filter buttons in the
blog index when introducing a new topic. Dates are publication metadata; a
rebuild does not update them.

# Page URL metadata

Run `python3 scripts/check-site-metadata.py` after adding pages or changing URLs.
It checks canonicals, Open Graph URLs, JSON-LD self-references and complete
sitemap coverage. Error pages marked `noindex` and underscore-prefixed templates
are excluded. Existing file routes use extensionless canonical URLs; directory
indexes use a trailing slash. This command performs local validation only.

# Article contents

Run `python3 scripts/build-contents.py` after changing article headings, then
`python3 scripts/build-contents.py --check`. Empty contents slots are rendered
into HTML so their links work without JavaScript. Hand-written lists are kept;
lists marked `data-toc-generated` are maintained by the builder. Existing IDs
are preserved, generated IDs avoid collisions, and contents-box headings and
hidden content are excluded from the generated links. Commit the updated pages
with heading changes.

# Keyboard navigation

Keep the skip link as the first body element on new public pages, targeting
`<main id="main-content" tabindex="-1">`. Use native `details` and `summary`
elements for FAQ disclosures; the answer must remain readable without scripts.
Fragment links use native browser navigation; the stylesheet handles smooth
scrolling, reduced-motion preferences and heading offsets for the sticky header.
Shop filter buttons expose their selected state with `aria-pressed`, and the
status element reports how many items remain visible.

# Archive search

The archive combines a `q` query with the topic fragment, for example
`/blog/?q=solar+battery#solar`. Search matches all words, ignoring case and
accents, across each card's title, summary and displayed topic. It uses the
rendered directory and makes no extra data request. Search and category
controls are revealed after initialization; all cards remain readable when
scripts are unavailable. New titles and summaries enter search on the next
archive rebuild. Back and Forward restore the query and topic.

# Reveal effects

Reveal classes are visible by default. Intersection observation starts a finite
animation; it must not be required to expose content. Keep focus/target, reduced
motion and print overrides when changing these styles. Missing or failing
observation skips decoration. A zero intersection threshold allows tall content
to animate when any portion enters view.
