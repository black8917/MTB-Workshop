# Task Forge v4 · Local Beta

Includes the v3 framework plus safer multi-project JSON imports, bulk task review, 12-week routine charts, detailed workout and ride logs, and optional migration from an existing v3 workspace in the **same browser**.

## New in v4

- Import a OneNote JSON page into an existing project in one operation. Choose optional project during preview; files are never uploaded to the server.
- Merge skips matching task IDs or exact normalized titles within the same category/project. Import preview shows task counts and ID overlaps.
- Bulk-assign selected unreviewed tasks to categories/projects, with confirmation by the user. Review queue expands beyond the first 50.
- Tap a routine date for detail entry (duration, ride miles, elevation gain, notes). Charts include last 28 days and 12-week consistency, with target attainment.
- **Review copy from v3** via Settings if the v3 localStorage record is accessible in the same origin/browser. The v3 data remains untouched; the copy is not automatic.
- Settings backup now saves v4 schema with imported data, categories, history and review decisions. v1/v2/v3/v4 supported.

## Privacy / limitations

- Cloud synchronization is **not connected**. Data is browser-local and may differ between Safari and an installed iOS web app. Export a JSON backup before switching browsers/devices.
- Gmail and Calendar are **not connected**; suggestion cards are demonstration data only and approvals never make external changes.
- PDF import is intentionally **not included**; use ChatGPT to convert new OneNote pages into compatible JSON.
- Demo project progress/check-ins are sample values, not imported user history. Project completion is calculated only from tasks actually present in the workspace.

## Hosting

Upload this static directory to an HTTPS host (GitHub Pages supported) and open `index.html`. Avoid committing any personal JSON files or notes to public GitHub repositories. For a distinct installed PWA, use a separate URL path and manifest scope.