# Task Forge v5.2 — Garmin-inspired personal task dashboard

Offline-first, mobile-friendly static PWA. No build tools or server account required. All changes are stored in the browser's localStorage; email triage is manual and does **not** access Gmail directly.

## Upgrading safely

1. In the existing Task Forge, **export a new JSON backup** first and save it separately. The included `data/initial-backup.json` is an **empty starter**, not your personal backup.
2. Deploy **every file and folder** from this ZIP to the same HTTPS website/host as the previous app (GitHub Pages, Netlify, etc). On GitHub Pages, replace the old files and wait for the deployment to finish.
3. Open the updated app and go to Settings → **Import backup**. Select your latest personal Task Forge JSON backup (103 tasks in the Nov 16 snapshot). This restores all tasks, categories, projects and routines. If this is an in-place replacement on the same origin, you may have an option to recover old local data instead.
4. If the old app and new app use the same origin and old localStorage includes a task array, Settings may offer **Recover old local data**. Prefer the newer export when available.
5. On iPhone Home Screen, fully close and reopen the PWA or open the site in Safari to load new files. Never clear Safari site data until your backup is verified.

## v5 improvements

- iPhone safe-area header and fixed accessible **+ New task** button
- Review queue: Keep, Done, Trash, select-visible, bulk delete, recover from Trash for 30 days
- Deleted tasks excluded from progress, open counts, and completion denominator
- Projects: edit colors and names, add categories/projects, move categories and projects up/down, show per-project completion
- Routines: daily, specific weekdays, weekly, biweekly, monthly; recurring check-ins do not erase history; upcoming occurrences
- Gmail triage: import JSON proposals, approve/edit/reject before converting email into task; duplicate ID checks; no live Gmail access
- Vivid, high-contrast category color system, circular completion charts, progress bars and mobile-first information density
- JSON import/export compatible with Task Forge v4 backups and new v5 data

## Email proposals JSON schema

See Email → Supported JSON format. A JSON file can contain `{"type":"task-forge-email-proposals","version":1,"proposals":[...]}` with proposal objects: `sourceMessageId`, `subject`, `from`, `date`, `summary`, `taskTitle`, `category`, `priority`, `dueDate`. Use the *Copy Gmail triage prompt* button and paste that prompt into ChatGPT with your connected Gmail, then import the resulting downloadable JSON file here.

## Hosting and privacy

Deploy with HTTPS. No backend. The app does not read or transmit private task data except when a user explicitly exports a file. `data/initial-backup.json` contains only generic starter categories and no personal data. **Never upload your personal Task Forge export or any email proposal file into a public GitHub repository**; import those files privately in the running app instead.

This build is meant to be tested as a replacement PWA; it is not automatically deployed to your current site.
