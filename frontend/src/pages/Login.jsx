import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AshokaChakra from '../components/AshokaChakra'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@wagholi.gov.in')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-navy-dark relative overflow-hidden">
      <div className="tricolor-strip" />

      {/* Watermark chakra */}
      <AshokaChakra
        size={520}
        color="#FFFFFF"
        className="absolute opacity-[0.04] -right-40 -bottom-40 pointer-events-none"
      />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <AshokaChakra size={56} color="#FF9933" className="mx-auto mb-4" />
            <h1 className="font-display text-2xl text-white">GramConnect AI</h1>
            <p className="text-white/60 text-sm mt-1">AI-Powered Voice Governance Platform for Gram Panchayats</p>
          </div>

          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="tricolor-strip" />
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <h2 className="font-display text-xl text-navy-dark">Sign in</h2>
                <p className="text-sm text-muted mt-1">Access your Panchayat governance dashboard</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-hairline rounded-lg px-3 py-2.5 text-sm focus:border-navy outline-none"
                  placeholder="you@panchayat.gov.in"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-hairline rounded-lg px-3 py-2.5 text-sm focus:border-navy outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-navy-dark transition-colors disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>

              <p className="text-xs text-muted text-center pt-2">
                Demo login: <span className="font-mono">admin@wagholi.gov.in</span> / <span className="font-mono">Password@123</span>
              </p>
            </form>
          </div>

          <p className="text-center text-white/40 text-xs mt-6">
            GramConnect AI &middot; A digital governance initiative for Gram Panchayats, Maharashtra
          </p>
        </div>
      </div>
    </div>
  )
}
