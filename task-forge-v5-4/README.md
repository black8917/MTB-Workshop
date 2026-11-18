# Task Forge v5.4 — Gmail improvements & Orders and Deliveries

Separate test release at `/MTB-Workshop/task-forge-v5-4/`. v5.3 is unchanged.

## New
- Orders under the Email tab, with a shortcut on Home. **Scan Orders from Gmail** inspects recent purchase/shipping messages (up to 250 metadata messages and 100 full relevant messages) from the last 60 days.
- Track merchant, order number, tracking number/carrier, last email date, inferred status and delivery estimate when present. Carrier links use recognized tracking numbers.
- Deduplicate order updates by merchant + order number, tracking number or Gmail thread. Archive and manually mark delivered; these changes persist in local backups.
- **Important:** Order statuses are email-derived, not live tracking. A status or ETA may be out of date. Open carrier links for the latest scan.
- Gmail OAuth no longer forces `prompt: consent` every time. A short-lived access token is optionally cached in **sessionStorage** and expires normally; it is never added to exported JSON. You may still see Google account selection after closing the PWA, and longer-lived silent access requires a secure backend.
- Email triage excludes routine sign-in/one-time codes, detects Pinkbike inquiries as potential Stuff To Sell leads, and matches repeats by Pinkbike conversation URL when present.
- Fix mobile Email approval-history overlap and heading readability.
- Existing in-app reminders, task review, categories, projects and all prior flows remain.

## Safe migration
- First launch attempts to **copy** the `task-forge-v5.3-state` local data into `task-forge-v5.4-state` without changing v5.3.
- Or import the newest private JSON backup via Settings → Import backup. Verify tasks, routines, colors and email history.
- The public GitHub Pages deployment ships only an **empty starter backup**. Never publish personal task exports or OAuth access tokens.
- OAuth Web Client ID is preserved through user backup imports and can be re-used without creating a new Google Cloud client.
- Google OAuth requires read-only Gmail scope. Nothing is sent, deleted, labeled or archived in Gmail.
- Export a fresh JSON backup from v5.4 before making changes in later releases.

## Security note
This is a browser-only application deployed from a public repository. Task/email/order data remains in localStorage on the user's device. Gmail access is handled in the browser via Google Identity Services; token persistence is session-scoped rather than long-lived. This model cannot silently refresh authorization for days without a secure back end.
