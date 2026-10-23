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
Shop filter buttons expose their selected state with `aria-pressed`, and the
status element reports how many items remain visible.
