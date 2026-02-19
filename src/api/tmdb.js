const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500'
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280'
const FETCH_TIMEOUT_MS = 8000

const getApiKey = () => import.meta.env.VITE_TMDB_API_KEY

const fetchWithTimeout = (url) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout))
}

// Fallback when poster fails - always loads, shows movie title
export const getPlaceholderPosterUrl = (title = '') => {
  const t = (title || 'Movie').slice(0, 10).replace(/[^\w]/g, '') || 'Poster'
  return `https://placehold.co/400x600/222/999.png?text=${t}`
}

// Movie-themed placeholder when no path
const PLACEHOLDER_POSTER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'%3E%3Crect fill='%231a1a2e' width='400' height='600'/%3E%3Ctext fill='%2394a3b8' font-size='24' font-family='sans-serif' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EMovie%3C/text%3E%3C/svg%3E"

const IMG_PROXY = 'https://wsrv.nl/?url='

export const getPosterUrl = (path, movieId) => {
  if (!path) return getPlaceholderPosterUrl()
  let imgUrl
  if (typeof path === 'string' && path.startsWith('http')) {
    imgUrl = path
  } else {
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    imgUrl = `${TMDB_IMG_BASE}${cleanPath}`
  }
  // Proxy TMDB images to avoid CORS/blocking - OMDb URLs pass through
  if (imgUrl.includes('image.tmdb.org')) {
    return `${IMG_PROXY}${encodeURIComponent(imgUrl)}`
  }
  return imgUrl
}

export const getBackdropUrl = (path) => {
  if (!path) return null
  return `${TMDB_BACKDROP_BASE}${path}`
}

export const fetchPopularMovies = async (page = 1) => {
  const key = getApiKey()
  if (!key) throw new Error('TMDB API key not configured. Add VITE_TMDB_API_KEY to .env.local')
  
  const res = await fetchWithTimeout(
    `${TMDB_BASE}/movie/popular?api_key=${key}&language=en-US&page=${page}`
  )
  if (!res.ok) throw new Error('Failed to fetch movies')
  return res.json()
}

export const fetchTopRatedMovies = async (page = 1) => {
  const key = getApiKey()
  if (!key) throw new Error('TMDB API key not configured')
  
  const res = await fetchWithTimeout(
    `${TMDB_BASE}/movie/top_rated?api_key=${key}&language=en-US&page=${page}`
  )
  if (!res.ok) throw new Error('Failed to fetch movies')
  return res.json()
}

export const fetchNowPlaying = async (page = 1) => {
  const key = getApiKey()
  if (!key) throw new Error('TMDB API key not configured')
  
  const res = await fetchWithTimeout(
    `${TMDB_BASE}/movie/now_playing?api_key=${key}&language=en-US&page=${page}`
  )
  if (!res.ok) throw new Error('Failed to fetch movies')
  return res.json()
}

export const fetchMovieDetails = async (movieId) => {
  const key = getApiKey()
  if (!key) throw new Error('TMDB API key not configured')
  
  const res = await fetch(
    `${TMDB_BASE}/movie/${movieId}?api_key=${key}&language=en-US`
  )
  if (!res.ok) throw new Error('Failed to fetch movie details')
  return res.json()
}

export const fetchTVDetails = async (tvId) => {
  const key = getApiKey()
  if (!key) throw new Error('TMDB API key not configured')
  
  const res = await fetch(
    `${TMDB_BASE}/tv/${tvId}?api_key=${key}&language=en-US`
  )
  if (!res.ok) throw new Error('Failed to fetch TV details')
  return res.json()
}

/** Enrich originals with real poster_path from TMDB API */
export const fetchOriginalsWithPosters = async (originalsList) => {
  const key = getApiKey()
  if (!key) return originalsList

  const enriched = await Promise.all(
    originalsList.map(async (item) => {
      try {
        if (item.tmdbTvId) {
          const tv = await fetchTVDetails(item.tmdbTvId)
          return { ...item, poster_path: tv.poster_path, backdrop_path: tv.backdrop_path }
        }
        if (typeof item.id === 'number') {
          const movie = await fetchMovieDetails(item.id)
          return { ...item, poster_path: movie.poster_path, backdrop_path: movie.backdrop_path }
        }
      } catch {
        // Keep original poster_path on failure
      }
      return item
    })
  )
  return enriched
}

export const fetchMovieVideos = async (movieId) => {
  const key = getApiKey()
  if (!key) throw new Error('TMDB API key not configured')
  
  const res = await fetch(
    `${TMDB_BASE}/movie/${movieId}/videos?api_key=${key}&language=en-US`
  )
  if (!res.ok) throw new Error('Failed to fetch videos')
  const data = await res.json()
  const trailer = data.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')
  return trailer ? { key: trailer.key } : null
}

export const searchMovies = async (query, page = 1) => {
  const key = getApiKey()
  if (!key) throw new Error('TMDB API key not configured')

  const res = await fetch(
    `${TMDB_BASE}/search/movie?api_key=${key}&language=en-US&query=${encodeURIComponent(query)}&page=${page}`
  )
  if (!res.ok) throw new Error('Failed to search movies')
  return res.json()
}
