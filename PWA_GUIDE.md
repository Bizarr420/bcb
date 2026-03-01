# PWA - Validador de Billetes Bolivianos

## 📱 Guía de Implementación y Pruebas

Esta es una **Progressive Web App (PWA)** lista para instalar como aplicación nativa en dispositivos móviles y de escritorio, con soporte completo para funcionalidad offline.

---

## ✅ Archivos Creados

### 1. **manifest.json**
Archivo de configuración de la PWA que define:
- Nombre y descripción de la aplicación
- Modo standalone (pantalla completa sin URL bar)
- Iconos para diferentes resoluciones
- Color tema (#667eea)
- URL de inicio y alcance

```json
{
  "name": "Validador de Billetes Bolivianos - Serie B",
  "short_name": "Validador BCB",
  "start_url": "/bcb/index.html",
  "display": "standalone",
  "theme_color": "#667eea",
  "icons": [...]
}
```

### 2. **js/service-worker.js**
Script que:
- Cachea archivos principales en la primera carga
- Implementa estrategia **cache-first** para offline
- Automáticamente limpia caches antiguos
- Sincroniza actualizaciones sin romper la app

```js
// Cache-first: intenta cache primero, luego red
event.respondWith(
    caches.match(request)
        .then(response => response || fetch(request))
);
```

### 3. **index.html (actualizado)**
Cambios realizados:
- ✅ `<link rel="manifest" href="manifest.json">`
- ✅ Meta tags para iOS y Android
- ✅ Theme color y apple-touch-icon
- ✅ Elemento status de PWA en footer

### 4. **app.js (actualizado)**
Añadido:
- ✅ Registro del service worker con error handling
- ✅ Notificación de nuevas versiones disponibles
- ✅ Status visual de activación offline
- ✅ Listener para cambios en el service worker

---

## 🚀 Cómo Probar la PWA

### **Paso 1: Asegurarse que XAMPP corre con HTTPS**
Las PWA solo funcionan en **HTTPS** (o localhost).

En **localhost**, navegadores permiten HTTP, así que:

```bash
http://localhost/bcb/index.html
```

### **Paso 2: Abrir en navegador compatible**

#### 🔵 **Chrome / Edge (Recomendado)**
1. Abre `http://localhost/bcb/index.html`
2. Espera a que cargue completamente
3. Busca el ícono de **"Instalar"** o **"⊞ Instalar app"** en la barra de direcciones
4. Haz clic y confirma

#### 🔴 **Firefox**
1. Abre `about:config`
2. Busca `dom.serviceWorkers.enabled` y asegúrate que sea `true`
3. Abre la app, haz clic derecho → "Instalar aplicación"

#### 🟢 **Safari (iOS)**
1. Abre en Safari
2. Toca el botón Compartir → "Agregar a pantalla de inicio"
3. Se creará un acceso directo (no es instalación PWA completa)

#### 🟡 **Android Chrome**
1. Abre en Chrome
2. Toca el menú (⋮) → "Instalar aplicación"
3. Confirma; aparecerá en pantalla de inicio

---

## 🔌 Testear Funcionalidad Offline

### **Chrome/Edge:**
1. Abre las DevTools (F12)
2. Ve a **Application** → **Service Workers**
3. Verifica que esté **activated and running**
4. Ve a **Network** y marca **Offline**
5. Recarga la página (`Ctrl+R`)
6. ✅ La app debe cargar sin errores

### **Simular conexión lenta:**
1. DevTools → **Network**
2. En el dropdown "Throttling" selecciona "Slow 4G"
3. La app debería cargar desde cache mucho más rápido

### **Ver el cache:*
1. DevTools → **Application** → **Cache Storage**
2. Expande `bcb-validador-v1`
3. Verás todos los archivos cacheados

---

## 📋 Funcionalidades Offline

### ✅ Funciona sin conexión:
- Validación de imágenes subidas desde galería
- OCR con imágenes anteriormente cargadas
- Escaneo con cámara (requiere permisos del navegador)
- Interfaz completa (HTML, CSS, JS)

### ⚠️ Limitaciones offline:
- La librería Tesseract.js debe estar cacheada (se cachea en primera carga)
- Las solicitudes a APIs externas fallarán (pero no rompen la app)
- Si Tesseract.js no se cachea, OCR no funcionará sin conexión

---

## 🔄 Actualizar la PWA

### **Para usuarios:**
1. Verán una notificación azul: **"📱 Nueva versión disponible"**
2. Deben recargar la página manualmente

### **Para desarrolladores:**
Cambiar `CACHE_NAME` en `service-worker.js`:
```js
const CACHE_NAME = 'bcb-validador-v2'; // Cambiar versión
```

El service worker:
1. Detectará la nueva versión
2. Descargará nuevos archivos
3. Notificará al usuario
4. En la próxima carga, usará la versión nueva

---

## 📊 Estructura de Archivos PWA

```
/bcb
  ├── index.html                    ← Referencia manifest
  ├── manifest.json                 ← Configuración PWA
  ├── css/
  │   └── style.css
  ├── js/
  │   ├── app.js                    ← Registra service worker
  │   └── service-worker.js         ← Caché y offline
  ├── icons/
  │   ├── icon-192x192.png          ← Requerido
  │   ├── icon-512x512.png          ← Requerido
  │   ├── icon-maskable-192x192.png ← Opcional
  │   └── icon-maskable-512x512.png ← Opcional
  └── PWA_GUIDE.md                  ← Esta guía
```

---

## 🎨 Próximos Pasos

### **1. Crear Iconos**
Usar uno de estos métodos:
- Online: https://icon-workshop.vercel.app/
- Local: ImageMagick, sharp, o Photoshop
- Ver instrucciones en `/icons/README.md`

### **2. Probar en dispositivo real (opcional)**
```bash
# Si está en servidor externo con HTTPS
ngrok http 80
# O usar Vercel, Netlify, GitHub Pages
```

### **3. Mejorar el caché**
```js
// Excluir archivos muy grandes
const STATIC_ASSETS = [
    // Solo lo esencial
];
```

### **4. Agregar notificaciones push (avanzado)**
```js
// En service-worker.js
self.addEventListener('push', event => {
    // Mostrar notificación de actualización
});
```

---

## 🐛 Solución de Problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| No aparece botón "Instalar" | App no cumple requisitos PWA | Verificar manifest.json y HTTPS |
| Service Worker no se registra | Error en la sintaxis | Ver DevTools Console para errores |
| Offline no funciona | Cache vacío | Asegurar que el SW esté activado |
| OCR no funciona offline | Tesseract.js no está cacheado | Cargar una imagen mientras hay conexión |
| Icono no aparece en inicio | Ruta incorrecta en manifest | Verificar ruta relativa a manifest.json |

---

## 📝 Licencia y Copyright

© 2026 Bizarr420

Esta PWA funciona con datos públicos del Banco Central de Bolivia (BCB) y **no reemplaza la validación oficial de una entidad financiera**.

---

## 🔗 Recursos útiles

- [MDN: Progressive Web Apps](https://developer.mozilla.org/es/docs/Web/Progressive_web_apps)
- [Google: PWA Checklist](https://web.dev/pwa-checklist/)
- [Manifest.json Spec](https://www.w3.org/TR/appmanifest/)
- [Service Workers API](https://developer.mozilla.org/es/docs/Web/API/Service_Worker_API)
- [Web App Install Banners](https://web.dev/customize-install/)

---

**¡Tu PWA está lista para producción!** 🎉
