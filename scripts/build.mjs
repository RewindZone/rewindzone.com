import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'dist')
const articles = JSON.parse(fs.readFileSync(path.join(root, 'content/articles.json'), 'utf8'))
const siteUrl = 'https://rewindzone.com'
const googleAnalyticsId = 'G-SKE6RQ6WEN'
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
    <nav class="site-nav" aria-label="Main navigation"><a href="${rootPrefix}">Home</a><a href="${rootPrefix}categories/">Browse</a><a href="${rootPrefix}archive/">Archive</a><a href="${rootPrefix}about/">About</a></nav>
  </header>`
}

function footer(rootPrefix) {
  return `<footer class="site-footer">
    <span>© ${new Date().getUTCFullYear()} RewindZone</span>
    <nav aria-label="Footer navigation"><a href="${rootPrefix}archive/">Archive</a><a href="${rootPrefix}about/">About</a><a href="${rootPrefix}privacy/">Privacy</a></nav>
  </footer>`
}

function layout({ title, description, canonicalPath = '/', body, article = null, searchable = false }) {
  const pageTitle = title === 'RewindZone' ? title : `${title} | RewindZone`
  const canonical = `${siteUrl}${canonicalPath}`
  const rootPrefix = '/'
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
${canonicalPath === '/404.html' ? '  <meta name="robots" content="noindex">' : ''}
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
  <script async src="https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}"></script>
  <script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${googleAnalyticsId}');</script>
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

// Evidence is deliberately limited: article types come from titles, genres from
// titles/excerpts, and a four-digit year counts only when parenthesised as a release year.
const taxonomyRules = {
  types: [
    ['film-reviews', 'Film Reviews', /\b(reviews?|deep dive|revisit(?:ed)?|how does it hold up)\b/i],
    ['cast-then-now', 'Cast Then & Now', /\b(cast|then and now|where are they now)\b/i],
    ['profiles', 'Actor & Director Profiles', /\b(actor|actress|director|filmmaker|filmography|career|hollywood journey|rise to stardom|top \d+ (?:movies|films))\b/i],
    ['lists-recommendations', 'Lists & Recommendations', /\b(best|ranked|ranking|top \d+|essential|forgotten|overlooked|hidden gem|underrated|must.watch|movies? (?:from|to watch)|film collection)\b/i],
    ['film-history-essays', 'Film History & Essays', /\b(analysis|an ode|uncovered|cultural phenomenon|history|cinema)\b/i],
    ['streaming-guides', 'Streaming guides', /\b(streaming|plex|pluto tv|free movies)\b/i],
  ],
  genres: [
    ['action', 'Action'], ['comedy', 'Comedy'], ['drama', 'Drama'], ['horror', 'Horror'],
    ['thriller', 'Thriller'], ['western', 'Westerns'], ['science-fiction', 'Science fiction'],
    ['crime', 'Crime'], ['war', 'War'], ['family', 'Family'], ['animation', 'Animation'],
  ],
}

function classify(article) {
  const title = article.title || ''
  const evidence = `${title} ${article.excerpt || ''}`
  const labels = []

  for (const [slug, label, pattern] of taxonomyRules.types) {
    if (pattern.test(title)) labels.push({ group: 'type', slug, label })
  }
  if (/\bwhat happened to\b/i.test(title) && !/\b(cast|pictures|studio|band)\b/i.test(title)) {
    labels.push({ group: 'type', slug: 'profiles', label: 'Actor & Director Profiles' })
  }

  const explicitDecades = [...title.matchAll(/\b(?:(19[5-9]|20[0-2])0|(50|60|70|80|90))s\b/gi)]
    .map(match => match[1] ? `${match[1]}0` : `19${match[2]}`)
  const parenthesisedReleaseYear = title.match(/\((19[5-9]\d|20[0-2]\d)\)/)?.[1]
  for (const decade of new Set(explicitDecades.length ? explicitDecades : parenthesisedReleaseYear ? [`${parenthesisedReleaseYear.slice(0, 3)}0`] : [])) {
    labels.push({ group: 'decade', slug: decade, label: `${decade}s` })
  }

  for (const [slug, label] of taxonomyRules.genres) {
    if (new RegExp(`\\b${slug.replace('-', '[ -]?')}s?\\b`, 'i').test(evidence)) labels.push({ group: 'genre', slug, label })
  }
  return [...new Map(labels.map(label => [`${label.group}/${label.slug}`, label])).values()]
}

const labelsBySlug = new Map(articles.map(article => [article.slug, classify(article)]))
const categories = [...new Map([...labelsBySlug.values()].flat().map(label => [`${label.group}/${label.slug}`, label])).values()]
  .map(label => ({ ...label, articles: sortedArticles.filter(article => labelsBySlug.get(article.slug).some(candidate => candidate.group === label.group && candidate.slug === label.slug)) }))
  .filter(category => category.articles.length >= 3)
  .sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label))
const publishedCategories = new Set(categories.map(category => `${category.group}/${category.slug}`))

function breadcrumbs(items) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${items.map((item, index) => `<li>${index === items.length - 1 ? `<span aria-current="page">${escapeHtml(item.label)}</span>` : `<a href="${item.href}">${escapeHtml(item.label)}</a>`}</li>`).join('')}</ol></nav>`
}

function articleCard(article) {
  const labels = labelsBySlug.get(article.slug).filter(label => publishedCategories.has(`${label.group}/${label.slug}`))
  const search = `${article.title} ${article.excerpt || ''} ${labels.map(label => label.label).join(' ')}`.toLocaleLowerCase()
  return `<li class="article-card" data-article-card data-search="${escapeHtml(search)}" data-categories="${escapeHtml(labels.map(label => `${label.group}/${label.slug}`).join(' '))}">
    <time datetime="${escapeHtml(isoDate(article.published_at))}">${escapeHtml(formatDate(article.published_at))}</time>
    <div><h2><a href="/${escapeHtml(article.slug)}/">${escapeHtml(article.title)}</a></h2>${article.excerpt ? `<p>${escapeHtml(article.excerpt)}</p>` : ''}${labels.length ? `<p class="tag-list">${labels.map(label => `<a href="/categories/${label.group}/${label.slug}/">${escapeHtml(label.label)}</a>`).join('')}</p>` : ''}</div>
  </li>`
}

function filters(selected = '', scope = sortedArticles) {
  const scopeSlugs = new Set(scope.map(article => article.slug))
  const options = categories.filter(category => category.articles.some(article => scopeSlugs.has(article.slug)))
  return `<div class="archive-tools"><div><label for="archive-search">Search the archive</label><input id="archive-search" data-archive-search type="search" placeholder="Title, excerpt or category" autocomplete="off"></div><div><label for="archive-category">Filter by category</label><select id="archive-category" data-archive-category><option value="">All categories</option>${options.map(category => `<option value="${category.group}/${category.slug}"${selected === `${category.group}/${category.slug}` ? ' selected' : ''}>${escapeHtml(category.label)} (${category.articles.filter(article => scopeSlugs.has(article.slug)).length})</option>`).join('')}</select></div><button type="button" data-filter-reset>Reset</button><p class="result-count" data-result-count aria-live="polite">${scope.length} articles</p></div><p class="no-results" data-no-results role="status" hidden>No archive articles match that search and category. Clear one or both filters and try again.</p>`
}

const ignoredRelatedWords = new Set('movie movies film films from with that then where best your this cast ranked ranking what happened now years later today star stars story stories actor actors actress director greatest worst most about which their they have still look back life into after before guide essential forgotten classic classics complete revisit revisited review reviews cinema hollywood history timeless underrated unforgettable memorable performances revealed updated update'.split(' '))
function subjectWords(title) {
  return [...new Set(title.toLowerCase().split(/[^a-z]+/).filter(word => word.length > 3 && !ignoredRelatedWords.has(word)))]
}
const subjectWordsBySlug = new Map(articles.map(article => [article.slug, subjectWords(article.title)]))
const subjectFrequency = new Map()
for (const words of subjectWordsBySlug.values()) for (const word of words) subjectFrequency.set(word, (subjectFrequency.get(word) || 0) + 1)

function relatedArticles(article) {
  const ownLabels = new Set(labelsBySlug.get(article.slug).map(label => `${label.group}/${label.slug}`))
  const words = new Set(subjectWordsBySlug.get(article.slug))
  return sortedArticles.filter(candidate => candidate.slug !== article.slug).map(candidate => {
    const shared = labelsBySlug.get(candidate.slug).filter(label => ownLabels.has(`${label.group}/${label.slug}`)).length
    const overlap = subjectWordsBySlug.get(candidate.slug).filter(word => words.has(word))
    const specific = overlap.some(word => word.length >= 5 && subjectFrequency.get(word) <= 8)
    return { candidate, score: overlap.reduce((score, word) => score + 20 / Math.sqrt(subjectFrequency.get(word)), 0) + shared, qualifies: overlap.length >= 2 || specific }
  }).filter(result => result.qualifies).sort((a, b) => b.score - a.score || new Date(b.candidate.published_at) - new Date(a.candidate.published_at)).slice(0, 3)
}

write('index.html', layout({
  title: 'RewindZone',
  description: 'Independent film and television writing from the RewindZone archive.',
  body: `<main id="main" class="shell">
    <section class="masthead"><div class="eyebrow">Film · Television · Culture</div><h1>The archive, rewound.</h1><p>Original RewindZone articles, preserved in one simple place.</p><form class="home-search" action="/archive/" method="get"><label for="home-search">Search all ${articles.length} articles</label><input id="home-search" name="q" type="search" placeholder="Search titles and excerpts"><button type="submit">Search</button></form></section>
    <section class="featured-categories"><div class="section-heading"><h2>Browse by article type</h2><a href="/categories/">All categories</a></div><div class="category-grid">${categories.filter(category => category.group === 'type').map(category => `<a class="category-card" href="/categories/${category.group}/${category.slug}/"><span>${escapeHtml(category.label)}</span><strong>${category.articles.length} articles</strong></a>`).join('')}</div></section>
    <section class="home-latest"><div class="section-heading"><h2>From the archive</h2><a href="/archive/">Full archive</a></div><p>A selection from across the collection. Articles retain their original publication dates; streaming availability may have changed.</p><ol class="article-list">${[...new Map(categories.filter(category => category.group === 'type').map(category => [category.articles[0].slug, category.articles[0]])).values()].map(articleCard).join('\n')}</ol></section>
  </main>`,
}))

write('archive/index.html', layout({
  title: 'Full archive',
  description: `Browse and search all ${articles.length} original RewindZone articles.`,
  canonicalPath: '/archive/',
  searchable: true,
  body: `<main id="main" class="shell archive-page">${breadcrumbs([{ label: 'Home', href: '/' }, { label: 'Archive' }])}<header class="page-intro"><div class="eyebrow">All original writing</div><h1>Full archive</h1><p>Original publication dates are preserved. This is an archive, not a guide to current streaming availability.</p></header>${filters()}<ol class="article-list">${sortedArticles.map(articleCard).join('\n')}</ol></main>`,
}))

write('categories/index.html', layout({
  title: 'Browse the archive',
  description: 'Browse RewindZone articles by type, decade and genre.',
  canonicalPath: '/categories/',
  body: `<main id="main" class="shell">${breadcrumbs([{ label: 'Home', href: '/' }, { label: 'Browse' }])}<header class="page-intro"><div class="eyebrow">Browse the archive</div><h1>Find a starting point</h1><p>Explore the archive by article type, decade or genre.</p></header>${['type', 'decade', 'genre'].map(group => { const list = categories.filter(category => category.group === group); const label = group === 'type' ? 'Article type' : group === 'decade' ? 'Decade' : 'Genre'; return list.length ? `<section class="category-section"><h2>${label}</h2><div class="category-grid">${list.map(category => `<a class="category-card" href="/categories/${category.group}/${category.slug}/"><span>${escapeHtml(category.label)}</span><strong>${category.articles.length} articles</strong></a>`).join('')}</div></section>` : '' }).join('')}</main>`,
}))

for (const category of categories) {
  write(`categories/${category.group}/${category.slug}/index.html`, layout({
    title: category.label,
    description: `Original RewindZone articles filed under ${category.label}.`,
    canonicalPath: `/categories/${category.group}/${category.slug}/`,
    searchable: true,
    body: `<main id="main" class="shell archive-page">${breadcrumbs([{ label: 'Home', href: '/' }, { label: 'Browse', href: '/categories/' }, { label: category.label }])}<header class="page-intro"><div class="eyebrow">${escapeHtml(category.group)}</div><h1>${escapeHtml(category.label)}</h1></header>${filters(`${category.group}/${category.slug}`, category.articles)}<ol class="article-list">${category.articles.map(articleCard).join('\n')}</ol></main>`,
  }))
}

for (const article of articles) {
  const description = article.meta_description || article.excerpt || `Read ${article.title} in the RewindZone archive.`
  const title = cleanTitle(article.meta_title || article.title)
  write(`${article.slug}/index.html`, layout({
    title,
    description,
    canonicalPath: `/${article.slug}/`,
    article,
    body: `<main id="main">
      ${breadcrumbs([{ label: 'Home', href: '/' }, { label: 'Archive', href: '/archive/' }, { label: article.title }])}
      <header class="article-header"><div class="eyebrow">From the RewindZone archive</div><h1>${escapeHtml(article.title)}</h1>${article.excerpt ? `<p class="article-deck">${escapeHtml(article.excerpt)}</p>` : ''}<p class="article-meta">Originally published ${escapeHtml(formatDate(article.published_at))} · ${escapeHtml(article.author_name || 'RewindZone')}</p>${labelsBySlug.get(article.slug).filter(label => publishedCategories.has(`${label.group}/${label.slug}`)).length ? `<p class="tag-list">${labelsBySlug.get(article.slug).filter(label => publishedCategories.has(`${label.group}/${label.slug}`)).map(label => `<a href="/categories/${label.group}/${label.slug}/">${escapeHtml(label.label)}</a>`).join('')}</p>` : ''}</header>
      <article class="article-body">${renderBlocks(article)}${adUnit(`${article.id}-end`, 'multiplex')}${relatedArticles(article).length ? `<aside class="related"><div class="eyebrow">Continue exploring</div><h2>Related archive articles</h2><ul>${relatedArticles(article).map(result => `<li><a href="/${result.candidate.slug}/">${escapeHtml(result.candidate.title)}</a></li>`).join('')}</ul></aside>` : ''}<p><a href="/archive/">← Back to the full archive</a></p></article>
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
  body: `<main id="main"><header class="page-header"><div class="eyebrow">Information</div><h1>Privacy</h1></header><div class="page-copy"><p>RewindZone is an independent film and television archive. We do not provide reader accounts and do not ask readers to submit personal information.</p><h2>Analytics</h2><p>We use Google Analytics to understand general, aggregated use of the site, such as which pages are visited and how visitors navigate the archive. Google Analytics may use cookies, web beacons, IP addresses, or similar identifiers. Learn more about <a href="https://policies.google.com/technologies/partner-sites">how Google uses data from sites that use its services</a>.</p><h2>Advertising</h2><p>This site uses Google AdSense to display advertising. Google and its advertising partners may place and read cookies, use web beacons or IP addresses, and collect information from visits in order to serve, measure, limit, and improve advertising. Ads may be personalised based on information such as browsing activity where permitted by law and the visitor’s choices.</p><h2>Your choices</h2><p>You can control or delete cookies through your browser settings and manage Google advertising personalisation through <a href="https://myadcenter.google.com/">Google’s My Ad Center</a>. Where required, RewindZone will provide a consent message before using advertising cookies or similar technologies for personalised advertising. Choosing not to consent may result in non-personalised or limited advertising.</p><h2>Third-party policies</h2><p>Google’s processing of information is governed by Google’s own policies. Please see <a href="https://policies.google.com/privacy">Google’s Privacy Policy</a> for more information.</p><p>Last updated: 11 September 2026.</p></div></main>`,
}))

write('404.html', layout({
  title: 'Page not found',
  description: 'The requested RewindZone page could not be found.',
  canonicalPath: '/404.html',
  body: `<main id="main" class="page-header not-found"><div class="eyebrow">404</div><h1>That reel is missing.</h1><p><a href="/">Return to the archive</a></p></main>`,
}))

const sitemapUrls = ['/', '/archive/', '/categories/', ...categories.map(category => `/categories/${category.group}/${category.slug}/`), '/about/', '/privacy/', ...articles.map(article => `/${article.slug}/`)]
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

const untypedArticles = sortedArticles.filter(article => !labelsBySlug.get(article.slug).some(label => label.group === 'type'))
const audit = `# RewindZone taxonomy audit

Generated by \`npm run build\`.

Article types use title wording only. Genre labels use clear title/excerpt wording. Decades require an explicit title decade (including 80s/90s) or a parenthesised release year. Article body years, cast-update years and actor lifespan dates are never used.

## Published categories

${categories.map(category => `- ${category.group}/${category.slug}: ${category.articles.length}`).join('\n')}

## Titles without an editorial type (${untypedArticles.length})

${untypedArticles.map(article => `- ${article.slug}: ${article.title}`).join('\n')}
`
fs.mkdirSync(path.join(root, 'docs'), { recursive: true })
fs.writeFileSync(path.join(root, 'docs/taxonomy-audit.md'), audit)

console.log(`Built ${articles.length} articles, ${categories.length} category pages and ${sitemapUrls.length} sitemap URLs. ${untypedArticles.length} articles have no editorial type label.`)
