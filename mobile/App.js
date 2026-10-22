import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { CitizenAuthProvider } from './src/context/CitizenAuthContext'
import AppNavigator from './src/navigation/AppNavigator'

export default function App() {
  return (
    <CitizenAuthProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </CitizenAuthProvider>
  )
}
