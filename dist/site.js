const input = document.querySelector('[data-archive-search]')
const select = document.querySelector('[data-archive-category]')
const reset = document.querySelector('[data-filter-reset]')
const cards = Array.from(document.querySelectorAll('[data-article-card]'))
const count = document.querySelector('[data-result-count]')
const noResults = document.querySelector('[data-no-results]')

if (cards.length) {
  const params = new URLSearchParams(window.location.search)
  if (input && params.has('q')) input.value = params.get('q')
  if (select && params.has('category')) select.value = params.get('category')

  const applyFilters = () => {
    const query = input?.value.trim().toLocaleLowerCase() || ''
    const category = select?.value || ''
    let visible = 0

    for (const card of cards) {
      const matchesSearch = !query || card.dataset.search.includes(query)
      const matchesCategory = !category || card.dataset.categories.split(' ').includes(category)
      const match = matchesSearch && matchesCategory
      card.hidden = !match
      if (match) visible += 1
    }

    if (count) count.textContent = `${visible} article${visible === 1 ? '' : 's'}`
    if (noResults) noResults.hidden = visible !== 0
  }

  input?.addEventListener('input', applyFilters)
  select?.addEventListener('change', applyFilters)
  reset?.addEventListener('click', () => {
    if (input) input.value = ''
    if (select) select.value = ''
    applyFilters()
    input?.focus()
  })
  applyFilters()
}

