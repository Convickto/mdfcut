const CACHE_NAME = 'mdfcut-cache-v1';
const urlsToCache = [
  '/mdfcut/MdfCutPro-V5.html',
  '/mdfcut/manifest.json',
  '/mdfcut/icone-192x192.png',
  '/mdfcut/icone-512x512.png',
  '/mdfcut/style.css',
  '/mdfcut/script.js'
];

// Evento de instalação do Service Worker: Cacheia os arquivos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de 'fetch': Intercepta requisições de rede
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se o recurso estiver no cache, retorne-o
        if (response) {
          return response;
        }
        // Caso contrário, faça a requisição de rede
        return fetch(event.request);
      })
  );
});

// Evento de ativação: Limpa caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
