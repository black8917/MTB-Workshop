'use strict';
const assert = require('assert');
const TF = require('../forge-core.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('ok', name);
}

function memoryStorage(initial) {
  const data = new Map(Object.entries(initial || {}));
  const writes = [];
  return {
    writes,
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { writes.push(key); data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  };
}

test('v5.3 migration is written to the v5.4 key immediately', () => {
  const legacy = {
    tasks: [{ id: 't-keep', title: 'Check tire wear', status: 'open', category: 'Vehicles', priority: 'high' }],
    categories: [{ name: 'Vehicles', color: '#61c5ff' }],
    projects: [{ id: 'p-y', name: 'Tesla Model Y', category: 'Vehicles' }],
    habits: [{ id: 'h1', name: 'Ride' }],
    settings: { accent: 'orange', gmailClientId: '' }
  };
  const storage = memoryStorage({ 'task-forge-v5.3-state': JSON.stringify(legacy) });
  const loaded = TF.loadPersistedState(storage);
  assert.strictEqual(loaded.migratedFrom, 'v5.3');
  assert.strictEqual(loaded.persisted, true);
  assert.ok(loaded.state);
  assert.strictEqual(storage.writes.filter(k => k === TF.STORE_KEY).length, 1);
  const saved = JSON.parse(storage.getItem(TF.STORE_KEY));
  assert.strictEqual(saved.tasks[0].id, 't-keep');
  assert.strictEqual(saved.tasks[0].title, 'Check tire wear');
  assert.strictEqual(saved.projects[0].name, 'Tesla Model Y');
  assert.deepStrictEqual(saved.projects[0].notes, { text: '', entries: [] });
  assert.strictEqual(saved.settings.accent, 'orange');
  assert.strictEqual(saved.settings.autoGmailScan, true);

  storage.setItem('task-forge-v5.3-state', JSON.stringify({
    tasks: [{ id: 'other', title: 'Should not replace', status: 'open' }],
    categories: [{ name: 'Inbox', color: '#74cedf' }]
  }));
  const again = TF.loadPersistedState(storage);
  assert.strictEqual(again.migratedFrom, null);
  assert.strictEqual(again.persisted, false);
  assert.strictEqual(again.state.tasks[0].title, 'Check tire wear');
});

test('existing v5.4 state is not rewritten during load', () => {
  const current = TF.normalize({
    tasks: [{ id: 'a', title: 'Keep current', status: 'open', category: 'To Do' }],
    categories: [{ name: 'To Do', color: '#ff695f', colorBeforeV5: '#ff695f' }],
    projects: [],
    habits: []
  });
  const storage = memoryStorage({
    [TF.STORE_KEY]: JSON.stringify(current),
    'task-forge-v5.3-state': JSON.stringify({
      tasks: [{ id: 'old', title: 'Old', status: 'open' }],
      categories: [{ name: 'Inbox', color: '#74cedf' }]
    })
  });
  const before = storage.writes.length;
  const loaded = TF.loadPersistedState(storage);
  assert.strictEqual(loaded.migratedFrom, null);
  assert.strictEqual(loaded.persisted, false);
  assert.strictEqual(storage.writes.length, before);
  assert.strictEqual(loaded.state.tasks[0].title, 'Keep current');
});

test('v5.2 migration persists and a partial v5.3 payload does not', () => {
  const bad = memoryStorage({
    'task-forge-v5.3-state': JSON.stringify({ tasks: [{ id: 'x', title: 'No categories' }] })
  });
  const skipped = TF.loadPersistedState(bad);
  assert.strictEqual(skipped.state, null);
  assert.strictEqual(bad.getItem(TF.STORE_KEY), null);

  const storage = memoryStorage({
    'task-forge-v5-state': JSON.stringify({
      tasks: [{ id: 'v52', title: 'From v5.2', status: 'open' }],
      habits: [{ id: 'h', name: 'Stretch' }],
      categories: [{ name: 'Health', color: '#5bd2ed' }],
      projects: []
    })
  });
  const loaded = TF.loadPersistedState(storage);
  assert.strictEqual(loaded.migratedFrom, 'v5.2');
  assert.strictEqual(loaded.persisted, true);
  assert.strictEqual(JSON.parse(storage.getItem(TF.STORE_KEY)).tasks[0].title, 'From v5.2');
});

function sampleState() {
  return TF.normalize({
    tasks: [
      { id: 'keep', title: 'Check tire wear', status: 'open', category: 'Vehicles', projectId: 'ram', priority: 'high', notes: 'existing task note' },
      { id: 'other', title: 'IRS Payment', status: 'open', category: 'Finances', projectId: 'tax', priority: 'urgent' }
    ],
    categories: [
      { name: 'Vehicles', color: '#61c5ff', colorBeforeV5: '#61c5ff' },
      { name: 'Finances', color: '#ffd36b', colorBeforeV5: '#ffd36b' }
    ],
    projects: [
      { id: 'ram', name: 'RAM 1500', category: 'Vehicles', notes: { text: 'Owner notes stay', entries: [
        { id: 'n-old', date: '2024-03-01', title: 'Oil', body: '5W-30, 5 quarts' }
      ] } },
      { id: 'tax', name: 'Financial Admin', category: 'Finances', notes: { text: '', entries: [] } }
    ],
    habits: [{ id: 'h', name: 'Ride', schedule: { frequency: 'weekly', weekdays: [2], monthDay: 1, anchorDate: '2026-01-06' }, target: 1 }],
    history: { h: { '2026-11-24': { completed: true } } },
    focus: { date: '2026-11-24', ids: ['keep'], carryoverIds: [] },
    settings: { accent: 'cyan', autoGmailScan: false, gmailClientId: 'abc.apps.googleusercontent.com' },
    orders: [{ id: 'o1', merchant: 'Shop', status: 'Delivered', sourceEmailIds: ['m1'], archived: false }]
  });
}

function importFile(extra) {
  return TF.parseImportFile(Object.assign({
    format: 'task-forge-import',
    version: 1,
    project: { name: 'RAM 1500', category: 'Vehicles', description: '2019 Laramie' },
    tasks: [
      { title: 'check tire wear', notes: 'duplicate casing', priority: 'HIGH', dueDate: '2026-11-16', completed: false },
      { title: 'Rotate tires', notes: 'every 6k', priority: 'normal', dueDate: null, checklist: [{ text: 'Torque lugs', done: false }, { text: 'Check pressure', done: true }], completed: false },
      { title: 'Replace cabin filter', priority: 'nope', completed: true },
      { title: 'Rotate tires', notes: 'intra-file duplicate', completed: false },
      { title: '   ', completed: false }
    ],
    notes: [
      { date: '2024-03-01', title: 'Oil', body: '5W-30, 5 quarts' },
      { date: '2025-06-02', title: 'Brake pads', body: 'Front ceramic, part BP-44' },
      { date: null, title: 'Tire size', body: '275/55R20' },
      { date: '2025-06-02', title: 'Brake pads', body: 'Front ceramic, part BP-44' }
    ]
  }, extra || {}));
}

test('merge preview skips same-project titles and duplicate notes', () => {
  const state = sampleState();
  const file = importFile();
  const plan = TF.previewImportMerge(state, file, { projectId: 'ram' });
  assert.deepStrictEqual(plan.fresh.map(t => t.title), ['Rotate tires', 'Replace cabin filter']);
  assert.deepStrictEqual(plan.dupes.map(t => t.title), ['check tire wear', 'Rotate tires']);
  assert.strictEqual(plan.noteNew.length, 2);
  assert.strictEqual(plan.noteDup.length, 2);
  assert.strictEqual(plan.descriptionAttach, true);
  assert.strictEqual(plan.skippedBlank, 1);
  assert.strictEqual(file.tasks[0].priority, 'high');
  assert.strictEqual(file.tasks[2].priority, 'normal');
  assert.strictEqual(file.tasks[2].completed, true);
  assert.strictEqual(file.tasks[1].checklist.length, 2);
  assert.strictEqual(file.tasks[1].checklist[1].done, true);
});

test('merge keeps existing data and dedupes a second import', () => {
  const before = sampleState();
  const file = importFile();
  const first = TF.applyImportMerge(before, file, { projectId: 'ram', createCategory: true });
  assert.strictEqual(first.addedTasks, 2);
  assert.strictEqual(first.skippedTasks, 2);
  assert.strictEqual(first.addedNotes, 2);
  assert.strictEqual(first.skippedNotes, 2);
  assert.strictEqual(first.createdProject, false);
  const ramTasks = first.state.tasks.filter(t => t.projectId === 'ram' && t.status !== 'deleted');
  assert.ok(ramTasks.some(t => t.id === 'keep' && t.notes === 'existing task note' && t.status === 'open'));
  const rotated = ramTasks.find(t => t.title === 'Rotate tires');
  assert.strictEqual(rotated.source, 'import');
  assert.strictEqual(rotated.status, 'open');
  assert.strictEqual(rotated.category, 'Vehicles');
  assert.strictEqual(rotated.checklist.length, 2);
  const cabin = ramTasks.find(t => t.title === 'Replace cabin filter');
  assert.strictEqual(cabin.status, 'completed');
  assert.ok(cabin.completedAt);
  assert.strictEqual(cabin.source, 'import');
  const ram = first.state.projects.find(p => p.id === 'ram');
  assert.ok(ram.notes.text.includes('Owner notes stay'));
  assert.ok(ram.notes.text.includes('2019 Laramie'));
  assert.strictEqual(ram.notes.entries.length, 3);
  assert.strictEqual(first.state.tasks.find(t => t.id === 'other').title, 'IRS Payment');
  assert.strictEqual(first.state.orders.length, 1);
  assert.strictEqual(first.state.settings.autoGmailScan, false);
  assert.deepStrictEqual(first.state.focus.ids, ['keep']);
  assert.strictEqual(before.tasks.length, 2, 'apply must not mutate the input state');

  const second = TF.applyImportMerge(first.state, file, { projectId: 'ram' });
  assert.strictEqual(second.addedTasks, 0);
  assert.strictEqual(second.addedNotes, 0);
  assert.strictEqual(second.state.projects.find(p => p.id === 'ram').notes.entries.length, 3);
  assert.strictEqual(second.state.projects.find(p => p.id === 'ram').notes.text.split('2019 Laramie').length, 2);
});

test('new project creates a missing category and does not replace other projects', () => {
  const state = sampleState();
  const file = TF.parseImportFile({
    format: 'task-forge-import',
    version: 1,
    project: { name: 'Outback', category: 'Trailers', description: 'Subaru' },
    tasks: [{ title: 'CVT service', priority: 'critical', completed: false }],
    notes: [{ date: '2026-01-01', title: '', body: '120k service' }]
  });
  assert.throws(() => TF.applyImportMerge(state, file, { projectId: null, createCategory: false }), /category/i);
  const result = TF.applyImportMerge(state, file, { projectId: null, createCategory: true });
  assert.strictEqual(result.createdProject, true);
  assert.strictEqual(result.createdCategory, 'Trailers');
  const created = result.state.projects.find(p => p.id === result.projectId);
  assert.strictEqual(created.name, 'Outback');
  assert.strictEqual(created.category, 'Trailers');
  assert.strictEqual(created.notes.text, 'Subaru');
  assert.strictEqual(created.notes.entries[0].body, '120k service');
  const task = result.state.tasks.find(t => t.title === 'CVT service');
  assert.strictEqual(task.priority, 'urgent');
  assert.strictEqual(task.projectId, created.id);
  assert.strictEqual(task.source, 'import');
  assert.ok(result.state.projects.some(p => p.id === 'ram'));
  assert.strictEqual(result.state.categories.filter(c => c.name.toLowerCase() === 'vehicles').length, 1);

  const aliased = TF.parseImportFile({
    format: 'task-forge-import', version: 1,
    project: { name: 'Daily driver', category: 'vehicles' },
    tasks: [{ title: 'Washer fluid', completed: false }],
    notes: []
  });
  const reused = TF.applyImportMerge(state, aliased, { projectId: null, createCategory: false });
  assert.strictEqual(reused.createdCategory, null);
  assert.strictEqual(reused.state.projects.find(p => p.id === reused.projectId).category, 'Vehicles');
  assert.strictEqual(reused.state.categories.filter(c => c.name.toLowerCase() === 'vehicles').length, 1);
});

test('import of about 100 tasks and 40 notes stays fast and dedupes', () => {
  const tasks = Array.from({ length: 100 }, (_, i) => ({
    title: `Service item ${i}`,
    notes: i % 2 ? `note ${i}` : '',
    priority: ['low', 'normal', 'high', 'urgent'][i % 4],
    dueDate: i % 5 === 0 ? '2026-12-01' : null,
    checklist: [{ text: `Step ${i}`, done: i % 3 === 0 }],
    completed: i % 10 === 0
  }));
  const notes = Array.from({ length: 40 }, (_, i) => ({
    date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
    title: `Log ${i}`,
    body: `Body ${i}\nline 2`
  }));
  const file = TF.parseImportFile({
    format: 'task-forge-import', version: 1,
    project: { name: 'RAM 1500', category: 'Vehicles', description: 'batch' },
    tasks, notes
  });
  const started = Date.now();
  const first = TF.applyImportMerge(sampleState(), file, { projectId: 'ram' });
  const second = TF.applyImportMerge(first.state, file, { projectId: 'ram' });
  const elapsed = Date.now() - started;
  assert.strictEqual(first.addedTasks, 100);
  assert.strictEqual(first.addedNotes, 40);
  assert.strictEqual(first.state.tasks.filter(t => t.source === 'import' && t.status === 'completed').length, 10);
  assert.strictEqual(second.addedTasks, 0);
  assert.strictEqual(second.addedNotes, 0);
  assert.ok(elapsed < 500, `import took ${elapsed}ms`);
});

test('backup round-trip keeps notes, checklists, focus and settings', () => {
  const state = sampleState();
  state.projects[0].notes.text = 'Spec <b> & "quotes"';
  state.projects[0].notes.entries.push({ id: 'n-html', date: null, title: 'A & B', body: 'line1\n<line2>' });
  state.tasks[0].checklist = [{ id: 'c1', text: 'Torque', done: true }];
  const exported = { ...state, exportedAt: '2026-11-24T12:00:00.000Z' };
  const restored = TF.normalize(JSON.parse(JSON.stringify(exported)));
  const ram = restored.projects.find(p => p.id === 'ram');
  assert.strictEqual(ram.notes.text, 'Spec <b> & "quotes"');
  const htmlNote = ram.notes.entries.find(e => e.id === 'n-html');
  assert.strictEqual(htmlNote.title, 'A & B');
  assert.strictEqual(htmlNote.body, 'line1\n<line2>');
  assert.strictEqual(htmlNote.date, null);
  assert.strictEqual(ram.notes.entries.find(e => e.id === 'n-old').body, '5W-30, 5 quarts');
  assert.strictEqual(restored.tasks.find(t => t.id === 'keep').checklist[0].text, 'Torque');
  assert.strictEqual(restored.tasks.find(t => t.id === 'keep').checklist[0].done, true);
  assert.deepStrictEqual(restored.focus.ids, ['keep']);
  assert.strictEqual(restored.settings.autoGmailScan, false);
  assert.strictEqual(restored.settings.gmailClientId, 'abc.apps.googleusercontent.com');
  assert.strictEqual(restored.orders[0].merchant, 'Shop');
  assert.strictEqual(restored.history.h['2026-11-24'].completed, true);
  assert.strictEqual(TF.esc(ram.notes.text), 'Spec &lt;b&gt; &amp; &quot;quotes&quot;');
  assert.strictEqual(TF.esc("it's"), 'it&#39;s');
});

test('import parser rejects backups and unknown versions', () => {
  assert.throws(() => TF.parseImportFile({ schemaVersion: 5, tasks: [], categories: [], projects: [] }), /task-forge-import/);
  assert.throws(() => TF.parseImportFile({ format: 'task-forge-import', version: 2, project: { name: 'X' } }), /version/);
});

console.log(`\n${passed} tests passed`);
