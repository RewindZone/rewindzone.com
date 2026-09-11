import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'dist')
const articles = JSON.parse(fs.readFileSync(path.join(root, 'content/articles.json'), 'utf8'))
const failures = []
const siteUrl = 'https://rewindzone.com'

if (articles.length !== 342) failures.push(`Expected 342 articles, found ${articles.length}`)
if (new Set(articles.map(article => article.slug)).size !== articles.length) failures.push('Article slugs are not unique')

for (const article of articles) {
  const file = path.join(out, article.slug, 'index.html')
  if (!fs.existsSync(file)) failures.push(`Missing article page: ${article.slug}`)
}

const htmlFiles = []
function collect(directory) {
  if (!fs.existsSync(directory)) return
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const item = path.join(directory, entry.name)
    if (entry.isDirectory()) collect(item)
    else if (entry.name.endsWith('.html')) htmlFiles.push(item)
  }
}
collect(out)

function localTarget(file, value) {
  const raw = value.trim()
  if (!raw || raw.startsWith('#') || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(raw)) return null
  const withoutQuery = raw.split(/[?#]/, 1)[0]
  if (!withoutQuery) return null
  const relative = withoutQuery.startsWith('/')
    ? withoutQuery.slice(1)
    : path.relative(out, path.dirname(file)).split(path.sep).filter(Boolean).concat(withoutQuery).join('/')
  const normalised = path.posix.normalize(`/${relative}`).slice(1)
  if (normalised.startsWith('../') || normalised === '..') return { display: raw, file: null }
  const candidate = path.join(out, normalised)
  if (raw.endsWith('/')) return { display: raw, file: path.join(candidate, 'index.html') }
  if (path.extname(candidate)) return { display: raw, file: candidate }
  return { display: raw, file: fs.existsSync(candidate) ? candidate : path.join(candidate, 'index.html') }
}

const canonicalByFile = new Map()

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8')
  if (/<img\b/i.test(html)) failures.push(`Image tag found: ${path.relative(root, file)}`)
  if (/supabase/i.test(html)) failures.push(`Supabase reference found: ${path.relative(root, file)}`)
  if (!/<footer\b[^>]*>[\s\S]*?href=["'][^"']*\/privacy\/?["'][\s\S]*?<\/footer>/i.test(html)) {
    failures.push(`Privacy link missing from footer: ${path.relative(root, file)}`)
  }
  for (const match of html.matchAll(/\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi)) {
    const target = localTarget(file, match[2])
    if (target && (!target.file || !fs.existsSync(target.file))) {
      failures.push(`Missing local ${match[0].startsWith('src') ? 'asset' : 'link'} ${target.display} in ${path.relative(root, file)}`)
    }
  }
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1]
  if (!canonical) failures.push(`Canonical missing: ${path.relative(root, file)}`)
  else if (canonicalByFile.has(canonical)) failures.push(`Duplicate canonical ${canonical}`)
  else canonicalByFile.set(canonical, file)
}

const sitemap = fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8')
const sitemapUrls = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(match => match[1])
if (new Set(sitemapUrls).size !== sitemapUrls.length) failures.push('Sitemap URLs are not unique')
const sitemapSet = new Set(sitemapUrls)
for (const url of sitemapUrls) {
  if (!url.startsWith(`${siteUrl}/`) && url !== siteUrl) failures.push(`Non-canonical sitemap URL: ${url}`)
  const canonicalFile = canonicalByFile.get(url)
  if (!canonicalFile || path.basename(canonicalFile) === '404.html') failures.push(`Sitemap URL is missing or points to 404: ${url}`)
}
for (const [canonical, file] of canonicalByFile) {
  if (path.basename(file) !== '404.html' && !sitemapSet.has(canonical)) failures.push(`Sitemap missing canonical: ${canonical}`)
}
const robots = fs.readFileSync(path.join(out, 'robots.txt'), 'utf8')
if (!new RegExp(`^Sitemap:\\s*${siteUrl.replace('.', '\\.')}/sitemap\\.xml\\s*$`, 'mi').test(robots)) failures.push('robots.txt sitemap declaration missing or incorrect')
const notFound = fs.readFileSync(path.join(out, '404.html'), 'utf8')
if (!/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*\bnoindex\b[^"']*["']/i.test(notFound)) failures.push('404 page is missing a noindex robots directive')

const redirectLines = fs.readFileSync(path.join(root, 'migration/taleventry-redirects.csv'), 'utf8').trim().split('\n')
if (redirectLines.length !== articles.length + 1) failures.push(`Redirect map has ${redirectLines.length - 1} rows, expected ${articles.length}`)

if (failures.length) {
  console.error(failures.slice(0, 30).join('\n'))
  process.exit(1)
}

console.log(`Verified ${articles.length} text-only article pages, ${htmlFiles.length} HTML files, sitemap, and redirect map.`)
