# Task Forge v5.5

Shipped in place at `/MTB-Workshop/task-forge-v5-4/` so the iPhone Home Screen icon keeps working. The storage key is still `task-forge-v5.4-state`. A v5.3 or v5.2 browser that has not been saved under that key is copied into it and written immediately.

Export a JSON backup from Settings before opening the updated app. If anything looks wrong, Import backup restores that file. Import backup still replaces the whole workspace. It is separate from the project merge importer below.

## On the iPhone
1. Settings → Export backup, and keep that file.
2. Force-quit Task Forge (swipe it away), then open it from the Home Screen.
3. The header should read **v5.5**. If it still looks like the previous version, force-quit and open it once more so the new service worker (`task-forge-v5.5`) can take over.
4. Confirm today's tasks are still there. The backup is only needed if you want to roll back.

## Project notes
Open a project. **Reference** is free text for specs, part numbers, and other standing info. **Log** is a list of dated entries you can add, edit, and delete. Both are stored on the project and travel with backup export and import. Task notes are unchanged and stay on each task.

## Merge import
Settings, the Projects page, or a project’s Import button accepts a JSON file in the schema below. Pick an existing project or create the project named in the file. The preview lists tasks that will be added, titles that already exist in that project (skipped, case-insensitive), and notes that will be attached. Re-importing skips a note when the date, title, and body already match. Nothing already in Task Forge is deleted or overwritten.

Imported tasks use source `import`. Completed tasks are stored as completed. Open ones stay open and are marked reviewed, so a large import does not fill the review queue. Priorities map to `low`, `normal`, `high`, or `urgent` (`medium` becomes normal, `critical` becomes urgent, anything else becomes normal). If the file’s category is not already in the app, the preview offers to create it.

```json
{
  "format": "task-forge-import",
  "version": 1,
  "project": { "name": "RAM 1500", "category": "Vehicles", "description": "optional" },
  "tasks": [
    {
      "title": "Rotate tires",
      "notes": "optional",
      "priority": "low|normal|high|urgent (optional)",
      "dueDate": "YYYY-MM-DD or null",
      "checklist": [{ "text": "Torque lugs", "done": false }],
      "completed": false
    }
  ],
  "notes": [
    { "date": "YYYY-MM-DD or null", "title": "optional", "body": "plain text" }
  ]
}
```

## Gmail auto-check
When Settings → Auto-check Gmail is on (the default) and this browser already has a Gmail session, Task Forge runs the email-proposal scan and the orders scan when the app opens, when it becomes visible again, and every 15 minutes while it is open. It does not open the Google sign-in popup on its own. Check Gmail and Scan Orders still work manually. Proposals that are already tracked are not added again. The home screen and the Email page show “Last checked X min ago”.

## Also in this version
- Today’s Focus uses a progress ring. Projects use a small ring. Task rows pick up a thin category-color edge. The big numerals use a small subset of Barlow Condensed (SIL Open Font License, see `fonts/OFL.txt`).
- Checking off a task plays a short animation and, where the phone allows it, a light vibration. Finishing the last focus task plays a small celebration. Both respect Reduce Motion.
- The 180 and 512 icons are in the service worker cache.

## Check
From the repo root:

```sh
node task-forge-v5-4/test/v55.test.js
```

That covers v5.3/v5.2 migration being saved immediately, merge dedupe for tasks and notes, a 100-task / 40-note import, and a backup round-trip that keeps project notes.
