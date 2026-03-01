// Service Worker para Validador de Billetes BCB
// Versión 1.1.0 - Mejorado para mejor offline
// Fecha: Marzo 2026

const CACHE_NAME = 'bcb-validador-v1-1';
const CACHE_CDN = 'bcb-cdn-v1-1';
const STATIC_ASSETS = [
    '/bcb/index.html',
    '/bcb/css/style.css',
    '/bcb/js/app.js',
    '/bcb/manifest.json'
];

// URLs de CDN que se cachearán bajo demanda
const CDN_URLS = [
    'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js'
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
                    // Mantener solo los caches actuales
                    if (cacheName !== CACHE_NAME && cacheName !== CACHE_CDN) {
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

// Estrategia de caché inteligente
self.addEventListener('fetch', (event) => {
    // Solo cachear requests GET
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);
    
    // Estrategia especial para CDN (Tesseract): network-first con timeout
    if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'unpkg.com') {
        event.respondWith(
            fetchWithTimeout(event.request, 10000) // 10 segundos timeout
                .then((response) => {
                    if (!response || response.status !== 200) {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_CDN)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        })
                        .catch(e => console.warn('[ServiceWorker] Error cacheando CDN:', e));
                    return response;
                })
                .catch((error) => {
                    console.warn('[ServiceWorker] Error CDN, intentando cache:', error);
                    return caches.match(event.request)
                        .then(cached => cached || createOfflineResponse());
                })
        );
    } else {
        // Para archivos locales: estrategia cache-first
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        console.log('[ServiceWorker] Sirviendo desde cache:', event.request.url);
                        return response;
                    }

                    console.log('[ServiceWorker] Obteniendo de la red:', event.request.url);
                    return fetchWithTimeout(event.request, 5000)
                        .then((response) => {
                            if (!response || response.status !== 200 || response.type === 'error') {
                                return response;
                            }

                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                })
                                .catch(e => console.warn('[ServiceWorker] Error cacheando:', e));

                            return response;
                        })
                        .catch((error) => {
                            console.error('[ServiceWorker] Error en fetch, usando cache:', error);
                            return caches.match(event.request)
                                .then(cached => cached || createOfflineResponse());
                        });
                })
        );
    }
});

// Fetch con timeout
function fetchWithTimeout(request, timeout) {
    return Promise.race([
        fetch(request),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
        )
    ]);
}

// Respuesta offline placeholder
function createOfflineResponse() {
    return new Response('Offline - Recurso no disponible', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
            'Content-Type': 'text/plain'
        })
    });
}

// Escuchar mensajes del cliente (para actualizaciones de cache)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[ServiceWorker] Salteando espera, activando nuevo SW');
        self.skipWaiting();
    }
});
