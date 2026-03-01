# Iconos para la PWA

Este directorio debe contener los siguientes archivos:

## Requeridos:
- **icon-192x192.png** - Icono 192x192px para Android y navegadores
- **icon-512x512.png** - Icono 512x512px para splash screens y tiendas de apps

## Opcionales (pero recomendados):
- **icon-maskable-192x192.png** - Versión maskable 192x192px (Android Adaptive Icons)
- **icon-maskable-512x512.png** - Versión maskable 512x512px
- **screenshot-1.png** - Screenshot 540x720px de la app en acción

## Cómo crear los iconos:

### Opción 1: Usar un generador online
1. Ir a https://www.favicon-generator.org/ o https://icon-workshop.vercel.app/
2. Subir un logo/imagen de al menos 512x512px
3. Descargar los archivos en este directorio

### Opción 2: Usar ImageMagick en terminal
```bash
# Crear versión 192x192
magick convert logo.png -resize 192x192 icon-192x192.png

# Crear versión 512x512
magick convert logo.png -resize 512x512 icon-512x512.png

# Versiones maskable (con padding transparente)
magick convert logo.png -resize 160x160 -background transparent -gravity center -extent 192x192 icon-maskable-192x192.png
magick convert logo.png -resize 400x400 -background transparent -gravity center -extent 512x512 icon-maskable-512x512.png
```

### Opción 3: Usar Node.js con sharp
```bash
npm install -g sharp
# ... scripts para redimensionar
```

## Requisitos de los iconos:
- Formato PNG con transparencia
- Logotipo/símbolo reconocible
- Para maskable: dejar espacio en bordes (safe zone de 40%)
- Colores que contrasten con #667eea (color tema)

## Ejemplo de uso en manifest.json:
```json
{
  "icons": [
    {
      "src": "icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}
```

Una vez que tengas los iconos, la PWA podrá instalarse correctamente en dispositivos móviles y de escritorio.
