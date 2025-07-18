const CACHE_NAME = 'mdfcut-cache-v1'; // Nome do cache (mude se fizer grandes atualizações)
const urlsToCache = [
  'MdfCutPro-V5.html',
  'manifest.json',
  'icone-192x192.png',
  'icone-512x512.png',
  'style.css',
  'script.js'
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
