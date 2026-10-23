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
