# Task Forge v5.5

Personal command center. This update ships in place at `/MTB-Workshop/task-forge-v5-4/` so the iPhone Home Screen icon keeps working. The storage key stays `task-forge-v5.4-state`. The service worker cache is `task-forge-v5.5`.

Export a JSON backup from Settings before opening the updated app. If anything looks wrong, import that backup. It replaces the dashboard. The new project import does not.

## Project notes

Open a project and choose Notes. Reference notes are free text (part numbers, specs, history). Log entries are dated notes you can add, edit, and delete. Both are stored on the project and travel with backup export and full restore. They are separate from task notes.

## Project import

Settings → Import tasks & notes, or Import on a project. Pick a JSON file in the schema below. The preview shows new tasks, duplicate titles that will be skipped, and notes that will be attached. Choose an existing project or create the project named in the file. If that category does not exist yet, the preview asks before creating it. Nothing already on the device is deleted or overwritten.

Duplicates are titles in the destination project, compared without regard to case. Notes skip a repeat of the same date, title, and body. Imported tasks are marked source `import`. Completed tasks go straight to completed. Re-importing the same file adds nothing new.

Full backup restore is unchanged and still replaces the current dashboard. A backup file is refused by the project importer.

Example file: `data/sample-import.json`.

### Import schema (version 1)

```json
{
  "format": "task-forge-import",
  "version": 1,
  "project": { "name": "RAM 1500", "category": "Vehicles", "description": "optional" },
  "tasks": [ { "title": "...", "notes": "optional", "priority": "low|normal|high|urgent (optional)", "dueDate": "YYYY-MM-DD or null", "checklist": [ { "text": "...", "done": false } ], "completed": false } ],
  "notes": [ { "date": "YYYY-MM-DD or null", "title": "optional", "body": "plain text" } ]
}
```

Priorities other than `low`, `normal`, `high`, and `urgent` are stored as `normal`.

## Gmail auto-check

When a Gmail session is already signed in, Task Forge runs the email-proposal scan and the orders scan on open, when the app becomes visible, and every 15 minutes while it stays open. It does not open the Google sign-in prompt by itself. Check Gmail and Scan Orders remain. Settings has a toggle, on by default. Home shows “Last checked X min ago” when Gmail is configured.

The Gmail token lasts about an hour. After it expires, automatic checks pause until you tap Check Gmail or Scan Orders again.

## Today’s Focus

Home still opens on a daily list you choose. Up to five tasks. Completing one checks it off in place. At 100% the focus ring turns green. Unfinished selections roll into a review queue on the next local day. Orders, routines, review, and backups behave as before.

## Data and privacy

The public copy ships an empty starter backup. Personal tasks, notes, email, and orders stay in this browser’s localStorage. No OAuth token is written into a backup. v5.3 and v5 state is copied into `task-forge-v5.4-state` and saved immediately the first time v5.5 opens if that key is empty.

## Checks

`node test/v55.test.js` covers migration persistence, import merge and dedupe (including about 100 tasks and 40 notes), backup round-trip of notes, and escaping of note and import text.
