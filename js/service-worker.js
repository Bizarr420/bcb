// Service Worker para Validador de Billetes BCB
// Versión 1.2.0 - Mejorado para offline robusto
// Fecha: Marzo 2026

const CACHE_NAME = 'bcb-validador-v1-2';
const CACHE_CDN = 'bcb-cdn-v1-2';
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
                    if (!cacheName.includes('bcb-validador-v1-2') && !cacheName.includes('bcb-cdn-v1-2')) {
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

// Estrategia de caché mejorada
self.addEventListener('fetch', (event) => {
    // Solo cachear requests GET
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);
    
    // Estrategia especial para CDN (Tesseract): cache-first con network fallback
    if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'unpkg.com') {
        event.respondWith(
            caches.open(CACHE_CDN)
                .then((cache) => {
                    return cache.match(event.request)
                        .then((response) => {
                            if (response) {
                                console.log('[ServiceWorker] Sirviendo CDN desde cache:', event.request.url);
                                // Intentar actualizar en background
                                fetchWithTimeout(event.request, 10000)
                                    .then((networkResponse) => {
                                        if (networkResponse && networkResponse.status === 200) {
                                            cache.put(event.request, networkResponse.clone());
                                        }
                                    })
                                    .catch(() => {
                                        console.log('[ServiceWorker] No se pudo actualizar CDN, usando cache');
                                    });
                                return response;
                            }

                            // Si no está en cache, intentar de red
                            return fetchWithTimeout(event.request, 15000)
                                .then((networkResponse) => {
                                    if (!networkResponse || networkResponse.status !== 200) {
                                        throw new Error('Respuesta de red inválida');
                                    }
                                    
                                    // Cachear para futuros usos
                                    cache.put(event.request, networkResponse.clone());
                                    return networkResponse;
                                })
                                .catch((error) => {
                                    console.error('[ServiceWorker] Error CDN:', error);
                                    return createOfflineResponse('Librería OCR no disponible offline');
                                });
                        });
                })
        );
    } else {
        // Para archivos locales: cache-first con network fallback
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        console.log('[ServiceWorker] Sirviendo desde cache:', event.request.url);
                        return response;
                    }

                    console.log('[ServiceWorker] Obteniendo de la red:', event.request.url);
                    return fetchWithTimeout(event.request, 8000)
                        .then((networkResponse) => {
                            if (!networkResponse || networkResponse.status !== 200) {
                                throw new Error('Respuesta de red inválida');
                            }

                            // Cachear para futuros usos
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                })
                                .catch(e => console.warn('[ServiceWorker] Error cacheando:', e));

                            return networkResponse;
                        })
                        .catch((error) => {
                            console.error('[ServiceWorker] Error en fetch:', error);
                            
                            // Para archivos críticos, intentar servir alternativa
                            if (event.request.url.includes('app.js')) {
                                return createOfflineResponse('Aplicación no disponible offline');
                            }
                            if (event.request.url.includes('style.css')) {
                                return createCSSResponse();
                            }
                            if (event.request.url.includes('index.html')) {
                                return caches.match('/bcb/index.html');
                            }
                            
                            return createOfflineResponse('Recurso no disponible offline');
                        });
                })
        );
    }
});

// Fetch con timeout mejorado
function fetchWithTimeout(request, timeout) {
    return Promise.race([
        fetch(request),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout de red')), timeout)
        )
    ]);
}

// Respuesta offline para recursos críticos
function createOfflineResponse(message = 'Recurso no disponible offline') {
    return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Modo Offline</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                .offline-container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .icon { font-size: 48px; margin-bottom: 20px; }
                h2 { color: #667eea; margin-bottom: 10px; }
                p { color: #666; line-height: 1.5; }
                .retry-btn { background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="offline-container">
                <div class="icon">📱</div>
                <h2>Modo Offline</h2>
                <p>${message}</p>
                <p>Verifica tu conexión y recarga la página.</p>
                <button class="retry-btn" onclick="window.location.reload()">Reintentar</button>
            </div>
        </body>
        </html>
    `, {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
            'Content-Type': 'text/html'
        })
    });
}

// CSS fallback básico
function createCSSResponse() {
    return new Response(`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
        header { background: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px; }
        h1 { color: #333; margin-bottom: 10px; }
        main { max-width: 500px; margin: 0 auto; }
        .controls { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        button, input { padding: 15px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
        button { background: #667eea; color: white; }
        input { background: white; color: #333; border: 2px solid #667eea; }
        .result-item { background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #ccc; }
        .result-item.ok { border-left-color: #48bb78; }
        .result-item.bad { border-left-color: #f56565; }
        .result-item.error { border-left-color: #ecc94b; }
        footer { background: white; padding: 15px; border-radius: 12px; text-align: center; margin-top: 20px; }
        .legal { font-size: 14px; color: #666; }
    `, {
        status: 200,
        headers: new Headers({
            'Content-Type': 'text/css'
        })
    });
}

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[ServiceWorker] Salteando espera, activando nuevo SW');
        self.skipWaiting();
    }
    
    // Manejar solicitudes de actualización de cache
    if (event.data && event.data.type === 'UPDATE_CACHE') {
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then((cache) => {
                    return cache.addAll(STATIC_ASSETS);
                })
                .then(() => {
                    event.ports[0].postMessage({ success: true });
                })
                .catch((error) => {
                    event.ports[0].postMessage({ success: false, error: error.message });
                })
        );
    }
});
