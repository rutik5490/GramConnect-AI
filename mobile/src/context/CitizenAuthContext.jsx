import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { saveToken, getToken, clearToken } from '../api/client'
import { citizenAuthApi } from '../api/endpoints'

const CitizenAuthContext = createContext(null)

export function CitizenAuthProvider({ children }) {
  const [citizen, setCitizen] = useState(null)
  const [loading, setLoading] = useState(true)

  const bootstrap = useCallback(async () => {
    const token = await getToken()
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { data } = await citizenAuthApi.me()
      setCitizen(data)
    } catch (e) {
      await clearToken()
      setCitizen(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const requestOtp = (mobileNumber) => citizenAuthApi.requestOtp(mobileNumber)

  const selfRegister = (payload) => citizenAuthApi.selfRegister(payload)

  const verifyOtp = async (mobileNumber, otp) => {
    const { data } = await citizenAuthApi.verifyOtp(mobileNumber, otp)
    await saveToken(data.access_token)
    setCitizen(data.citizen)
    return data.citizen
  }

  const logout = async () => {
    await clearToken()
    setCitizen(null)
  }

  return (
    <CitizenAuthContext.Provider value={{ citizen, loading, requestOtp, selfRegister, verifyOtp, logout }}>
      {children}
    </CitizenAuthContext.Provider>
  )
}

export function useCitizenAuth() {
  const ctx = useContext(CitizenAuthContext)
  if (!ctx) throw new Error('useCitizenAuth must be used within CitizenAuthProvider')
  return ctx
}
