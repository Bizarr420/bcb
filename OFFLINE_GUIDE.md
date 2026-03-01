# Guía: Offline y Instalación PWA

## 🔌 Cómo funciona el modo Offline

### Primera carga (con conexión):
1. La app descarga todos los archivos necesarios
2. Tesseract.js se carga desde CDN
3. Todo se guarda en el cache del navegador

### Cargas posteriores (sin conexión):
1. Abre la app normalmente
2. Si no hay conexión, el Service Worker sirve los archivos del cache
3. La app funciona completamente offline

## 📥 Instalación como Aplicación Nativa

### Opción 1: Botón "Instalar App" (automático)
- Cuando abres la app en un navegador compatible, aparecerá un botón naranja **📥 Instalar App**
- Haz clic y confirma
- La app se instalará en tu pantalla de inicio

### Opción 2: Menú del navegador (manual)

**Chrome/Edge:**
1. Abre la app
2. Toca el menú (⋮) → "Instalar aplicación"
3. Confirma

**Firefox:**
1. Abre la app
2. Menú (≡) → "Instalar aplicación" o "Install as an App"

**Safari (iOS):**
1. Abre en Safari
2. Toca el botón Compartir (↑)
3. "Agregar a pantalla de inicio"
4. *(Nota: Safari no soporta PWA completo, solo acceso directo)*

## ✅ Verificar que el Offline funciona

### En computadora (Chrome/Edge):
1. Abre DevTools (F12)
2. Ve a **Application** → **Service Workers**
3. Marca la checkbox **Offline**
4. Recarga la página
5. ✅ Debe cargar sin errores

### En celular:
1. Abre la app
2. Activa Modo Avión
3. Abre la app nuevamente
4. ✅ Debe funcionar sin Internet

## 🔄 Actualizar la aplicación

- Cuando hay una nueva versión, verás una notificación azul
- **Recarga** la página (o cierra y abre de nuevo)
- Se descargarán los nuevos archivos automáticamente

## ⚙️ Información técnica

### Service Worker Cache:
- `bcb-validador-v1-1`: Archivos principales (HTML, CSS, JS)
- `bcb-cdn-v1-1`: Librerías desde CDN (Tesseract.js)

### Tamaño:
- Aplicación local: ~50 KB
- Tesseract.js: ~4 MB (se descarga solo la primera vez)
- **Total: ~4 MB** (se descarga una sola vez)

### Eliminación del cache:
- Los archivos se guardan en el almacenamiento local del navegador
- Se borran automáticamente si desinstala la app
- O manualmente: Configuración → Almacenamiento → Limpiar cache

## 🐛 Solución de problemas

### "El botón Instalar no aparece"
- Usa HTTPS (o localhost funciona en desarrollo)
- La app necesita una conexión completada (espera a que cargue)
- Algunos navegadores no soportan PWA (ej: Safari)

### "Offline no funciona"
- Asegúrate de haber abierto la app **una vez con conexión**
- Comprueba que el Service Worker esté **activated** (DevTools)
- Borra el cache y carga de nuevo

### "Tesseract.js no funciona offline"
- Necesita haber cargado una imagen **online** primero
- Luego Tesseract.js estará en cache
- O descarga manualmente visitando: https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js

## 📱 Recomendaciones

✅ **Instala como PWA** para mejor experiencia  
✅ **Abre una vez online** para cachear Tesseract  
✅ **Usa en Modo Avión** para probar offline  
✅ **Recarga periódicamente** para obtener nuevas versiones  

---

**¿Problemas?** Abre DevTools (F12) → Console y busca mensajes `[ServiceWorker]` o `[PWA]`.
