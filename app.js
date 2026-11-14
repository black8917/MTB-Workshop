'use strict';

const APP_VERSION = '0.4.2';
const DB_NAME = 'BikeWorkshopPWA';
const DB_VERSION = 1;
let db;
let rides = [];
let todos = [];
let maintenance = [];
let activeBike = 'bullit';
let progression = 'LO';
let geometry = 'LO';
let setupOverride = null;
let editingSetup = false;
let baseline = 'sc';
let editingRideId = null;
let simpleMode = null;

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const uid = prefix => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;

const DEFAULT_CURRENT_SETUP = {
  "id": "bullit_current_20261113",
  "date": "2026-11-13",
  "createdAt": "2026-11-13T22:30:00",
  "location": "Current setup",
  "frontPsi": 23,
  "rearPsi": 25,
  "frontTire": "Schwalbe Shredda Rear Radial Gravity Pro Ultra Soft TLR 29×2.50",
  "rearTire": "Schwalbe Shredda Rear Radial Gravity Pro Ultra Soft TLR 27.5×2.50",
  "forkPsi": 97,
  "forkTravel": 170,
  "spacers": 1,
  "forkSagMm": null,
  "shockPsi": 205,
  "shockStroke": 65,
  "shockSagMm": null,
  "lastShockSagMm": 19,
  "hsc": 10,
  "lsc": 10,
  "hsr": 6,
  "lsr": 5,
  "shockHsc": 3,
  "shockLsc": 9,
  "shockHsr": 4,
  "shockLsr": 8,
  "progression": "LO",
  "geometry": "LO",
  "antiPedalKickbackDeg": 20,
  "notes": "Current setup reported Nov 13. Recheck shock sag after changing pressure to 205 psi and shock progression to LOW.",
  "after": {}
};


const BIKE_PROFILES={
 bullit:{label:'Bullit',name:'2026 Santa Cruz Bullit',sub:'Bullit 4 · MX 170',size:'Large',fork:'FOX 38 Performance Elite GRIP X2',shock:'2026 FOX FLOAT X2 · X01 tune',forkTravel:170,shockStroke:65,shockType:'air',limits:{hsc:11,lsc:18,hsr:8,lsr:15,shockHsc:9,shockLsc:19,shockHsr:7,shockLsr:16}},
 nomad:{label:'Nomad',name:'2023 Santa Cruz Nomad V6',sub:'Nomad V6 · Enduro',size:'Unverified',fork:'FOX 38 Performance Elite GRIP X2',shock:'Rear shock model to confirm',forkTravel:180,shockStroke:null,shockType:'air',limits:{hsc:11,lsc:18,hsr:8,lsr:15}},
 supreme:{label:'Supreme V5',name:'2026 Commencal Supreme DH V5',sub:'Supreme DH V5 · 220 rear',size:'Large (Aug 2026 record)',fork:'2027 FOX 40 Factory GRIP X2',shock:'RockShox Vivid Ultimate DH Coil 250×75',forkTravel:203,shockStroke:75,shockType:'coil',limits:{hsc:11,lsc:18,hsr:9,lsr:16}}
};
const FIRST_SETUP={
 nomad:{bikeId:'nomad',id:'nomad_current',date:'2026-11-14',location:'Current setup',frontPsi:null,rearPsi:null,frontTire:'Not recorded',rearTire:'Not recorded',forkPsi:85,forkTravel:180,spacers:1,forkSagMm:null,shockPsi:null,shockStroke:null,shockSagMm:null,shockType:'air',springRate:null,hbo:null,forkModel:'FOX 38 Performance Elite GRIP X2',shockModel:'Rear shock model to confirm',hsc:6,lsc:10,hsr:5,lsr:6,shockHsc:null,shockLsc:null,shockHsr:null,shockLsr:null,geometry:'Unrecorded',progression:'Unrecorded',notes:'Historical Nomad notes: fork recorded; rear shock, tires and remaining settings need verification.',after:{}},
 supreme:{bikeId:'supreme',id:'supreme_current',date:'2026-11-14',location:'Current setup',frontPsi:27,rearPsi:30,frontTire:'Model to confirm · CushCore front',rearTire:'Model to confirm',forkPsi:85,forkTravel:203,spacers:2,forkSagMm:null,shockPsi:null,shockStroke:75,shockSagMm:null,shockType:'coil',springRate:550,hbo:3,forkModel:'2027 FOX 40 Factory GRIP X2',shockModel:'RockShox Vivid Ultimate DH Coil 250×75',hsc:5,lsc:9,hsr:8,lsr:9,shockHsc:1,shockLsc:0,shockHsr:null,shockLsr:4,geometry:'HIGH',progression:'LINEAR',notes:'Latest recorded Supreme: 550 lb/in spring supersedes older 500; High/Linear. Earlier ~17% sag requires recheck.',after:{}}
};
const profile=()=>BIKE_PROFILES[activeBike];
const setupKey=(id=activeBike)=>id==='bullit'?'currentSetupV2':'currentSetupV4_'+id;
const displayNum=v=>Number.isFinite(v)?String(v):'—';
const nullableNum=v=>v===null||v===''||v===undefined?null:Number(v);
const fieldNumber=id=>{const t=$(id).textContent.trim();return t==='—'||t===''?null:Number(t);};


// Historical user notes; snapshots are setup logs, not actual rides.
// Fields absent from the note are kept unknown rather than carried forward.
const SUPREME_HISTORICAL_RAW=[
 {date:'2026-07-15',forkPsi:80,spacers:2,hsc:7,lsc:13,hsr:8,lsr:8,
  shockModel:'RockShox Vivid Select (new at time)',springRate:500,shockLsr:8,hbo:3,
  notes:'Rolled faster with higher pressure; hoped for more bite. Rebound too slow at 6, changed to 8. Fork LSC13 HSC7 LSR8 HSR8, 80 psi, 2 tokens. New Vivid Select basic, 500 lb spring, 1 turn preload, LSR8, HBO3. Tires: Albert Radial Ultra Soft Gravity front 21/26 psi and Tacky Chan Ultra Soft Gravity Pro rear 23/28 psi (pairs as recorded; exact selected PSI unknown).'},
 {date:'2026-07-16',forkPsi:79,spacers:2,hsc:7,lsc:13,hsr:8,lsr:8,
  springRate:500,shockLsc:3,shockHsc:3,shockLsr:4,hbo:3,historicalSagPct:17,
  notes:'Fork 79 psi, 2 tokens, LSC13 HSC7 LSR8 HSR8. Vivid Ultimate DH 500 lb spring, 17% sag, preload 1T, 7wt oil noted, LSC3 HSC3 LSR4 HBO3. Albert Radial Ultra Soft Gravity front 21/26 psi and Tacky Chan Ultra Soft Gravity Pro rear 23/28 psi (paired values not treated as single pressures).'},
 {date:'2026-07-18',forkPsi:86,spacers:2,hsc:5,lsc:9,hsr:8,lsr:9,
  springRate:500,shockLsc:0,shockHsc:1,shockLsr:4,hbo:3,historicalSagPct:17,
  frontPsi:27,rearPsi:30,frontTire:'Albert Radial Ultra Soft Gravity',rearTire:'Tacky Chan Ultra Soft Gravity Pro',
  notes:'Fork 86 psi, 2 tokens, LSC9 HSC5 LSR9/16 HSR8/9. Vivid Ultimate DH 500 lb spring, 17% sag, preload 1T, 7wt oil noted; LSC0 HSC1 LSR4/19 HBO3. Tires F27/R30.'},
 {date:'2026-07-23',forkPsi:86,spacers:1,hsc:5,lsc:9,hsr:7,lsr:9,
  springRate:550,shockLsc:2,shockHsc:2,shockLsr:4,hbo:2,
  frontPsi:25,rearPsi:28,frontTire:'Magic Mary Radial Ultra Soft Gravity',rearTire:'Tacky Chan Radial Ultra Soft Gravity Pro',
  ochainDeg:9,chainstayAdjustmentMm:6,barRollBackDeg:5,
  notes:'New O-Chain 9°, +6mm chainstay, bars rolled back 5°. Fork 86 psi, 1 token, LSC9 HSC5 LSR9/16 HSR7/9. Vivid Ultimate DH 550 lb spring, preload 1T, 7wt oil noted, LSC2 HSC2 LSR4/19 HBO2. Magic Mary F25 and Tacky Chan R28.'},
 {date:'2026-07-24',forkPsi:86,spacers:1,hsc:5,lsc:9,hsr:7,lsr:9,
  springRate:550,shockLsc:2,shockHsc:2,shockLsr:4,hbo:2,ochainDeg:9,
  notes:'New O-Chain 9°. Fork 86 psi, 1 token, LSC9 HSC5 LSR9/16 HSR7/9. Vivid Ultimate DH 550 lb spring, preload 1T, 7wt oil noted, LSC2 HSC2 LSR4/19 HBO2. Tire pressures not recorded.'},
 {date:'2026-07-26',forkPsi:86,spacers:1,hsc:5,lsc:9,hsr:7,lsr:9,
  springRate:550,shockLsc:1,shockHsc:2,shockLsr:3,hbo:1,
  notes:'Fork 86 psi, 1 token, LSC9 HSC5 LSR9/16 HSR7/9. Vivid Ultimate DH 550 lb spring, preload 1T, 7wt oil noted, LSC1 HSC2 LSR3/19 HBO1.'},
 {date:'2026-07-30',forkPsi:88,spacers:0,hsc:5,lsc:9,hsr:7,lsr:11,
  springRate:550,shockLsc:1,shockHsc:2,shockLsr:3,hbo:1,
  notes:'Fork 88 psi, 0 tokens, LSC9 HSC5 LSR11/16 HSR7/9. Vivid Ultimate DH 550 lb spring, preload 1T, 7wt oil noted, LSC1 HSC2 LSR3/19 HBO1.'},
 {date:'2026-08-16',forkPsi:88,spacers:0,hsc:9,lsc:10,hsr:6,lsr:10,
  springRate:550,shockLsc:2,shockHsc:2,shockLsr:3,hbo:1,
  frontPsi:24,rearPsi:26,frontTire:'Magic Mary Radial Ultra Soft Gravity',rearTire:'Tacky Chan Ultra Soft Gravity Pro',
  notes:'Fork 88 psi, 0 tokens, LSC10 HSC9 LSR10/16 HSR6/9. Vivid Ultimate DH 550 lb spring, preload 1T, 7wt oil noted, LSC2 HSC2 LSR3/19 HBO1. Magic Mary F24 psi / Tacky Chan R26 psi.'}
];
const SUPREME_HISTORICAL_SETUPS=SUPREME_HISTORICAL_RAW.map(r=>({
 ...FIRST_SETUP.supreme,...r,id:'supreme_history_'+r.date,bikeId:'supreme',recordType:'setup',
 location:'Historical suspension setup',createdAt:r.date+'T12:00:00',shockSagMm:null,shockHsr:null,
 frontPsi:Object.hasOwn(r,'frontPsi')?r.frontPsi:null,rearPsi:Object.hasOwn(r,'rearPsi')?r.rearPsi:null,
 frontTire:Object.hasOwn(r,'frontTire')?r.frontTire:'',rearTire:Object.hasOwn(r,'rearTire')?r.rearTire:'',
 after:{}
}));
const SUPREME_IMPORTED_TODOS=[
 'Refresh shock','Update clickers','Pads from V4 to V5','Blue pads installed',
 'Red brake pads','Springdex','Refresh fork','550lb Spring','Rotate bars back',
 'Untwist front brake','Bolt check','Clean','Magic Mary'
].map((title,i)=>({
 id:'supreme_imported_todo_'+String(i+1).padStart(2,'0'),bikeId:'supreme',
 text:title,detail:'Historical To Do entry; completion status has not been verified.',
 done:false,createdAt:'2026-08-16T12:'+String(i).padStart(2,'0')+':00'
}));

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
function getMeta(key){return new Promise((resolve,reject)=>{const r=tx('meta').get(key);r.onsuccess=()=>resolve(r.result?.value);r.onerror=()=>reject(r.error);});}
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
  // Upgrade: create a distinct editable current setup; do not mutate saved rides.
  if(!(await getMeta('currentSetupV2'))){
    const saved=sortRides(await getAll('rides'))[0];
    const chosen=saved && saved.date>DEFAULT_CURRENT_SETUP.date ? saved : DEFAULT_CURRENT_SETUP;
    await put('meta',{key:'currentSetupV2',value:chosen});
  }
  if(!(await getMeta('serviceMigrationV2'))){
    // Stable IDs avoid duplicate service items on subsequent launches.
    if(!(await getAll('maintenance')).some(m=>m.id==='maint_red_pads_20260930'))
      await put('maintenance',{id:'maint_red_pads_20260930',date:'2026-09-30',category:'Brakes',note:'Replaced TRP blue resin pads with red semi-metallic. Sanded rotors and wiped with isopropyl alcohol before bedding.',createdAt:'2026-09-30T19:12:00'});
    if(!(await getAll('todos')).some(t=>t.id==='todo_bosch_500008'))
      await put('todos',{id:'todo_bosch_500008',text:'Investigate Bosch fault 500008',detail:'After downhill coasting, cranks have sometimes spun without moving chainring; intermittent delayed engagement, clunk and whir.',done:false,createdAt:'2026-11-13T22:30:00'});
    await put('meta',{key:'serviceMigrationV2',value:true});
  }

  // Non-destructive v0.4 migration: untagged legacy records belong to Bullit.
  if(!(await getMeta('bikeMigrationV4'))){
    for(const store of ['rides','todos','maintenance']){
      for(const item of await getAll(store))if(!item.bikeId)await put(store,{...item,bikeId:'bullit'});
    }
    for(const id of ['nomad','supreme'])if(!(await getMeta(setupKey(id))))
      await put('meta',{key:setupKey(id),value:FIRST_SETUP[id]});
    await put('meta',{key:'bikeMigrationV4',value:true});
  }
  // v0.4.2: add historical Supreme setup logs and notes once, without touching
  // a more recent or user-edited Supreme current setup.
  if(!(await getMeta('supremeArchiveV042'))){
    const ridesById=new Set((await getAll('rides')).map(r=>r.id));
    for(const entry of SUPREME_HISTORICAL_SETUPS)if(!ridesById.has(entry.id))await put('rides',entry);
    const todosById=new Set((await getAll('todos')).map(t=>t.id));
    for(const entry of SUPREME_IMPORTED_TODOS)if(!todosById.has(entry.id))await put('todos',entry);
    await put('meta',{key:'supremeArchiveV042',value:true});
  }
  await put('meta',{key:'appVersion',value:APP_VERSION});
}

function sortRides(arr){return [...arr].sort((a,b)=>String(b.date).localeCompare(String(a.date)) || String(b.createdAt||'').localeCompare(String(a.createdAt||'')));}
function sortMaintenance(arr){return [...arr].sort((a,b)=>String(b.date).localeCompare(String(a.date)) || String(b.createdAt||'').localeCompare(String(a.createdAt||'')));}
async function reload(){
  rides=sortRides((await getAll('rides')).filter(r=>(r.bikeId||'bullit')===activeBike));
  todos=(await getAll('todos')).filter(t=>(t.bikeId||'bullit')===activeBike);
  maintenance=sortMaintenance((await getAll('maintenance')).filter(m=>(m.bikeId||'bullit')===activeBike));
  setupOverride=await getMeta(setupKey());
  renderAll();
}
const current=()=>setupOverride||rides[0]||(activeBike==='bullit'?DEFAULT_CURRENT_SETUP:FIRST_SETUP[activeBike]);
async function switchBike(id){
  if(!BIKE_PROFILES[id]||id===activeBike)return;
  activeBike=id;await put('meta',{key:'activeBikeV4',value:id});
  document.querySelectorAll('.bike-tab').forEach(b=>b.classList.toggle('active',b.dataset.bike===id));
  await reload();go('dashboard');
}
function prettyDate(s){if(!s)return '—';const d=new Date(`${s}T12:00:00`);return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});}
function shortDate(s){if(!s)return '—';const d=new Date(`${s}T12:00:00`);return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});}

function go(screen){
  document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('active',x.id===screen));
  document.querySelectorAll('.navbtn').forEach(x=>x.classList.toggle('active',x.dataset.screen===screen));
  window.scrollTo({top:0,behavior:'smooth'});
  $('fab').style.display=screen==='bike'?'none':'grid';
}

function renderDashboard(){
 const c=current(),p=profile(),coil=(c.shockType||p.shockType)==='coil';
 $('appBikeTitle').textContent=p.name;
 $('dashBikeTitle').textContent=p.sub;
 $('dashSavedDate').textContent=shortDate(c.date);
 $('dashForkDesc').textContent=(c.forkModel||p.fork)+' · '+(c.forkTravel||p.forkTravel)+' mm · '+displayNum(c.spacers)+' spacer';
 $('dashShockDesc').textContent=c.shockModel||p.shock;
 $('dashShockLabel').textContent=coil?'Spring':'Shock';
 $('dashShockUnit').textContent=coil?'lb/in':'psi';
 $('dashForkPsi').textContent=displayNum(c.forkPsi);
 $('dashShockPsi').textContent=coil?displayNum(c.springRate):displayNum(c.shockPsi);
 $('dashFrontPsi').textContent=displayNum(c.frontPsi);
 $('dashRearPsi').textContent=displayNum(c.rearPsi);
 $('dashFrontTire').textContent=c.frontTire||'Unrecorded';
 $('dashRearTire').textContent=c.rearTire||'Unrecorded';
 $('dashGeometry').textContent=c.geometry||'—';
 $('dashForkSag').textContent=Number.isFinite(c.forkSagMm)&&c.forkTravel?c.forkSagMm+' mm / '+(100*c.forkSagMm/c.forkTravel).toFixed(1)+'%':'Sag not measured';
 $('dashShockSag').textContent=Number.isFinite(c.shockSagMm)&&c.shockStroke?c.shockSagMm+' mm / '+(100*c.shockSagMm/c.shockStroke).toFixed(1)+'%':'Sag not measured';
 for(const [id,key] of [['dashHSC','hsc'],['dashLSC','lsc'],['dashHSR','hsr'],['dashLSR','lsr'],
  ['dashShockHSC','shockHsc'],['dashShockLSC','shockLsc'],['dashShockHSR','shockHsr'],['dashShockLSR','shockLsr']]){
   $(id).textContent=displayNum(c[key]);
 }
 for(const [id,key] of [['dashFMax','hsc'],['dashFlMax','lsc'],['dashFrMax','hsr'],['dashFlrMax','lsr']]){
   $(id).textContent='/ '+(p.limits[key]??'—');
 }
 $('dashProgression').textContent=c.progression||'—';
 $('dashHBO').textContent=coil?'HBO '+displayNum(c.hbo):'';
 $('dashHBO').style.display=coil?'':'none';
 $('dashBrakePads').textContent=c.brakePads||(activeBike==='bullit'?'TRP red semi-metallic':'Unrecorded');
 $('dashRotorSize').textContent=c.rotors||(activeBike==='bullit'?'TRP 223 / 223 mm':'Unrecorded');
 $('dashHub').textContent=activeBike==='bullit'?'20° last confirmed':'Unrecorded';
 $('dashSetupButton').textContent='Edit '+p.label+' setup';
 const open=todos.filter(t=>!t.done).length;
 $('todoCountChip').textContent=open+' to-do'+(open===1?'':'s');
 const last=rides.find(r=>r.recordType!=='setup')||c,a=last.after||{};
 const afterBits=[a.overall,a.next?'Next: '+a.next:''].filter(Boolean);
 const shockLabel=(last.shockType||p.shockType)==='coil'?
   displayNum(last.springRate)+' lb/in':displayNum(last.shockPsi)+' psi';
 $('lastRideCard').innerHTML='<div class="row"><div><div class="kicker">'+esc(prettyDate(last.date))+'</div><h3>'+esc(last.location||'Saved setup')+'</h3></div><div style="font-size:24px">›</div></div>'+
   '<div class="chips"><span class="chip">Fork '+esc(displayNum(last.forkPsi))+' psi</span><span class="chip">Shock '+esc(shockLabel)+'</span><span class="chip">'+esc(last.progression||'—')+'</span></div>'+
   '<div class="note" style="margin-top:10px;color:#cfd1d5;font-size:13px">'+(afterBits.length?esc(afterBits.join(' · ')):'Use this as the starting point for the next ride.')+'</div>';
}
function afterHasData(a={}){return !!(a.overall||a.bottom||a.forkTravel||a.shockTravel||a.feel||a.worked||a.didnt||a.next||a.notes);}
function renderRides(){
  $('rideList').innerHTML=rides.map((r,i)=>{
    const a=r.after||{};
    const after=afterHasData(a)?`<div class="after-summary"><div class="line"><strong>After ride${a.overall?` · ${esc(a.overall)}`:''}</strong></div>${a.feel?`<div class="line">${esc(a.feel)}</div>`:''}${a.next?`<div class="line"><strong>Next:</strong> ${esc(a.next)}</div>`:''}</div>`:'';
    return `<div class="ride-card">
      <div class="row"><div><div class="date">${esc(prettyDate(r.date))}</div><div class="meta">${esc(r.location||'Ride')}${r.conditions?` · ${esc(r.conditions)}`:''}</div></div>${r.recordType==='setup'?'<span class="status-pill">Setup notes</span>':i===rides.findIndex(x=>x.recordType!=='setup')?'<span class="status-pill"><span class="status-dot"></span>Latest ride</span>':''}</div>
      <div class="chips"><span class="chip">Fork ${esc(displayNum(r.forkPsi))} psi</span><span class="chip">HSC ${esc(displayNum(r.hsc))}</span><span class="chip">LSR ${esc(displayNum(r.lsr))}</span><span class="chip">Shock ${esc((r.shockType||profile().shockType)==='coil'?displayNum(r.springRate)+' lb/in':displayNum(r.shockPsi)+' psi')}</span><span class="chip">S LSR ${esc(displayNum(r.shockLsr))}</span><span class="chip">${esc(r.progression||'—')}</span></div>
      ${r.notes?`<div class="note">${esc(r.notes)}</div>`:''}${after}
      <div class="ride-actions"><button data-edit-ride="${esc(r.id)}">${afterHasData(a)?'Edit ride':'Add after-ride notes'}</button></div>
    </div>`;
  }).join('')||'<div class="empty">No rides yet.</div>';
  document.querySelectorAll('[data-edit-ride]').forEach(b=>b.onclick=()=>openRide(b.dataset.editRide));
}

// Santa Cruz suspension calculator snapshot: 185 lb rider, 2026 Bullit X01 AXS.
// The user's X2 came from this build. The fork reference is X01 Factory 38,
// whereas the installed fork is Performance Elite GRIP X2. Do not interpolate.
const SC_RIDER_LBS = 185;
const forkBaseline={
  sc:{pressure:104,hsc:4,lsc:5,hsr:6,lsr:7,label:'Santa Cruz Bullit X01 · 185 lb'},
  fox:{pressure:93,hsc:5,lsc:10,hsr:5,lsr:7,label:'FOX 38 generic'}
};
const shockBaseline={
  sc:{pressure:215,hsc:3,lsc:6,hsr:3,lsr:11,sagMin:28,sagMax:30},
  fox:{pressure:null}
};
// FOX 2026 FLOAT X2: click-out recommendations by shock air pressure (psi).
// Fields with two values are the range of recommended clicks.
const FOX_X2_BANDS=[
 {min:0,max:100,lsr:13,hsr:7,lsc:[11,13],hsc:[6,7]},
 {min:100,max:120,lsr:12,hsr:7,lsc:[11,13],hsc:[6,7]},
 {min:120,max:140,lsr:11,hsr:6,lsc:[11,13],hsc:[6,7]},
 {min:140,max:160,lsr:10,hsr:6,lsc:[9,10],hsc:[4,5]},
 {min:160,max:180,lsr:9,hsr:5,lsc:[9,10],hsc:[4,5]},
 {min:180,max:200,lsr:8,hsr:4,lsc:[9,10],hsc:[4,5]},
 {min:200,max:220,lsr:7,hsr:4,lsc:[9,10],hsc:[4,5]},
 {min:220,max:240,lsr:6,hsr:3,lsc:[9,10],hsc:[4,5]},
 {min:240,max:260,lsr:5,hsr:2,lsc:[7,8],hsc:[2,3]},
 {min:260,max:280,lsr:4,hsr:2,lsc:[7,8],hsc:[2,3]},
 {min:280,max:301,lsr:3,hsr:1,lsc:[7,8],hsc:[2,3]}
];
function foxX2Baseline(psi){
 return FOX_X2_BANDS.find(r=>psi>=r.min&&psi<r.max)||null;
}
function deltaText(y,b){if(b===null||b===undefined)return '—';const d=Number(y)-Number(b);return d===0?'0':`${d>0?'+':''}${d}`;}
function pos(v,max){return Math.max(3,Math.min(97,(Number(v)/max)*100));}
function comparisonRow(label,y,b,max,note,unit='',maxLabel=''){
  const has=b!==null&&b!==undefined;
  const d=has?Number(y)-Number(b):null;
  const cls=!has?'neutral':Math.abs(d)<=1?'good':'warn';
  const yDisplay=unit==='psi'?`${y} psi`:`${y}${maxLabel}`;
  const bDisplay=!has?'—':unit==='psi'?`${b} psi`:`${b}${maxLabel}`;
  const minePos=pos(y,max);
  const basePos=has?pos(b,max):50;
  return `<div class="compare-row"><div class="compare-top"><div class="setting">${esc(label)}</div><div class="your">${esc(yDisplay)}</div><div class="base">${esc(bDisplay)}</div><div class="delta ${cls}">${esc(deltaText(y,b))}</div></div><div class="barwrap"><div class="barfill" style="width:${minePos}%"></div>${has?`<div class="baseline" style="left:${basePos}%"></div>`:''}<div class="mine-dot" style="left:${minePos}%"></div></div><div class="row-note">${esc(note)}</div></div>`;
}
function comparisonRangeRow(label,y,range,max,note,maxLabel=''){
  if(!range)return comparisonRow(label,y,null,max,note,'',maxLabel);
  const [lo,hi]=range;
  const delta=y<lo?y-lo:y>hi?y-hi:0;
  const color=delta===0?'good':Math.abs(delta)<=1?'good':'warn';
  const mid=(lo+hi)/2;
  return '<div class="compare-row"><div class="compare-top"><div class="setting">'+esc(label)+'</div><div class="your">'+esc(y+maxLabel)+'</div><div class="base">'+esc(lo+'–'+hi+maxLabel)+'</div><div class="delta '+color+'">'+esc(delta===0?'0':(delta>0?'+':'')+delta)+'</div></div><div class="barwrap"><div class="barfill" style="width:'+pos(y,max)+'%"></div><div class="baseline" style="left:'+pos(mid,max)+'%"></div><div class="mine-dot" style="left:'+pos(y,max)+'%"></div></div><div class="row-note">'+esc(note)+'</div></div>';
}
function renderSetup(){
  if(activeBike!=='bullit'){renderOtherBikeSetup();return;}
  const c=current(),f=forkBaseline[baseline],s=shockBaseline[baseline];
  const sc=baseline==='sc',fox=sc?null:foxX2Baseline(Number(c.shockPsi));
  const clicks='All click counts OUT from fully clockwise closed. Positive compression Δ = softer; positive rebound Δ = faster.';
  $('suspensionReference').textContent=sc
    ?'Santa Cruz calculator · 185 lb · 2026 Bullit X01 AXS. Shock reference matches the X01 FLOAT X2 fitted to this bike; fork reference is the X01 Factory 38, not the installed Performance Elite.'
    :'FOX 2026 component manuals · generic setup. FLOAT X2 damping dynamically follows the current shock PSI; not a Bullit-specific recommendation.';
  $('forkRows').innerHTML=
    '<div class="compare-row"><div class="compare-top"><div class="setting">Sag</div><div class="your">'+(Number.isFinite(c.forkSagMm)?esc(c.forkSagMm+' mm / '+(c.forkSagMm/170*100).toFixed(1)+'%'):'Not measured')+'</div><div class="base">—</div><div class="delta neutral">—</div></div><div class="row-note">Measured mm as a percent of 170 mm fork travel.</div></div>'+
    comparisonRow('Air pressure',c.forkPsi,f.pressure,140,sc?'185 lb X01 Factory 38 pressure reference.':'FOX generic 38 pressure starting point.','psi')+
    comparisonRow('HSC',c.hsc,f.hsc,11,clicks,'','/11')+
    comparisonRow('LSC',c.lsc,f.lsc,18,clicks,'','/18')+
    comparisonRow('HSR',c.hsr,f.hsr,8,clicks,'','/8')+
    comparisonRow('LSR',c.lsr,f.lsr,15,clicks,'','/15');
  const pct=Number.isFinite(c.shockSagMm)?c.shockSagMm/65*100:null;
  const sagDelta=sc&&pct!==null?(pct<s.sagMin?(pct-s.sagMin).toFixed(1)+'%':pct>s.sagMax?'+'+(pct-s.sagMax).toFixed(1)+'%':'0'):'—';
  const sagCurrent=pct===null?'Recheck':c.shockSagMm+' mm / '+pct.toFixed(1)+'%';
  const sagBaseline=sc?s.sagMin+'–'+s.sagMax+'%':'—';
  const sagRow='<div class="compare-row"><div class="compare-top"><div class="setting">Sag</div><div class="your">'+esc(sagCurrent)+'</div><div class="base">'+esc(sagBaseline)+'</div><div class="delta neutral">'+esc(sagDelta)+'</div></div><div class="row-note">65 mm shock stroke. Previous 19 mm reading predates the 205 psi and LOW progression configuration.</div></div>';
  const foxRange=fox?'FOX 2026 FLOAT X2 at '+c.shockPsi+' psi (pressure band '+fox.min+'–'+(fox.max===301?300:fox.max)+'). ':'FOX X2 manual table is available for 0–300 psi. ';
  $('shockRows').innerHTML=
    comparisonRow('Air pressure',c.shockPsi,s.pressure,350,sc?'Santa Cruz X01 185 lb pressure starting point; confirm with measured sag.':'FOX suggests body weight in pounds as initial pressure, then adjust to proper sag.','psi')+
    sagRow+
    '<div class="compare-row"><div class="compare-top"><div class="setting">Geometry</div><div class="your">'+esc(c.geometry||'—')+'</div><div class="base">—</div><div class="delta neutral">—</div></div><div class="row-note">Chainstay flip chips.</div></div>'+
    '<div class="compare-row"><div class="compare-top"><div class="setting">Progression</div><div class="your">'+esc(c.progression||'—')+'</div><div class="base">—</div><div class="delta neutral">—</div></div><div class="row-note">Shock progression flip chip.</div></div>'+
    (sc?comparisonRow('HSC',c.shockHsc,s.hsc,9,clicks,'','/9')
        :comparisonRangeRow('HSC',c.shockHsc,fox?.hsc||null,9,foxRange+clicks,'/9'))+
    (sc?comparisonRow('LSC',c.shockLsc,s.lsc,19,clicks,'','/19')
        :comparisonRangeRow('LSC',c.shockLsc,fox?.lsc||null,19,foxRange+clicks,'/19'))+
    comparisonRow('HSR',c.shockHsr,sc?s.hsr:(fox?.hsr??null),7,(sc?'Santa Cruz X01. ':foxRange)+clicks,'','/7')+
    comparisonRow('LSR',c.shockLsr,sc?s.lsr:(fox?.lsr??null),16,(sc?'Santa Cruz X01. ':foxRange)+clicks,'','/16');
}
function otherRow(label,value,note){
 return '<div class="compare-row"><div class="compare-top"><div class="setting">'+esc(label)+'</div><div class="your">'+esc(value)+'</div><div class="base">—</div><div class="delta neutral">—</div></div><div class="row-note">'+esc(note)+'</div></div>';
}

const SUPREME_REFERENCES={
 commencal:{fork:{pressure:85,tokens:2,hsc:7,lsc:14,hsr:5,lsr:9},shock:{spring:500,hsc:2,lsc:2,lsr:7,hbo:1,sag:[20,25]}},
 manuals:{fork:{pressure:[76,87],tokens:2,hsc:5,lsc:10,hsr:6,lsr:6},shock:{spring:450,lsr:11,sag:[30,30]}}
};
function supremeRow(k,y,ref,unit='',note='',deltaAllowed=true){
 const yNum=Number.isFinite(y),refNum=Number.isFinite(ref),refRange=Array.isArray(ref);
 let diff=null;
 if(deltaAllowed&&yNum){
  if(refNum)diff=y-ref;
  else if(refRange&&ref.every(Number.isFinite))diff=y<ref[0]?y-ref[0]:y>ref[1]?y-ref[1]:0;
 }
 const df=diff===null?'—':diff===0?'0':(diff>0?'+':'')+diff;
 const b=refNum?String(ref):refRange?ref.join('–'):'—';
 return '<div class="compare-row"><div class="compare-top"><div class="setting">'+esc(k)+'</div><div class="your">'+esc(yNum?y+unit:'—')+'</div><div class="base">'+esc(b==='—'?b:b+unit)+'</div><div class="delta '+(diff===null?'neutral':Math.abs(diff)<=1?'good':'warn')+'">'+esc(df)+'</div></div><div class="row-note">'+esc(note)+'</div></div>';
}
function renderSupremeReference(){
 const c=current(),isCommencal=baseline==='sc',ref=SUPREME_REFERENCES[isCommencal?'commencal':'manuals'],f=ref.fork,r=ref.shock;
 $('suspensionReference').textContent=isCommencal
  ?'Commencal V5 85kg/187lb EXPERT: FOX Factory fork row and RockShox Ultimate shock row, combined for the installed mixed components.'
  :'FOX 40 GRIP X2 2026/2027 manual and user-provided RockShox generic 185lb/220mm/30% calculator. Generic setup is separate from Commencal.';
 const note='FOX fork clicks OUT from fully clockwise closed. More compression clicks = softer; more rebound clicks = faster.';
 const forkSag=Number.isFinite(c.forkSagMm)?Number((100*c.forkSagMm/(c.forkTravel||203)).toFixed(1)):null;
 $('forkRows').innerHTML=[
  supremeRow('Pressure',c.forkPsi,f.pressure,' psi','FOX 40 pressure starting point; confirm 15–20% fork sag.'),
  supremeRow('Tokens',c.spacers,f.tokens,'','203mm FOX 40 ships with 2 spacers; maximum 5.'),
  ...[['HSC',c.hsc,f.hsc],['LSC',c.lsc,f.lsc],['HSR',c.hsr,f.hsr],['LSR',c.lsr,f.lsr]].map(x=>supremeRow(x[0],x[1],x[2],' out',note)),
  supremeRow('Fork sag',forkSag,isCommencal?null:[15,20],'%','FOX 15–20% = about 30–41mm for 203mm travel.')
 ].join('');
 const sag=Number.isFinite(c.shockSagMm)&&c.shockStroke?Number((100*c.shockSagMm/c.shockStroke).toFixed(1)):null;
 const warning='RockShox compression adjusters use a center-zero reference in C1 service documentation; verify the adjuster convention before comparing exact HSC/LSC/HBO click offsets.';
 $('shockRows').innerHTML=[
  supremeRow('Spring',c.springRate,r.spring,' lb/in',isCommencal?'Commencal V5 expert target 500lb/in.':'Generic RockShox 30%-sag calculator shows 450lb/in; less bike-specific.'),
  supremeRow('Sag',sag,r.sag,'%','Commencal V5 20–25% = 15–18.75mm from 75mm stroke.'),
  supremeRow('HSC',c.shockHsc,r.hsc,'',warning,false),
  supremeRow('LSC',c.shockLsc,r.lsc,'',warning,false),
  supremeRow('Rebound',c.shockLsr,r.lsr,' out','Vivid Ultimate DH has one rebound adjustment.'),
  supremeRow('HBO',c.hbo,r.hbo,'',warning,false),
  otherRow('Geometry',c.geometry||'—','Current geometry'),otherRow('Progression',c.progression||'—','Current linkage progression')
 ].join('');
}

function renderOtherBikeSetup(){
 if(activeBike==='supreme'){renderSupremeReference();return;}
 const c=current(),p=profile(),stroke=c.shockStroke||p.shockStroke;
 $('suspensionReference').textContent=p.name+' · Current settings only. Manufacturer baseline not yet verified; never reuse Bullit-specific pressure, damping or torque values.';
 $('forkRows').innerHTML=[
  otherRow('Air pressure',displayNum(c.forkPsi)+' psi',c.forkModel||p.fork),
  otherRow('Sag',Number.isFinite(c.forkSagMm)&&c.forkTravel?c.forkSagMm+' mm / '+(100*c.forkSagMm/c.forkTravel).toFixed(1)+'%':'Not measured',(c.forkTravel||p.forkTravel)+' mm travel'),
  ...[['HSC',c.hsc],['LSC',c.lsc],['HSR',c.hsr],['LSR',c.lsr]].map(([k,v])=>otherRow(k,displayNum(v)+' out','Clicks OUT from fully closed'))
 ].join('');
 $('shockRows').innerHTML=[
  otherRow((c.shockType||p.shockType)==='coil'?'Spring rate':'Air pressure',(c.shockType||p.shockType)==='coil'?displayNum(c.springRate)+' lb/in':displayNum(c.shockPsi)+' psi',c.shockModel||p.shock),
  otherRow('Sag',Number.isFinite(c.shockSagMm)&&stroke?c.shockSagMm+' mm / '+(100*c.shockSagMm/stroke).toFixed(1)+'%':'Not measured',stroke?stroke+' mm stroke':'Enter shock stroke'),
  ...[['HSC',c.shockHsc],['LSC',c.shockLsc],['HSR',c.shockHsr],['LSR',c.shockLsr]].map(([k,v])=>otherRow(k,displayNum(v)+' out','Clicks OUT from fully closed')),
  ...((c.shockType||p.shockType)==='coil'?[otherRow('HBO',displayNum(c.hbo)+' out','Hydraulic bottom-out')]:[]),
  otherRow('Geometry',c.geometry||'—','Current frame configuration'),
  otherRow('Progression',c.progression||'—','Current suspension configuration')
 ].join('');
}
function renderProfileSpecs(){
 const bullit=activeBike==='bullit',c=current(),p=profile();
 const supreme=activeBike==='supreme';
 $('baselineSelector').style.display=bullit||supreme?'':'none';
 $('baselineBrandLabel').textContent=supreme?'Commencal · 185 lb':'Santa Cruz · 185 lb';
 $('baselineManualLabel').textContent=supreme?'FOX / RockShox':'FOX manual';
 $('supremeSourceLinks').style.display=supreme?'':'none';
 $('setupForkDesc').textContent=(c.forkModel||p.fork)+' · '+(c.forkTravel||p.forkTravel)+' mm';
 $('setupShockDesc').textContent=c.shockModel||p.shock;
 for(const el of document.querySelectorAll('#setup .assessment, #setup .tiny, #spec-components > details.component-detail')){
   el.style.display=bullit?'':'none';
 }
 for(const id of ['bullitFactoryTitle','bullitFrameTitle','bullitTorqueSearch','bullitBuildCard','bullitFactoryCard','bullitGeometryCard','bullitFrameFacts','torqueList']){
   const el=$(id);if(el)el.style.display=bullit?'':'none';
 }
 for(const id of ['otherBikeBuild','otherBikeGeometry','otherBikeTorque','otherBikeComponents']){
   const el=$(id);if(el)el.style.display=bullit?'none':'';
 }
 if(bullit)return;
 const rows=[
  ['Bike',p.name],['Recorded size',p.size],
  ['Fork',c.forkModel||p.fork],['Fork travel',displayNum(c.forkTravel||p.forkTravel)+' mm'],
  ['Rear shock',c.shockModel||p.shock],['Shock stroke',c.shockStroke?c.shockStroke+' mm':'Unrecorded'],
  ['Shock type',c.shockType||p.shockType],['Coil spring',(c.shockType||p.shockType)==='coil'?displayNum(c.springRate)+' lb/in':'N/A'],
  ['Front tire',c.frontTire||'Unrecorded'],['Rear tire',c.rearTire||'Unrecorded'],
  ['Brakes',c.brakePads||'Unrecorded'],['Rotors',c.rotors||'Unrecorded'],
  ['Geometry',c.geometry||'Unrecorded'],['Progression',c.progression||'Unrecorded']
 ];
 $('otherBikeBuild').innerHTML='<div class="card"><h3>'+esc(p.name)+'</h3><div class="spec-list">'+rows.map(([name,val])=>'<div class="spec-row"><span>'+esc(name)+'</span><strong>'+esc(val)+'</strong></div>').join('')+'</div><div class="data-note">These are previously recorded settings. Verify any uncertain components before relying on them.</div></div>';
 $('otherBikeGeometry').innerHTML='<div class="card"><h3>'+esc(p.label)+' geometry</h3><div class="spec-row"><span>Current geometry</span><strong>'+esc(c.geometry||'Unrecorded')+'</strong></div><div class="spec-row"><span>Progression</span><strong>'+esc(c.progression||'Unrecorded')+'</strong></div><div class="data-note">Manufacturer geometry reference pending verification.</div></div>';
 $('otherBikeTorque').innerHTML='<div class="card"><h3>Torque specs</h3><div class="data-note">Not yet verified for '+esc(p.label)+'. Bullit-specific torque values are hidden.</div></div>';
 $('otherBikeComponents').innerHTML='<div class="card"><h3>Components</h3><div class="spec-row"><span>Fork</span><strong>'+esc(c.forkModel||p.fork)+'</strong></div><div class="spec-row"><span>Rear shock</span><strong>'+esc(c.shockModel||p.shock)+'</strong></div><div class="data-note">Use Edit current setup on the dashboard to update components, then log work under Service.</div></div>';
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
function renderAll(){renderDashboard();renderRides();renderSetup();renderTodos();renderMaintenance();renderProfileSpecs();}

function clearRideForm(){
  ['afterOverall','afterBottom','afterForkTravel','afterShockTravel','afterFeel','afterWorked','afterDidnt','afterNext','afterNotes'].forEach(id=>{const el=$(id);if(el)el.value='';});
}
function setStep(id,v){$(id).textContent=displayNum(v);}
function fillRideForm(r){
  $('rideDate').value=r.date||new Date().toISOString().slice(0,10);
  $('location').value=r.location==='Current setup'||r.location==='Setup log'?'':(r.location||'');
  $('conditions').value=r.conditions||'Dry';
  $('rideNotes').value=r.notes||'';
  setStep('frontPsi',r.frontPsi);setStep('rearPsi',r.rearPsi);setStep('forkPsi',r.forkPsi);setStep('shockPsi',r.shockPsi);
  $('frontTireModel').value=r.frontTire||'';
  $('rearTireModel').value=r.rearTire||'';
  $('forkModel').value=r.forkModel||profile().fork;
  $('shockModel').value=r.shockModel||profile().shock;
  $('shockType').value=r.shockType||profile().shockType;
  $('shockSpringRate').value=Number.isFinite(r.springRate)?r.springRate:'';
  $('shockHbo').value=Number.isFinite(r.hbo)?r.hbo:'';
  $('forkTravelMm').value=r.forkTravel||profile().forkTravel||'';
  $('shockStrokeMm').value=r.shockStroke||profile().shockStroke||'';
  $('spacersInput').value=Number.isFinite(r.spacers)?r.spacers:'';
  $('forkTravelNote').textContent=r.forkTravel||profile().forkTravel||'—';
  $('shockStrokeNote').textContent=r.shockStroke||profile().shockStroke||'—';
  $('forkSagMm').max=r.forkTravel||profile().forkTravel||170;
  $('shockSagMm').max=r.shockStroke||profile().shockStroke||65;
  $('brakePads').value=r.brakePads||(activeBike==='bullit'?'TRP red semi-metallic':'');
  $('rotorSpecs').value=r.rotors||(activeBike==='bullit'?'TRP 223 / 223 mm':'');
  $('geometryText').value=r.geometry||'';
  $('progressionText').value=r.progression||'';
  $('nonBullitFlipFields').style.display=activeBike==='bullit'?'none':'';
  $('bullitFlipFields').style.display=activeBike==='bullit'?'':'none';
  updateShockTypeUI();
  $('forkSagMm').value=Number.isFinite(r.forkSagMm)?r.forkSagMm:'';
  $('shockSagMm').value=Number.isFinite(r.shockSagMm)?r.shockSagMm:'';
  updateSagDisplay();
  setStep('hsc',r.hsc);setStep('lsc',r.lsc);setStep('hsr',r.hsr);setStep('lsr',r.lsr);
  setStep('shockHsc',r.shockHsc);setStep('shockLsc',r.shockLsc);setStep('shockHsr',r.shockHsr);setStep('shockLsr',r.shockLsr);
  progression=r.progression||'LO';
  geometry=r.geometry||'LO';
  document.querySelectorAll('.progression').forEach(x=>x.classList.toggle('active',x.dataset.mode===progression));
  document.querySelectorAll('.geometry').forEach(x=>x.classList.toggle('active',x.dataset.mode===geometry));
  clearRideForm();
  const a=r.after||{};
  $('afterOverall').value=a.overall||'';$('afterBottom').value=a.bottom||'';$('afterForkTravel').value=a.forkTravel||'';$('afterShockTravel').value=a.shockTravel||'';$('afterFeel').value=a.feel||'';$('afterWorked').value=a.worked||'';$('afterDidnt').value=a.didnt||'';$('afterNext').value=a.next||'';$('afterNotes').value=a.notes||'';
  $('afterRideBlock').open=afterHasData(a);
}
function updateShockTypeUI(){
 const coil=$('shockType').value==='coil';
 $('shockSpringField').style.display=coil?'':'none';
 $('shockHboField').style.display=coil?'':'none';
 $('shockPsiField').style.display=coil?'none':'';
}
function updateSagDisplay(){
  for(const [field,out,stroke] of [['forkSagMm','forkSagPct',Number($('forkTravelMm').value)],['shockSagMm','shockSagPct',Number($('shockStrokeMm').value)]]){
    const v=$(field).value.trim();
    $(out).textContent=v!=='' && Number.isFinite(Number(v)) && stroke>0 ? (100*Number(v)/stroke).toFixed(1)+'%' : '—';
  }
}
function openCurrentSetup(){
  editingSetup=true;editingRideId=null;fillRideForm(current());
  document.querySelector('#rideModal h2').textContent='Edit '+profile().label+' setup';
  document.querySelector('#rideModal .subhead').textContent='Save settings without adding a ride to your history.';
  $('saveRide').textContent='Save setup';
  $('rideModal').classList.add('open');
}
function openRide(id=null){
  editingSetup=false;editingRideId=id;
  const isEdit=!!id;
  const r=isEdit?rides.find(x=>x.id===id):{...current(),id:null,date:new Date().toISOString().slice(0,10),location:'',conditions:'Dry',notes:'',after:{}};
  fillRideForm(r);
  document.querySelector('#rideModal h2').textContent=isEdit?'Edit ride':'New ride';
  document.querySelector('#rideModal .subhead').textContent=isEdit?'Update the setup or add after-ride notes.':'Prefilled from your current setup — change only what you touched.';
  $('saveRide').textContent=isEdit?'Save changes':'Save ride';
  $('rideModal').classList.add('open');
}
function closeRide(){$('rideModal').classList.remove('open');editingRideId=null;editingSetup=false;}
async function saveRide(){
  const old=editingRideId?rides.find(r=>r.id===editingRideId):null;
  const r={
    ...(old||current()),bikeId:activeBike,recordType:old?.recordType||'ride',id:old?.id||uid('ride'),createdAt:old?.createdAt||new Date().toISOString(),
    date:$('rideDate').value||new Date().toISOString().slice(0,10),location:$('location').value.trim()||'Ride',conditions:$('conditions').value,notes:$('rideNotes').value.trim(),progression:activeBike==='bullit'?progression:$('progressionText').value.trim(),geometry:activeBike==='bullit'?geometry:$('geometryText').value.trim(),frontTire:$('frontTireModel').value.trim(),rearTire:$('rearTireModel').value.trim(),forkSagMm:$('forkSagMm').value.trim()===''?null:Number($('forkSagMm').value),shockSagMm:$('shockSagMm').value.trim()===''?null:Number($('shockSagMm').value),shockStroke:nullableNum($('shockStrokeMm').value),forkModel:$('forkModel').value.trim(),shockModel:$('shockModel').value.trim(),shockType:$('shockType').value,springRate:nullableNum($('shockSpringRate').value),hbo:nullableNum($('shockHbo').value),brakePads:$('brakePads').value.trim(),rotors:$('rotorSpecs').value.trim(),
    frontPsi:fieldNumber('frontPsi'),rearPsi:fieldNumber('rearPsi'),forkPsi:fieldNumber('forkPsi'),forkTravel:nullableNum($('forkTravelMm').value),spacers:nullableNum($('spacersInput').value),shockPsi:fieldNumber('shockPsi'),
    hsc:fieldNumber('hsc'),lsc:fieldNumber('lsc'),hsr:fieldNumber('hsr'),lsr:fieldNumber('lsr'),shockHsc:fieldNumber('shockHsc'),shockLsc:fieldNumber('shockLsc'),shockHsr:fieldNumber('shockHsr'),shockLsr:fieldNumber('shockLsr'),
    after:{overall:$('afterOverall').value,bottom:$('afterBottom').value,forkTravel:$('afterForkTravel').value.trim(),shockTravel:$('afterShockTravel').value.trim(),feel:$('afterFeel').value.trim(),worked:$('afterWorked').value.trim(),didnt:$('afterDidnt').value.trim(),next:$('afterNext').value.trim(),notes:$('afterNotes').value.trim()}
  };
  if(editingSetup){
    const updated={...r,id:activeBike+'_current_user',date:new Date().toISOString().slice(0,10),createdAt:new Date().toISOString(),location:'Current setup',after:{}};
    await put('meta',{key:setupKey(),value:updated});
  }else{
    await put('rides',r);
    if(r.date>=current().date)await put('meta',{key:setupKey(),value:r});
  }
  closeRide();await reload();go('dashboard');
}

function openSimple(mode){
  simpleMode=mode;
  const fields=$('simpleFields');
  if(mode==='todo'){
    $('simpleTitle').textContent='Add to-do';$('simpleSub').textContent='Keep workshop tasks attached to the selected bike.';
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
    await put('todos',{id:uid('todo'),bikeId:activeBike,text,detail:$('simpleDetail').value.trim(),done:false,createdAt:new Date().toISOString()});
  }else if(simpleMode==='maintenance'){
    const note=$('simpleNote').value.trim();if(!note)return;
    await put('maintenance',{id:uid('maint'),bikeId:activeBike,date:$('simpleDate').value||new Date().toISOString().slice(0,10),category:$('simpleCategory').value.trim()||'Maintenance',note,createdAt:new Date().toISOString()});
  }
  closeSimple();await reload();
}

async function exportBackup(){
  const payload={format:'bike-workshop-pwa',version:APP_VERSION,exportedAt:new Date().toISOString(),bike:'all',activeBike,currentSetups:{bullit:await getMeta(setupKey('bullit')),nomad:await getMeta(setupKey('nomad')),supreme:await getMeta(setupKey('supreme'))},rides:await getAll('rides'),todos:await getAll('todos'),maintenance:await getAll('maintenance')};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`bike-workshop-all-bikes-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function importBackup(file){
  const text=await file.text();
  let payload;try{payload=JSON.parse(text);}catch(_){alert('That file is not valid JSON.');return;}
  if(!payload||!Array.isArray(payload.rides)){alert('This does not look like a Bike Workshop backup.');return;}
  const modern=!!payload.currentSetups;
  const message=modern?'Replace ALL THREE bikes and their local rides, service and settings with this backup?':'Older Bullit-only backup. Replace only Bullit records and leave other bikes unchanged?';
  if(!confirm(message))return;
  if(modern){
    for(const store of ['rides','todos','maintenance'])await clearStore(store);
    for(const [id,c] of Object.entries(payload.currentSetups))if(BIKE_PROFILES[id]&&c)await put('meta',{key:setupKey(id),value:c});
  }else{
    for(const store of ['rides','todos','maintenance']){
      for(const item of await getAll(store))if((item.bikeId||'bullit')==='bullit')await del(store,item.id);
    }
    await put('meta',{key:setupKey('bullit'),value:payload.currentSetup||sortRides(payload.rides)[0]||DEFAULT_CURRENT_SETUP});
  }
  for(const r of payload.rides||[])await put('rides',{...r,bikeId:r.bikeId||'bullit',id:r.id||uid('ride')});
  for(const t of payload.todos||[])await put('todos',{...t,bikeId:t.bikeId||'bullit',id:t.id||uid('todo')});
  for(const m of payload.maintenance||[])await put('maintenance',{...m,bikeId:m.bikeId||'bullit',id:m.id||uid('maint')});
  activeBike=modern&&BIKE_PROFILES[payload.activeBike]?payload.activeBike:'bullit';
  document.querySelectorAll('.bike-tab').forEach(b=>b.classList.toggle('active',b.dataset.bike===activeBike));
  await put('meta',{key:'activeBikeV4',value:activeBike});
  await reload();alert('Backup imported.');
}

function wireEvents(){
  document.querySelectorAll('.bike-tab').forEach(b=>b.onclick=()=>switchBike(b.dataset.bike));
  document.querySelectorAll('.navbtn').forEach(b=>b.onclick=()=>go(b.dataset.screen));
  document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
  [$('headerAdd'),$('newRideMain'),$('newRideRides'),$('fab')].forEach(b=>b&&(b.onclick=()=>openRide()));
  $('editCurrentSetup').onclick=openCurrentSetup;
  $('forkSagMm').oninput=updateSagDisplay;$('shockSagMm').oninput=updateSagDisplay;
  $('forkTravelMm').oninput=()=>{$('forkTravelNote').textContent=$('forkTravelMm').value||'—';updateSagDisplay();};
  $('shockStrokeMm').oninput=()=>{$('shockStrokeNote').textContent=$('shockStrokeMm').value||'—';updateSagDisplay();};
  $('shockType').onchange=updateShockTypeUI;
  document.querySelectorAll('.geometry').forEach(b=>b.onclick=()=>{geometry=b.dataset.mode;document.querySelectorAll('.geometry').forEach(x=>x.classList.toggle('active',x===b));});
  $('cancelRide').onclick=closeRide;$('saveRide').onclick=saveRide;$('rideModal').onclick=e=>{if(e.target===$('rideModal'))closeRide();};
  document.querySelectorAll('.progression').forEach(b=>b.onclick=()=>{progression=b.dataset.mode;document.querySelectorAll('.progression').forEach(x=>x.classList.toggle('active',x===b));});
  document.querySelectorAll('.stepper').forEach(s=>{
    const [minus,,plus]=s.children,id=s.dataset.target,step=Number(s.dataset.step||1);
    const p=profile();const limits={hsc:[0,p.limits.hsc??20],lsc:[0,p.limits.lsc??30],hsr:[0,p.limits.hsr??20],lsr:[0,p.limits.lsr??30],frontPsi:[0,60],rearPsi:[0,60],forkPsi:[0,200],shockPsi:[0,350],shockHsc:[0,p.limits.shockHsc??30],shockLsc:[0,p.limits.shockLsc??30],shockHsr:[0,p.limits.shockHsr??30],shockLsr:[0,p.limits.shockLsr??30]};
    const change=dir=>{const el=$(id);let v=Number(el.textContent);if(!Number.isFinite(v))v=0;v+=dir*step;const [min,max]=limits[id]||[0,999];v=Math.max(min,Math.min(max,v));el.textContent=Number.isInteger(v)?v:v.toFixed(1);};
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
    db=await openDB();await seedIfNeeded();wireEvents();activeBike=(await getMeta('activeBikeV4'))||'bullit';if(!BIKE_PROFILES[activeBike])activeBike='bullit';document.querySelectorAll('.bike-tab').forEach(b=>b.classList.toggle('active',b.dataset.bike===activeBike));await reload();
  }catch(err){console.error(err);alert('Bike Workshop could not open local storage. Try reloading the page.');}
  if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Service worker registration failed',err));}
}

document.addEventListener('DOMContentLoaded',init);
