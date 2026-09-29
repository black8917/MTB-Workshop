# Bike Workshop PWA — v0.1

Installable, offline-first iPhone PWA for the 2026 Santa Cruz Bullit.

## What is in v0.1

- Garmin-inspired Bullit dashboard with current fork, shock, tire and bike setup in one glanceable area.
- Full HSC / LSC / HSR / LSR values; suspension clicks are counted **OUT from fully closed**.
- New Ride prefilled from the current setup.
- Dedicated After Ride notes: overall feel, travel used, bottom-out, grip/support/chatter, what worked, what didn't and next test.
- Ride/setup history seeded from the Bullit setup note.
- FOX / Santa Cruz baseline comparison UI. Unverified bike-specific suspension values remain blank rather than being guessed.
- Interactive To Do list and maintenance history.
- 2026 Bullit GX Large build / geometry reference.
- Searchable common torque specifications.
- Component service reference, starting with the FOX 38 GRIP X2 lower-leg service.
- IndexedDB local data storage.
- Offline service-worker cache.
- JSON Export / Import backup.
- Home Screen PWA manifest and app icons.
- Supreme V5 and Nomad are intentionally left as future bike tabs until the Bullit workflow is approved.

## Run locally on Linux

A service worker needs HTTP/HTTPS; do not open `index.html` with a `file://` URL.

```bash
cd BikeWorkshop_PWA_v0.1
python3 -m http.server 8080
```

Then open `http://localhost:8080` on the Linux machine.

## Put it on the iPhone

The iPhone needs an HTTPS URL. GitHub Pages is an easy free option:

1. Create a **private or public** GitHub repository for the project. (GitHub Pages availability for private repositories depends on the GitHub plan.)
2. Copy the contents of this folder into the repository root.
3. Commit and push to the `main` branch.
4. In GitHub: **Settings → Pages → Source → GitHub Actions**.
5. The included `.github/workflows/pages.yml` deploys the site.
6. Open the resulting `https://...github.io/.../` address in **Safari on the iPhone**.
7. Tap **Share → Add to Home Screen → Add**.
8. Launch **Bike Workshop** from the new Home Screen icon once while online. After the service worker caches the app shell, the core app works offline.

## Data / backup behavior

Ride, To Do and maintenance data stay in IndexedDB on the current browser/device. Use **Service → App & backup → Export backup** periodically. Import replaces the local Bike Workshop data with the selected backup.

Clearing Safari website data can remove the local database, which is why JSON backup is included from the first PWA build.

## Developer notes

This version intentionally has **no build tool or external JavaScript dependencies**. That makes it easy to develop on Linux, host on any static HTTPS service, and keep the entire app available offline. The data model is kept simple enough to migrate later to SwiftData if a native iOS version becomes worthwhile.
