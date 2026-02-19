import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import HeroBillboard from './components/HeroBillboard'
import BackgroundAnimation from './components/BackgroundAnimation'
import MovieRow from './components/MovieRow'
import MovieDetailModal from './components/MovieDetailModal'
import {
  fetchPopularMovies,
  fetchTopRatedMovies,
  fetchNowPlaying,
  searchMovies,
  fetchOriginalsWithPosters,
} from './api/tmdb'
import { fetchMoviesByIds, searchMovies as omdbSearch } from './api/omdb'
import { fetchMoviesByIds as freeFetchByIds, searchMovies as freeSearch } from './api/freeMovieApi'
import { demoMovies } from './data/demoMovies'
import { kaggleMovies } from './data/kaggleMovies'
import { netflixShows } from './data/netflixShows'
import { originals } from './data/originals'
import { freeFullMovies } from './data/freeFullMovies'
import { dubbedMovies } from './data/dubbedMovies'
import { series } from './data/series'
import { cartoons } from './data/cartoons'
import {
  popularImdbIds,
  topRatedImdbIds,
  nowPlayingImdbIds,
  regionalImdbIds,
} from './data/imdbIds'
import './Home.css'

function Home() {
  const [popular, setPopular] = useState([])
  const [topRated, setTopRated] = useState([])
  const [nowPlaying, setNowPlaying] = useState([])
  const [regionalMovies, setRegionalMovies] = useState([])
  const [moreMovies, setMoreMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [dataSource, setDataSource] = useState('demo') // 'tmdb' | 'omdb' | 'free' | 'kaggle' | 'demo'
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [, setUsingDemo] = useState(false)
  const [originalsList, setOriginalsList] = useState(originals)

  const featuredMovie = popular[0] || demoMovies[0]

  useEffect(() => {
    const loadMovies = async () => {
      setLoading(true)
      setError('')
      const tmdbKey = !!import.meta.env.VITE_TMDB_API_KEY
      const omdbKey = !!import.meta.env.VITE_OMDB_API_KEY

      try {
        if (tmdbKey) {
          try {
            const [popularRes, topRatedRes, nowPlayingRes] = await Promise.all([
              fetchPopularMovies(),
              fetchTopRatedMovies(),
              fetchNowPlaying(),
            ])
            const results = popularRes.results || []
            setPopular(results)
            setTopRated(topRatedRes.results || [])
            setNowPlaying(nowPlayingRes.results || [])
            setRegionalMovies(demoMovies.filter(m => [564147, 587412, 858485, 579974, 257344, 340666, 690957, 23790, 660046, 589761].includes(m.id)))
            setMoreMovies(results.slice(15, 40))
            setHasApiKey(true)
            setDataSource('tmdb')
            const enriched = await fetchOriginalsWithPosters(originals)
            setOriginalsList(enriched)
            return
          } catch {
            // TMDB failed, try OMDb or demo
          }
        }

        if (omdbKey) {
          try {
            const [popularList, topList, nowList, regionalList] = await Promise.all([
              fetchMoviesByIds(popularImdbIds),
              fetchMoviesByIds(topRatedImdbIds),
              fetchMoviesByIds(nowPlayingImdbIds),
              fetchMoviesByIds(regionalImdbIds),
            ])
            setPopular(popularList)
            setTopRated(topList)
            setNowPlaying(nowList)
            setRegionalMovies(regionalList)
            setMoreMovies([...topList, ...nowList].slice(0, 15))
            setHasApiKey(true)
            setDataSource('omdb')
            setOriginalsList(originals)
            return
          } catch {
            // OMDb failed
          }
        }

        if (kaggleMovies.length > 0) {
          const sorted = [...kaggleMovies].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
          const regional = sorted.filter((m) =>
            /\b(KGF|Kantara|RRR|Baahubali|Pushpa|Magadheera|Ponniyin|Vikram)\b/i.test(m.title || '')
          )
          setPopular(sorted)
          setTopRated(sorted.slice(0, 15))
          setNowPlaying(sorted.slice(15, 30))
          setRegionalMovies(regional.length > 0 ? regional : sorted.slice(20, 30))
          setMoreMovies(sorted.slice(30, 60))
          setDataSource('kaggle')
          return
        }

        if (netflixShows.length > 0) {
          const sorted = [...netflixShows].sort((a, b) => {
            const yA = a.release_date?.slice(0, 4) || '0'
            const yB = b.release_date?.slice(0, 4) || '0'
            return yB.localeCompare(yA)
          })
          const moviesOnly = sorted.filter((m) => (m.type || '').toLowerCase().includes('movie'))
          const tvOnly = sorted.filter((m) => (m.type || '').toLowerCase().includes('tv'))
          setPopular(sorted)
          setTopRated(moviesOnly.length > 0 ? moviesOnly.slice(0, 15) : sorted.slice(0, 15))
          setNowPlaying(tvOnly.length > 0 ? tvOnly.slice(0, 15) : sorted.slice(15, 30))
          setRegionalMovies(sorted.filter((m) => /\b(India|Indian|Bollywood|KGF|RRR|Pushpa)\b/i.test(m.overview || m.title || '')).slice(0, 10) || sorted.slice(20, 30))
          setMoreMovies(sorted.slice(30, 60))
          setDataSource('netflix')
          return
        }

        try {
          const [popularList, topList, nowList, regionalList] = await Promise.all([
            freeFetchByIds(popularImdbIds),
            freeFetchByIds(topRatedImdbIds),
            freeFetchByIds(nowPlayingImdbIds),
            freeFetchByIds(regionalImdbIds),
          ])
          if (popularList?.length > 0) {
            setPopular(popularList)
            setTopRated(topList)
            setNowPlaying(nowList)
            setRegionalMovies(regionalList)
            setMoreMovies([...topList, ...nowList].slice(0, 15))
            setDataSource('free')
            setHasApiKey(false)
            return
          }
        } catch {
          // Free API failed
        }

        const regional = demoMovies.filter(m => [564147, 587412, 858485, 579974, 257344, 340666, 690957, 23790, 660046, 589761].includes(m.id))
        setUsingDemo(true)
        setPopular(demoMovies)
        setTopRated(demoMovies.slice(0, 8))
        setNowPlaying(demoMovies.slice(8, 16))
        setRegionalMovies(regional)
        setMoreMovies(demoMovies.slice(16, 35))
      } finally {
        setLoading(false)
      }
    }
    loadMovies()
  }, [])

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const runSearch = useCallback(async (query) => {
    const q = query.trim()
    if (!q) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      if (dataSource === 'tmdb' && hasApiKey) {
        const res = await searchMovies(q)
        setSearchResults(res.results || [])
      } else if (dataSource === 'omdb' && hasApiKey) {
        const results = await omdbSearch(q)
        setSearchResults(results)
      } else if (dataSource === 'free') {
        const results = await freeSearch(q)
        setSearchResults(results)
      } else if (dataSource === 'kaggle') {
        const lower = q.toLowerCase()
        const filtered = kaggleMovies.filter(
          (m) => m.title?.toLowerCase().includes(lower)
        )
        setSearchResults(filtered.slice(0, 30))
      } else if (dataSource === 'netflix') {
        const lower = q.toLowerCase()
        const filtered = netflixShows.filter(
          (m) => (m.title || '').toLowerCase().includes(lower) || (m.overview || '').toLowerCase().includes(lower)
        )
        setSearchResults(filtered.slice(0, 30))
      } else {
        const lower = q.toLowerCase()
        const filtered = demoMovies.filter(
          (m) => m.title.toLowerCase().includes(lower)
        )
        setSearchResults(filtered)
      }
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [hasApiKey, dataSource])

  useEffect(() => {
    const timer = setTimeout(() => runSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, runSearch])

  if (loading) {
    return (
      <div className="home-page">
        <BackgroundAnimation />
        <header className={`home-header ${headerScrolled ? 'scrolled' : ''}`}>
          <h1 className="home-logo">MovieFlix</h1>
          <nav className="home-nav">
            <span className="home-nav-link active">Home</span>
            <span className="home-nav-link">Movies</span>
            <Link to="/" className="home-signout">Sign Out</Link>
          </nav>
        </header>
        <div className="home-loading">
          <div className="home-loading-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="home-page">
      <BackgroundAnimation />
      <header className={`home-header ${headerScrolled ? 'scrolled' : ''}`}>
        <h1 className="home-logo">MovieFlix</h1>
        <nav className="home-nav">
          <span className="home-nav-link active">Home</span>
          <span className="home-nav-link">Movies</span>
          <div className="home-search-wrap">
            <input
              type="search"
              placeholder="Titles, people, genres"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="home-search-input"
              aria-label="Search"
            />
          </div>
          <Link to="/" className="home-signout">Sign Out</Link>
        </nav>
      </header>

      {error && (
        <div className="home-banner">
          <p>{error}</p>
          <button type="button" className="home-banner-dismiss" onClick={() => setError('')} aria-label="Dismiss">×</button>
        </div>
      )}

      <main className="home-main">
        {searchQuery.trim() ? (
          <section className="home-search-section">
            <h2 className="home-search-title">
              {searching ? 'Searching...' : `Results for "${searchQuery}"`}
            </h2>
            {searchResults.length > 0 ? (
              <div className="netflix-row-wrap">
                <MovieRow title="" movies={searchResults} onMovieClick={setSelectedMovie} />
              </div>
            ) : !searching ? (
              <p className="home-search-empty">No titles found. Try different keywords.</p>
            ) : null}
          </section>
        ) : (
          <>
            <HeroBillboard
              movie={featuredMovie}
              onPlay={setSelectedMovie}
              onInfo={setSelectedMovie}
            />

            <div className="netflix-content">
              <MovieRow title="Originals" movies={originalsList} onMovieClick={setSelectedMovie} />
              <MovieRow title="Popular on MovieFlix" movies={popular} onMovieClick={setSelectedMovie} />
              <MovieRow title="Top Picks for You" movies={topRated} onMovieClick={setSelectedMovie} />
              <MovieRow title="Trending Now" movies={nowPlaying} onMovieClick={setSelectedMovie} />
              <MovieRow title="Kannada • Telugu • Tamil" movies={regionalMovies} onMovieClick={setSelectedMovie} />
              <MovieRow title="Indian Dubbed" movies={dubbedMovies} onMovieClick={setSelectedMovie} />
              <MovieRow title="TV Series" movies={series} onMovieClick={setSelectedMovie} />
              <MovieRow title="Cartoons & Animated" movies={cartoons} onMovieClick={setSelectedMovie} />
              <MovieRow title="Free to Watch (Full Movies)" movies={freeFullMovies} onMovieClick={setSelectedMovie} />
              {netflixShows.length > 0 && (
                <MovieRow title="Netflix Catalog" movies={netflixShows.slice(0, 30)} onMovieClick={setSelectedMovie} />
              )}
              <MovieRow title="More to Explore" movies={moreMovies} onMovieClick={setSelectedMovie} />
            </div>
          </>
        )}
      </main>

      <footer className="home-footer">
        {dataSource === 'demo' && (
          <a
            href="https://www.themoviedb.org/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="home-footer-cta"
          >
            Get real movie data — Free TMDB API key →
          </a>
        )}
        <div className="home-footer-links">
          <a href="#">FAQ</a>
          <a href="#">Help Center</a>
          <a href="#">Account</a>
        </div>
        <p className="home-footer-copy">© MovieFlix</p>
      </footer>

      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  )
}

export default Home
