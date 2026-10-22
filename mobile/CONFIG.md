# Pointing the app at your backend

Edit `app.json` → `expo.extra.apiBaseUrl`:

```json
"extra": {
  "apiBaseUrl": "http://192.168.1.42:8000"
}
```

**Important:** `localhost` will NOT work when testing on a physical phone via Expo Go —
your phone can't reach "localhost" on your laptop. Use your computer's LAN IP address instead
(run `ipconfig` on Windows / `ifconfig` or `ip addr` on Mac/Linux to find it), and make sure
your phone is on the same Wi-Fi network as your computer.

For production builds, point this at your deployed backend's public URL instead.
