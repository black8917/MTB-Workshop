import { CATEGORIES, DEMO_TASKS, SCHEMA_VERSION, STORAGE_KEY } from './data.js';
import { icon, hydrateIcons } from './icons.js';

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateToday = () => new Date().toLocaleDateString('en-CA', { year:'numeric',month:'2-digit',day:'2-digit' });
const asDay = value => value ? new Date(value+'T12:00:00') : null;
const prettyDate = value => value ? asDay(value).toLocaleDateString(undefined, {month:'short',day:'numeric',year:asDay(value).getFullYear()!==new Date().getFullYear()?'numeric':undefined}) : '';
const priorityScore = priority => ({urgent:4,high:3,normal:2,low:1})[priority] || 2;
const validCategory = category => CATEGORIES.some(c=>c.name===category) ? category : 'Inbox';
const plural = (n, unit) => n===1 ? `${n} ${unit}` : `${n} ${unit}s`;
const uniqueId = () => (typeof crypto!=='undefined' && typeof crypto.randomUUID==='function') ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const formatCount = n => new Intl.NumberFormat().format(n);
const DEFAULT_PREFERENCES = Object.freeze({
 showSummary: true,
 showCompletedStat: true,
 showFocus: true,
 showProjects: true,
 showReview: true,
 showPrivacy: true,
 showReviewBadges: true,
 showPriorityBadges: true,
 compactRows: false,
 focusCount: 6,
 defaultView: 'dashboard'
});
const normalizePreferences = input => {
 const source = input && typeof input==='object' && !Array.isArray(input) ? input : {};
 const output = {...DEFAULT_PREFERENCES};
 for(const [key,value] of Object.entries(DEFAULT_PREFERENCES)) {
  if(typeof value==='boolean' && typeof source[key]==='boolean')output[key]=source[key];
 }
 if([3,5,6,8,10].includes(Number(source.focusCount)))output.focusCount=Number(source.focusCount);
 if(['dashboard','tasks','inbox','projects'].includes(source.defaultView))output.defaultView=source.defaultView;
 return output;
};
const categoryMeta = category => CATEGORIES.find(c=>c.name===category) || CATEGORIES.at(-1);

function normalizedTask(task) {
 return {
  id: String(task.id || `new-${uniqueId()}`).slice(0,90),
  title: String(task.title || 'Untitled task').trim().slice(0,260),
  category: validCategory(task.category),
  priority: ['urgent','high','normal','low'].includes(task.priority) ? task.priority : 'normal',
  status: task.status==='completed' ? 'completed' : 'open',
  reviewed: Boolean(task.reviewed),
  notes: String(task.notes || '').slice(0,4000),
  dueDate: /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate||'') ? task.dueDate : null,
  parentId: task.parentId ? String(task.parentId).slice(0,90) : null,
  indent: Math.min(12,Math.max(0,Number(task.indent)||0)),
  source: String(task.source || 'Manual').slice(0,90),
  sourceIndex: Number(task.sourceIndex)||0,
  possibleDuplicate: Boolean(task.possibleDuplicate),
  completedAt: task.completedAt || null,
  updatedAt: task.updatedAt || null
 };
}
function demoState() {
 return {schemaVersion:SCHEMA_VERSION, source:'demo', importedAt:null, preferences:normalizePreferences(), tasks:DEMO_TASKS.map(normalizedTask)};
}
function restore() {
 try {
  const raw=localStorage.getItem(STORAGE_KEY);
  if (!raw) return demoState();
  const state=JSON.parse(raw);
  if (!Array.isArray(state.tasks)) return demoState();
  return {...state,schemaVersion:SCHEMA_VERSION,preferences:normalizePreferences(state.preferences),tasks:state.tasks.map(normalizedTask)};
 } catch(err) {
  console.warn('Cannot load saved data:',err);
  return demoState();
 }
}
let store=restore();
let currentView=store.preferences.defaultView;
let categoryFilter='all';
let taskFilter='open';
let sortOrder='smart';
let searchTerm='';
let showLimit=80;
let toastTimer;

function save() {
 try {localStorage.setItem(STORAGE_KEY,JSON.stringify(store));}
 catch(err) {toast('Device storage is full or unavailable. Export a backup now.',true);console.error(err);}
}
function toast(message,error=false) {
 const el=$('#toast');el.textContent=message;el.className=error?'show error':'show';
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.className='',4000);
}
const activeTasks = () => store.tasks.filter(t=>t.status==='open');
const completeTasks = () => store.tasks.filter(t=>t.status==='completed');
const reviewTasks = () => store.tasks.filter(t=>t.status==='open' && !t.reviewed);
const categoryCounts = name => store.tasks.filter(t=>t.category===name && t.status==='open').length;
const dueFlag = t => {
 if (!t.dueDate || t.status==='completed') return '';
 if (t.dueDate<dateToday())return 'overdue';
 if (t.dueDate===dateToday())return 'today';
 return '';
};
function sorted(tasks) {
 const copy=[...tasks];
 if(sortOrder==='newest') return copy.sort((a,b)=>(b.sourceIndex||0)-(a.sourceIndex||0));
 if(sortOrder==='alpha') return copy.sort((a,b)=>a.title.localeCompare(b.title));
 if(sortOrder==='category') return copy.sort((a,b)=>a.category.localeCompare(b.category)||a.title.localeCompare(b.title));
 return copy.sort((a,b)=>{
  let p=priorityScore(b.priority)-priorityScore(a.priority);
  if(p)return p;
  const ad=a.dueDate||'9999-99-99',bd=b.dueDate||'9999-99-99';
  if(ad!==bd)return ad.localeCompare(bd);
  return (a.sourceIndex||0)-(b.sourceIndex||0);
 });
}
function chrome() {
 const open=activeTasks();
 $('#nav-open-count').textContent=formatCount(open.length);
 $('#nav-inbox-count').textContent=formatCount(open.filter(t=>t.category==='Inbox').length);
 $$('[data-nav]').forEach(b=>{
  const selected=b.dataset.nav===currentView;
  b.classList.toggle('selected',selected);
  if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
 });
}
function sectionHeading(eyebrow,title,subtitle,extra='') {
 return `<div class="page-heading"><div><div class="eyebrow">${escapeHTML(eyebrow)}</div><h1>${escapeHTML(title)}</h1><p class="heading-subtitle">${escapeHTML(subtitle)}</p></div>${extra}</div>`;
}
function priorityBadge(t) {
 if(t.priority==='urgent')return '<span class="pill prio urgent">Urgent</span>';
 if(t.priority==='high')return '<span class="pill prio high">High</span>';
 if(t.priority==='low')return '<span class="pill prio low">Low</span>';
 return '<span class="pill prio normal">Normal</span>';
}
function categoryBadge(t) {let c=categoryMeta(t.category);return `<span class="cat-badge" style="--cat-color:${c.color}"><i></i>${escapeHTML(t.category)}</span>`;}
function taskRow(t,compact=false) {
 const completed=t.status==='completed';
 const flag=dueFlag(t);
 const pref=store.preferences;
 return `<div class="task-row ${completed?'completed':''} ${pref.compactRows?'compact-row':''}" data-id="${escapeHTML(t.id)}">
   <button type="button" class="task-check ${completed?'is-done':''}" data-action="toggle" data-id="${escapeHTML(t.id)}" aria-label="${completed?'Reopen':'Complete'} ${escapeHTML(t.title)}">${completed?icon('check',15):''}</button>
   <div class="task-body" data-action="edit" data-id="${escapeHTML(t.id)}" tabindex="0" role="button" aria-label="Edit ${escapeHTML(t.title)}">
     <div class="task-title">${escapeHTML(t.title)}</div>
     <div class="task-meta">${categoryBadge(t)}${t.dueDate?`<span class="date-text ${flag}">${icon('calendar',13)}${escapeHTML(prettyDate(t.dueDate))}</span>`:''}${pref.showReviewBadges && !t.reviewed && !completed?'<span class="review-chip">Needs review</span>':''}${t.possibleDuplicate?'<span class="duplicate-chip">Potential duplicate</span>':''}</div>
   </div>
   <div class="task-tail">${!compact && pref.showPriorityBadges?priorityBadge(t):''}<button type="button" class="icon-button task-edit" data-action="edit" data-id="${escapeHTML(t.id)}" aria-label="Edit task">${icon('chevron',17)}</button></div>
 </div>`;
}
function emptyState(title,body,actionLabel='',action=''){
 return `<div class="empty-state"><span class="empty-icon">${icon('inbox',30)}</span><h3>${escapeHTML(title)}</h3><p>${escapeHTML(body)}</p>${action?`<button class="btn btn-primary" data-action="${action}">${escapeHTML(actionLabel)}</button>`:''}</div>`;
}
function demoBanner() {
 return store.source==='demo' ? `<div class="demo-banner"><span>${icon('info',19)}</span><div><b>Demo workspace</b><p>Sample tasks are shown. Import your private OneNote JSON to replace them with your real list.</p></div><button class="btn btn-outline" data-nav="settings">Open Settings</button></div>` : '';
}
function dashboard() {
 const open=activeTasks(), complete=completeTasks(), review=reviewTasks(), pref=store.preferences;
 const high=open.filter(t=>['urgent','high'].includes(t.priority));
 const date=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
 const prioritized=sorted(open).slice(0,pref.focusCount);
 const categorized=CATEGORIES.filter(c=>categoryCounts(c.name)>0).sort((a,b)=>categoryCounts(b.name)-categoryCounts(a.name));
 const reviewedCount=open.length-review.length;
 const progress=open.length?Math.round(100*reviewedCount/open.length):100;
 const summaryCards = [
  `<div class="stat-card"><div class="stat-top">OPEN TASKS <span>${icon('list',18)}</span></div><div class="stat-value">${formatCount(open.length)}</div><div class="stat-foot">Things still to do</div></div>`,
  `<div class="stat-card"><div class="stat-top">NEEDS REVIEW <span>${icon('clock',18)}</span></div><div class="stat-value">${formatCount(review.length)}</div><div class="stat-foot">Imported items to confirm</div></div>`,
  `<div class="stat-card"><div class="stat-top">HIGH PRIORITY <span>${icon('flag',18)}</span></div><div class="stat-value">${formatCount(high.length)}</div><div class="stat-foot">Prioritized by you</div></div>`,
  ...(pref.showCompletedStat ? [`<div class="stat-card"><div class="stat-top">COMPLETED <span>${icon('checkcircle',18)}</span></div><div class="stat-value">${formatCount(complete.length)}</div><div class="stat-foot">Historical archive</div></div>`] : [])
 ];
 const focusPanel = pref.showFocus ? `<section class="panel focus-panel"><div class="panel-heading"><div><span class="eyebrow">PRIORITY QUEUE</span><h2>Focus tasks</h2></div><button class="inline-link" data-nav="tasks">View all ${icon('arrow',17)}</button></div>
 ${prioritized.length?`<div class="task-rows">${prioritized.map(t=>taskRow(t,true)).join('')}</div>`:emptyState('All clear','There are no open tasks.','Add a task','new')}
 ${open.length>pref.focusCount?`<button class="panel-footer-link" data-nav="tasks">See ${formatCount(open.length-pref.focusCount)} more open tasks ${icon('arrow',16)}</button>`:''}
 </section>` : '';
 const projectsPanel = pref.showProjects ? `<section class="panel projects-panel"><div class="panel-heading"><div><span class="eyebrow">BREAKDOWN</span><h2>By project</h2></div><button class="inline-link" data-nav="projects">All projects ${icon('arrow',17)}</button></div>
 ${categorized.length?categorized.slice(0,6).map(c=>`<button class="project-line" data-action="project" data-category="${escapeHTML(c.name)}"><span class="project-ico" style="--cat-color:${c.color}">${icon(c.icon,17)}</span><span class="project-name">${escapeHTML(c.name)}</span><span class="project-count">${categoryCounts(c.name)}</span><span class="project-bar"><span style="width:${Math.round(categoryCounts(c.name)/Math.max(open.length,1)*100)}%;background:${c.color}"></span></span></button>`).join(''):emptyState('No project tasks','Add or import tasks to see your project breakdown.')}
 </section>` : '';
 const reviewPanel = pref.showReview ? `<section class="panel review-panel"><span class="eyebrow">IMPORT HYGIENE</span><h2>Review progress</h2><div class="review-progress-line"><strong>${progress}%</strong><span>${reviewedCount} of ${open.length} verified</span></div><div class="progress-track"><div style="width:${progress}%"></div></div><p>Old unchecked items stay in your review queue until you confirm they are still relevant.</p><button class="btn btn-outline" data-action="reviewqueue">Review open tasks ${icon('arrow',15)}</button></section>` : '';
 const panels = pref.showFocus || pref.showProjects || pref.showReview;
 return `${sectionHeading('OVERVIEW','Your command center',`${date}  ·  ${store.source==='demo'?'Preview workspace':'Tasks ready'}`,
  `<button class="btn btn-outline heading-button" data-nav="settings">${icon('settings',17)} Customize dashboard</button>`)}
 ${demoBanner()}
 ${pref.showSummary?`<div class="stat-grid ${pref.showCompletedStat?'':'three-stats'}">${summaryCards.join('')}</div>`:''}
 ${panels?`<div class="content-grid ${!pref.showFocus || !(pref.showProjects||pref.showReview)?'solo':''}">
   ${focusPanel}${pref.showProjects || pref.showReview ? `<div class="right-stack">${projectsPanel}${reviewPanel}</div>`:''}
 </div>`:!pref.showSummary?emptyState('Your dashboard is clear','All dashboard panels are hidden. Enable them under Settings.','Open Settings','settings'):''}
 ${pref.showPrivacy?`<p class="privacy-foot">${icon('info',14)} Your data is saved locally in this browser. Export a backup; cloud synchronization is not yet enabled.</p>`:''}`;
}
function filterTasks() {
 let tasks=[...store.tasks];
 if(currentView==='archive'||taskFilter==='completed')tasks=tasks.filter(t=>t.status==='completed');
 else if(taskFilter==='open' || currentView==='inbox')tasks=tasks.filter(t=>t.status==='open');
 else if(taskFilter==='review')tasks=tasks.filter(t=>t.status==='open'&&!t.reviewed);
 else if(taskFilter==='high')tasks=tasks.filter(t=>t.status==='open' && ['urgent','high'].includes(t.priority));
 else if(taskFilter==='due')tasks=tasks.filter(t=>t.status==='open' && t.dueDate && t.dueDate<=new Date(Date.now()+7*86400000).toISOString().slice(0,10));
 if(currentView==='inbox') tasks=tasks.filter(t=>t.category==='Inbox');
 else if(categoryFilter!=='all')tasks=tasks.filter(t=>t.category===categoryFilter);
 if(searchTerm){const query=searchTerm.toLowerCase();tasks=tasks.filter(t=>`${t.title} ${t.notes} ${t.category}`.toLowerCase().includes(query));}
 return sorted(tasks);
}
function taskList() {
 const archive=currentView==='archive',inbox=currentView==='inbox';
 const filtered=filterTasks();
 const heading=archive?['ARCHIVE','Completed history',`${formatCount(completeTasks().length)} completed items, searchable and kept out of your active list.`]:inbox?['TRIAGE','Inbox',`Uncategorized tasks from your OneNote import.`]:['TASK MANAGER','All tasks','Find, prioritize, update, and complete tasks.'];
 return `${sectionHeading(...heading)}${demoBanner()}
 <section class="panel task-list-panel"><div class="list-toolbar">
   <div class="search-wrap">${icon('search',19)}<input id="task-search" type="search" placeholder="Search title, notes, category..." aria-label="Search tasks" value="${escapeHTML(searchTerm)}" /></div>
   <select id="category-select" aria-label="Filter category"><option value="all">All categories</option>${CATEGORIES.map(c=>`<option ${categoryFilter===c.name?'selected':''} value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('')}</select>
   <select id="sort-select" aria-label="Sort tasks"><option value="smart" ${sortOrder==='smart'?'selected':''}>Priority first</option><option value="newest" ${sortOrder==='newest'?'selected':''}>Newest in source</option><option value="alpha" ${sortOrder==='alpha'?'selected':''}>A to Z</option><option value="category" ${sortOrder==='category'?'selected':''}>By category</option></select>
  </div>
 ${archive||inbox?'':`<div class="filter-tabs">${[['open','Open'],['review','Needs review'],['high','High priority'],['due','Due in 7 days'],['completed','Completed'],['all','All']].map(([key,label])=>`<button data-action="filter" data-filter="${key}" class="filter-tab ${taskFilter===key?'active':''}">${label}</button>`).join('')}</div>`}
 <div class="list-label-row"><span>${formatCount(filtered.length)} ${filtered.length===1?'task':'tasks'} found</span><span>Tap a task to edit</span></div>
 <div class="task-rows">${filtered.length?filtered.slice(0,showLimit).map(t=>taskRow(t)).join(''):emptyState('No matching tasks','Try another filter or add a new task.','New task','new')}</div>
 ${filtered.length>showLimit?`<div class="load-more"><button class="btn btn-outline" data-action="more">Show more (${formatCount(filtered.length-showLimit)} remaining)</button></div>`:''}
 </section>`;
}
function projectPage() {
 const projects=CATEGORIES.map(c=>({...c,open:categoryCounts(c.name),done:store.tasks.filter(t=>t.category===c.name&&t.status==='completed').length})).filter(c=>c.open||c.done).sort((a,b)=>b.open-a.open);
 return `${sectionHeading('CATEGORIES','Project boards','Select a project to view and edit its tasks.')}${demoBanner()}
 <div class="project-grid">${projects.map(c=>`<button class="project-card" data-action="project" data-category="${escapeHTML(c.name)}">
 <div class="project-card-top"><span class="project-card-icon" style="--cat-color:${c.color}">${icon(c.icon,23)}</span>${icon('arrow',18)}</div>
 <h3>${escapeHTML(c.name)}</h3><div class="project-stats"><strong>${c.open}</strong> open <span>·</span> ${c.done} completed</div>
 <div class="project-bottom-bar"><span style="background:${c.color};width:${(c.open+c.done)?Math.round(c.done/(c.open+c.done)*100):0}%"></span></div>
 </button>`).join('')}</div>`;
}
const prefToggle = (key,title,description) => `<label class="setting-toggle"><span class="setting-toggle-copy"><b>${escapeHTML(title)}</b><small>${escapeHTML(description)}</small></span><input type="checkbox" role="switch" data-pref="${key}" ${store.preferences[key]?'checked':''} aria-label="${escapeHTML(title)}" /><span class="setting-switch" aria-hidden="true"></span></label>`;
function settingsPage() {
 const p=store.preferences;
 return `${sectionHeading('CUSTOMIZE','Settings','Dashboard preferences, backups and imports are managed here.')}
 <div class="settings-grid">
  <section class="panel settings-panel settings-panel-wide"><div class="setting-header">${icon('layout',22)}<div><h2>Dashboard panels</h2><p>Turn sections on or off without deleting any tasks.</p></div></div>
   <div class="setting-toggle-list">
    ${prefToggle('showSummary','Overview counters','Open, needs review and high-priority totals')}
    ${prefToggle('showCompletedStat','Completed counter','Show the completed archive count in the overview')}
    ${prefToggle('showFocus','Focus tasks','Show your highest-priority open items')}
    ${prefToggle('showProjects','Project breakdown','Show open tasks grouped by project')}
    ${prefToggle('showReview','Review progress','Show the progress of triaging imported items')}
    ${prefToggle('showPrivacy','Local storage notice','Show the reminder about device-only storage')}
   </div>
  </section>
  <section class="panel settings-panel"><div class="setting-header">${icon('settings',22)}<div><h2>Task display</h2><p>Control how task rows and priorities appear.</p></div></div>
   <div class="setting-toggle-list">
    ${prefToggle('showReviewBadges','Needs-review labels','Display labels on unverified imported tasks')}
    ${prefToggle('showPriorityBadges','Priority labels','Show priority chips in task lists')}
    ${prefToggle('compactRows','Compact task rows','Use tighter spacing to fit more items on screen')}
   </div>
   <div class="setting-controls">
    <label>Focus items<select data-pref-select="focusCount">${[3,5,6,8,10].map(n=>`<option value="${n}" ${p.focusCount===n?'selected':''}>${n} tasks</option>`).join('')}</select></label>
    <label>Start screen<select data-pref-select="defaultView">${[['dashboard','Dashboard'],['tasks','All tasks'],['inbox','Inbox'],['projects','Projects']].map(([key,label])=>`<option value="${key}" ${p.defaultView===key?'selected':''}>${label}</option>`).join('')}</select></label>
   </div>
   <button type="button" class="btn btn-outline settings-reset" data-action="reset-preferences">${icon('rotate',16)} Reset display settings</button>
  </section>
  <section class="panel settings-panel settings-panel-wide"><div class="setting-header">${icon('download',22)}<div><h2>Backup & import</h2><p>Keep a private copy of your tasks and customizations. Works without a cloud account.</p></div></div>
   <div class="settings-actions"><button class="btn btn-primary" data-action="export">${icon('download',17)} Download full backup</button><button class="btn btn-outline" data-action="import">${icon('upload',17)} Import JSON file</button></div>
   <div class="settings-muted">Backups include tasks and dashboard preferences. Import can <b>replace</b> or <b>merge</b> tasks. Existing v1 OneNote exports still work. A file is read on this device; it is not uploaded to a server.</div>
  </section>
  <section class="panel settings-panel"><div class="setting-header">${icon('info',22)}<div><h2>Current dataset</h2><p>Source: <b>${escapeHTML(store.source==='demo'?'Sample data':store.source)}</b></p></div></div>
   <div class="settings-stats"><div><b>${formatCount(store.tasks.length)}</b><small>Total</small></div><div><b>${formatCount(activeTasks().length)}</b><small>Open</small></div><div><b>${formatCount(completeTasks().length)}</b><small>Completed</small></div></div>
   ${store.importedAt?`<div class="settings-muted">Imported ${escapeHTML(new Date(store.importedAt).toLocaleString())}</div>`:''}
  </section>
  <section class="panel settings-panel"><div class="setting-header">${icon('info',22)}<div><h2>Sync status</h2><p>Local-only · Saved on this device</p></div></div><p class="settings-muted">Cloud sync and agent access aren't enabled yet. Back up before clearing browser data or changing devices.</p></section>
  <section class="panel settings-panel settings-panel-wide"><div class="setting-header">${icon('rotate',22)}<div><h2>Reset local workspace</h2><p>Only use this after making a backup. Resets tasks and preferences on this device.</p></div></div><button class="btn btn-danger-outline" data-action="reset">Reset local workspace</button></section>
 </div>`;
}
function render() {
 chrome();
 let content=currentView==='dashboard'?dashboard():currentView==='projects'?projectPage():currentView==='settings'?settingsPage():taskList();
 $('#main').innerHTML=content;
 hydrateIcons(document);
}
function nav(view){currentView=view;categoryFilter='all';taskFilter='open';searchTerm='';showLimit=80;render();window.scrollTo({top:0,behavior:'instant'});}
function updateTask(id,fn){const index=store.tasks.findIndex(t=>t.id===id);if(index<0)return;store.tasks[index]=normalizedTask(fn({...store.tasks[index]}));save();render();}
function toggleDone(id){updateTask(id,t=>({...t,status:t.status==='open'?'completed':'open',completedAt:t.status==='open'?new Date().toISOString():null,reviewed:true,updatedAt:new Date().toISOString()}));}
function taskEditor(id=null) {
 const existing=id?store.tasks.find(t=>t.id===id):null;
 const t=existing||{title:'',category:'Inbox',priority:'normal',status:'open',notes:'',dueDate:null,reviewed:true};
 $('#modal-root').innerHTML=`<div class="modal-shade" data-action="close"><div class="editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
 <div class="editor-head"><div><div class="eyebrow">${existing?'TASK DETAILS':'CREATE A TASK'}</div><h2 id="editor-title">${existing?'Edit task':'New task'}</h2></div><button class="icon-button" data-action="close" aria-label="Close editor">${icon('close',21)}</button></div>
 <form id="task-form"><div class="form-body">
  <label>Task name<input required maxlength="260" name="title" placeholder="What needs to be done?" value="${escapeHTML(t.title)}" /></label>
  <div class="form-pair"><label>Category<select name="category">${CATEGORIES.map(c=>`<option value="${escapeHTML(c.name)}" ${c.name===t.category?'selected':''}>${escapeHTML(c.name)}</option>`).join('')}</select></label>
  <label>Priority<select name="priority">${[['low','Low'],['normal','Normal'],['high','High'],['urgent','Urgent']].map(([key,text])=>`<option value="${key}" ${t.priority===key?'selected':''}>${text}</option>`).join('')}</select></label></div>
  <div class="form-pair"><label>Due date<input type="date" name="dueDate" value="${escapeHTML(t.dueDate||'')}" /></label><label>Status<select name="status"><option value="open" ${t.status==='open'?'selected':''}>Open</option><option value="completed" ${t.status==='completed'?'selected':''}>Completed</option></select></label></div>
  <label>Notes<textarea name="notes" rows="4" placeholder="Context, steps, or links...">${escapeHTML(t.notes||'')}</textarea></label>
  <label class="form-checkbox"><input type="checkbox" name="reviewed" ${t.reviewed?'checked':''} /> I've confirmed this task is still relevant</label>
  ${existing?.source==='OneNote PDF'?`<div class="source-detail">Imported from OneNote ${existing.sourceIndex?`· original item #${existing.sourceIndex}`:''}${existing.parentId?' · nested subtask':''}</div>`:''}
 </div><div class="editor-actions">${existing?`<button type="button" class="btn btn-danger-outline" data-action="delete" data-id="${escapeHTML(existing.id)}">${icon('trash',16)} Delete</button>`:''}<div class="editor-actions-right"><button type="button" class="btn btn-subtle" data-action="close">Cancel</button><button class="btn btn-primary" type="submit">${existing?'Save changes':'Add task'}</button></div></div></form>
 </div></div>`;
 const form=$('#task-form');
 form.dataset.id=id||'';
 form.addEventListener('submit',evt=>{
  evt.preventDefault();
  const fd=new FormData(form);const title=String(fd.get('title')||'').trim();if(!title)return;
  const wasCompleted=existing?.status==='completed';const nowCompleted=fd.get('status')==='completed';
  const out=normalizedTask({...existing,id:existing?.id||`manual-${uniqueId()}`,title,category:fd.get('category'),priority:fd.get('priority'),dueDate:fd.get('dueDate')||null,status:fd.get('status'),notes:fd.get('notes'),reviewed:fd.has('reviewed'),source:existing?.source||'Manual',completedAt:nowCompleted?(existing?.completedAt||new Date().toISOString()):null,updatedAt:new Date().toISOString()});
  if(existing){store.tasks=store.tasks.map(t=>t.id===existing.id?out:t);} else store.tasks.unshift(out);
  save();closeEditor();render();toast(existing?'Task saved':'Task added');
 });
 hydrateIcons($('#modal-root'));
 setTimeout(()=>$('#task-form [name="title"]')?.focus(),0);
}
function closeEditor(){$('#modal-root').innerHTML='';pendingImport=null;}
let pendingImport = null;
function importJSON(file){
 if(!file)return;
 if(file.size>10*1024*1024){toast('File too large (10 MB limit).',true);return;}
 file.text().then(raw=>{
  let parsed;
  try{parsed=JSON.parse(raw);}catch{throw Error('The file is not valid JSON.');}
  if(!parsed || ![1,2].includes(parsed.schemaVersion) || !Array.isArray(parsed.tasks))throw Error('Unsupported task file format.');
  if(parsed.tasks.length>20000)throw Error('Too many tasks in import.');
  const ids=new Set(), tasks=[];
  for(const input of parsed.tasks){
   if(typeof input!=='object'||input===null||Array.isArray(input))continue;
   const t=normalizedTask(input);
   if(ids.has(t.id))continue;
   ids.add(t.id);tasks.push(t);
  }
  if(!tasks.length)throw Error('This file has no tasks.');
  pendingImport={fileName:file.name,parsed,tasks};
  const open=tasks.filter(t=>t.status==='open').length;
  const duplicateIds=tasks.filter(t=>store.tasks.some(current=>current.id===t.id)).length;
  $('#modal-root').innerHTML=`<div class="modal-shade" data-action="close"><div class="editor import-editor" role="dialog" aria-modal="true" aria-labelledby="import-title">
  <div class="editor-head"><div><div class="eyebrow">RESTORE OR ADD TASKS</div><h2 id="import-title">Import preview</h2></div><button class="icon-button" data-action="close" aria-label="Cancel import">${icon('close',21)}</button></div>
  <div class="import-body"><p class="import-filename">${icon('upload',21)} ${escapeHTML(file.name)}</p>
  <div class="settings-stats"><div><b>${formatCount(tasks.length)}</b><small>In file</small></div><div><b>${formatCount(open)}</b><small>Open</small></div><div><b>${formatCount(tasks.length-open)}</b><small>Completed</small></div></div>
  <p class="settings-muted">${formatCount(duplicateIds)} task IDs already exist in this workspace.</p>
  <div class="import-option"><h3>Replace workspace</h3><p>Use the imported tasks instead of your existing list. If this is a Task Forge backup, restore its dashboard settings too.</p><button class="btn btn-primary" data-action="import-confirm" data-mode="replace">Replace with file</button></div>
  <div class="import-option"><h3>Merge tasks</h3><p>Keep your current tasks and settings. Add new task IDs from this file; existing task IDs are unchanged.</p><button class="btn btn-outline" data-action="import-confirm" data-mode="merge">Add missing tasks</button></div>
  <p class="import-warning">Before replacing an important list, download a backup from Settings.</p>
  </div></div></div>`;
  hydrateIcons($('#modal-root'));
 }).catch(e=>toast(`Import failed: ${e.message}`,true));
}
function commitImport(mode){
 if(!pendingImport)return;
 const {parsed,fileName,tasks}=pendingImport;
 if(mode==='replace'){
  store={schemaVersion:SCHEMA_VERSION,source:String(parsed.source||fileName).slice(0,100),importedAt:new Date().toISOString(),tasks,preferences:parsed.preferences ? normalizePreferences(parsed.preferences):normalizePreferences(store.preferences)};
 } else if(mode==='merge'){
  const ids=new Set(store.tasks.map(t=>t.id));
  const additions=tasks.filter(t=>!ids.has(t.id));
  store={...store,schemaVersion:SCHEMA_VERSION,source:store.source==='demo'?String(parsed.source||fileName).slice(0,100):store.source,importedAt:new Date().toISOString(),tasks:store.source==='demo'?tasks:[...store.tasks,...additions]};
 } else return;
 pendingImport=null;closeEditor();currentView='dashboard';categoryFilter='all';taskFilter='open';searchTerm='';showLimit=80;
 save();render();toast(`${mode==='merge'?'Merged':'Imported'} ${formatCount(store.tasks.length)} tasks (${formatCount(activeTasks().length)} open).`);
}
function downloadBackup(blob,name){
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=name;
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
 toast('Backup exported. Keep the JSON file somewhere safe.');
}
function exportJSON(){
 const exported={schemaVersion:SCHEMA_VERSION,source:store.source,exportedAt:new Date().toISOString(),preferences:normalizePreferences(store.preferences),tasks:store.tasks};
 const blob=new Blob([JSON.stringify(exported,null,2)],{type:'application/json'});
 const name=`task-forge-backup-${dateToday()}.json`;
 // The iOS Home Screen PWA can save the JSON in Files using the system Share sheet.
 if(typeof File==='function' && typeof navigator.share==='function' && typeof navigator.canShare==='function'){
  const file=new File([blob],name,{type:'application/json'});
  if(navigator.canShare({files:[file]})){
   navigator.share({title:'Task Forge backup',files:[file]}).catch(error=>{
    if(error?.name!=='AbortError')downloadBackup(blob,name);
   });
   return;
  }
 }
 downloadBackup(blob,name);
}
function handleAction(el) {
 const action=el.dataset.action,id=el.dataset.id;
 if(action==='toggle'){toggleDone(id);return;}
 if(action==='edit'){taskEditor(id);return;}
 if(action==='new'){taskEditor();return;}
 if(action==='import'){$('#import-file').click();return;}
 if(action==='settings'){nav('settings');return;}
 if(action==='export'){exportJSON();return;}
 if(action==='import-confirm'){commitImport(el.dataset.mode);return;}
 if(action==='reset-preferences'){store.preferences=normalizePreferences();save();render();toast('Dashboard display reset to defaults');return;}
 if(action==='filter'){taskFilter=el.dataset.filter;showLimit=80;render();return;}
 if(action==='more'){showLimit+=100;render();return;}
 if(action==='project'){currentView='tasks';categoryFilter=el.dataset.category;taskFilter='open';showLimit=80;render();return;}
 if(action==='reviewqueue'){currentView='tasks';categoryFilter='all';taskFilter='review';showLimit=80;render();return;}
 if(action==='close'){closeEditor();return;}
 if(action==='delete'){
  if(confirm('Delete this task? This cannot be undone unless you have a backup.')){store.tasks=store.tasks.filter(t=>t.id!==id);save();closeEditor();render();toast('Task deleted');}
  return;
 }
 if(action==='reset'){
  if(confirm('Reset this browser to sample data? Export a backup first; this removes current saved tasks and settings.')){store=demoState();save();nav('dashboard');toast('Workspace reset');}
 }
}
document.addEventListener('click',evt=>{
 const navEl=evt.target.closest('[data-nav]');if(navEl){nav(navEl.dataset.nav);return;}
 const actionEl=evt.target.closest('[data-action]');if(!actionEl)return;
 if(actionEl.classList.contains('modal-shade') && evt.target!==actionEl)return;
 handleAction(actionEl);
});
document.addEventListener('keydown',evt=>{
 if(evt.key==='Escape')closeEditor();
 if((evt.key==='Enter'||evt.key===' ')&&evt.target.matches('.task-body[role="button"]')){evt.preventDefault();taskEditor(evt.target.dataset.id);}
 if(evt.key==='/'&&!evt.target.closest('input,textarea,select')){$('#task-search')?.focus();evt.preventDefault();}
});
document.addEventListener('input',evt=>{
 if(evt.target.id==='task-search'){
  searchTerm=evt.target.value;showLimit=80;
  const caret=evt.target.selectionStart;
  render();const input=$('#task-search');input?.focus();try{input?.setSelectionRange(caret,caret);}catch{}
 }
});
document.addEventListener('change',evt=>{
 if(evt.target.id==='category-select'){categoryFilter=evt.target.value;showLimit=80;render();}
 if(evt.target.id==='sort-select'){sortOrder=evt.target.value;showLimit=80;render();}
 if(evt.target.id==='import-file'){importJSON(evt.target.files[0]);evt.target.value='';}
 if(evt.target.dataset.pref){store.preferences[evt.target.dataset.pref]=evt.target.checked;save();}
 if(evt.target.dataset.prefSelect){
  const key=evt.target.dataset.prefSelect;
  store.preferences[key]=key==='focusCount'?Number(evt.target.value):evt.target.value;
  store.preferences=normalizePreferences(store.preferences);
  save();
 }
});
render();
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(e=>console.info('Service worker unavailable:',e)));}