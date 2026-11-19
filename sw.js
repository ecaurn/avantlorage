// Service worker minimal : le site reste jouable hors connexion après la première visite.
// Stratégie : écrire d’abord le cache applicatif (JS/CSS/HTML), et servir les médias depuis le cache
// une fois vus, avec repli réseau. Aucun média n’est préchargé d’office : 18 Mo ne doivent pas
// être imposés à un visiteur qui ne jouera peut-être pas.
const V='aulnes-v1', COQUILLE=['./','./index.html','./partage.jpg','./site.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(COQUILLE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  const media=/\/media\//.test(r.url);
  if(media){
    e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res.ok){const cl=res.clone();caches.open(V).then(c=>c.put(r,cl))}return res})));
    return;
  }
  // HTML et service worker : réseau d’abord, sinon cache — une mise à jour du site doit être vue tout de suite.
  if(/\/(|index\.html|sw\.js)$/.test(new URL(r.url).pathname)||r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{if(res.ok){const cl=res.clone();caches.open(V).then(c=>c.put(r,cl))}return res}).catch(()=>caches.match(r).then(h=>h||caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res.ok){const cl=res.clone();caches.open(V).then(c=>c.put(r,cl))}return res}).catch(()=>caches.match('./index.html'))));
});
