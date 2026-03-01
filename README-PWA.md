# Validador de Billetes Bolivianos - Serie B

Este proyecto es una **Progressive Web App (PWA)** que permite validar billetes del Banco Central de Bolivia (BCB) para determinar si pertenecen a la serie B y si su número de serie está dentro de los rangos declarados como sin valor legal.

## 🚀 Características PWA

✅ **Instalable** - Acceso directo en celular/PC  
✅ **Offline-first** - Funciona sin conexión después del primer acceso  
✅ **Responsive** - Se adapta a cualquier pantalla  
✅ **Rápido** - Caché de archivos para carga instantánea  
✅ **Seguro** - Procesa todo en el cliente (sin servidor)  

## 📁 Estructura del proyecto

```
/bcb
  /css
    style.css              ← Estilos modernos y responsive
  /js
    app.js                 ← Lógica OCR, validación y SW
    service-worker.js      ← Cache y funcionalidad offline
  /icons
    icon-192x192.png       ← Icono PWA (requerido)
    icon-512x512.png       ← Icono PWA (requerido)
    README.md              ← Guía para crear iconos
  index.html              ← Interfaz principal
  manifest.json           ← Configuración PWA
  PWA_GUIDE.md            ← Guía detallada de pruebas
  README.md               ← Este archivo
```

## 💻 Uso

### **Abrir en navegador**
```
http://localhost/bcb/index.html
```

### **Instalar como PWA**
1. Abre en Chrome, Edge o Firefox
2. Busca el botón "Instalar" o "Install app" en la barra de direcciones
3. Confirma la instalación
4. ¡La app aparecerá en tu pantalla de inicio!

### **Usar offline**
1. Carga la app una vez con conexión
2. Desactiva la conexión (Modo Avión)
3. Abre la app nuevamente
4. ✅ Funciona sin internet

## 🔍 Funcionalidades principales

1. **Escanear con cámara** - Captura billetes en tiempo real
2. **Subir desde galería** - Procesa imágenes guardadas
3. **OCR automático** - Extrae serie y número con Tesseract.js
4. **Validación instantánea** - Compara contra rangos oficiales BCB
5. **Soporte offline** - Funciona sin conexión tras primer acceso

## 📊 Lógica de validación

- **Serie ≠ B** → 🟢 Serie no afectada
- **Serie = B + número en rango** → 🔴 Sin valor legal (BCB)
- **Serie = B + número fuera de rango** → 🟢 No inhabilitado

### Rangos oficiales (Serie B)

**Bs 50:** 67250001–67700000, 69050001–69500000, ... (10 rangos)  
**Bs 20:** 87280145–91646549, 96650001–97100000, ... (16 rangos)  
**Bs 10:** 77100001–77550000, 78000001–78450000, ... (12 rangos)

## 🛠️ Archivos PWA explicados

### `manifest.json`
Define el nombre, descripción, iconos e información de instalación.

```json
{
  "name": "Validador de Billetes Bolivianos - Serie B",
  "display": "standalone",
  "start_url": "/bcb/index.html",
  "theme_color": "#667eea",
  "icons": [...]
}
```

### `service-worker.js`
Cachea archivos en la primera carga e implementa estrategia **cache-first**:
- Intenta servir desde cache
- Si no existe, obtiene de la red
- Guarda en cache para futuro offline

### Registro en `app.js`
```js
navigator.serviceWorker.register('js/service-worker.js')
    .then(() => console.log('SW registrado'))
    .catch(err => console.error('Error:', err));
```

## 🔌 Pruebas offline

### DevTools (Chrome/Edge)
1. F12 → **Application** → **Service Workers**
2. Verifica: **activated and running**
3. **Network** → marca **Offline**
4. Recarga la página
5. ✅ Debe cargar sin errores

### Ver caché
1. DevTools → **Application** → **Cache Storage**
2. Expande `bcb-validador-v1`
3. Verás index.html, CSS, JS, manifest...

## 📱 Compatibilidad

| Navegador | Desktop | Móvil | Offline |
|-----------|---------|-------|---------|
| Chrome    | ✅      | ✅    | ✅      |
| Edge      | ✅      | ✅    | ✅      |
| Firefox   | ✅      | ✅    | ✅      |
| Safari    | ⚠️      | ⚠️    | ❌      |

*Safari soporta Web App pero no Service Workers completos.*

## 🎨 Mejoras OCR

- **Iluminación uniforme** - Evita reflejos y sombras
- **Enfoque adecuado** - Los números deben ser nítidos
- **Resolución alta** - Mínimo 1MP para legibilidad
- **Recorte** - Aísla la zona de serie/número
- **Tesseract en español** - Optimizado para español (spa)

## 🔐 Seguridad y Privacidad

✅ **Todo procesa en el cliente** - No se guarda información  
✅ **Sin servidor** - No hay conexiones backend  
✅ **Datos públicos** - Solo usa rangos del BCB  
✅ **No hay cookies** - Solo localStorage del navegador  

### ⚠️ Aviso legal
> Esta herramienta funciona con datos públicos del BCB y **no reemplaza la validación oficial de una entidad financiera.**

## 🚀 Próximos pasos

1. **Crear iconos** - Ver [icons/README.md](icons/README.md)
2. **Probar en dispositivo** - Instalar y usar offline
3. **Optimizar Tesseract** - Entrenar con billetes bolivianos
4. **Desplegar en HTTPS** - Para mejor compatibilidad PWA
5. **Agregar notificaciones push** - Para alertas de actualizaciones

## 📖 Documentación completa

Ver [PWA_GUIDE.md](PWA_GUIDE.md) para:
- Instrucciones detalladas de prueba
- Solución de problemas
- Actualización de versiones
- Recursos y referencias

## 👨‍💻 Desarrollo

### Cambiar versión del cache
En `service-worker.js`:
```js
const CACHE_NAME = 'bcb-validador-v2'; // Cambiar número
```

### Agregar más archivos a cachear
En `service-worker.js`:
```js
const STATIC_ASSETS = [
    '/bcb/index.html',
    '/bcb/css/style.css',
    // ... agregar más
];
```

## 📄 Licencia

© 2026 Bizarr420  
Todos los derechos reservados.

---

**¡Valida tus billetes de forma rápida, segura y offline!** 💵✅
