import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'dist')
const articles = JSON.parse(fs.readFileSync(path.join(root, 'content/articles.json'), 'utf8'))
const siteUrl = 'https://rewindzone.com'
const adsenseClient = 'ca-pub-6023845436873429'
const displaySlot = '6279262028'
const multiplexSlot = '4067463437'

const escapeHtml = (value = '') => String(value).trim().replace(/\s+/g, ' ')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const cleanTitle = (value = '') => String(value)
  .replace(/\s+\|\s*Taleventry\s*$/i, '')
  .replace(/\s+[-–—]\s*Taleventry\s*$/i, '')
  .trim()

const formatDate = value => value
  ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value))
  : 'From the archive'

const isoDate = value => value ? new Date(value).toISOString() : ''

const slugifyHeading = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90)

function write(relativePath, content) {
  const destination = path.join(out, relativePath)
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.writeFileSync(destination, content)
}

function header(rootPrefix) {
  return `<a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <a class="brand" href="${rootPrefix}" aria-label="RewindZone home">Rewind<span>Zone</span></a>
    <nav class="site-nav" aria-label="Main navigation"><a href="${rootPrefix}">Archive</a><a href="${rootPrefix}about/">About</a></nav>
  </header>`
}

function footer(rootPrefix) {
  return `<footer class="site-footer">
    <span>© ${new Date().getUTCFullYear()} RewindZone</span>
    <nav aria-label="Footer navigation"><a href="${rootPrefix}about/">About</a><a href="${rootPrefix}privacy/">Privacy</a></nav>
  </footer>`
}

function layout({ title, description, canonicalPath = '/', body, article = null, searchable = false }) {
  const pageTitle = title === 'RewindZone' ? title : `${title} | RewindZone`
  const canonical = `${siteUrl}${canonicalPath}`
  const rootPrefix = canonicalPath === '/' || canonicalPath === '/404.html' ? './' : '../'
  const structuredData = article ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description,
    datePublished: isoDate(article.published_at),
    dateModified: isoDate(article.updated_at || article.published_at),
    author: { '@type': 'Organization', name: article.author_name || 'RewindZone' },
    publisher: { '@type': 'Organization', name: 'RewindZone', url: siteUrl },
    mainEntityOfPage: canonical,
  } : {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'RewindZone',
    url: siteUrl,
  }

  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${article ? 'article' : 'website'}">
  <meta property="og:site_name" content="RewindZone">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary">
  <meta name="theme-color" content="#f5f2ea">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23171714'/%3E%3Cpath d='M14 14h23c10 0 16 5 16 14 0 6-3 10-9 12l10 10H40L29 39v11H14zm15 10v7h8c3 0 5-1 5-4 0-2-2-3-5-3z' fill='%23f5f2ea'/%3E%3Cpath d='M50 10h8v44h-8z' fill='%23bd291e'/%3E%3C/svg%3E">
  <link rel="stylesheet" href="${rootPrefix}styles.css">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}" crossorigin="anonymous"></script>
  <script type="application/ld+json">${JSON.stringify(structuredData).replaceAll('<', '\\u003c')}</script>
</head>
<body>
  ${header(rootPrefix)}
  ${body}
  ${footer(rootPrefix)}
  ${searchable ? `<script src="${rootPrefix}site.js" defer></script>` : ''}
</body>
</html>`
}

function adUnit(id, variant = 'display') {
  const slot = variant === 'multiplex' ? multiplexSlot : displaySlot
  const format = variant === 'multiplex' ? 'autorelaxed' : 'auto'
  return `<aside class="ad-slot" aria-label="Advertisement">
    <div class="ad-label">Advertisement</div>
    <ins class="adsbygoogle" style="display:block" data-ad-client="${adsenseClient}" data-ad-slot="${slot}" data-ad-format="${format}"${variant === 'display' ? ' data-full-width-responsive="true"' : ''}></ins>
    <script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>
  </aside>`
}

function renderBlocks(article) {
  const blocks = Array.isArray(article.content) ? article.content : []
  let headingCount = 0
  const rendered = []

  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue
    if (block.type === 'paragraph' && block.text) rendered.push(`<p>${escapeHtml(block.text)}</p>`)
    if (block.type === 'heading' && block.text) {
      headingCount += 1
      const level = block.level === 3 ? 3 : 2
      rendered.push(`<h${level} id="${escapeHtml(slugifyHeading(block.text))}">${escapeHtml(block.text)}</h${level}>`)
      if (headingCount === 2 || headingCount === 6) rendered.push(adUnit(`${article.id}-${headingCount}`))
    }
    if (block.type === 'quote' && block.text) {
      rendered.push(`<blockquote><p>${escapeHtml(block.text)}</p>${block.author ? `<footer>— ${escapeHtml(block.author)}</footer>` : ''}</blockquote>`)
    }
    if (block.type === 'list' && Array.isArray(block.items)) {
      rendered.push(`<ul>${block.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`)
    }
  }

  return rendered.join('\n')
}

const sortedArticles = [...articles].sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))

const cards = sortedArticles.map(article => {
  const search = `${article.title} ${article.excerpt || ''}`.toLocaleLowerCase()
  return `<li class="article-card" data-article-card data-search="${escapeHtml(search)}">
    <time datetime="${escapeHtml(isoDate(article.published_at))}">${escapeHtml(formatDate(article.published_at))}</time>
    <div><h2><a href="./${escapeHtml(article.slug)}/">${escapeHtml(article.title)}</a></h2>${article.excerpt ? `<p>${escapeHtml(article.excerpt)}</p>` : ''}</div>
  </li>`
}).join('\n')

write('index.html', layout({
  title: 'RewindZone',
  description: 'Independent film and television writing from the RewindZone archive.',
  searchable: true,
  body: `<main id="main" class="shell">
    <section class="masthead"><div class="eyebrow">Film · Television · Culture</div><h1>The archive, rewound.</h1><p>Original RewindZone articles, preserved in one simple place.</p></section>
    <div class="archive-tools"><label for="archive-search"><span data-result-count>${articles.length} articles</span></label><input id="archive-search" data-archive-search type="search" placeholder="Search the archive" autocomplete="off"></div>
    <ol class="article-list">${cards}</ol>
  </main>`,
}))

for (const article of articles) {
  const description = article.meta_description || article.excerpt || `Read ${article.title} in the RewindZone archive.`
  const title = cleanTitle(article.meta_title || article.title)
  write(`${article.slug}/index.html`, layout({
    title,
    description,
    canonicalPath: `/${article.slug}/`,
    article,
    body: `<main id="main">
      <header class="article-header"><div class="eyebrow">From the RewindZone archive</div><h1>${escapeHtml(article.title)}</h1>${article.excerpt ? `<p class="article-deck">${escapeHtml(article.excerpt)}</p>` : ''}<p class="article-meta">${escapeHtml(formatDate(article.published_at))} · ${escapeHtml(article.author_name || 'RewindZone')}</p></header>
      <article class="article-body">${renderBlocks(article)}${adUnit(`${article.id}-end`, 'multiplex')}<p><a href="../">← Back to the archive</a></p></article>
    </main>`,
  }))
}

write('about/index.html', layout({
  title: 'About',
  description: 'RewindZone is an independent film archive devoted to overlooked movies, memorable performances and the stories that stay with us.',
  canonicalPath: '/about/',
  body: `<main id="main">
    <header class="page-header about-header"><div class="eyebrow">About RewindZone</div><h1>Films are disposable only if we let them be.</h1><p class="about-intro">RewindZone is an independent film archive for readers who still enjoy going back—finding the overlooked movie, reconsidering an old favourite, or remembering the performer who made a scene impossible to forget.</p></header>
    <div class="about-layout">
      <aside class="about-facts" aria-label="Archive facts"><div><strong>342</strong><span>Original articles</span></div><div><strong>2023—26</strong><span>Published archive</span></div><div><strong>£0</strong><span>Cost to read</span></div></aside>
      <div class="about-copy">
        <section><div class="eyebrow">What we cover</div><h2>The long life of movies</h2><p>The archive moves through westerns, thrillers, horror, drama, action and cult cinema, with a particular affection for films from the 1970s through the 1990s. You’ll find cast retrospectives, career surveys, ranked watchlists and close looks at the films that slipped out of the conversation.</p><p>RewindZone is less interested in chasing every new release than in asking why certain movies endure—and why others deserve another chance.</p></section>
        <section><div class="eyebrow">Why this version exists</div><h2>The writing comes first</h2><p>This text-first edition brings the original RewindZone articles together without accounts, feeds, paywalls or a database. It is deliberately simple: quick pages, clear typography and the archive itself.</p></section>
        <section><div class="eyebrow">A note on the archive</div><h2>Preserved, not rewritten</h2><p>Articles retain their original publication dates and editorial point of view. Streaming availability, careers and other time-sensitive details may have changed since an article first appeared.</p></section>
        <section class="about-contact"><div class="eyebrow">Get in touch</div><h2>Talk movies with us</h2><p>Corrections, archive questions and thoughtful recommendations are welcome at <a href="mailto:contact@rewindzone.com">contact@rewindzone.com</a>.</p></section>
      </div>
    </div>
  </main>`,
}))

write('privacy/index.html', layout({
  title: 'Privacy',
  description: 'Privacy information for RewindZone.',
  canonicalPath: '/privacy/',
  body: `<main id="main"><header class="page-header"><div class="eyebrow">Information</div><h1>Privacy</h1></header><div class="page-copy"><p>RewindZone does not provide accounts and does not ask readers to submit personal information.</p><h2>Advertising</h2><p>This site uses Google AdSense to display advertising. Google and its partners may use cookies or similar technologies to serve and measure ads. You can learn how Google uses information from sites that use its services in <a href="https://policies.google.com/technologies/partner-sites">Google’s privacy information</a>.</p><h2>Your choices</h2><p>Your browser can block or delete cookies. Where required, advertising consent choices will be presented before advertising cookies are used.</p><p>Last updated: 11 September 2026.</p></div></main>`,
}))

write('404.html', layout({
  title: 'Page not found',
  description: 'The requested RewindZone page could not be found.',
  canonicalPath: '/404.html',
  body: `<main id="main" class="page-header not-found"><div class="eyebrow">404</div><h1>That reel is missing.</h1><p><a href="/">Return to the archive</a></p></main>`,
}))

const sitemapUrls = ['/', '/about/', '/privacy/', ...articles.map(article => `/${article.slug}/`)]
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map(url => `  <url><loc>${siteUrl}${url}</loc></url>`).join('\n')}\n</urlset>\n`)
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`)
write('ads.txt', `google.com, pub-6023845436873429, DIRECT, f08c47fec0942fa0\n`)
write('CNAME', `rewindzone.com\n`)
write('.nojekyll', '')
write('_headers', `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n`)
write('styles.css', fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8'))
write('site.js', fs.readFileSync(path.join(root, 'src/site.js'), 'utf8'))

fs.mkdirSync(path.join(root, 'migration'), { recursive: true })
const redirectRows = ['source,target,status', ...articles.map(article => `https://taleventry.com/archive/${article.slug},https://rewindzone.com/${article.slug}/,301`)]
fs.writeFileSync(path.join(root, 'migration/taleventry-redirects.csv'), `${redirectRows.join('\n')}\n`)

console.log(`Built ${articles.length} articles and ${sitemapUrls.length} sitemap URLs in dist/`)
