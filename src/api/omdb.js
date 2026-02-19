/**
 * OMDb API - The Open Movie Database (omdbapi.com)
 * Alternative to TMDB for real movie data. Free API key at omdbapi.com
 */

const OMDb_BASE = 'https://www.omdbapi.com'
const FETCH_TIMEOUT_MS = 8000

const getApiKey = () => import.meta.env.VITE_OMDB_API_KEY

const fetchWithTimeout = (url) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout))
}

/** Convert OMDb response to our standard movie shape */
export const mapOmdbToMovie = (m) => {
  if (!m || m.Response === 'False') return null
  const rating = m.imdbRating && m.imdbRating !== 'N/A'
    ? parseFloat(m.imdbRating)
    : null
  const year = m.Year && m.Year !== 'N/A' ? m.Year : ''
  return {
    id: m.imdbID,
    title: m.Title,
    poster_path: m.Poster && m.Poster !== 'N/A' ? m.Poster : null,
    backdrop_path: null,
    vote_average: rating,
    release_date: year ? `${year}-01-01` : '',
    overview: m.Plot && m.Plot !== 'N/A' ? m.Plot : '',
    runtime: m.Runtime && m.Runtime !== 'N/A'
      ? parseInt(m.Runtime.replace(/\D/g, ''), 10) || null
      : null,
    imdbID: m.imdbID,
  }
}

/** Fetch a single movie by IMDb ID */
export const fetchMovieById = async (imdbId) => {
  const key = getApiKey()
  if (!key) throw new Error('OMDb API key not configured')
  const res = await fetchWithTimeout(`${OMDb_BASE}/?apikey=${key}&i=${imdbId}`)
  if (!res.ok) throw new Error('Failed to fetch movie')
  const data = await res.json()
  return mapOmdbToMovie(data)
}

/** Search movies by title */
export const searchMovies = async (query, page = 1) => {
  const key = getApiKey()
  if (!key) throw new Error('OMDb API key not configured')
  const res = await fetchWithTimeout(
    `${OMDb_BASE}/?apikey=${key}&s=${encodeURIComponent(query)}&type=movie&page=${page}`
  )
  if (!res.ok) throw new Error('Failed to search')
  const data = await res.json()
  if (!data.Search || data.Search.length === 0) return []
  const results = await Promise.all(
    data.Search.slice(0, 12).map((m) =>
      fetchMovieById(m.imdbID).catch(() => mapOmdbToMovie(m))
    )
  )
  return results.filter(Boolean)
}

/** Fetch multiple movies by IMDb IDs - returns real data from OMDb */
export const fetchMoviesByIds = async (imdbIds) => {
  const key = getApiKey()
  if (!key) throw new Error('OMDb API key not configured')
  const results = await Promise.all(
    imdbIds.map((id) => fetchMovieById(id).catch(() => null))
  )
  return results.filter(Boolean)
}
