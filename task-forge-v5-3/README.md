# Task Forge v5.3 — Gmail connect & in-app reminders

This build is a **separate test deployment** (does not modify v5.2). Local state has a new key `task-forge-v5.3-state`; on first launch it copies any v5.2 local state from `task-forge-v5-state` without deleting it. If no prior state is present in this browser, use Settings → Import backup. Never upload your personal backup to public GitHub Pages.

## In-app routine reminders

- Home and Routines show a prominent reminder for non-daily scheduled routines **due today** and those **scheduled tomorrow**. Done routines disappear from due-today alert but retain completion history.
- Routine calendar scheduling supports daily, selected weekdays, weekly, biweekly, monthly; biweekly uses the chosen anchor date. The routine editor, checks, and history are unchanged.
- No push notifications, browser notifications or background service necessary. Reminders update when the page opens or becomes visible again.

## Gmail integration — one-tap after one-time Google setup

To directly use the Gmail API, the app needs its *own* OAuth client ID. The ChatGPT Gmail connector can't be used by a third-party website; Google requires a separate consent grant. Google OAuth is provided by Google's Identity Services library; client-only read-only token is held in memory and isn't placed in localStorage, exported in JSON, or committed to GitHub. Client ID itself is public and stored locally (including in user-initiated Task Forge backups).

One-time setup (Google Cloud Console):
1. Create a project and enable **Gmail API**: https://console.cloud.google.com/apis/library/gmail.googleapis.com
2. Configure Google Auth Platform / OAuth consent. Choose External audience in Testing and add your Gmail account as a test user. Add **Gmail read-only** scope (`https://www.googleapis.com/auth/gmail.readonly`). This is a restricted scope with unverified-app warnings and extra requirements if later published for wider use.
3. Create OAuth 2.0 client of type **Web application**. Add `https://black8917.github.io` under **Authorized JavaScript origins** (no path). No client secret is used by the app.
4. Open v5.3's Email tab → Connect Gmail → paste **OAuth client ID** → Save. Tap **Check Gmail** and complete Google's sign-in/consent. If pop-up sign-in fails from the iPhone Home Screen app, use same URL in Safari.

The app queries up to 200 Gmail messages from the last 7 days, uses **basic rules-based task extraction** (not ChatGPT AI), checks source IDs/known task titles for duplicates (e.g., a QFC pickup already in Tasks), and creates **pending proposals only**, never tasks without approval. It never sends, deletes, labels or archives any email. Google receives API requests; there is no Task Forge backend. User must be online to scan. Multiple scans skip previously imported or rejected messages, and can show "Already tracked" matches.

For deeper ChatGPT-based triage, the existing **Import JSON** is still supported and still yields better semantic interpretation. Keep backups, especially before testing new versions.

## Data security

Only app code and generic empty starter data are deployed in a public GitHub repo; do not commit personal exports or raw email messages. Gmail tokens are never persisted. Email subjects/snippets and imported task proposals are saved in the device's local storage, under the app origin. Existing v5.2 app and its local data remain unchanged.