'use strict';
const assert = require('assert');
const TF = require('../logic.js');

let failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log('ok  ' + name);
  } catch (error) {
    failed++;
    console.error('FAIL ' + name);
    console.error(error);
  }
}

function memory(initial) {
  const data = Object.assign({}, initial);
  const sets = [];
  return {
    data,
    sets,
    getItem(key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
    setItem(key, value) { data[key] = String(value); sets.push(key); }
  };
}

function baseState() {
  return TF.normalize({
    categories: [{name:'Vehicles', color:'#61c5ff', visible:true}, {name:'To Do', color:'#ff695f', visible:true}],
    projects: [{id:'proj-y', name:'Tesla Model Y', category:'Vehicles', notesText:'Tire size 255/45R19', noteLog:[
      {id:'note-1', date:'2026-05-01', title:'Alignment', body:'Toe set to spec.'}
    ]}],
    tasks: [
      {id:'task-1', title:'Check tire wear', category:'Vehicles', projectId:'proj-y', status:'open', reviewed:true, priority:'high', source:'Manual'},
      {id:'task-2', title:'IRS Payment', category:'To Do', projectId:null, status:'open', reviewed:true, priority:'urgent'}
    ],
    habits: [],
    history: {},
    focus: {date:'2026-11-24', ids:['task-1'], carryoverIds:[]},
    orders: [{id:'order-1', item:'Wiper blades', status:'In transit', sourceEmailIds:['m1'], archived:false}],
    settings: {accent:'cyan', autoGmailScan:false, gmailClientId:''}
  });
}

test('v5.3 migration is written to the current storage key immediately', () => {
  const legacy = {
    tasks: [{id:'old-1', title:'From v5.3', status:'open', category:'Vehicles'}],
    categories: [{name:'Vehicles', color:'#61c5ff'}],
    projects: [{id:'p1', name:'RAM 1500', category:'Vehicles'}]
  };
  const store = memory({'task-forge-v5.3-state': JSON.stringify(legacy)});
  const result = TF.bootstrapState(store, null);
  assert.strictEqual(result.persisted, true);
  assert.ok(store.sets.includes(TF.STORE));
  const saved = JSON.parse(store.data[TF.STORE]);
  assert.strictEqual(saved.tasks[0].title, 'From v5.3');
  assert.strictEqual(saved.projects[0].name, 'RAM 1500');
  assert.strictEqual(saved.projects[0].notesText, '');
  assert.deepStrictEqual(saved.projects[0].noteLog, []);
  const again = TF.bootstrapState(memory({[TF.STORE]: store.data[TF.STORE]}), null);
  assert.strictEqual(again.persisted, false);
  assert.strictEqual(again.state.tasks[0].title, 'From v5.3');
});

test('v5 migration persists and an existing current key is left untouched', () => {
  const v5 = {tasks:[{id:'v5', title:'Older', status:'open'}], habits:[], categories:[], projects:[]};
  const store = memory({'task-forge-v5-state': JSON.stringify(v5)});
  const result = TF.bootstrapState(store, null);
  assert.strictEqual(result.persisted, true);
  assert.strictEqual(JSON.parse(store.data[TF.STORE]).tasks[0].title, 'Older');

  const current = JSON.stringify({tasks:[{id:'keep', title:'Stay', status:'open'}], categories:[], projects:[], habits:[]});
  const kept = memory({[TF.STORE]: current, 'task-forge-v5.3-state': JSON.stringify({tasks:[{id:'x', title:'Nope'}], categories:[]})});
  const loaded = TF.bootstrapState(kept, null);
  assert.strictEqual(loaded.persisted, false);
  assert.deepStrictEqual(kept.sets, []);
  assert.strictEqual(kept.data[TF.STORE], current);
  assert.strictEqual(loaded.state.tasks.find(t => t.title === 'Stay').title, 'Stay');
  assert.ok(!loaded.state.tasks.some(t => t.title === 'Nope'));
});

test('corrupt current storage falls through to v5.3 and persists', () => {
  const store = memory({
    [TF.STORE]: '{not json',
    'task-forge-v5.3-state': JSON.stringify({tasks:[{id:'recovered', title:'Recovered', status:'open'}], categories:[{name:'Inbox', color:'#74cedf'}]})
  });
  const result = TF.bootstrapState(store, null);
  assert.strictEqual(result.persisted, true);
  assert.strictEqual(JSON.parse(store.data[TF.STORE]).tasks[0].title, 'Recovered');
});

test('merge import adds tasks and notes, skips duplicate titles and notes, and never removes data', () => {
  const state = baseState();
  const file = {
    format: 'task-forge-import',
    version: 1,
    project: {name:'RAM 1500', category:'Vehicles', description:'5.7 Hemi'},
    tasks: [
      {title:'Check tire wear', notes:'dup', priority:'HIGH', dueDate:'2026-11-16', completed:false},
      {title:'Rotate tires', priority:'normal', dueDate:null, checklist:[{text:'Torque lugs', done:false}]},
      {title:'rotate tires', priority:'low'},
      {title:'Replace cabin filter', priority:'nope', completed:true, notes:'Filter 53034051AA'},
      {title:'   ', priority:'urgent'}
    ],
    notes: [
      {date:'2026-08-02', title:'Oil change', body:'5W-20. Filter 53034051AA.'},
      {date:'2026-08-02', title:'Oil change', body:'5W-20. Filter 53034051AA.'},
      {date:'2026-08-02', title:'Oil change', body:'Different body'},
      {date:null, title:'Tire size', body:'275/60R20'}
    ]
  };
  const preview = TF.planMergeImport(state, file, {projectId:'proj-y'});
  assert.strictEqual(preview.ok, true);
  assert.strictEqual(preview.destination, 'existing');
  assert.strictEqual(preview.addTasks.length, 2);
  assert.strictEqual(preview.skipTasks.length, 2);
  assert.deepStrictEqual(preview.addTasks.map(t => t.title), ['Rotate tires', 'Replace cabin filter']);
  assert.strictEqual(preview.addTasks[1].priority, 'normal');
  assert.strictEqual(preview.addTasks[1].completed, true);
  assert.strictEqual(preview.addNotes.length, 3);
  assert.strictEqual(preview.skipNotes.length, 1);

  const beforeIds = state.tasks.map(t => t.id);
  const applied = TF.applyMergeImport(state, file, {projectId:'proj-y'});
  assert.strictEqual(applied.ok, true);
  assert.strictEqual(applied.addedTasks, 2);
  assert.strictEqual(applied.addedNotes, 3);
  assert.ok(beforeIds.every(id => state.tasks.some(t => t.id === id)));
  assert.strictEqual(state.tasks.find(t => t.id === 'task-2').title, 'IRS Payment');
  const added = state.tasks.filter(t => t.source === 'import');
  assert.strictEqual(added.length, 2);
  const cabin = added.find(t => t.title === 'Replace cabin filter');
  assert.strictEqual(cabin.status, 'completed');
  assert.ok(cabin.completedAt);
  assert.strictEqual(cabin.projectId, 'proj-y');
  assert.strictEqual(cabin.category, 'Vehicles');
  assert.strictEqual(cabin.reviewed, true);
  const rotate = added.find(t => t.title === 'Rotate tires');
  assert.strictEqual(rotate.status, 'open');
  assert.strictEqual(rotate.checklist.length, 1);
  assert.strictEqual(rotate.checklist[0].text, 'Torque lugs');
  assert.strictEqual(state.projects[0].notesText, 'Tire size 255/45R19');
  assert.strictEqual(state.projects[0].noteLog.length, 4);

  const again = TF.planMergeImport(state, file, {projectId:'proj-y'});
  assert.strictEqual(again.addTasks.length, 0);
  assert.strictEqual(again.addNotes.length, 0);
  assert.ok(again.skipTasks.length >= 3);
  assert.strictEqual(again.skipNotes.length, 4);
  const second = TF.applyMergeImport(state, file, {projectId:'proj-y'});
  assert.strictEqual(second.addedTasks, 0);
  assert.strictEqual(second.addedNotes, 0);
  assert.strictEqual(state.tasks.filter(t => t.source === 'import').length, 2);
});

test('new project import can create a missing category and does not create it without consent', () => {
  const state = baseState();
  const categories = state.categories.length;
  const projects = state.projects.length;
  const file = {
    format: 'task-forge-import',
    version: 1,
    project: {name:'Garage fridge', category:'Workshop', description:'Keep the manual here.'},
    tasks: [{title:'Clean the coils', priority:'low', completed:false}],
    notes: [{date:'2026-01-01', title:'Model', body:'ABC-100'}]
  };
  const blocked = TF.applyMergeImport(state, file, {createCategory:false});
  assert.strictEqual(blocked.ok, false);
  assert.strictEqual(blocked.needsCategory, true);
  assert.strictEqual(state.categories.length, categories);
  assert.strictEqual(state.projects.length, projects);
  assert.ok(!state.tasks.some(t => t.title === 'Clean the coils'));

  const created = TF.applyMergeImport(state, file, {createCategory:true});
  assert.strictEqual(created.ok, true);
  assert.strictEqual(created.createdProject, true);
  assert.strictEqual(created.createdCategory, 'Workshop');
  const project = state.projects.find(p => p.name === 'Garage fridge');
  assert.ok(project);
  assert.strictEqual(project.category, 'Workshop');
  assert.strictEqual(project.notesText, 'Keep the manual here.');
  assert.strictEqual(project.noteLog[0].body, 'ABC-100');
  const task = state.tasks.find(t => t.title === 'Clean the coils');
  assert.strictEqual(task.category, 'Workshop');
  assert.strictEqual(task.projectId, project.id);
  assert.ok(state.categories.some(c => c.name === 'Workshop'));
});

test('about 100 tasks and 40 notes merge without dropping or duplicating', () => {
  const state = baseState();
  const tasks = [];
  for (let i = 0; i < 100; i++) tasks.push({title:`Service item ${i}`, priority: i % 7 === 0 ? 'urgent' : 'normal', completed: i % 10 === 0, dueDate: i % 4 === 0 ? '2026-12-01' : null});
  tasks.push({title:'Service item 5', priority:'high'});
  const notes = [];
  for (let i = 0; i < 40; i++) notes.push({date:'2026-04-01', title:`Log ${i}`, body:`Detail ${i}`});
  notes.push({date:'2026-04-01', title:'Log 3', body:'Detail 3'});
  const file = {format:'task-forge-import', version:1, project:{name:'Fleet', category:'Vehicles'}, tasks, notes};
  const started = Date.now();
  const result = TF.applyMergeImport(state, file, {});
  assert.ok(Date.now() - started < 1000);
  assert.strictEqual(result.addedTasks, 100);
  assert.strictEqual(result.skippedTasks, 1);
  assert.strictEqual(result.addedNotes, 40);
  assert.strictEqual(result.skippedNotes, 1);
  const project = state.projects.find(p => p.name === 'Fleet');
  assert.strictEqual(project.noteLog.length, 40);
  assert.strictEqual(state.tasks.filter(t => t.projectId === project.id && t.status === 'completed').length, 10);
});

test('backup round-trip keeps notes, tasks, focus, orders, and the auto-scan choice', () => {
  const state = baseState();
  state.projects[0].notesText = 'Specs <>&"\'';
  state.projects[0].noteLog.push({id:'note-2', date:null, title:'Part <1>', body:'Line one\nLine two', createdAt:'2026-11-01T00:00:00.000Z', updatedAt:'2026-11-01T00:00:00.000Z'});
  const exported = JSON.parse(JSON.stringify(Object.assign({}, state, {exportedAt: new Date().toISOString()})));
  const restored = TF.normalize(exported);
  assert.strictEqual(restored.projects[0].notesText, 'Specs <>&"\'');
  assert.strictEqual(restored.projects[0].noteLog.length, 2);
  const part = restored.projects[0].noteLog.find(n => n.id === 'note-2');
  assert.strictEqual(part.title, 'Part <1>');
  assert.strictEqual(part.body, 'Line one\nLine two');
  assert.strictEqual(part.date, null);
  assert.strictEqual(restored.tasks.find(t => t.id === 'task-1').title, 'Check tire wear');
  assert.deepStrictEqual(restored.focus.ids, ['task-1']);
  assert.strictEqual(restored.orders[0].item, 'Wiper blades');
  assert.strictEqual(restored.settings.autoGmailScan, false);
  const round = TF.normalize(JSON.parse(JSON.stringify(restored)));
  assert.strictEqual(round.projects[0].notesText, restored.projects[0].notesText);
  assert.strictEqual(round.projects[0].noteLog.map(n => n.body).join('|'), restored.projects[0].noteLog.map(n => n.body).join('|'));
});

test('notes and import preview HTML stay escaped', () => {
  const html = TF.noteEntryHtml({id:'n1', date:'2026-08-02', title:'<b>x</b>', body:'<script>alert(1)</script>'}, 'p"1');
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<b>'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'));
  assert.ok(html.includes('data-project="p&quot;1"'));
  const line = TF.importTaskLine({title:'<img src=x onerror=alert(1)>', completed:false, dueDate:null, priority:'<high>'});
  assert.ok(!line.includes('<img'));
  assert.ok(line.includes('&lt;img'));
  assert.ok(line.includes('&lt;high&gt;'));
});

test('the running app persists migration through bootstrapState and caches both icons', () => {
  const fs = require('fs');
  const path = require('path');
  const app = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  const sw = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.ok(app.includes('TF.bootstrapState(localStorage,bundled)'));
  assert.ok(!app.includes("localStorage.getItem('task-forge-v5.3-state')"));
  assert.ok(sw.includes("const CACHE='task-forge-v5.5'"));
  assert.ok(sw.includes('./icons/icon-180.png') && sw.includes('./icons/icon-512.png'));
  assert.ok(html.includes('Task Forge v5.5') && html.includes('logic.js?v=5.5'));
});

test('full backup is refused by the merge planner and a bad priority maps to normal', () => {
  const state = baseState();
  const refused = TF.planMergeImport(state, {tasks:[], categories:[], projects:[], schemaVersion:5}, {});
  assert.strictEqual(refused.ok, false);
  assert.ok(/backup/i.test(refused.error));
  assert.strictEqual(TF.mapPriority('URGENT'), 'urgent');
  assert.strictEqual(TF.mapPriority(''), 'normal');
  assert.strictEqual(TF.mapPriority('critical'), 'normal');
});

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('all tests passed');
