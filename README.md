# PBS Inventory – collaborative desktop app

Live team sync (Firestore) + Windows .exe with auto-update (Electron + GitHub Releases).

## 1. Firebase (5 min, free tier)
1. console.firebase.google.com → create project → add a **Web app** → copy the config into `app/firebase-config.js`.
2. Build → **Firestore Database** → create → paste `firestore.rules` in the Rules tab.
3. Build → **Authentication** → Sign-in method → enable **Anonymous**.

## 2. Test locally
    npm install
    npm start

## 3. Build the .exe
- Local (Windows): `npm run dist` → installer in `dist/`.
- Automatic: put this folder in a GitHub repo (edit `owner`/`repo` in package.json), then
      git tag v1.0.0 && git push --tags
  GitHub Actions builds the installer and publishes it as a Release.
- Share the `.exe` once. Afterwards, bump `version` in package.json, push a new tag, and every
  installed copy downloads the update when it has internet (checked at launch, every 15 min,
  and when the connection returns). It installs when the app is closed.

## How collaboration works
- Notes / "removed" flags: synced per PO in real time.
- Uploading an Excel: replaces the shared inventory for everyone (last upload wins).
- Users and roles: shared across all installs.
- Offline: edits are cached and pushed automatically when internet returns.

## Known limits
- Unsigned .exe shows Windows SmartScreen; a code-signing certificate removes it.
- Auto-update needs a public repo (or a token/own server for private).
- Logins are still the dashboard's own SHA-256 users; Firebase rules only require an anonymous session.
  For real security, migrate to Firebase Auth (email/password) as a next step.
