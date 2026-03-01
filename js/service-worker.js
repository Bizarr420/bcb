// Service Worker para Validador de Billetes BCB
// Versión 1.0.0
// Fecha: Marzo 2026

const CACHE_NAME = 'bcb-validador-v1';
const STATIC_ASSETS = [
    '/bcb/index.html',
    '/bcb/css/style.css',
    '/bcb/js/app.js',
    '/bcb/manifest.json',
    'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js',
    'https://cdn.jsdelivr.net/npm/tesseract.js-core@v5.2.3/tesseract-core.wasm.js'
];

// Instalar el service worker y cachear archivos estáticos
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Cacheando archivos estáticos');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((error) => {
                console.error('[ServiceWorker] Error al cachear:', error);
            })
    );
    // Fuerza la activación del nuevo service worker
    self.skipWaiting();
});

// Activar el service worker y limpiar caches antiguos
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activando...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Toma control inmediatamente
    self.clients.claim();
});

// Estrategia Cache-First: sirve desde cache, si no existe intenta red
self.addEventListener('fetch', (event) => {
    // Solo cachear requests GET
    if (event.request.method !== 'GET') {
        return;
    }

    // Estrategia cache-first con fallback a red
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Si está en cache, devolverlo
                if (response) {
                    console.log('[ServiceWorker] Sirviendo desde cache:', event.request.url);
                    return response;
                }

                // Si no está en cache, intentar obtener de la red
                console.log('[ServiceWorker] Obteniendo de la red:', event.request.url);
                return fetch(event.request)
                    .then((response) => {
                        // Validar respuesta
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Clonar la respuesta antes de almacenarla
                        const responseToCache = response.clone();

                        // Almacenar en cache para futuro offline
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch((error) => {
                        // Si no hay conexión y no está en cache, retornar error
                        console.error('[ServiceWorker] Error en fetch:', error);
                        // Podría retornar una página de error personalizada aquí
                        throw error;
                    });
            })
    );
});

// Escuchar mensajes del cliente (para actualizaciones de cache)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[ServiceWorker] Salteando espera, activando nuevo SW');
        self.skipWaiting();
    }
});
