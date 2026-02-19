import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { auth, googleProvider } from './firebase'
import { signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import './Login.css'

const DEMO_STORAGE_KEY = 'movieflix_demo_user'

function demoHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h = h & h
  }
  return String(h)
}

function handleDemoAuth(isSignUp, email, password, confirmPassword) {
  const stored = localStorage.getItem(DEMO_STORAGE_KEY)
  if (isSignUp) {
    if (password !== confirmPassword) return { ok: false, error: 'Passwords do not match.' }
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }
    const cred = { email: email.trim().toLowerCase(), h: demoHash(email.trim().toLowerCase() + password) }
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(cred))
    return { ok: true }
  }
  // Sign in
  if (!stored) return { ok: false, error: 'No account found. Sign up first.' }
  try {
    const cred = JSON.parse(stored)
    const enteredHash = demoHash(email.trim().toLowerCase() + password)
    if (cred.email !== email.trim().toLowerCase() || cred.h !== enteredHash) {
      return { ok: false, error: 'Invalid email or password.' }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Invalid email or password.' }
  }
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const fromSignupRoute = location.pathname === '/signup'
  const [isSignUp, setIsSignUp] = useState(fromSignupRoute)

  useEffect(() => {
    setIsSignUp(fromSignupRoute)
  }, [fromSignupRoute])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  // Handle redirect result when user returns from Google sign-in
  useEffect(() => {
    if (!auth) return
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          navigate('/home')
        }
      })
      .catch((err) => {
        if (err.code !== 'auth/popup-closed-by-user') {
          setError(err.message || 'Google sign-in failed.')
        }
      })
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!auth) {
      const result = handleDemoAuth(isSignUp, email, password, confirmPassword)
      if (result.ok) {
        navigate('/home')
      } else {
        setError(result.error)
      }
      return
    }
    if (isSignUp) {
      // Sign up: create new account
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      try {
        await createUserWithEmailAndPassword(auth, email, password)
        navigate('/home')
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          setError('This email is already registered. Sign in with your password.')
        } else {
          setError(err.message || 'Sign-up failed. Please try again.')
        }
      }
    } else {
      // Sign in: use same email and password
      try {
        await signInWithEmailAndPassword(auth, email, password)
        navigate('/home')
      } catch (err) {
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          setError('Invalid email or password.')
        } else if (err.code === 'auth/user-not-found') {
          setError('No account found. Sign up first to create an account.')
        } else {
          setError(err.message || 'Sign-in failed. Please try again.')
        }
      }
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setGoogleLoading(true)
    
    if (!auth) {
      setGoogleLoading(false)
      navigate('/home')
      return
    }

    try {
      const result = await signInWithPopup(auth, googleProvider)
      navigate('/home')
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled.')
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Signing in with redirect...')
        await signInWithRedirect(auth, googleProvider)
      } else {
        setError(err.message || 'Google sign-in failed. Please try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Blurred background */}
      <div className="login-background" />

      {/* Header with logo */}
      <header className="login-header">
        <Link to="/" className="login-logo-link">
          <h1 className="login-logo">MovieFlix</h1>
        </Link>
      </header>

      {/* Login form card */}
      <div className="login-card">
        {/* Tab: Log In vs Sign Up */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${!isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(false); setError(''); }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`login-tab ${isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(true); setError(''); }}
          >
            Sign Up
          </button>
        </div>
        <p className="login-subtitle">
          {isSignUp
            ? 'Create a new account to get started.'
            : 'Sign in to your existing account.'}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={isSignUp ? 'Create a password (min 6 characters)' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {isSignUp && (
            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required={isSignUp}
              />
            </div>
          )}

          {!isSignUp && (
            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
            </div>
          )}

          {error && <div className="form-message form-message--error">{error}</div>}

          <button type="submit" className="btn-signin">
            {isSignUp ? 'Create Account' : 'Log In'}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="btn-google"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? 'Signing in...' : 'Continue with Gmail'}
        </button>

        <p className="signup-prompt">
          {isSignUp ? (
            <>Already have an account? <button type="button" className="login-switch-link" onClick={() => { setIsSignUp(false); setError(''); }}>Log in</button></>
          ) : (
            <>First time here? <button type="button" className="login-switch-link" onClick={() => { setIsSignUp(true); setError(''); }}>Sign up</button></>
          )}
        </p>
        <p className="browse-prompt">
          <Link to="/home">Browse movies without signing in →</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
