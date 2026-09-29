# Bike Workshop — iPhone-only GitHub Pages setup

1. In Safari, go to github.com and sign in.
2. Create a new repository named `bike-workshop`. Public is simplest for GitHub Pages; private Pages availability depends on your GitHub plan.
3. Open the repository, choose **Add file → Upload files**.
4. Upload every file from this folder to the repository root. There are no subfolders in this phone-ready bundle.
5. Commit the files to the `main` branch.
6. In the repository open **Settings → Pages**.
7. Under **Build and deployment**, choose **Deploy from a branch**.
8. Select branch **main** and folder **/(root)**, then Save.
9. Wait for GitHub Pages to show the published HTTPS URL.
10. Open that URL in Safari on the iPhone.
11. Tap **Share → Add to Home Screen → Add**.
12. Launch **Bike Workshop** from the Home Screen. After the first successful online load, the service worker caches the app for offline use.

Data is stored locally in the browser/PWA. Use the app's JSON export regularly until cloud sync is added.
