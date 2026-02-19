/**
 * Import Kaggle Netflix Shows dataset into MovieFlix
 *
 * Dataset: https://www.kaggle.com/datasets/shivamb/netflix-shows
 *
 * Usage:
 *   1. Download from Kaggle (Sign in → Download → Extract)
 *   2. Run: npm run import-netflix -- path/to/netflix_titles.csv
 *
 * CSV columns: show_id, type, title, director, cast, country, date_added, release_year, rating, duration, listed_in, description
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = path.join(__dirname, '../src/data/netflixShows.json')
const MAX_ITEMS = 8000

function parseCSVLine(line, delim = ',') {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (c === delim && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''))
      current = ''
    } else {
      current += c
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''))
  return result
}

function mapRow(values, headers) {
  const get = (key) => {
    const normKey = key.toLowerCase().replace(/[\s-]/g, '_')
    const i = headers.findIndex((h) => h.toLowerCase().replace(/[\s-]/g, '_') === normKey)
    return i >= 0 && values[i] !== undefined ? String(values[i] || '').trim() : ''
  }

  const showId = get('show_id') || get('id')
  const title = get('title') || get('name')
  if (!title) return null

  const type = get('type') || 'Movie'
  const releaseYear = get('release_year')
  const description = get('description') || get('overview')
  const duration = get('duration')
  const contentRating = get('rating')
  const genres = get('listed_in')

  let releaseDate = ''
  if (releaseYear && /^\d{4}$/.test(String(releaseYear))) {
    releaseDate = `${releaseYear}-01-01`
  }

  let runtime = null
  if (duration) {
    const mins = duration.match(/(\d+)\s*min/i)
    if (mins) runtime = parseInt(mins[1], 10)
    else if (/^\d+$/.test(duration)) runtime = parseInt(duration, 10)
  }

  const overview = [description, genres].filter(Boolean).join(' • ') || ''

  return {
    id: showId || `nf-${Math.random().toString(36).slice(2, 9)}`,
    title: String(title).slice(0, 200),
    overview: overview.slice(0, 500) || '',
    release_date: releaseDate,
    vote_average: null,
    poster_path: null,
    runtime: runtime || (type === 'Movie' ? 90 : 45),
    type: type,
    duration: duration || '',
    rating: contentRating || '',
  }
}

async function importCSV(csvPath) {
  const absolutePath = path.resolve(process.cwd(), csvPath)
  if (!fs.existsSync(absolutePath)) {
    console.error('File not found:', absolutePath)
    console.error('\nDownload the dataset from: https://www.kaggle.com/datasets/shivamb/netflix-shows')
    process.exit(1)
  }

  console.log('Reading', absolutePath)
  const content = fs.readFileSync(absolutePath, 'utf-8')
  const lines = content.split(/\r?\n/).filter((l) => l.trim())

  if (lines.length < 2) {
    console.error('CSV has no data rows')
    process.exit(1)
  }

  const headerLine = lines[0]
  const delimiter = headerLine.includes('\t') ? '\t' : ','
  const headers = parseCSVLine(headerLine, delimiter)

  console.log('Detected columns:', headers)

  const items = []
  for (let i = 1; i < lines.length && items.length < MAX_ITEMS; i++) {
    const values = parseCSVLine(lines[i], delimiter)
    const item = mapRow(values, headers)
    if (item && item.title) items.push(item)
  }

  // Sort by release_year desc (newer first), then title
  items.sort((a, b) => {
    const yA = a.release_date?.slice(0, 4) || '0'
    const yB = b.release_date?.slice(0, 4) || '0'
    if (yB !== yA) return yB.localeCompare(yA)
    return (a.title || '').localeCompare(b.title || '')
  })

  const output = items.slice(0, MAX_ITEMS)
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`Imported ${output.length} titles to ${OUTPUT_PATH}`)
  const movies = output.filter((m) => (m.type || '').toLowerCase().includes('movie')).length
  const series = output.filter((m) => (m.type || '').toLowerCase().includes('tv')).length
  console.log(`  Movies: ${movies}  |  TV Shows: ${series}`)
}

const csvPath = process.argv[2] || 'netflix_titles.csv'
importCSV(csvPath).catch((err) => {
  console.error(err)
  process.exit(1)
})
