import { useRef } from 'react'
import MovieCard from './MovieCard'
import './MovieRow.css'

function MovieRow({ title, movies, onMovieClick }) {
  const scrollRef = useRef(null)

  const scroll = (direction) => {
    if (!scrollRef.current) return
    const amount = 280
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  if (!movies?.length) return null

  return (
    <section className="movie-row">
      <div className="movie-row-header">
        {title && <h2 className="movie-row-title">{title}</h2>}
        <div className="movie-row-arrows">
          <button
            type="button"
            className="movie-row-arrow"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            ‹
          </button>
          <button
            type="button"
            className="movie-row-arrow"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>
      </div>
      <div className="movie-row-scroll" ref={scrollRef}>
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onClick={onMovieClick} />
        ))}
      </div>
    </section>
  )
}

export default MovieRow
