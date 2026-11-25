const CACHE='task-forge-v5.5';
const CORE=['./','./index.html','./styles.css?v=5.5','./logic.js?v=5.5','./app.js?v=5.5','./manifest.webmanifest','./icons/icon-192.png','./data/initial-backup.json'];
const OPTIONAL=['./icons/icon-180.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(async c=>{await c.addAll(CORE);await Promise.all(OPTIONAL.map(url=>c.add(url).catch(()=>{})))}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('task-forge-v5.4')||k.startsWith('task-forge-v5.5'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});
