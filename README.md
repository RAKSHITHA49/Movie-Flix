# MovieFlix

Netflix-style movie app with Firebase auth. Browse movies, TV series, cartoons, free full films, and Indian dubbed content.

## Quick Start

```bash
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Setup (Optional)

### Real Movie Data

Add API keys to `.env.local` (copy from `.env.example`):

**TMDB** (recommended): [themoviedb.org](https://www.themoviedb.org/) → Sign up → API → Copy key  
```
VITE_TMDB_API_KEY=your-key
```

**OMDb** (alternative): [omdbapi.com](https://www.omdbapi.com/) → Get API key  
```
VITE_OMDB_API_KEY=your-key
```

### Firebase Auth (Login, Google, Forgot Password)

1. [Firebase Console](https://console.firebase.google.com/) → Create project
2. Go to **Authentication** → **Sign-in method** → Enable **Email/Password** and **Google**
3. Add a web app (Project Settings → Your apps) → Copy config to `.env.local`:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Kaggle / Netflix Datasets

**Kaggle Millions of Movies:**
```bash
npm run import-kaggle -- path/to/movies.csv
```

**Netflix Shows:**
```bash
npm run import-netflix -- path/to/netflix_titles.csv
```

---

## Troubleshooting

- **Connection failed:** Run `npm run dev` and open http://localhost:5173
- **APIs blocked:** Remove API keys from `.env.local` to use demo data
- **Import:** Use full path to CSV, e.g. `"C:\Users\Name\Downloads\netflix-shows\netflix_titles.csv"`
