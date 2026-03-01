# Validador de Billetes Bolivianos - Serie B

Este proyecto es una aplicación web que permite validar billetes del Banco Central de Bolivia (BCB) para determinar si pertenecen a la serie B y si su número de serie está dentro de los rangos declarados como sin valor legal.

## Estructura del proyecto

```
/bcb
  /css
    style.css
  /js
    app.js
  index.html
  README.md
```

## Funcionalidades principales

- Pantalla principal con opciones para escanear con cámara o subir imagen desde galería
- OCR usando [Tesseract.js](https://github.com/naptha/tesseract.js) procesado en el navegador
- Validación de serie y número contra rangos oficiales de la serie B para denominaciones de 10, 20 y 50 bolivianos
- Manejo de múltiples billetes en una sola imagen y evitar duplicados
- Resultados presentados en una lista ordenada
- Aviso legal visible y fecha de última actualización

## Uso

Abrir `index.html` en un navegador compatible. En dispositivos móviles se recomienda el modo pantalla completa.

1. Hacer clic en **Escanear con cámara** para abrir la cámara trasera.
2. Apuntar al billete y presionar **Capturar**.
3. Alternativamente, usar **Subir imagen** para seleccionar una foto desde la galería.
4. Los resultados aparecerán debajo, indicando si el billete está afectado o no.

## Código de validación (resumen)

La lógica de validación se encuentra en `js/app.js`. Utiliza un diccionario de rangos para cada denominación y calcula si el número de serie cae dentro de alguno.

```js
function checkSerial(denom, letter, number) {
    // ...
}
```

Se mantiene un conjunto `seenSerials` para evitar duplicados.

## Configuración de OCR y buenas prácticas


### Depuración de OCR
En casos donde no se detectan billetes (como la imagen subida por el usuario), la aplicación muestra el texto crudo que Tesseract reconoce. El parsing intenta extraer cualquier serial de la forma `B12345678` (letra + dígitos) y asigna una denominación predeterminada (10 Bs si no se encuentra ninguna).
Si no aparece ningún serial, probar con otra foto bien enfocada o ajustar iluminación; también puede corregirse manualmente en el código.

### Series A y B
Los billetes bolivianos de las últimas emisiones solo llevan series **A** o **B** junto al número de serie. La lógica de extracción busca ambas variantes:
 - letra antes del número (`B032288398`)
 - letra después (`032288398 B`)

Si en tus pruebas el texto crudo muestra solo dígitos o la letra no es correcta, la imagen puede estar desenfocada o la porción del serial no fue legible; en ese caso intenta otra captura o ajusta manualmente la expresión regular en `parseText`.
  - el OCR a veces reconoce la letra **B** como **U** o incluso O, el código normaliza `U`→`B` y descarta otros caracteres dejando `A` por defecto.

### Números con cero inicial
La parte numérica del serial puede empezar con cero (`032288398`). El parser ya no elimina ceros iniciales, de modo que la comparación contra los rangos conserva la longitud correcta.

## Nota

Esta herramienta procesa todo en el cliente y no almacena información en servidores. No sustituye la verificación oficial por parte del Banco Central de Bolivia.

---

**Fecha de última actualización:** `date` deberá ajustarse conforme a nuevos datos.

**Aviso legal:** Esta herramienta no reemplaza la validación oficial de un banco.