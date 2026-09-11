const input = document.querySelector('[data-archive-search]')
const cards = Array.from(document.querySelectorAll('[data-article-card]'))
const count = document.querySelector('[data-result-count]')

if (input && cards.length) {
  input.addEventListener('input', () => {
    const query = input.value.trim().toLocaleLowerCase()
    let visible = 0

    for (const card of cards) {
      const match = !query || card.dataset.search.includes(query)
      card.hidden = !match
      if (match) visible += 1
    }

    if (count) count.textContent = `${visible} article${visible === 1 ? '' : 's'}`
  })
}

