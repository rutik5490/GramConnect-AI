import React, { createContext, useContext, useState, useCallback } from 'react'
import { authApi, panchayatApi } from '../api/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('gc_user')
    return stored ? JSON.parse(stored) : null
  })
  const [panchayat, setPanchayat] = useState(null)
  const [loading, setLoading] = useState(true)

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem('gc_token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { data } = await authApi.me()
      setUser(data)
      localStorage.setItem('gc_user', JSON.stringify(data))
      if (data.panchayat_id) {
        const { data: panchayats } = await panchayatApi.list()
        const p = panchayats.find((p) => p.id === data.panchayat_id)
        setPanchayat(p || null)
      }
    } catch (e) {
      localStorage.removeItem('gc_token')
      localStorage.removeItem('gc_user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const login = async (email, password) => {
    const { data } = await authApi.login(email, password)
    localStorage.setItem('gc_token', data.access_token)
    localStorage.setItem('gc_user', JSON.stringify(data.user))
    setUser(data.user)
    if (data.user.panchayat_id) {
      const { data: panchayats } = await panchayatApi.list()
      const p = panchayats.find((p) => p.id === data.user.panchayat_id)
      setPanchayat(p || null)
    }
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('gc_token')
    localStorage.removeItem('gc_user')
    setUser(null)
    setPanchayat(null)
  }

  return (
    <AuthContext.Provider value={{ user, panchayat, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
