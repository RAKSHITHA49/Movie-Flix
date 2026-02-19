import { useState } from 'react'
import { getPosterUrl, getPlaceholderPosterUrl } from '../api/tmdb'
import './MovieCard.css'

function MovieCard({ movie, onClick }) {
  const [imgErrorCount, setImgErrorCount] = useState(0)
  const displayTitle = movie.title || movie.name || ''
  // 0: real poster, 1: placehold.co fallback (always loads, shows title)
  const posterUrl = imgErrorCount === 0
    ? getPosterUrl(movie.poster_path, movie.id)
    : getPlaceholderPosterUrl(displayTitle)
  const rating = movie.vote_average?.toFixed(1) ?? '—'
  const year = (movie.release_date || movie.first_air_date)?.slice(0, 4) ?? ''

  return (
    <article className="movie-card" onClick={() => onClick?.(movie)} role="button" tabIndex={0}>
      <div className="movie-card-poster">
        <img
          src={posterUrl}
          alt={displayTitle}
          loading="lazy"
          onError={() => setImgErrorCount((c) => Math.min(c + 1, 1))}
        />
        <div className="movie-card-overlay">
          <span className="movie-card-rating">★ {rating}</span>
          {movie.overview && (
            <p className="movie-card-overview">{movie.overview}</p>
          )}
        </div>
      </div>
      <div className="movie-card-info">
        <h3 className="movie-card-title">{displayTitle}</h3>
        {year && <span className="movie-card-year">{year}</span>}
      </div>
    </article>
  )
}

export default MovieCard
