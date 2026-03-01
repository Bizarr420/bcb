// Service Worker para Validador de Billetes BCB
// Versión 1.0.0
// Fecha: Marzo 2026

const CACHE_NAME = 'bcb-validador-v1';
const STATIC_ASSETS = [
    '/bcb/index.html',
    '/bcb/css/style.css',
    '/bcb/js/app.js',
    '/bcb/manifest.json'
];

// No cachear Tesseract desde el inicio para evitar conflictos
// Se cacheará bajo demanda con estrategia network-first

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

// Estrategia de caché inteligente
self.addEventListener('fetch', (event) => {
    // Solo cachear requests GET
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);
    
    // Estrategia especial para Tesseract: network-first (siempre intentar red primero)
    if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'unpkg.com') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (!response || response.status !== 200) {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => cache.put(event.request, responseToCache));
                    return response;
                })
                .catch(() => {
                    // Si falla la red, intentar caché como fallback
                    return caches.match(event.request);
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
                    return fetch(event.request)
                        .then((response) => {
                            if (!response || response.status !== 200 || response.type === 'error') {
                                return response;
                            }

                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });

                            return response;
                        })
                        .catch((error) => {
                            console.error('[ServiceWorker] Error en fetch:', error);
                            throw error;
                        });
                })
        );
    }
});

// Escuchar mensajes del cliente (para actualizaciones de cache)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[ServiceWorker] Salteando espera, activando nuevo SW');
        self.skipWaiting();
    }
});
