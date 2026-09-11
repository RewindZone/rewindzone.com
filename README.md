# RewindZone

A static, text-only home for the original RewindZone film and television archive.

## How it works

- Published articles live in `content/articles.json`.
- `npm run build` generates the complete website in `dist/`.
- Every article is generated at its original `rewindzone.com/<slug>` URL.
- `/archive/` contains the complete searchable archive; `/categories/` exposes only useful populated article-type, decade and genre pages.
- The generated site has no database, server, image storage, authentication, or runtime dependencies.

Cloudflare Pages can publish the repository with:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: none

Alternatively, the included GitHub Pages workflow builds and publishes the same `dist/` site whenever `main` changes. Enable **GitHub Actions** as the Pages source in the repository settings to use it.

Run `npm run check` after a build to verify the article count, URLs, sitemap parity, category counts and absence of image tags. `docs/taxonomy-audit.md` is regenerated during the build and lists category counts plus titles left without an editorial-type label.

The publishing workflow runs these checks before deployment. See [site operations](Wiki/01-Site-Operations.md) for sitemap, indexing and Google-service setup details.
