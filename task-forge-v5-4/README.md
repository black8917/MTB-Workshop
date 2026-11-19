# Task Forge v5.4.1 — Today’s Focus

Updated in place at `/MTB-Workshop/task-forge-v5-4/` so installed shortcuts and the existing `task-forge-v5.4-state` data remain in use.

## Today’s Focus
- Home opens with a user-selected daily list. Start with three tasks; at most five including completed selections.
- Choose tasks offers suggestions by deadline/priority and search across all open tasks. Nothing is automatically selected.
- Do today is available on task rows and in the new/edit task form. It never changes a task’s due date or creates a duplicate.
- Edit list exposes touch-friendly move up/down and remove controls. Removing only changes the daily selection.
- Completing a task updates its existing record. Completed selections collapse and remain in the progress denominator; the list does not refill automatically.
- At the next local calendar day, unfinished selections become a review queue. Keep today or Later; Later leaves the task in All tasks.
- The daily selection and pending carryover are included in JSON backup export/restore. Older backups load with an empty selection.
- Dashboard totals now fit into one compact row; Up next excludes tasks already chosen for Today.

## Verification
Automated checks cover selection limits, duplicate prevention, ordering around completed tasks, completion, removal, local-day rollover, carryover, deleted tasks, backup round-trip, preserved orders/settings/history, and HTML escaping. Browser checks cover new-task selection, suggestions/search, reordering, removal, completion, refresh persistence and a 390px phone viewport. Native iOS installation behavior has not been device-tested.

## Existing features
Gmail triage, Orders & Deliveries, routines, projects, categories, Trash, backups and Gmail session behavior are retained. Shipping status remains inferred from email rather than live carrier scans.

## Data and privacy
The public deployment ships an empty starter backup only. Personal task/email/order data and daily choices remain in the browser’s existing localStorage. No personal backup or OAuth access token is included in source. The service-worker asset cache is versioned 5.4.1; the data storage key is unchanged.
