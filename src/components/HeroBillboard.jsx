import { getPosterUrl, getBackdropUrl } from '../api/tmdb'
import './HeroBillboard.css'

function HeroBillboard({ movie, onPlay, onInfo }) {
  if (!movie) return null

  const bgUrl = getBackdropUrl(movie.backdrop_path) || getPosterUrl(movie.poster_path, movie.id)
  const year = movie.release_date?.slice(0, 4) ?? ''

  return (
    <section
      className="hero-billboard"
      style={{ backgroundImage: `linear-gradient(to top, #141414 0%, transparent 50%, rgba(0,0,0,0.4) 100%), url(${bgUrl})` }}
    >
      <div className="hero-billboard-content">
        <h1 className="hero-billboard-title">{movie.title}</h1>
        <p className="hero-billboard-meta">
          <span className="hero-billboard-year">{year}</span>
          <span className="hero-billboard-dot">•</span>
          <span className="hero-billboard-rating">★ {movie.vote_average?.toFixed(1) ?? '—'}</span>
        </p>
        <p className="hero-billboard-description">
          {movie.overview?.slice(0, 200)}{movie.overview?.length > 200 ? '...' : ''}
        </p>
        <div className="hero-billboard-actions">
          <button className="hero-btn-play" onClick={() => onPlay?.(movie)}>
            ▶ Play
          </button>
          <button className="hero-btn-info" onClick={() => onInfo?.(movie)}>
            ℹ More Info
          </button>
        </div>
      </div>
    </section>
  )
}

export default HeroBillboard
