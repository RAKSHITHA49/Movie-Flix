/**
 * Free Movie API - No API key required
 * https://imdb.iamidiotareyoutoo.com
 * CORS enabled, works in browser
 */

const FREE_API_BASE = 'https://imdb.iamidiotareyoutoo.com'
const FETCH_TIMEOUT_MS = 10000

const fetchWithTimeout = (url) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout))
}

/** Convert search result to our movie shape */
const mapSearchResult = (m) => ({
  id: m['#IMDB_ID'],
  title: m['#TITLE'],
  poster_path: m['#IMG_POSTER'] || null,
  backdrop_path: null,
  vote_average: m['#RANK'] ? (10 - (m['#RANK'] / 50000)) : null,
  release_date: m['#YEAR'] ? `${m['#YEAR']}-01-01` : '',
  overview: m['#ACTORS'] ? `Cast: ${m['#ACTORS']}` : '',
  runtime: null,
})

/** Convert detail response (short schema) to our movie shape */
const mapDetailToMovie = (data) => {
  const short = data?.short
  if (!short) return null
  const rating = short.aggregateRating?.ratingValue
  const duration = short.duration // e.g. "PT2H28M"
  let runtime = null
  if (duration && typeof duration === 'string') {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
    if (match) {
      const h = parseInt(match[1] || 0, 10)
      const m = parseInt(match[2] || 0, 10)
      runtime = h * 60 + m
    }
  }
  const imdbId = data.imdbId || short.url?.match(/tt\d+/)?.[0]
  return {
    id: imdbId,
    title: short.name,
    poster_path: short.image || null,
    backdrop_path: null,
    vote_average: rating ? parseFloat(rating) : null,
    release_date: short.datePublished ? String(short.datePublished).slice(0, 10) : '',
    overview: short.description || '',
    runtime,
  }
}

/** Search movies by title - no key needed */
export const searchMovies = async (query) => {
  const res = await fetchWithTimeout(
    `${FREE_API_BASE}/search?q=${encodeURIComponent(query)}`
  )
  if (!res.ok) throw new Error('Search failed')
  const data = await res.json()
  if (!data.ok || !Array.isArray(data.description)) return []
  return data.description
    .filter((m) => m['#IMDB_ID'] && m['#TITLE'])
    .slice(0, 15)
    .map(mapSearchResult)
}

/** Get movie details by IMDb ID - no key needed */
export const fetchMovieById = async (imdbId) => {
  const id = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`
  const res = await fetchWithTimeout(`${FREE_API_BASE}/search?tt=${id}`)
  if (!res.ok) throw new Error('Fetch failed')
  const data = await res.json()
  const movie = mapDetailToMovie(data)
  if (movie) return movie
  const desc = data.description
  if (Array.isArray(desc) && desc[0]) return mapSearchResult(desc[0])
  return null
}

/** Fetch multiple movies by IMDb IDs */
export const fetchMoviesByIds = async (imdbIds) => {
  const results = await Promise.all(
    imdbIds.map((id) => fetchMovieById(id).catch(() => null))
  )
  return results.filter(Boolean)
}
