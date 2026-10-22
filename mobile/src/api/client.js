import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'

export const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000'

const TOKEN_KEY = 'gc_citizen_token'

const client = axios.create({ baseURL: API_BASE_URL })

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function saveToken(token) {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export default client
