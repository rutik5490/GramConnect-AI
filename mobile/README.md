# GramConnect AI — Citizen Mobile App

A React Native (Expo) app for citizens: register/track complaints, chat with the AI
assistant, view announcements, and check government scheme eligibility. It talks to the
**same backend** as the staff web dashboard — there is one FastAPI server and one
database behind both.

---

## How it integrates with the web dashboard (read this first)

There is **one backend** (`/backend`) and **two frontends**:

```
                        ┌─────────────────────┐
                        │   FastAPI backend    │
                        │   (one server,       │
                        │    one Postgres DB)  │
                        └──────────┬───────────┘
                    ┌──────────────┴──────────────┐
                    │                              │
         ┌──────────▼──────────┐        ┌──────────▼──────────┐
         │   Web Dashboard      │        │   Citizen Mobile App │
         │   (staff/admins)     │        │   (citizens)         │
         │   /api/auth/*        │        │   /api/citizen/*     │
         │   JWT: staff login   │        │   JWT: mobile+OTP    │
         └──────────────────────┘        └──────────────────────┘
```

- **Staff** (Panchayat Admin, Gram Sevak, Sarpanch, etc.) log into the **web dashboard**
  with email + password, hitting `/api/auth/*` and the staff routers (`/api/citizens`,
  `/api/complaints`, `/api/campaigns`, etc.) — this is what you already have.
- **Citizens** log into this **mobile app** with mobile number + OTP, hitting a
  separate set of endpoints under `/api/citizen/*`.
- Both sets of endpoints read and write the **same database tables**. When a citizen
  files a complaint in the app, it's the exact same `Complaint` row a Gram Sevak sees
  and updates in the web dashboard's Complaints board — no sync step, no delay.
- The two logins are kept deliberately separate and **cannot cross over**: a citizen's
  token is tagged `type: citizen` and is rejected by every staff endpoint, and a staff
  token is rejected by every citizen endpoint. This means a citizen can never see other
  citizens' data or staff tools, even by accident.

So integration isn't something you "set up" — it's structural. Both apps are already
talking to the same backend; you just need to run that backend somewhere reachable by
both your browser (dashboard) and your phone (app).

---

## What's in the app

- **Onboarding:** pick your Gram Panchayat → enter mobile number → OTP → (auto-registers
  if the number isn't already a known citizen, asking for name + ward)
- **Home:** quick actions + recent announcements
- **My Complaints:** file a new complaint (AI auto-classifies it), track status live
- **AI Assistant:** the same conversational assistant as the inbound IVR line, as an
  in-app chat
- **Schemes:** government schemes the citizen is currently eligible for
- **Announcements:** Panchayat-wide notices
- **Profile:** citizen details + sign out

---

## Running it

### 1. Make sure the backend is running and reachable
Follow `/backend`'s setup (Docker or manual). The backend must be reachable from your
**phone**, not just your laptop — see `CONFIG.md` for the LAN IP detail.

### 2. Point the app at your backend
Edit `app.json` → `expo.extra.apiBaseUrl` (see `CONFIG.md`).

### 3. Install and run
```bash
cd mobile
npm install
npx expo start
```
This prints a QR code.
- **On your phone:** install the **Expo Go** app (Play Store / App Store), then scan the
  QR code. The app loads directly — no build step needed for development.
- **On an emulator:** press `a` (Android emulator) or `i` (iOS simulator) in the terminal
  running `expo start`.

### 4. Try it end-to-end
1. Pick "Wagholi Gram Panchayat" (seeded demo data)
2. Enter one of the seeded citizens' numbers, e.g. `9812345601`
3. **Check your backend terminal/logs** — the OTP is printed there (see "About OTP" below)
4. Enter that OTP, and you're in
5. File a complaint in the app → open the web dashboard's Complaints board as staff
   (`admin@wagholi.gov.in` / `Password@123`) → the complaint is already there

---

## About OTP delivery

The pilot build **does not send real SMS** — it logs the OTP to the backend console
instead (search for `[SMS SIMULATED]` in the backend logs). This means you can test the
whole flow for free, with no SMS provider account.

To send real OTPs, open `backend/app/services/otp_service.py` and replace the body of
`_send_sms()` with a real provider call (MSG91 is common for Indian mobile numbers;
Twilio is another option). Nothing else needs to change — every router already calls
this one function.

---

## Building a real installable app (production)

Development via Expo Go (above) is enough for testing and demos. When you're ready to
distribute an actual APK/IPA to real citizens:

```bash
npm install -g eas-cli
eas login
eas build --platform android   # or ios
```
This uses Expo's build service (EAS) to produce an installable app file. You'll need a
free (or paid, for iOS/App Store) Expo account. See https://docs.expo.dev/build/setup/
for the current step-by-step — Expo's tooling changes fairly often, so check their docs
for the latest flags and requirements at build time.

---

## Project structure

```
mobile/
├── App.js                        # Entry point
├── app.json                      # Expo config (app name, icons, apiBaseUrl)
├── src/
│   ├── api/                      # axios client + endpoint helpers
│   ├── components/                # AshokaChakra, TricolorStrip, ui.jsx (buttons/cards/inputs)
│   ├── context/CitizenAuthContext.jsx   # OTP login state, token storage
│   ├── navigation/                # AppNavigator (auth vs main app), MainTabs (bottom tabs)
│   ├── screens/                   # One file per screen
│   ├── theme/colors.js            # Same Digital India palette as the web dashboard
│   └── utils/storage.js           # SecureStore wrapper
```
