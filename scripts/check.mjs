import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'dist')
const articles = JSON.parse(fs.readFileSync(path.join(root, 'content/articles.json'), 'utf8'))
const failures = []

if (articles.length !== 342) failures.push(`Expected 342 articles, found ${articles.length}`)
if (new Set(articles.map(article => article.slug)).size !== articles.length) failures.push('Article slugs are not unique')

for (const article of articles) {
  const file = path.join(out, article.slug, 'index.html')
  if (!fs.existsSync(file)) failures.push(`Missing article page: ${article.slug}`)
}

const htmlFiles = []
function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const item = path.join(directory, entry.name)
    if (entry.isDirectory()) collect(item)
    else if (entry.name.endsWith('.html')) htmlFiles.push(item)
  }
}
collect(out)

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8')
  if (/<img\b/i.test(html)) failures.push(`Image tag found: ${path.relative(root, file)}`)
  if (/supabase/i.test(html)) failures.push(`Supabase reference found: ${path.relative(root, file)}`)
}

const sitemap = fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8')
for (const article of articles) {
  if (!sitemap.includes(`https://rewindzone.com/${article.slug}/`)) failures.push(`Sitemap missing: ${article.slug}`)
}

const redirectLines = fs.readFileSync(path.join(root, 'migration/taleventry-redirects.csv'), 'utf8').trim().split('\n')
if (redirectLines.length !== articles.length + 1) failures.push(`Redirect map has ${redirectLines.length - 1} rows, expected ${articles.length}`)

if (failures.length) {
  console.error(failures.slice(0, 30).join('\n'))
  process.exit(1)
}

console.log(`Verified ${articles.length} text-only article pages, ${htmlFiles.length} HTML files, sitemap, and redirect map.`)
