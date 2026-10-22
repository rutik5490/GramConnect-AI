import * as SecureStore from 'expo-secure-store'

// Thin wrapper so the rest of the app can use a familiar getItem/setItem API
// without depending on @react-native-async-storage/async-storage as well.
const storage = {
  async getItem(key) {
    return SecureStore.getItemAsync(key)
  },
  async setItem(key, value) {
    return SecureStore.setItemAsync(key, value)
  },
  async removeItem(key) {
    return SecureStore.deleteItemAsync(key)
  },
}

export default storage
