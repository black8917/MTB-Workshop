/* Task Forge data core. Shared by the browser app and the Node test. No DOM. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TF = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORE_KEY = 'task-forge-v5.4-state';
  const V53_KEY = 'task-forge-v5.3-state';
  const V52_KEY = 'task-forge-v5-state';
  const FOCUS_LIMIT = 5;
  const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
  const VIVID = {
    Home: '#ffac56', Vehicles: '#61c5ff', 'Mountain Bikes': '#47e7ad', 'Outdoor & Snow': '#bc9aff',
    Fitness: '#ff83a6', Finances: '#ffd36b', Work: '#67aaff', Email: '#a89bff', Inbox: '#74cedf',
    Entertainment: '#dd87ff', 'Stuff To Sell': '#9de66b', 'To Do': '#ff695f', Health: '#5bd2ed'
  };

  const uid = () => globalThis.crypto?.randomUUID?.() || `tf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const iso = (d = new Date()) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  const parseDate = s => s ? new Date(`${s}T12:00:00`) : null;
  const addDays = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return iso(d); };
  const cleanColor = x => /^#[0-9a-fA-F]{6}$/.test(x || '') ? x : '#27d2f3';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function isMutedColor(hex) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return true;
    const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), light = (mx + mn) / 2;
    const sat = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * light - 1));
    return sat < .46;
  }

  function normalizeChecklist(items) {
    return Array.isArray(items)
      ? items.filter(i => i && typeof i.text === 'string' && i.text.trim()).map(i => ({
        id: typeof i.id === 'string' && i.id ? i.id : uid(),
        text: i.text.trim(),
        done: i.done === true
      }))
      : [];
  }

  function normalizeFocus(value, tasks, today = iso()) {
    const f = value && typeof value === 'object' ? value : {};
    const valid = new Set((tasks || []).filter(t => t.status !== 'deleted').map(t => t.id));
    const ids = Array.isArray(f.ids) ? [...new Set(f.ids)].filter(id => valid.has(id)).slice(0, FOCUS_LIMIT) : [];
    const carryoverIds = Array.isArray(f.carryoverIds)
      ? [...new Set(f.carryoverIds)].filter(id => (tasks || []).some(t => t.id === id && t.status === 'open') && !ids.includes(id))
      : [];
    return { date: /^\d{4}-\d{2}-\d{2}$/.test(f.date || '') ? f.date : today, ids, carryoverIds };
  }

  function normalizeNoteEntry(e) {
    if (!e || typeof e !== 'object') return null;
    const title = String(e.title ?? '').trim().slice(0, 200);
    const body = String(e.body ?? '').replace(/\r\n/g, '\n').trim().slice(0, 20000);
    if (!title && !body) return null;
    let date = e.date == null || e.date === '' ? null : String(e.date).trim();
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) date = null;
    const id = typeof e.id === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(e.id) ? e.id : uid();
    return { id, date, title, body };
  }

  function normalizeProjectNotes(raw) {
    if (typeof raw === 'string') return { text: raw.slice(0, 50000), entries: [] };
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const text = String(source.text ?? '').slice(0, 50000);
    const seen = new Set();
    const entries = [];
    for (const item of Array.isArray(source.entries) ? source.entries : []) {
      const entry = normalizeNoteEntry(item);
      if (!entry) continue;
      if (seen.has(entry.id)) entry.id = uid();
      seen.add(entry.id);
      entries.push(entry);
    }
    return { text, entries };
  }

  function noteFingerprint(n) {
    return `${n?.date || ''}\u0001${String(n?.title || '').trim()}\u0001${String(n?.body || '').replace(/\r\n/g, '\n').trim()}`;
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
    d.settings.autoGmailScan = d.settings.autoGmailScan !== false;
    d.categories.forEach(c => {
      if (!c.name) return;
      if (!c.colorBeforeV5) {
        c.colorBeforeV5 = c.color;
        if (d.settings.vivid && VIVID[c.name] && isMutedColor(c.color)) c.color = VIVID[c.name];
      }
      c.color = cleanColor(c.color);
      c.visible = c.visible !== false;
    });
    d.projects.forEach(p => {
      if (!p.id) p.id = uid();
      p.notes = normalizeProjectNotes(p.notes);
    });
    d.tasks.forEach(t => {
      if (!t.id) t.id = uid();
      t.status = t.status || 'open';
      if (t.reviewed == null) t.reviewed = false;
      if (t.category == null) t.category = 'Inbox';
      if (!t.priority) t.priority = 'normal';
      if (t.checklist !== undefined) t.checklist = normalizeChecklist(t.checklist);
    });
    d.habits.forEach(h => {
      if (!h.schedule) h.schedule = { frequency: 'daily', weekdays: [], monthDay: 1, anchorDate: iso() };
      if (!h.target) h.target = 1;
    });
    d.categoryOrder = [...new Set([...d.categoryOrder, ...d.categories.map(c => c.name)])].filter(name => d.categories.some(c => c.name === name));
    d.projectOrder = [...new Set([...d.projectOrder, ...d.projects.map(p => p.id)])].filter(id => d.projects.some(p => p.id === id));
    d.focus = normalizeFocus(d.focus, d.tasks);
    d.lastUpdatedAt = new Date().toISOString();
    return d;
  }

  function loadPersistedState(storage) {
    let state = null;
    let migratedFrom = null;
    try {
      const raw = storage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') state = normalize(parsed);
      }
    } catch (e) { state = null; }
    if (!state) {
      try {
        const v = storage.getItem(V53_KEY);
        if (v) {
          const d = JSON.parse(v);
          if (Array.isArray(d.tasks) && Array.isArray(d.categories)) {
            state = normalize(d);
            migratedFrom = 'v5.3';
          }
        }
      } catch (e) { /* try the next legacy key */ }
    }
    if (!state) {
      try {
        const prior = storage.getItem(V52_KEY);
        if (prior) {
          const parsed = JSON.parse(prior);
          if (Array.isArray(parsed.tasks) && Array.isArray(parsed.habits)) {
            state = normalize(parsed);
            migratedFrom = 'v5.2';
          }
        }
      } catch (e) { /* leave state empty so the starter backup can load */ }
    }
    let persisted = false;
    let error = null;
    if (state && migratedFrom) {
      try {
        storage.setItem(STORE_KEY, JSON.stringify(state));
        persisted = true;
      } catch (e) {
        error = e;
      }
    }
    return { state, migratedFrom, persisted, error };
  }

  function mapPriority(value) {
    const v = String(value ?? '').trim().toLowerCase();
    if (!v || v === 'medium' || v === 'med' || v === 'none') return 'normal';
    if (v === 'critical' || v === 'highest') return 'urgent';
    if (v === 'hi') return 'high';
    return PRIORITIES.includes(v) ? v : 'normal';
  }

  function normTitle(s) {
    return String(s || '').trim().toLowerCase();
  }

  function existingCategory(state, name) {
    const wanted = String(name || '').trim().toLowerCase();
    if (!wanted) return null;
    return state.categories.find(c => String(c.name || '').toLowerCase() === wanted) || null;
  }

  function canonicalCategoryName(state, name) {
    const trimmed = String(name || '').trim().slice(0, 90);
    if (!trimmed) return '';
    const found = existingCategory(state, trimmed);
    if (found) return found.name;
    const preset = Object.keys(VIVID).find(k => k.toLowerCase() === trimmed.toLowerCase());
    return preset || trimmed;
  }

  function categoryColorFor(name) {
    return VIVID[name] || VIVID[Object.keys(VIVID).find(k => k.toLowerCase() === String(name).toLowerCase())] || '#27d2f3';
  }

  function parseImportFile(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('This JSON is not a Task Forge import file.');
    if (raw.format !== 'task-forge-import') throw Error('Expected a task-forge-import file. Full backups still use Import backup.');
    if (Number(raw.version) !== 1) throw Error('Unsupported import version. This app reads version 1.');
    if (!raw.project || typeof raw.project !== 'object' || Array.isArray(raw.project)) throw Error('Import file is missing a project object.');
    const tasksIn = Array.isArray(raw.tasks) ? raw.tasks : [];
    const notesIn = Array.isArray(raw.notes) ? raw.notes : [];
    if (tasksIn.length > 5000) throw Error('Import has too many tasks (max 5000).');
    if (notesIn.length > 2000) throw Error('Import has too many notes (max 2000).');
    let skippedBlank = 0;
    const tasks = [];
    for (const t of tasksIn) {
      if (!t || typeof t !== 'object') { skippedBlank++; continue; }
      const title = String(t.title || '').trim().slice(0, 300);
      if (!title) { skippedBlank++; continue; }
      const due = t.dueDate == null || t.dueDate === '' ? null : String(t.dueDate).trim();
      tasks.push({
        title,
        notes: String(t.notes || '').trim().slice(0, 8000),
        priority: mapPriority(t.priority),
        dueDate: due && /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : null,
        checklist: normalizeChecklist(t.checklist),
        completed: t.completed === true || t.completed === 'true'
      });
    }
    const notes = [];
    for (const n of notesIn) {
      const entry = normalizeNoteEntry(n);
      if (entry) notes.push(entry);
      else skippedBlank++;
    }
    return {
      project: {
        name: String(raw.project.name || '').trim().slice(0, 120),
        category: String(raw.project.category || '').trim().slice(0, 90),
        description: String(raw.project.description || '').trim().slice(0, 4000)
      },
      tasks,
      notes,
      skippedBlank
    };
  }

  function textHasBlock(text, block) {
    const wanted = String(block || '').trim();
    if (!wanted) return false;
    return String(text || '').split(/\n\s*\n/).some(part => part.trim() === wanted) || String(text || '').trim() === wanted;
  }

  function planImport(state, file, choice) {
    const projectId = choice?.projectId || null;
    const target = projectId ? state.projects.find(p => p.id === projectId) : null;
    if (projectId && !target) throw Error('That project no longer exists.');
    const titles = new Set();
    if (target) {
      state.tasks.forEach(t => {
        if (t.projectId === target.id && t.status !== 'deleted') titles.add(normTitle(t.title));
      });
    }
    const fresh = [];
    const dupes = [];
    for (const t of file.tasks) {
      const key = normTitle(t.title);
      if (titles.has(key)) dupes.push(t);
      else { fresh.push(t); titles.add(key); }
    }
    const have = new Set();
    const existingEntries = target && target.notes && Array.isArray(target.notes.entries) ? target.notes.entries : [];
    existingEntries.forEach(e => have.add(noteFingerprint(e)));
    const noteNew = [];
    const noteDup = [];
    for (const n of file.notes) {
      const fp = noteFingerprint(n);
      if (have.has(fp)) noteDup.push(n);
      else { noteNew.push(n); have.add(fp); }
    }
    const requested = target ? target.category : (choice?.categoryOverride || file.project.category || '');
    const categoryName = canonicalCategoryName(state, requested);
    const categoryExists = !!(categoryName && existingCategory(state, categoryName));
    const currentText = target && target.notes && typeof target.notes === 'object' ? String(target.notes.text || '') : '';
    const descriptionAttach = !!(file.project.description && !textHasBlock(currentText, file.project.description));
    return {
      fresh, dupes, noteNew, noteDup,
      categoryName, categoryExists, isNew: !target, target,
      descriptionAttach, skippedBlank: file.skippedBlank || 0,
      projectLabel: target ? target.name : (file.project.name || 'New project')
    };
  }

  function previewImportMerge(state, file, choice) {
    return planImport(state, file, choice || {});
  }

  function applyImportMerge(state, file, choice) {
    const opts = choice || {};
    const next = normalize(state);
    let projectId = opts.projectId || null;
    let createdProject = false;
    let createdCategory = null;
    if (!projectId) {
      const name = file.project.name;
      if (!name) throw Error('This file has no project name. Choose an existing project.');
      const desired = opts.categoryOverride || file.project.category || '';
      if (!desired) throw Error('Choose a category for the new project.');
      if (opts.categoryOverride && !existingCategory(next, opts.categoryOverride)) throw Error('That category does not exist.');
      let category = canonicalCategoryName(next, desired);
      if (!existingCategory(next, category)) {
        if (!opts.createCategory) throw Error('Create the missing category or pick an existing one.');
        const color = categoryColorFor(category);
        next.categories.push({ name: category, color, icon: 'grid', visible: true, colorBeforeV5: color });
        next.categoryOrder.push(category);
        createdCategory = category;
      } else {
        category = existingCategory(next, category).name;
      }
      projectId = uid();
      next.projects.push({ id: projectId, name, category, notes: { text: '', entries: [] } });
      next.projectOrder.push(projectId);
      createdProject = true;
    }
    const plan = planImport(next, file, { projectId });
    const project = next.projects.find(p => p.id === projectId);
    const now = new Date().toISOString();
    for (const t of plan.fresh) {
      next.tasks.unshift({
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
    project.notes = normalizeProjectNotes(project.notes);
    if (plan.descriptionAttach && file.project.description) {
      const desc = file.project.description;
      project.notes.text = project.notes.text ? `${project.notes.text.replace(/\s+$/, '')}\n\n${desc}` : desc;
    }
    for (const n of plan.noteNew) {
      project.notes.entries.push({ id: uid(), date: n.date, title: n.title, body: n.body });
    }
    return {
      state: normalize(next),
      addedTasks: plan.fresh.length,
      skippedTasks: plan.dupes.length,
      addedNotes: plan.noteNew.length,
      skippedNotes: plan.noteDup.length,
      projectId: project.id,
      createdProject,
      createdCategory
    };
  }

  return {
    STORE_KEY, V53_KEY, V52_KEY, FOCUS_LIMIT, VIVID, PRIORITIES,
    uid, iso, parseDate, addDays, cleanColor, isMutedColor, esc,
    normalizeChecklist, normalizeFocus, normalizeNoteEntry, normalizeProjectNotes, noteFingerprint,
    normalize, loadPersistedState, mapPriority, parseImportFile, previewImportMerge, applyImportMerge
  };
});
