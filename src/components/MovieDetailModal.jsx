import { useState, useEffect } from 'react'
import { getPosterUrl } from '../api/tmdb'
import { fetchMovieDetails, fetchMovieVideos } from '../api/tmdb'
import { demoTrailers } from '../data/demoTrailers'
import './MovieDetailModal.css'

function MovieDetailModal({ movie, onClose }) {
  const [details, setDetails] = useState(null)
  const [trailerKey, setTrailerKey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [playingTrailer, setPlayingTrailer] = useState(false)
  const [playingFullMovie, setPlayingFullMovie] = useState(false)

  const fullMovieId = movie?.youtubeId

  const hasTmdbKey = !!import.meta.env.VITE_TMDB_API_KEY
  const isOmdbMovie = typeof movie?.id === 'string' && movie.id.startsWith('tt')
  const title = (details?.title || movie?.title || movie?.name || '').trim()
  const trailerUrl = trailerKey
    ? `https://www.youtube.com/watch?v=${trailerKey}`
    : title
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' official trailer')}`
      : null

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!movie) return

      if (movie.youtubeId) {
        setDetails({ ...movie, runtime: movie.runtime || 90 })
        setTrailerKey(movie.trailerYoutubeId || null)
        if (!cancelled) setLoading(false)
        return
      }

      const trailer = demoTrailers[movie.id] ?? demoTrailers[String(movie.id)] ?? null
      if (isOmdbMovie) {
        setDetails({ ...movie, runtime: movie.runtime || 148 })
        setTrailerKey(trailer)
        if (!cancelled) setLoading(false)
        return
      }

      if (!hasTmdbKey) {
        setTrailerKey(trailer)
        setDetails({ ...movie, runtime: movie.runtime || 148 })
        setLoading(false)
        return
      }

      try {
        const [movieDetails, videoData] = await Promise.all([
          fetchMovieDetails(movie.id),
          fetchMovieVideos(movie.id),
        ])
        if (!cancelled) {
          setDetails(movieDetails)
          setTrailerKey(videoData?.key || trailer)
        }
      } catch {
        if (!cancelled) {
          setDetails({ ...movie, runtime: 148 })
          setTrailerKey(trailer)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [movie, hasTmdbKey, isOmdbMovie])

  const formatRuntime = (mins) => {
    if (!mins) return '—'
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m ? `${h}h ${m}m` : `${h}h`
  }

  if (!movie) return null

  return (
    <div className="movie-modal-overlay" onClick={onClose}>
      <div className="movie-modal" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          className="movie-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {loading ? (
          <div className="movie-modal-loading">Loading...</div>
        ) : (
          <>
            <div className="movie-modal-header">
              <div
                className="movie-modal-poster"
                style={{ backgroundImage: `url(${getPosterUrl(details?.poster_path || movie.poster_path, movie.id)})` }}
              />
              <div className="movie-modal-info">
                <h2>{details?.title || movie.title}</h2>
                <div className="movie-modal-meta">
                  <span>★ {(details?.vote_average ?? movie.vote_average)?.toFixed(1)}</span>
                  <span>{details?.release_date?.slice(0, 4) || movie.release_date?.slice(0, 4)}</span>
                  <span>{formatRuntime(details?.runtime)}</span>
                </div>
                <p className="movie-modal-overview">{details?.overview || movie.overview}</p>
                <div className="movie-modal-actions">
                  {trailerKey ? (
                    <button type="button" className="btn-play" onClick={() => { setPlayingFullMovie(false); setPlayingTrailer(true); }}>
                      ▶ Trailer
                    </button>
                  ) : trailerUrl ? (
                    <a href={trailerUrl} target="_blank" rel="noopener noreferrer" className="btn-play">
                      ▶ Trailer
                    </a>
                  ) : null}
                  {fullMovieId ? (
                    <button type="button" className="btn-play" onClick={() => { setPlayingTrailer(false); setPlayingFullMovie(true); }}>
                      ▶ Full Video
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {playingTrailer && trailerKey && (
              <div className="movie-modal-video">
                <iframe
                  title="Trailer"
                  src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
                <a href={trailerUrl} target="_blank" rel="noopener noreferrer" className="movie-modal-fallback-link">
                  Video not playing? Open in YouTube →
                </a>
                <button type="button" className="btn-stop-overlay" onClick={() => setPlayingTrailer(false)}>
                  ✕ Close
                </button>
              </div>
            )}

            {playingFullMovie && fullMovieId && (
              <div className="movie-modal-video movie-modal-fullscreen">
                <div className="movie-modal-duration-badge">Full Movie • Free to watch</div>
                <iframe
                  title="Full Movie"
                  src={`https://www.youtube-nocookie.com/embed/${fullMovieId}?autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
                <a href={`https://www.youtube.com/watch?v=${fullMovieId}`} target="_blank" rel="noopener noreferrer" className="movie-modal-fallback-link">
                  Video not playing? Open in YouTube →
                </a>
                <button type="button" className="btn-stop-overlay" onClick={() => setPlayingFullMovie(false)}>
                  ✕ Close
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default MovieDetailModal
