import { useState } from 'react'
import { Link } from 'react-router-dom'
import { auth } from './firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import './Login.css'
import './ForgotPassword.css'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    if (!auth) {
      setMessage({
        type: 'error',
        text: 'Password reset requires Firebase. Add your config to .env.local (see FIREBASE_SETUP.md). For now, use "Browse movies without signing in" on the login page.'
      })
      setLoading(false)
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      setMessage({
        type: 'success',
        text: 'Password reset email sent! Check your inbox for the reset link.'
      })
      setEmail('')
    } catch (error) {
      let errorText = 'Something went wrong. Please try again.'
      if (error.code === 'auth/user-not-found') {
        errorText = 'No account found with this email address.'
      } else if (error.code === 'auth/invalid-email') {
        errorText = 'Please enter a valid email address.'
      } else if (error.message) {
        errorText = error.message
      }
      setMessage({ type: 'error', text: errorText })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-background" />

      <header className="login-header">
        <Link to="/" className="login-logo-link">
          <h1 className="login-logo">MovieFlix</h1>
        </Link>
      </header>

      <div className="login-card forgot-password-card">
        <h2 className="login-title">Reset Password</h2>
        <p className="forgot-password-subtitle">
          Enter your email address and we'll send you a link to reset your password.
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
              disabled={loading}
            />
          </div>

          {message.text && (
            <div className={`form-message form-message--${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="btn-signin" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="back-to-login">
          <Link to="/">← Back to Sign In</Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword
