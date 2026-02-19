// Kaggle Netflix Shows dataset - populated by: npm run import-netflix -- path/to/netflix_titles.csv
// Dataset: https://www.kaggle.com/datasets/shivamb/netflix-shows
import netflixData from './netflixShows.json'

export const netflixShows = Array.isArray(netflixData) ? netflixData : []
