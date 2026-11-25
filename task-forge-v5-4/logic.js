/* Task Forge data helpers. No DOM. Loaded before app.js; tests require() this file. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TF = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const STORE = 'task-forge-v5.4-state';
  const APP_VERSION = '5.5';
  const FOCUS_LIMIT = 5;
  const VIVID = {Home:'#ffac56',Vehicles:'#61c5ff','Mountain Bikes':'#47e7ad','Outdoor & Snow':'#bc9aff',Fitness:'#ff83a6',Finances:'#ffd36b',Work:'#67aaff',Email:'#a89bff',Inbox:'#74cedf',Entertainment:'#dd87ff','Stuff To Sell':'#9de66b','To Do':'#ff695f',Health:'#5bd2ed'};
  const PRESETS = ['#27d2f3','#ff9f58','#4adfa8','#f56f94','#b29aff','#ff6a63','#ffcf61','#64b7ff','#d581ff','#9de66b'];
  const PRIORITIES = ['low','normal','high','urgent'];

  const uid = () => (globalThis.crypto && crypto.randomUUID && crypto.randomUUID()) || `tf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const iso = (d = new Date()) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  const parseDate = s => s ? new Date(`${s}T12:00:00`) : null;
  const cleanColor = x => /^#[0-9a-fA-F]{6}$/.test(x || '') ? x : '#27d2f3';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isMutedColor = hex => {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return true;
    const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), light = (mx + mn) / 2;
    const sat = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * light - 1));
    return sat < .46;
  };
  const fmtDate = s => s ? parseDate(s)?.toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '';
  const titleKey = s => String(s || '').trim().toLowerCase();
  const noteKey = n => `${n && n.date || ''}\n${String(n && n.title || '').trim()}\n${String(n && n.body || '').trim()}`;

  function mapPriority(p) {
    const v = String(p ?? 'normal').trim().toLowerCase();
    return PRIORITIES.includes(v) ? v : 'normal';
  }

  function normalizeChecklist(items) {
    return Array.isArray(items) ? items.filter(i => i && typeof i.text === 'string' && i.text.trim()).map(i => ({
      id: typeof i.id === 'string' && i.id ? i.id : uid(),
      text: i.text.trim(),
      done: i.done === true
    })) : [];
  }

  function normalizeFocus(value, tasks, today = iso()) {
    const f = value && typeof value === 'object' ? value : {};
    const list = Array.isArray(tasks) ? tasks : [];
    const valid = new Set(list.filter(t => t && t.status !== 'deleted').map(t => t.id));
    const ids = Array.isArray(f.ids) ? [...new Set(f.ids)].filter(id => valid.has(id)).slice(0, FOCUS_LIMIT) : [];
    const carryoverIds = Array.isArray(f.carryoverIds) ? [...new Set(f.carryoverIds)].filter(id => list.some(t => t && t.id === id && t.status === 'open') && !ids.includes(id)) : [];
    return {date: /^\d{4}-\d{2}-\d{2}$/.test(f.date || '') ? f.date : today, ids, carryoverIds};
  }

  function normalizeStoredNote(e) {
    if (!e || typeof e !== 'object') return null;
    const title = String(e.title ?? '').trim().slice(0, 200);
    const body = String(e.body ?? '').replace(/\r\n/g, '\n').trim().slice(0, 20000);
    if (!title && !body) return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(e.date || '') ? e.date : null;
    const createdAt = typeof e.createdAt === 'string' && e.createdAt ? e.createdAt : new Date().toISOString();
    return {
      id: typeof e.id === 'string' && e.id ? e.id : uid(),
      date,
      title,
      body,
      createdAt,
      updatedAt: typeof e.updatedAt === 'string' && e.updatedAt ? e.updatedAt : createdAt
    };
  }

  function normalize(x) {
    const d = JSON.parse(JSON.stringify(x || {}));
    d.schemaVersion = 5;
    d.categories = Array.isArray(d.categories) ? d.categories : [];
    d.projects = Array.isArray(d.projects) ? d.projects : [];
    d.tasks = Array.isArray(d.tasks) ? d.tasks : [];
    d.habits = Array.isArray(d.habits) ? d.habits : [];
    d.history = d.history && typeof d.history === 'object' ? d.history : {};
    d.orders = Array.isArray(d.orders) ? d.orders : [];
    d.orders.forEach(o => { o.sourceEmailIds = Array.isArray(o.sourceEmailIds) ? o.sourceEmailIds : []; o.archived = !!o.archived; });
    d.emailProposals = Array.isArray(d.emailProposals) ? d.emailProposals : [];
    d.preferences = d.preferences || {};
    d.categoryOrder = Array.isArray(d.categoryOrder) ? d.categoryOrder : [];
    d.projectOrder = Array.isArray(d.projectOrder) ? d.projectOrder : [];
    d.settings = d.settings || {};
    d.settings.accent = d.settings.accent || 'cyan';
    d.settings.vivid = d.settings.vivid !== false;
    d.settings.defaultRoute = d.settings.defaultRoute || 'home';
    d.settings.gmailClientId = typeof d.settings.gmailClientId === 'string' ? d.settings.gmailClientId : '';
    if (d.settings.autoGmailScan == null) d.settings.autoGmailScan = true;
    d.categories.forEach(c => {
      if (!c || !c.name) return;
      if (!c.colorBeforeV5) {
        c.colorBeforeV5 = c.color;
        if (d.settings.vivid && VIVID[c.name] && isMutedColor(c.color)) c.color = VIVID[c.name];
      }
      c.color = cleanColor(c.color);
      c.visible = c.visible !== false;
    });
    d.projects.forEach(p => {
      if (!p || typeof p !== 'object') return;
      if (!p.id) p.id = uid();
      p.notesText = typeof p.notesText === 'string' ? p.notesText : '';
      p.noteLog = Array.isArray(p.noteLog) ? p.noteLog.map(normalizeStoredNote).filter(Boolean) : [];
    });
    d.tasks.forEach(t => {
      if (!t || typeof t !== 'object') return;
      if (!t.id) t.id = uid();
      t.status = t.status || 'open';
      if (t.reviewed == null) t.reviewed = false;
      if (t.category == null) t.category = 'Inbox';
      if (!t.priority) t.priority = 'normal';
      if (t.checklist !== undefined) t.checklist = normalizeChecklist(t.checklist);
    });
    d.habits.forEach(h => {
      if (!h || typeof h !== 'object') return;
      if (!h.schedule) h.schedule = {frequency:'daily', weekdays:[], monthDay:1, anchorDate:iso()};
      if (!h.target) h.target = 1;
    });
    d.categoryOrder = [...new Set([...d.categoryOrder, ...d.categories.map(c => c && c.name)])].filter(name => d.categories.some(c => c && c.name === name));
    d.projectOrder = [...new Set([...d.projectOrder, ...d.projects.map(p => p && p.id)])].filter(id => d.projects.some(p => p && p.id === id));
    d.focus = normalizeFocus(d.focus, d.tasks);
    d.lastUpdatedAt = new Date().toISOString();
    return d;
  }

  function bootstrapState(storage, bundled) {
    const read = key => {
      try { return storage.getItem(key); } catch { return null; }
    };
    let state = null;
    let persist = false;
    const current = read(STORE);
    if (current) {
      try {
        const parsed = JSON.parse(current);
        if (parsed && typeof parsed === 'object') state = normalize(parsed);
      } catch { state = null; }
    }
    if (!state) {
      try {
        const raw = read('task-forge-v5.3-state');
        if (raw) {
          const d = JSON.parse(raw);
          if (d && Array.isArray(d.tasks) && Array.isArray(d.categories)) {
            state = normalize(d);
            persist = true;
          }
        }
      } catch { /* try the next legacy key */ }
    }
    if (!state) {
      try {
        const raw = read('task-forge-v5-state');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.tasks) && Array.isArray(parsed.habits)) {
            state = normalize(parsed);
            persist = true;
          }
        }
      } catch { /* fall through to the starter backup */ }
    }
    if (!state) {
      state = normalize(bundled || {tasks:[], categories:[], projects:[], habits:[], history:{}});
      persist = true;
    }
    if (persist) {
      state.lastUpdatedAt = new Date().toISOString();
      storage.setItem(STORE, JSON.stringify(state));
    }
    return {state, persisted: persist};
  }

  function incomingNote(n) {
    if (!n || typeof n !== 'object') return null;
    const title = String(n.title ?? '').trim().slice(0, 200);
    const body = String(n.body ?? '').replace(/\r\n/g, '\n').trim().slice(0, 20000);
    if (!title && !body) return null;
    const date = n.date == null || n.date === '' ? null : (/^\d{4}-\d{2}-\d{2}$/.test(String(n.date)) ? String(n.date) : null);
    return {date, title, body};
  }

  function incomingTask(task) {
    if (!task || typeof task !== 'object') return null;
    const title = String(task.title || '').trim().slice(0, 300);
    if (!title) return null;
    return {
      title,
      notes: String(task.notes || '').trim().slice(0, 20000),
      priority: mapPriority(task.priority),
      dueDate: /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate || '') ? task.dueDate : null,
      checklist: normalizeChecklist(task.checklist).slice(0, 200),
      completed: task.completed === true
    };
  }

  function planMergeImport(state, raw, opts) {
    const options = opts || {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {ok:false, error:'This file is not a Task Forge project import.'};
    if (raw.format !== 'task-forge-import' || Number(raw.version) !== 1) {
      if (Array.isArray(raw.tasks) && Array.isArray(raw.categories) && Array.isArray(raw.projects)) {
        return {ok:false, error:'This looks like a full backup. Use Import backup on Settings to restore it. Project import never replaces your data.'};
      }
      return {ok:false, error:'Expected a Task Forge import file: {"format":"task-forge-import","version":1}.'};
    }
    if (!raw.project || typeof raw.project.name !== 'string' || !raw.project.name.trim()) return {ok:false, error:'The import needs a project name.'};
    if (raw.tasks != null && !Array.isArray(raw.tasks)) return {ok:false, error:'tasks must be an array.'};
    if (raw.notes != null && !Array.isArray(raw.notes)) return {ok:false, error:'notes must be an array.'};
    if ((raw.tasks || []).length > 2000 || (raw.notes || []).length > 2000) return {ok:false, error:'This import is too large (limit 2,000 tasks and 2,000 notes).'};
    const base = state && typeof state === 'object' ? state : {categories:[], projects:[], tasks:[]};
    const categories = Array.isArray(base.categories) ? base.categories : [];
    const projects = Array.isArray(base.projects) ? base.projects : [];
    const tasks = Array.isArray(base.tasks) ? base.tasks : [];
    const projectName = raw.project.name.trim().slice(0, 120);
    const requestedCategory = String(raw.project.category || 'Inbox').trim().slice(0, 90) || 'Inbox';
    const description = String(raw.project.description || '').trim().slice(0, 20000);
    const projectId = options.projectId || '';
    let project = projectId ? projects.find(p => p && p.id === projectId) : null;
    if (projectId && !project) return {ok:false, error:'That project is no longer on this device.'};
    const destination = project ? 'existing' : 'new';
    const existingCat = categories.find(c => c && String(c.name).toLowerCase() === requestedCategory.toLowerCase());
    const categoryExists = destination === 'existing' ? true : !!existingCat;
    const seenTitles = new Set();
    if (project) {
      for (const t of tasks) {
        if (t && t.projectId === project.id) seenTitles.add(titleKey(t.title));
      }
    }
    const addTasks = [];
    const skipTasks = [];
    for (const item of raw.tasks || []) {
      const task = incomingTask(item);
      if (!task) continue;
      const key = titleKey(task.title);
      if (seenTitles.has(key)) { skipTasks.push({title: task.title, reason:'Duplicate title'}); continue; }
      seenTitles.add(key);
      addTasks.push(task);
    }
    const seenNotes = new Set();
    for (const n of (project && project.noteLog) || []) seenNotes.add(noteKey(n));
    const addNotes = [];
    const skipNotes = [];
    for (const item of raw.notes || []) {
      const note = incomingNote(item);
      if (!note) continue;
      const key = noteKey(note);
      if (seenNotes.has(key)) { skipNotes.push(note); continue; }
      seenNotes.add(key);
      addNotes.push(note);
    }
    return {
      ok:true,
      projectName,
      requestedCategory,
      categoryName: project ? project.category : (existingCat ? existingCat.name : requestedCategory),
      categoryExists,
      destination,
      project,
      description,
      addTasks,
      skipTasks,
      addNotes,
      skipNotes
    };
  }

  function applyMergeImport(state, raw, opts) {
    const options = opts || {};
    const plan = planMergeImport(state, raw, options);
    if (!plan.ok) return plan;
    if (plan.destination === 'new' && !plan.categoryExists && !options.createCategory) {
      return Object.assign({}, plan, {ok:false, error:'Create the missing category, or choose an existing project.', needsCategory:true});
    }
    let project = plan.project;
    let createdCategory = '';
    if (plan.destination === 'new') {
      if (!plan.categoryExists) {
        const color = cleanColor(VIVID[plan.requestedCategory] || PRESETS[state.categories.length % PRESETS.length]);
        state.categories.push({name: plan.requestedCategory, color, icon:'grid', visible:true, colorBeforeV5: color});
        if (!state.categoryOrder.includes(plan.requestedCategory)) state.categoryOrder.push(plan.requestedCategory);
        createdCategory = plan.requestedCategory;
      }
      const cat = state.categories.find(c => c && String(c.name).toLowerCase() === plan.requestedCategory.toLowerCase());
      const id = uid();
      project = {id, name: plan.projectName, category: cat.name, notesText: plan.description, noteLog: []};
      state.projects.push(project);
      state.projectOrder.push(id);
    }
    const now = new Date().toISOString();
    for (const t of plan.addTasks) {
      state.tasks.unshift({
        id: uid(),
        title: t.title,
        notes: t.notes,
        category: project.category,
        projectId: project.id,
        priority: t.priority,
        dueDate: t.dueDate,
        checklist: t.checklist,
        status: t.completed ? 'completed' : 'open',
        reviewed: true,
        source: 'import',
        parentId: null,
        indent: 0,
        sourceIndex: 0,
        possibleDuplicate: false,
        completedAt: t.completed ? now : null,
        createdAt: now,
        updatedAt: now
      });
    }
    if (!Array.isArray(project.noteLog)) project.noteLog = [];
    for (const n of plan.addNotes) {
      project.noteLog.push({id: uid(), date: n.date, title: n.title, body: n.body, createdAt: now, updatedAt: now});
    }
    return {
      ok: true,
      project,
      createdCategory,
      createdProject: plan.destination === 'new',
      addedTasks: plan.addTasks.length,
      skippedTasks: plan.skipTasks.length,
      addedNotes: plan.addNotes.length,
      skippedNotes: plan.skipNotes.length
    };
  }

  function noteEntryHtml(n, projectId) {
    const dateLabel = n.date ? fmtDate(n.date) : 'No date';
    return `<article class="note-entry"><div class="note-entry-top"><time class="note-date">${esc(dateLabel)}</time><h3>${esc(n.title || 'Note')}</h3><div class="note-actions"><button class="btn btn-tiny" type="button" data-act="edit-note" data-id="${esc(n.id)}" data-project="${esc(projectId)}">Edit</button><button class="btn btn-tiny btn-danger" type="button" data-act="delete-note" data-id="${esc(n.id)}" data-project="${esc(projectId)}" aria-label="Delete note ${esc(n.title || 'entry')}">Delete</button></div></div>${n.body ? `<p class="note-body">${esc(n.body)}</p>` : ''}</article>`;
  }

  function importTaskLine(t) {
    return `<p>${esc(t.title)}${t.completed ? ' · completed' : ''}${t.dueDate ? ' · ' + esc(fmtDate(t.dueDate)) : ''} · ${esc(t.priority)}</p>`;
  }

  function importNoteLine(n) {
    const preview = n.body.length > 160 ? n.body.slice(0, 160) + '…' : n.body;
    return `<p><b>${n.date ? esc(fmtDate(n.date)) : 'No date'}${n.title ? ' · ' + esc(n.title) : ''}</b>${preview ? `<span class="subtle"> — ${esc(preview)}</span>` : ''}</p>`;
  }

  return {
    STORE, APP_VERSION, FOCUS_LIMIT, VIVID, PRESETS,
    uid, iso, esc, cleanColor, fmtDate, mapPriority, titleKey, noteKey,
    normalizeChecklist, normalizeFocus, normalize, normalizeStoredNote,
    bootstrapState, planMergeImport, applyMergeImport,
    noteEntryHtml, importTaskLine, importNoteLine
  };
});
