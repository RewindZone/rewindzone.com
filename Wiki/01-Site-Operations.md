# RewindZone site operations

The production repository is `RewindZone/rewindzone.com`. GitHub Pages publishes `dist/` after the build and site checks pass on `main`.

## Search and navigation

- `scripts/build.mjs` generates all article pages, the homepage, full archive, populated category pages, About, Privacy and a custom 404 page.
- `/archive/` holds all 342 articles. The homepage highlights prominent article types and sends searches to the full archive. `/categories/` lists only categories with at least three source-supported articles.
- Taxonomy is conservative: article type comes from the title; genre comes from the title/excerpt; decade requires an explicit title decade (including 80s/90s) or a parenthesised release year. Body years, cast-update years and actor lifespan dates are not classification evidence. Review `docs/taxonomy-audit.md` after a build for counts and untyped titles.
- `/sitemap.xml` lists the 342 articles, archive/category pages and public information pages. The error page is excluded and marked `noindex`.
- `/robots.txt` allows crawling and advertises the sitemap. Search engines decide whether and when to index pages.
- Shared asset and navigation URLs start at `/`, so the 404 page works even at deeply nested missing URLs.
- Archive and category pages provide labelled combined title/excerpt search and category filters, reset control, live result counts and no-result feedback. Category pages expose only filter options represented by their rendered cards; without JavaScript the pre-filtered category lists and all links remain usable.
- If Google Search Console is configured for this domain, submit `https://rewindzone.com/sitemap.xml` there and inspect indexing reports. Publishing a sitemap is not the same as submitting it to a private Search Console property.

## Publishing

Run `npm run build` then `npm run check`. Commit source changes and generated output. GitHub Actions repeats both commands before deployment; failing checks prevent publishing.

## Google services

Analytics uses `G-SKE6RQ6WEN`. AdSense uses publisher `ca-pub-6023845436873429`; `/ads.txt` contains its authorisation record. `/privacy/` describes these services.

The publisher plans to configure Google's AdSense consent message. A privacy page alone does not implement consent: the current Analytics loader starts immediately and needs separate consent integration when that setup is completed. Do not describe consent handling as verified until browser behaviour and the account configuration have been checked.
