/**
 * Import Kaggle Millions of Movies dataset into MovieFlix
 * 
 * Usage:
 *   1. Download from https://www.kaggle.com/datasets/akshaypawar7/millions-of-movies
 *   2. Extract the CSV file
 *   3. Run: node scripts/importKaggleMovies.js path/to/movies.csv
 * 
 * Or with npm: npm run import-kaggle -- path/to/movies.csv
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500'
const MAX_MOVIES = 8000 // Limit for app performance
const OUTPUT_PATH = path.join(__dirname, '../src/data/kaggleMovies.json')

// Flexible column mapping - auto-detect common Kaggle dataset formats
const COLUMN_ALIASES = {
  id: ['id', 'tmdb_id', 'movie_id', 'imdb_id'],
  title: ['title', 'original_title', 'name', 'movie_title'],
  overview: ['overview', 'description', 'plot', 'tagline'],
  release_date: ['release_date', 'date', 'year', 'release_year'],
  vote_average: ['vote_average', 'rating', 'vote_mean', 'score', 'imdb_rating'],
  popularity: ['popularity', 'votes', 'vote_count'],
  poster_path: ['poster_path', 'poster', 'poster_url', 'image', 'img_url'],
  backdrop_path: ['backdrop_path', 'backdrop'],
  runtime: ['runtime', 'duration', 'movie_runtime'],
}

function findColumn(row, aliases) {
  const keys = Object.keys(row).map((k) => k.toLowerCase().trim())
  for (const alt of aliases) {
    const found = keys.find((k) => k === alt || k.includes(alt.replace('_', '')))
    if (found) return Object.keys(row).find((k) => k.toLowerCase().trim() === found)
  }
  return null
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  result.push(current.trim())
  return result
}

function mapRow(row, colMap) {
  const id = colMap.id ? row[colMap.id] : null
  const title = colMap.title ? row[colMap.title] : ''
  if (!id && !title) return null

  let poster = colMap.poster_path ? row[colMap.poster_path] : ''
  if (poster && poster.startsWith('/') && !poster.startsWith('http')) {
    poster = TMDB_IMG + poster
  }

  let date = colMap.release_date ? row[colMap.release_date] : ''
  if (date && /^\d{4}$/.test(String(date))) date = `${date}-01-01`

  let rating = colMap.vote_average ? parseFloat(row[colMap.vote_average]) : null
  if (isNaN(rating)) rating = null

  let runtime = colMap.runtime ? parseInt(row[colMap.runtime], 10) : null
  if (isNaN(runtime)) runtime = null

  const popularity = colMap.popularity ? parseFloat(row[colMap.popularity]) || 0 : 0

  return {
    id: isNaN(parseInt(id, 10)) ? id : parseInt(id, 10),
    title: String(title || 'Untitled').slice(0, 200),
    poster_path: poster || null,
    backdrop_path: colMap.backdrop_path && row[colMap.backdrop_path]
      ? (row[colMap.backdrop_path].startsWith('http') ? row[colMap.backdrop_path] : 'https://image.tmdb.org/t/p/w1280' + row[colMap.backdrop_path])
      : null,
    vote_average: rating,
    release_date: date ? String(date).slice(0, 10) : '',
    overview: (colMap.overview ? row[colMap.overview] : '')?.slice(0, 500) || '',
    runtime,
    popularity,
  }
}

async function importCSV(csvPath) {
  const absolutePath = path.resolve(process.cwd(), csvPath)
  if (!fs.existsSync(absolutePath)) {
    console.error('File not found:', absolutePath)
    process.exit(1)
  }

  console.log('Reading', absolutePath)
  const content = fs.readFileSync(absolutePath, 'utf-8')
  const lines = content.split(/\r?\n/).filter((l) => l.trim())

  if (lines.length < 2) {
    console.error('CSV has no data rows')
    process.exit(1)
  }

  const headers = parseCSVLine(lines[0])
  const colMap = {}
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const header = headers.find((h) =>
      aliases.some((a) => h.toLowerCase().replace(/-/g, '_').includes(a.toLowerCase()))
    )
    if (header) colMap[field] = header
  }
  console.log('Detected columns:', colMap)

  // Build index by header name for row lookup
  const getRowObj = (values) => {
    const obj = {}
    headers.forEach((h, i) => { obj[h] = values[i] ?? '' })
    return obj
  }

  const movies = []
  for (let i = 1; i < lines.length && movies.length < MAX_MOVIES; i++) {
    const values = parseCSVLine(lines[i])
    const row = getRowObj(values)
    const movie = mapRow(row, colMap)
    if (movie && movie.title) movies.push(movie)
  }

  // Sort by rating then popularity
  movies.sort((a, b) => {
    const rA = a.vote_average || 0
    const rB = b.vote_average || 0
    if (rB !== rA) return rB - rA
    return (b.popularity || 0) - (a.popularity || 0)
  })

  const output = movies.slice(0, MAX_MOVIES)
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`Imported ${output.length} movies to ${OUTPUT_PATH}`)
}

const csvPath = process.argv[2] || 'movies.csv'
importCSV(csvPath).catch((err) => {
  console.error(err)
  process.exit(1)
})
