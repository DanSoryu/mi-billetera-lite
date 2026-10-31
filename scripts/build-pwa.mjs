import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const root = join(process.cwd(), 'dist');

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  }));
  return files.flat();
}

const files = (await filesIn(root)).filter((path) => !path.endsWith('.map') && !path.endsWith('sw.js')).sort();
const paths = files.map((path) => './' + relative(root, path).split(sep).join('/'));
const hash = createHash('sha256');
for (const file of files) {
  hash.update(relative(root, file));
  hash.update(await readFile(file));
}
const cacheName = `mi-billetera-lite-${hash.digest('hex').slice(0, 12)}`;
const worker = `const CACHE_NAME = ${JSON.stringify(cacheName)};
const APP_SHELL = ${JSON.stringify(paths, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('mi-billetera-lite-') && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const shell = await caches.match(new URL('./index.html', self.registration.scope));
      if (shell) return shell;
    }
    return fetch(request);
  })());
});
`;
await writeFile(join(root, 'sw.js'), worker);
console.log(`PWA lista: ${files.length} archivos en ${cacheName}`);
