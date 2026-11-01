# Writes sw.js with a precache list of every site file and a content-hash version. Run from web_game/.
import os, hashlib
skip_dirs={'tools','screenshots','.git','tests'}
files=[]
for root,dirs,fs in os.walk('.'):
    dirs[:]=[d for d in dirs if d not in skip_dirs]
    for f in fs:
        p=os.path.relpath(os.path.join(root,f),'.')
        if p in ('sw.js',) or f.startswith('.') or p.endswith(('.md','.zip')) or p in ('LICENSE',) or p.startswith('licenses'): continue
        files.append(p)
files.sort()
h=hashlib.sha1()
for p in files: h.update(p.encode()); h.update(open(p,'rb').read())
ver=h.hexdigest()[:10]
lst=',\n  '.join("'./%s'"%p for p in files)
open('sw.js','w').write(f"""/* lotee service worker - precaches every asset so the game works fully offline. MIT. */
const VERSION = 'lotee-{ver}';
const ASSETS = [
  './',
  {lst}
];
self.addEventListener('install', e => {{
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
}});
self.addEventListener('activate', e => {{
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('lotee-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
}});
self.addEventListener('fetch', e => {{
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {{
    e.respondWith(caches.match('./index.html', {{ignoreSearch: true}}).then(r => r || fetch(req)).catch(() => caches.match('./')));
    return;
  }}
  e.respondWith(caches.match(req, {{ignoreSearch: true}}).then(hit => hit || fetch(req).then(res => {{
    if (res.ok && res.type === 'basic') {{ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }}
    return res;
  }})));
}});
""")
print(ver,len(files))
