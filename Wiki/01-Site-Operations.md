# RewindZone site operations

The production repository is `RewindZone/rewindzone.com`. GitHub Pages publishes `dist/` after the build and site checks pass on `main`.

## Search and navigation

- `scripts/build.mjs` generates all article pages, the homepage, About, Privacy and a custom 404 page.
- `/sitemap.xml` lists the 342 articles and three public information/index pages. The error page is excluded and marked `noindex`.
- `/robots.txt` allows crawling and advertises the sitemap. Search engines decide whether and when to index pages.
- Shared asset and navigation URLs start at `/`, so the 404 page works even at deeply nested missing URLs.
- The archive search filters titles and excerpts in the browser.
- If Google Search Console is configured for this domain, submit `https://rewindzone.com/sitemap.xml` there and inspect indexing reports. Publishing a sitemap is not the same as submitting it to a private Search Console property.

## Publishing

Run `npm run build` then `npm run check`. Commit source changes and generated output. GitHub Actions repeats both commands before deployment; failing checks prevent publishing.

## Google services

Analytics uses `G-SKE6RQ6WEN`. AdSense uses publisher `ca-pub-6023845436873429`; `/ads.txt` contains its authorisation record. `/privacy/` describes these services.

The publisher plans to configure Google's AdSense consent message. A privacy page alone does not implement consent: the current Analytics loader starts immediately and needs separate consent integration when that setup is completed. Do not describe consent handling as verified until browser behaviour and the account configuration have been checked.
