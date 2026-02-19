// Kaggle Millions of Movies dataset - populated by: npm run import-kaggle -- path/to/movies.csv
import kaggleData from './kaggleMovies.json'

export const kaggleMovies = Array.isArray(kaggleData) ? kaggleData : []
