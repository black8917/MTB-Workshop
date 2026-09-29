'use strict';

const APP_VERSION = '0.1.0';
const DB_NAME = 'BikeWorkshopPWA';
const DB_VERSION = 1;
let db;
let rides = [];
let todos = [];
let maintenance = [];
let progression = 'HI';
let baseline = 'fox';
let editingRideId = null;
let simpleMode = null;

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const uid = prefix => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;

const baseRides = [
  {id:'seed_20260930',date:'2026-09-30',createdAt:'2026-09-30T12:00:00',location:'Current setup',conditions:'',frontPsi:27,rearPsi:30,forkPsi:99,forkTravel:170,spacers:1,shockPsi:200,hsc:8,lsc:10,hsr:6,lsr:6,shockHsc:4,shockLsc:5,shockHsr:3,shockLsr:11,progression:'HI',notes:'Latest saved Bullit suspension setup. Shock LSC carried forward from Sep 9 because the Sep 30 note is blank.',after:{}},
  {id:'seed_20260909',date:'2026-09-09',createdAt:'2026-09-09T12:00:00',location:'Setup log',conditions:'',frontPsi:27,rearPsi:30,forkPsi:99,forkTravel:170,spacers:1,shockPsi:200,hsc:8,lsc:10,hsr:6,lsr:6,shockHsc:4,shockLsc:5,shockHsr:3,shockLsr:11,progression:'HI',notes:'Fork 99 psi · 1 volume spacer. Shock 200 psi.',after:{}},
  {id:'seed_20260701',date:'2026-07-01',createdAt:'2026-07-01T12:00:00',location:'Setup log',conditions:'',frontPsi:27,rearPsi:30,forkPsi:99,forkTravel:170,spacers:1,shockPsi:205,hsc:8,lsc:10,hsr:6,lsr:6,shockHsc:4,shockLsc:5,shockHsr:3,shockLsr:11,progression:'LO',notes:'Shock 205 psi in LO progression.',after:{}},
  {id:'seed_20260630',date:'2026-06-30',createdAt:'2026-06-30T12:00:00',location:'Setup log',conditions:'',frontPsi:27,rearPsi:30,forkPsi:99,forkTravel:170,spacers:1,shockPsi:205,hsc:5,lsc:10,hsr:6,lsr:6,shockHsc:5,shockLsc:8,shockHsr:3,shockLsr:8,progression:'LO',notes:'Fork HSC 5/11. Shock LSC 8, LSR 8.',after:{}},
  {id:'seed_20260629',date:'2026-06-29',createdAt:'2026-06-29T12:00:00',location:'Setup log',conditions:'',frontPsi:27,rearPsi:30,forkPsi:99,forkTravel:170,spacers:1,shockPsi:205,hsc:11,lsc:13,hsr:5,lsr:7,shockHsc:5,shockLsc:5,shockHsr:3,shockLsr:11,progression:'LO',notes:'Earlier firmer damping test.',after:{}},
  {id:'seed_20260428',date:'2026-04-28',createdAt:'2026-04-28T12:00:00',location:'Setup log',conditions:'',frontPsi:27,rearPsi:30,forkPsi:99,forkTravel:170,spacers:1,shockPsi:205,hsc:5,lsc:5,hsr:6,lsr:7,shockHsc:5,shockLsc:5,shockHsr:3,shockLsr:11,progression:'LO',notes:'Historical setup imported from Bullit note.',after:{}},
  {id:'seed_20260426',date:'2026-04-26',createdAt:'2026-04-26T12:00:00',location:'Setup log',conditions:'',frontPsi:27,rearPsi:30,forkPsi:90,forkTravel:170,spacers:1,shockPsi:205,hsc:5,lsc:8,hsr:4,lsr:6,shockHsc:5,shockLsc:5,shockHsr:3,shockLsr:11,progression:'LO',notes:'Historical setup imported from Bullit note.',after:{}},
  {id:'seed_20260208',date:'2026-02-08',createdAt:'2026-02-08T12:00:00',location:'Setup log',conditions:'',frontPsi:27,rearPsi:30,forkPsi:75,forkTravel:180,spacers:2,shockPsi:185,hsc:10,lsc:10,hsr:6,lsr:7,shockHsc:4,shockLsc:8,shockHsr:5,shockLsr:9,progression:'LO',notes:'Earlier 180 mm fork configuration.',after:{}}
];

const baseTodos = [
  {id:'todo_sag',text:'Check sag',detail:'Confirm fork and shock after current pressure changes',done:false,createdAt:'2026-09-29T10:00:00'},
  {id:'todo_rattle',text:'Check cable rattle',detail:'Front cockpit / hose routing',done:false,createdAt:'2026-09-29T10:01:00'},
  {id:'todo_chain',text:'Check chain noise',detail:'Noted around 7th gear',done:false,createdAt:'2026-09-29T10:02:00'},
  {id:'todo_dropper',text:'Tighten dropper',detail:'Recheck after next ride',done:false,createdAt:'2026-09-29T10:03:00'}
];

const baseMaintenance = [
  {id:'maint_20250622',date:'2025-06-22',category:'Cockpit',note:'Swapped OneUp carbon e-bike bars onto the Bullit.',createdAt:'2025-06-22T12:00:00'},
  {id:'maint_brakes',date:'2026-09-29',category:'Current build',note:'Shimano Saint brakes · TRP 223 mm rotors front/rear · TRP blue resin pads.',createdAt:'2026-09-29T12:00:00'}
];

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=e=>{
      const d=e.target.result;
      if(!d.objectStoreNames.contains('rides')) d.createObjectStore('rides',{keyPath:'id'});
      if(!d.objectStoreNames.contains('todos')) d.createObjectStore('todos',{keyPath:'id'});
      if(!d.objectStoreNames.contains('maintenance')) d.createObjectStore('maintenance',{keyPath:'id'});
      if(!d.objectStoreNames.contains('meta')) d.createObjectStore('meta',{keyPath:'key'});
    };
    req.onsuccess=e=>resolve(e.target.result);
    req.onerror=()=>reject(req.error);
  });
}
function tx(store,mode='readonly'){return db.transaction(store,mode).objectStore(store);}
function getAll(store){return new Promise((resolve,reject)=>{const r=tx(store).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});}
function put(store,obj){return new Promise((resolve,reject)=>{const r=tx(store,'readwrite').put(obj);r.onsuccess=()=>resolve(obj);r.onerror=()=>reject(r.error);});}
function del(store,key){return new Promise((resolve,reject)=>{const r=tx(store,'readwrite').delete(key);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});}
function clearStore(store){return new Promise((resolve,reject)=>{const r=tx(store,'readwrite').clear();r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});}

async function seedIfNeeded(){
  const existing=await getAll('rides');
  if(!existing.length){
    // Migrate the HTML prototype if it was used on the same origin.
    let migrated=[];
    try{ migrated=JSON.parse(localStorage.getItem('bikeAppRides')||'[]'); }catch(_){ }
    const seed=migrated.length ? migrated.map((r,i)=>({...r,id:r.id||uid('migrated'),createdAt:r.createdAt||`${r.date}T12:00:00`,after:r.after||{}})) : baseRides;
    for(const r of seed) await put('rides',r);
  }
  if(!(await getAll('todos')).length) for(const t of baseTodos) await put('todos',t);
  if(!(await getAll('maintenance')).length) for(const m of baseMaintenance) await put('maintenance',m);
  await put('meta',{key:'appVersion',value:APP_VERSION});
}

function sortRides(arr){return [...arr].sort((a,b)=>String(b.date).localeCompare(String(a.date)) || String(b.createdAt||'').localeCompare(String(a.createdAt||'')));}
function sortMaintenance(arr){return [...arr].sort((a,b)=>String(b.date).localeCompare(String(a.date)) || String(b.createdAt||'').localeCompare(String(a.createdAt||'')));}
async function reload(){
  rides=sortRides(await getAll('rides'));
  todos=await getAll('todos');
  maintenance=sortMaintenance(await getAll('maintenance'));
  renderAll();
}
const current=()=>rides[0]||baseRides[0];
function prettyDate(s){if(!s)return '—';const d=new Date(`${s}T12:00:00`);return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});}
function shortDate(s){if(!s)return '—';const d=new Date(`${s}T12:00:00`);return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});}

function go(screen){
  document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('active',x.id===screen));
  document.querySelectorAll('.navbtn').forEach(x=>x.classList.toggle('active',x.dataset.screen===screen));
  window.scrollTo({top:0,behavior:'smooth'});
  $('fab').style.display=screen==='bike'?'none':'grid';
}

function renderDashboard(){
  const c=current();
  $('dashSavedDate').textContent=shortDate(c.date);
  $('dashForkPsi').textContent=c.forkPsi;
  $('dashShockPsi').textContent=c.shockPsi;
  $('dashFrontPsi').textContent=c.frontPsi;
  $('dashRearPsi').textContent=c.rearPsi;
  $('dashHSC').textContent=`${c.hsc} / 11`;
  $('dashLSC').textContent=`${c.lsc} / 18`;
  $('dashLSR').textContent=`${c.lsr} / 15`;
  $('dashHSR').textContent=`${c.hsr} / 8`;
  $('dashShockHSC').textContent=c.shockHsc ?? '—';
  $('dashShockLSC').textContent=c.shockLsc ?? '—';
  $('dashShockHSR').textContent=c.shockHsr ?? '—';
  $('dashShockLSR').textContent=c.shockLsr ?? '—';
  $('dashProgression').textContent=c.progression||'—';
  const open=todos.filter(t=>!t.done).length;
  $('todoCountChip').textContent=`${open} to-do${open===1?'':'s'}`;

  const a=c.after||{};
  const afterBits=[a.overall,a.next?`Next: ${a.next}`:''].filter(Boolean);
  $('lastRideCard').innerHTML=`
    <div class="row"><div><div class="kicker">${esc(prettyDate(c.date))}</div><h3>${esc(c.location||'Saved setup')}</h3></div><div style="font-size:24px">›</div></div>
    <div class="chips"><span class="chip">Fork ${esc(c.forkPsi)} psi</span><span class="chip">Shock ${esc(c.shockPsi)} psi</span><span class="chip">${esc(c.progression)} progression</span></div>
    <div class="note" style="margin-top:10px;color:#cfd1d5;font-size:13px">${afterBits.length?esc(afterBits.join(' · ')):'Use this as the starting point for the next ride. Change only what you actually touch.'}</div>`;
}

function afterHasData(a={}){return !!(a.overall||a.bottom||a.forkTravel||a.shockTravel||a.feel||a.worked||a.didnt||a.next||a.notes);}
function renderRides(){
  $('rideList').innerHTML=rides.map((r,i)=>{
    const a=r.after||{};
    const after=afterHasData(a)?`<div class="after-summary"><div class="line"><strong>After ride${a.overall?` · ${esc(a.overall)}`:''}</strong></div>${a.feel?`<div class="line">${esc(a.feel)}</div>`:''}${a.next?`<div class="line"><strong>Next:</strong> ${esc(a.next)}</div>`:''}</div>`:'';
    return `<div class="ride-card">
      <div class="row"><div><div class="date">${esc(prettyDate(r.date))}</div><div class="meta">${esc(r.location||'Ride')}${r.conditions?` · ${esc(r.conditions)}`:''}</div></div>${i===0?'<span class="status-pill"><span class="status-dot"></span>Current</span>':''}</div>
      <div class="chips"><span class="chip">Fork ${esc(r.forkPsi)} psi</span><span class="chip">HSC ${esc(r.hsc)}/11</span><span class="chip">LSR ${esc(r.lsr)}/15</span><span class="chip">Shock ${esc(r.shockPsi)} psi</span><span class="chip">S LSR ${esc(r.shockLsr ?? '—')}</span><span class="chip">${esc(r.progression)}</span></div>
      ${r.notes?`<div class="note">${esc(r.notes)}</div>`:''}${after}
      <div class="ride-actions"><button data-edit-ride="${esc(r.id)}">${afterHasData(a)?'Edit ride':'Add after-ride notes'}</button></div>
    </div>`;
  }).join('')||'<div class="empty">No rides yet.</div>';
  document.querySelectorAll('[data-edit-ride]').forEach(b=>b.onclick=()=>openRide(b.dataset.editRide));
}

// Manufacturer references are deliberately source-specific. Unknown exact Bullit-tune values stay blank.
const forkBaseline={
  sc:{pressure:null,hsc:null,lsc:null,hsr:null,lsr:null,label:'Santa Cruz'},
  fox:{pressure:93,hsc:5,lsc:10,hsr:5,lsr:7,label:'FOX FLOAT'}
};
const shockBaseline={
  sc:{pressure:null,sag:null},
  fox:{pressure:null,sag:null}
};
function deltaText(y,b){if(b===null||b===undefined)return '—';const d=Number(y)-Number(b);return d===0?'0':`${d>0?'+':''}${d}`;}
function pos(v,max){return Math.max(3,Math.min(97,(Number(v)/max)*100));}
function comparisonRow(label,y,b,max,note,unit='',maxLabel=''){
  const has=b!==null&&b!==undefined;
  const d=has?Number(y)-Number(b):null;
  const cls=!has?'neutral':Math.abs(d)<=1?'good':'warn';
  const yDisplay=unit==='psi'?`${y} psi`:`${y}${maxLabel}`;
  const bDisplay=!has?'—':unit==='psi'?`${b} psi`:`${b}${maxLabel}`;
  const minePos=unit==='psi'?pos(y,140):pos(y,max);
  const basePos=has?(unit==='psi'?pos(b,140):pos(b,max)):50;
  return `<div class="compare-row"><div class="compare-top"><div class="setting">${esc(label)}</div><div class="your">${esc(yDisplay)}</div><div class="base">${esc(bDisplay)}</div><div class="delta ${cls}">${esc(deltaText(y,b))}</div></div><div class="barwrap"><div class="barfill" style="width:${minePos}%"></div>${has?`<div class="baseline" style="left:${basePos}%"></div>`:''}<div class="mine-dot" style="left:${minePos}%"></div></div><div class="row-note">${esc(note)}</div></div>`;
}
function renderSetup(){
  const c=current(),f=forkBaseline[baseline],s=shockBaseline[baseline];
  $('forkRows').innerHTML=
    comparisonRow('Air pressure',c.forkPsi,f.pressure,140,baseline==='fox'?'FOX 2026 38 FLOAT starting point shown for 170–180 lb. FOX also lists a separate E-Bike+ pressure; confirm exact fork chassis before treating this as your final pressure baseline.':'Santa Cruz does not publish a pressure target in the bike page currently stored in the app. Use sag and verified bike-specific setup data.','psi')+
    comparisonRow('HSC',c.hsc,f.hsc,11,baseline==='fox'?'FOX GRIP X2 generic start: 5 clicks OUT from closed.':'No Santa Cruz HSC value stored yet.','','/11')+
    comparisonRow('LSC',c.lsc,f.lsc,18,baseline==='fox'?'FOX GRIP X2 generic start: 10 clicks OUT from closed.':'No Santa Cruz LSC value stored yet.','','/18')+
    comparisonRow('HSR',c.hsr,f.hsr,8,baseline==='fox'?'FOX rebound table varies with rider weight/pressure; this reference is for the 170–180 lb row.':'No Santa Cruz HSR value stored yet.','','/8')+
    comparisonRow('LSR',c.lsr,f.lsr,15,baseline==='fox'?'FOX rebound table varies with rider weight/pressure; this reference is for the 170–180 lb row.':'No Santa Cruz LSR value stored yet.','','/15');
  $('shockRows').innerHTML=
    comparisonRow('Air pressure',c.shockPsi,s.pressure,300,baseline==='fox'?'No generic pressure target is applied here; the exact Float X2 tune should be set by sag/bike-specific guidance.':'No Santa Cruz pressure baseline stored yet.','psi')+
    `<div class="compare-row"><div class="compare-top"><div class="setting">Sag</div><div class="your">—</div><div class="base">—</div><div class="delta neutral">—</div></div><div class="row-note">Your imported note records a 28% / 18.2–19.5 mm shock-sag reference and 15–20% fork sag. It remains a saved reference until its exact source is confirmed.</div></div>`+
    `<div class="compare-row"><div class="compare-top"><div class="setting">Progression</div><div class="your">${esc(c.progression)}</div><div class="base">—</div><div class="delta neutral">—</div></div><div class="row-note">Stored with every ride so HI/LO changes remain visible in history.</div></div>`+
    `<div class="compare-row"><div class="compare-top"><div class="setting">HSC / LSC</div><div class="your">${esc(c.shockHsc ?? '—')} / ${esc(c.shockLsc ?? '—')}</div><div class="base">—</div><div class="delta neutral">—</div></div><div class="row-note">Exact manufacturer baseline for the Bullit-specific X2 tune is intentionally not guessed.</div></div>`+
    `<div class="compare-row"><div class="compare-top"><div class="setting">HSR / LSR</div><div class="your">${esc(c.shockHsr ?? '—')} / ${esc(c.shockLsr ?? '—')}</div><div class="base">—</div><div class="delta neutral">—</div></div><div class="row-note">Clicks OUT from fully closed.</div></div>`;
}

function renderTodos(){
  const sorted=[...todos].sort((a,b)=>Number(a.done)-Number(b.done)||String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  const open=sorted.filter(t=>!t.done).length;
  $('todoOpenCount').textContent=`${open} open`;
  $('todoList').innerHTML=sorted.map(t=>`<div class="todo ${t.done?'done':''}" data-todo="${esc(t.id)}"><button class="check" data-toggle-todo="${esc(t.id)}">${t.done?'✓':''}</button><div class="todo-main"><div class="text">${esc(t.text)}</div>${t.detail?`<div class="small">${esc(t.detail)}</div>`:''}</div><button class="todo-delete" data-delete-todo="${esc(t.id)}">×</button></div>`).join('')||'<div class="empty">Nothing on the list.</div>';
  document.querySelectorAll('[data-toggle-todo]').forEach(b=>b.onclick=async()=>{const t=todos.find(x=>x.id===b.dataset.toggleTodo);if(!t)return;t.done=!t.done;await put('todos',t);await reload();});
  document.querySelectorAll('[data-delete-todo]').forEach(b=>b.onclick=async()=>{if(confirm('Delete this to-do?')){await del('todos',b.dataset.deleteTodo);await reload();}});
}
function renderMaintenance(){
  $('maintenanceList').innerHTML=maintenance.map(m=>`<div class="ride-card"><div class="row"><div><div class="date">${esc(prettyDate(m.date))}</div><div class="meta">${esc(m.category||'Maintenance')}</div></div></div><div class="note">${esc(m.note)}</div></div>`).join('')||'<div class="empty">No maintenance entries yet.</div>';
}
function renderAll(){renderDashboard();renderRides();renderSetup();renderTodos();renderMaintenance();}

function clearRideForm(){
  ['afterOverall','afterBottom','afterForkTravel','afterShockTravel','afterFeel','afterWorked','afterDidnt','afterNext','afterNotes'].forEach(id=>{const el=$(id);if(el)el.value='';});
}
function setStep(id,v){$(id).textContent=(v??0);}
function fillRideForm(r){
  $('rideDate').value=r.date||new Date().toISOString().slice(0,10);
  $('location').value=r.location==='Current setup'||r.location==='Setup log'?'':(r.location||'');
  $('conditions').value=r.conditions||'Dry';
  $('rideNotes').value=r.notes||'';
  setStep('frontPsi',r.frontPsi);setStep('rearPsi',r.rearPsi);setStep('forkPsi',r.forkPsi);setStep('shockPsi',r.shockPsi);
  setStep('hsc',r.hsc);setStep('lsc',r.lsc);setStep('hsr',r.hsr);setStep('lsr',r.lsr);
  setStep('shockHsc',r.shockHsc??4);setStep('shockLsc',r.shockLsc??5);setStep('shockHsr',r.shockHsr??3);setStep('shockLsr',r.shockLsr??11);
  progression=r.progression||'HI';
  document.querySelectorAll('.progression').forEach(x=>x.classList.toggle('active',x.dataset.mode===progression));
  clearRideForm();
  const a=r.after||{};
  $('afterOverall').value=a.overall||'';$('afterBottom').value=a.bottom||'';$('afterForkTravel').value=a.forkTravel||'';$('afterShockTravel').value=a.shockTravel||'';$('afterFeel').value=a.feel||'';$('afterWorked').value=a.worked||'';$('afterDidnt').value=a.didnt||'';$('afterNext').value=a.next||'';$('afterNotes').value=a.notes||'';
  $('afterRideBlock').open=afterHasData(a);
}
function openRide(id=null){
  editingRideId=id;
  const isEdit=!!id;
  const r=isEdit?rides.find(x=>x.id===id):{...current(),id:null,date:new Date().toISOString().slice(0,10),location:'',conditions:'Dry',notes:'',after:{}};
  fillRideForm(r);
  document.querySelector('#rideModal h2').textContent=isEdit?'Edit ride':'New ride';
  document.querySelector('#rideModal .subhead').textContent=isEdit?'Update the setup or add after-ride notes.':'Prefilled from your current setup — change only what you touched.';
  $('saveRide').textContent=isEdit?'Save changes':'Save ride';
  $('rideModal').classList.add('open');
}
function closeRide(){$('rideModal').classList.remove('open');editingRideId=null;}
async function saveRide(){
  const old=editingRideId?rides.find(r=>r.id===editingRideId):null;
  const r={
    ...(old||{}),id:old?.id||uid('ride'),createdAt:old?.createdAt||new Date().toISOString(),
    date:$('rideDate').value||new Date().toISOString().slice(0,10),location:$('location').value.trim()||'Ride',conditions:$('conditions').value,notes:$('rideNotes').value.trim(),progression,
    frontPsi:Number($('frontPsi').textContent),rearPsi:Number($('rearPsi').textContent),forkPsi:Number($('forkPsi').textContent),forkTravel:old?.forkTravel||170,spacers:old?.spacers??1,shockPsi:Number($('shockPsi').textContent),
    hsc:Number($('hsc').textContent),lsc:Number($('lsc').textContent),hsr:Number($('hsr').textContent),lsr:Number($('lsr').textContent),shockHsc:Number($('shockHsc').textContent),shockLsc:Number($('shockLsc').textContent),shockHsr:Number($('shockHsr').textContent),shockLsr:Number($('shockLsr').textContent),
    after:{overall:$('afterOverall').value,bottom:$('afterBottom').value,forkTravel:$('afterForkTravel').value.trim(),shockTravel:$('afterShockTravel').value.trim(),feel:$('afterFeel').value.trim(),worked:$('afterWorked').value.trim(),didnt:$('afterDidnt').value.trim(),next:$('afterNext').value.trim(),notes:$('afterNotes').value.trim()}
  };
  await put('rides',r);closeRide();await reload();go('dashboard');
}

function openSimple(mode){
  simpleMode=mode;
  const fields=$('simpleFields');
  if(mode==='todo'){
    $('simpleTitle').textContent='Add to-do';$('simpleSub').textContent='Keep workshop tasks attached to the Bullit.';
    fields.innerHTML='<div class="field"><label>Task</label><input id="simpleText" type="text" placeholder="e.g. Recheck rear axle" /></div><div class="field"><label>Detail</label><textarea id="simpleDetail" placeholder="Optional note"></textarea></div>';
  }else{
    $('simpleTitle').textContent='Add maintenance';$('simpleSub').textContent='Record what you changed or serviced.';
    fields.innerHTML=`<div class="fieldgrid"><div class="field"><label>Date</label><input id="simpleDate" type="date" value="${new Date().toISOString().slice(0,10)}" /></div><div class="field"><label>Category</label><input id="simpleCategory" type="text" placeholder="Fork / brakes / drivetrain" /></div></div><div class="field"><label>Work performed</label><textarea id="simpleNote" placeholder="What did you do?"></textarea></div>`;
  }
  $('simpleModal').classList.add('open');
  setTimeout(()=>$('simpleText')?.focus(),100);
}
function closeSimple(){$('simpleModal').classList.remove('open');simpleMode=null;}
async function saveSimple(){
  if(simpleMode==='todo'){
    const text=$('simpleText').value.trim();if(!text)return;
    await put('todos',{id:uid('todo'),text,detail:$('simpleDetail').value.trim(),done:false,createdAt:new Date().toISOString()});
  }else if(simpleMode==='maintenance'){
    const note=$('simpleNote').value.trim();if(!note)return;
    await put('maintenance',{id:uid('maint'),date:$('simpleDate').value||new Date().toISOString().slice(0,10),category:$('simpleCategory').value.trim()||'Maintenance',note,createdAt:new Date().toISOString()});
  }
  closeSimple();await reload();
}

async function exportBackup(){
  const payload={format:'bike-workshop-pwa',version:APP_VERSION,exportedAt:new Date().toISOString(),bike:'2026 Santa Cruz Bullit GX Large',rides:await getAll('rides'),todos:await getAll('todos'),maintenance:await getAll('maintenance')};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`bike-workshop-bullit-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function importBackup(file){
  const text=await file.text();
  let payload;try{payload=JSON.parse(text);}catch(_){alert('That file is not valid JSON.');return;}
  if(!payload||!Array.isArray(payload.rides)){alert('This does not look like a Bike Workshop backup.');return;}
  if(!confirm('Replace the local Bike Workshop data on this device with this backup?'))return;
  for(const store of ['rides','todos','maintenance'])await clearStore(store);
  for(const r of payload.rides||[])await put('rides',{...r,id:r.id||uid('ride')});
  for(const t of payload.todos||[])await put('todos',{...t,id:t.id||uid('todo')});
  for(const m of payload.maintenance||[])await put('maintenance',{...m,id:m.id||uid('maint')});
  await reload();alert('Backup imported.');
}

function wireEvents(){
  document.querySelectorAll('.navbtn').forEach(b=>b.onclick=()=>go(b.dataset.screen));
  document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
  [$('headerAdd'),$('newRideMain'),$('newRideRides'),$('fab')].forEach(b=>b&&(b.onclick=()=>openRide()));
  $('cancelRide').onclick=closeRide;$('saveRide').onclick=saveRide;$('rideModal').onclick=e=>{if(e.target===$('rideModal'))closeRide();};
  document.querySelectorAll('.progression').forEach(b=>b.onclick=()=>{progression=b.dataset.mode;document.querySelectorAll('.progression').forEach(x=>x.classList.toggle('active',x===b));});
  document.querySelectorAll('.stepper').forEach(s=>{
    const [minus,,plus]=s.children,id=s.dataset.target,step=Number(s.dataset.step||1);
    const limits={hsc:[0,11],lsc:[0,18],hsr:[0,8],lsr:[0,15],frontPsi:[0,60],rearPsi:[0,60],forkPsi:[0,140],shockPsi:[0,350],shockHsc:[0,20],shockLsc:[0,20],shockHsr:[0,20],shockLsr:[0,30]};
    const change=dir=>{const el=$(id);let v=Number(el.textContent);v+=dir*step;const [min,max]=limits[id]||[0,999];v=Math.max(min,Math.min(max,v));el.textContent=Number.isInteger(v)?v:v.toFixed(1);};
    minus.onclick=e=>{e.preventDefault();change(-1);};plus.onclick=e=>{e.preventDefault();change(1);};
  });
  document.querySelectorAll('.baseline-btn').forEach(b=>b.onclick=()=>{baseline=b.dataset.baseline;document.querySelectorAll('.baseline-btn').forEach(x=>x.classList.toggle('active',x===b));renderSetup();});
  document.querySelectorAll('.spec-tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.spec-tab').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.subview').forEach(v=>v.classList.toggle('active',v.id===`spec-${b.dataset.specview}`));});
  const tq=$('torqueSearch');if(tq)tq.addEventListener('input',()=>{const q=tq.value.trim().toLowerCase();document.querySelectorAll('.torque-item').forEach(item=>{const hay=((item.dataset.search||'')+' '+item.textContent).toLowerCase();item.style.display=!q||hay.includes(q)?'grid':'none';});document.querySelectorAll('[data-torque-group]').forEach(g=>{g.style.display=[...g.querySelectorAll('.torque-item')].some(i=>i.style.display!=='none')?'block':'none';});});
  $('addTodoBtn').onclick=()=>openSimple('todo');$('addMaintenanceBtn').onclick=()=>openSimple('maintenance');$('simpleCancel').onclick=closeSimple;$('simpleSave').onclick=saveSimple;$('simpleModal').onclick=e=>{if(e.target===$('simpleModal'))closeSimple();};
  $('exportBtn').onclick=exportBackup;$('importBtn').onclick=()=>$('importFile').click();$('importFile').onchange=e=>{const f=e.target.files?.[0];if(f)importBackup(f);e.target.value='';};
}

async function init(){
  try{
    db=await openDB();await seedIfNeeded();wireEvents();await reload();
  }catch(err){console.error(err);alert('Bike Workshop could not open local storage. Try reloading the page.');}
  if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Service worker registration failed',err));}
}

document.addEventListener('DOMContentLoaded',init);
