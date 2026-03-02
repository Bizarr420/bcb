// Ranges for Serie B without legal value by denomination
const ranges = {
    50: [
        [67250001,67700000],
        [69050001,69500000],
        [69500001,69950000],
        [69950001,70400000],
        [70400001,70850000],
        [70850001,71300000],
        [76310012,85139995],
        [86400001,86850000],
        [90900001,91350000],
        [91800001,92250000]
    ],
    20: [
        [87280145,91646549],
        [96650001,97100000],
        [99800001,100250000],
        [100250001,100700000],
        [109250001,109700000],
        [110600001,111050000],
        [111050001,111500000],
        [111950001,112400000],
        [112400001,112850000],
        [112850001,113300000],
        [114200001,114650000],
        [114650001,115100000],
        [115100001,115550000],
        [118700001,119150000],
        [119150001,119600000],
        [120500001,120950000]
    ],
    10: [
        [77100001,77550000],
        [78000001,78450000],
        [78900001,96350000],
        [96350001,96800000],
        [96800001,97250000],
        [98150001,98600000],
        [104900001,105350000],
        [105350001,105800000],
        [106700001,107150000],
        [107600001,108050000],
        [108050001,108500000],
        [109400001,109850000]
    ]
};

// keep track of processed serials to avoid duplicates
const seenSerials = new Set();

function checkSerial(denom, letter, number) {
    const result = { denom, letter, number, status: '', message: '' };
    if (letter.toUpperCase() !== 'B') {
        result.status = 'ok';
        result.message = 'Serie no afectada';
        return result;
    }
    const num = parseInt(number, 10);
    if (isNaN(num)) {
        result.status = 'error';
        result.message = 'Número inválido';
        return result;
    }
    if (seenSerials.has(`${letter}${num}`)) {
        result.status = 'duplicate';
        result.message = 'Duplicado';
        return result;
    }
    seenSerials.add(`${letter}${num}`);
    const list = ranges[denom];
    if (!list) {
        result.status = 'error';
        result.message = 'Denominación no soportada';
        return result;
    }
    const inRange = list.some(([low, high]) => num >= low && num <= high);
    if (inRange) {
        result.status = 'bad';
        result.message = 'Serie B sin valor legal (BCB)';
    } else {
        result.status = 'ok';
        result.message = 'No figura como inhabilitado';
    }
    return result;
}

// append a result item to the UI
function appendResult(r) {
    const container = document.getElementById('results');
    const div = document.createElement('div');
    div.className = `result-item ${r.status}`;
    const statusEmoji = r.status === 'bad' ? '🔴' : '🟢';
    div.innerHTML = `
        <div class="result-header">${statusEmoji} ${r.denom} Bs - Serie ${r.letter} ${r.number}</div>
        <div class="result-message">${r.message}</div>
    `;
    container.appendChild(div);
}

// ==================== DETECCIÓN POR COLOR ====================
function detectarValorPorColor(imageData) {
    // Análisis de color para identificar denominación
    // Basado en colores característicos de billetes bolivianos:
    // 10 Bs: Verde dominante
    // 20 Bs: Naranja dominante  
    // 50 Bs: Morado/Lila dominante
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Muestrear múltiples áreas para mejor detección
            const areas = [
                { x: 0.1, y: 0.1, w: 0.3, h: 0.3 },  // Superior izquierda
                { x: 0.7, y: 0.1, w: 0.3, h: 0.3 },  // Superior derecha
                { x: 0.1, y: 0.7, w: 0.3, h: 0.3 },  // Inferior izquierda
                { x: 0.7, y: 0.7, w: 0.3, h: 0.3 },  // Inferior derecha
                { x: 0.4, y: 0.4, w: 0.2, h: 0.2 }   // Centro
            ];
            
            let colorData = [];
            
            areas.forEach(area => {
                const x = Math.floor(area.x * canvas.width);
                const y = Math.floor(area.y * canvas.height);
                const w = Math.floor(area.w * canvas.width);
                const h = Math.floor(area.h * canvas.height);
                
                const imageData = ctx.getImageData(x, y, w, h);
                const avgColor = getAverageColor(imageData.data);
                colorData.push(avgColor);
            });
            
            const valor = analizarColores(colorData);
            resolve(valor);
        };
        img.src = imageData;
    });
}

function getAverageColor(data) {
    let r = 0, g = 0, b = 0;
    let count = 0;
    
    for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
    }
    
    return {
        r: Math.floor(r / count),
        g: Math.floor(g / count),
        b: Math.floor(b / count)
    };
}

function analizarColores(colorData) {
    // Convertir RGB a HSV para mejor análisis de color
    const hsvData = colorData.map(rgb => rgbToHsv(rgb.r, rgb.g, rgb.b));
    
    // Contar colores dominantes
    let verdeCount = 0, naranjaCount = 0, moradoCount = 0;
    
    hsvData.forEach(hsv => {
        const h = hsv.h; // 0-360
        const s = hsv.s; // 0-100
        const v = hsv.v; // 0-100
        
        // Ignorar colores muy claros o muy oscuros
        if (v < 20 || v > 95 || s < 20) return;
        
        // Verde: 80-180 grados
        if (h >= 80 && h <= 180) verdeCount++;
        // Naranja: 20-50 grados
        else if (h >= 20 && h <= 50) naranjaCount++;
        // Morado/Lila: 260-320 grados
        else if (h >= 260 && h <= 320) moradoCount++;
    });
    
    console.log('[Color] Conteo - Verde:', verdeCount, 'Naranja:', naranjaCount, 'Morado:', moradoCount);
    
    // Determinar valor por color dominante
    if (verdeCount > naranjaCount && verdeCount > moradoCount) {
        return 10;
    } else if (naranjaCount > verdeCount && naranjaCount > moradoCount) {
        return 20;
    } else if (moradoCount > verdeCount && moradoCount > naranjaCount) {
        return 50;
    }
    
    return null; // No se pudo determinar
}

function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    let s = max === 0 ? 0 : diff / max;
    let v = max;
    
    if (diff !== 0) {
        switch (max) {
            case r: h = ((g - b) / diff + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / diff + 2) / 6; break;
            case b: h = ((r - g) / diff + 4) / 6; break;
        }
    }
    
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        v: Math.round(v * 100)
    };
}

// ==================== CORRECCIÓN DE ROTACIÓN ====================
function corregirRotacion(imageData) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Detectar orientación
            const esVertical = img.height > img.width * 1.5;
            
            if (esVertical) {
                console.log('[Rotación] Imagen vertical detectada, rotando 90°');
                canvas.width = img.height;
                canvas.height = img.width;
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(Math.PI / 2);
                ctx.drawImage(img, -img.width / 2, -img.height / 2);
                ctx.restore();
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
            }
            
            resolve(canvas.toDataURL());
        };
        img.src = imageData;
    });
}

// ==================== DETECCIÓN MULTI-ÁREA ====================
function detectarValorMultiArea(imageData) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Definir las 3 áreas basadas en tu imagen
            const areas = [
                {
                    nombre: 'superior_izquierda',
                    x: 0.05, y: 0.05, w: 0.25, h: 0.25,
                    descripcion: 'Número con signo ='
                },
                {
                    nombre: 'inferior_izquierda', 
                    x: 0.05, y: 0.70, w: 0.25, h: 0.20,
                    descripcion: 'Número circular'
                },
                {
                    nombre: 'inferior_derecha',
                    x: 0.60, y: 0.70, w: 0.35, h: 0.25,
                    descripcion: 'Valor principal'
                }
            ];
            
            let resultados = [];
            
            areas.forEach(area => {
                const x = Math.floor(area.x * canvas.width);
                const y = Math.floor(area.y * canvas.height);
                const w = Math.floor(area.w * canvas.width);
                const h = Math.floor(area.h * canvas.height);
                
                // Extraer área
                const areaCanvas = document.createElement('canvas');
                const areaCtx = areaCanvas.getContext('2d');
                areaCanvas.width = w;
                areaCanvas.height = h;
                areaCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
                
                // Preprocesar área para mejor OCR
                const areaProcesada = preprocesarArea(areaCanvas);
                
                resultados.push({
                    area: area.nombre,
                    descripcion: area.descripcion,
                    imagen: areaProcesada,
                    posicion: { x, y, w, h }
                });
            });
            
            resolve(resultados);
        };
        img.src = imageData;
    });
}

function preprocesarArea(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Mejorar contraste
    const factor = 1.5;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * factor);     // R
        data[i + 1] = Math.min(255, data[i + 1] * factor); // G
        data[i + 2] = Math.min(255, data[i + 2] * factor); // B
    }
    
    // Convertir a escala de grises
    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }
    
    // Binarización (threshold adaptativo simple)
    for (let i = 0; i < data.length; i += 4) {
        const threshold = 128;
        const value = data[i] > threshold ? 255 : 0;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
}

async function procesarAreasMultiArea(areas) {
    const resultados = [];
    
    for (const area of areas) {
        try {
            const texto = await recognizeImage(area.imagen);
            const valor = extraerValorDeTexto(texto);
            
            resultados.push({
                area: area.area,
                descripcion: area.descripcion,
                texto: texto.trim(),
                valor: valor,
                confianza: valor ? 1.0 : 0.0
            });
            
            console.log(`[Multi-área] ${area.area}: "${texto.trim()}" -> ${valor || 'null'}`);
        } catch (error) {
            console.error(`[Multi-área] Error en ${area.area}:`, error);
            resultados.push({
                area: area.area,
                descripcion: area.descripcion,
                texto: '',
                valor: null,
                confianza: 0.0
            });
        }
    }
    
    return resultados;
}

function extraerValorDeTexto(texto) {
    const textoLimpio = texto.toUpperCase().replace(/[^0-9A-Z\s]/g, '');
    
    // Buscar patrones de valor
    const patrones = {
        10: [/10/, /DIEZ/],
        20: [/20/, /VEINTE/],
        50: [/50/, /CINCUENTA/]
    };
    
    for (const [valor, regexes] of Object.entries(patrones)) {
        for (const regex of regexes) {
            if (regex.test(textoLimpio)) {
                return parseInt(valor);
            }
        }
    }
    
    return null;
}

// ==================== DETECCIÓN DE CARACTERÍSTICAS DE SEGURIDAD ====================
function detectarCaracteristicasSeguridad(imageData) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            const caracteristicas = {
                marcaAgua: detectarMarcaAgua(data, canvas.width, canvas.height),
                lineasSeguridad: detectarLineasSeguridad(ctx, canvas.width, canvas.height),
                calidadImagen: evaluarCalidadImagen(data),
                texturasSeguridad: detectarTexturasSeguridad(data),
                holograma: detectarHolograma(ctx, canvas.width, canvas.height)
            };
            
            console.log('[Seguridad] Características detectadas:', caracteristicas);
            resolve(caracteristicas);
        };
        img.src = imageData;
    });
}

function detectarMarcaAgua(data, width, height) {
    // Detectar variaciones sutiles en la imagen que podrían ser marcas de agua
    let variaciones = 0;
    let muestras = 0;
    
    // Muestrear áreas específicas donde suelen estar las marcas de agua
    for (let y = 0; y < height; y += 20) {
        for (let x = 0; x < width; x += 20) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            
            // Calcular variación local
            const brillo = (r + g + b) / 3;
            if (brillo > 50 && brillo < 200) {
                const varLocal = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
                if (varLocal > 10 && varLocal < 50) {
                    variaciones++;
                }
                muestras++;
            }
        }
    }
    
    const ratio = muestras > 0 ? variaciones / muestras : 0;
    return {
        detectada: ratio > 0.15 && ratio < 0.4,
        confianza: Math.min(ratio * 2, 1.0),
        ratio: ratio
    };
}

function detectarLineasSeguridad(ctx, width, height) {
    // Detectar líneas finas características de seguridad
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Convertir a escala de grises
    const grayData = [];
    for (let i = 0; i < data.length; i += 4) {
        grayData.push(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    }
    
    // Detectar bordes con Sobel
    const edges = [];
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            
            const sobelX = 
                -1 * grayData[idx - width - 1] + 1 * grayData[idx - width + 1] +
                -2 * grayData[idx - 1] + 2 * grayData[idx + 1] +
                -1 * grayData[idx + width - 1] + 1 * grayData[idx + width + 1];
            
            const sobelY = 
                -1 * grayData[idx - width - 1] - 2 * grayData[idx - width] - 1 * grayData[idx - width + 1] +
                1 * grayData[idx + width - 1] + 2 * grayData[idx + width] + 1 * grayData[idx + width + 1];
            
            const magnitude = Math.sqrt(sobelX * sobelX + sobelY * sobelY);
            edges.push(magnitude > 50 ? 1 : 0);
        }
    }
    
    const lineCount = edges.reduce((a, b) => a + b, 0);
    const totalPixels = (width - 2) * (height - 2);
    const ratio = lineCount / totalPixels;
    
    return {
        detectadas: ratio > 0.02 && ratio < 0.15,
        confianza: Math.min(ratio * 10, 1.0),
        densidad: ratio
    };
}

function evaluarCalidadImagen(data) {
    // Evaluar la calidad general de la imagen
    let brilloTotal = 0;
    let contraste = 0;
    let nitridez = 0;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        brilloTotal += (r + g + b) / 3;
        
        // Calcular contraste local
        if (i > 4 && i < data.length - 4) {
            const diff = Math.abs(r - data[i - 4]) + Math.abs(g - data[i - 3]) + Math.abs(b - data[i - 2]);
            contraste += diff / 3;
        }
    }
    
    const pixelCount = data.length / 4;
    const brilloPromedio = brilloTotal / pixelCount;
    const contrastePromedio = contraste / pixelCount;
    
    return {
        brillo: brilloPromedio,
        contraste: contrastePromedio,
        calidad: brilloPromedio > 50 && brilloPromedio < 200 && contrastePromedio > 10 ? 'buena' : 'regular'
    };
}

function detectarTexturasSeguridad(data) {
    // Detectar patrones de textura característicos
    let patrones = 0;
    let muestras = 0;
    
    for (let i = 0; i < data.length - 12; i += 12) {
        const bloque = [
            data[i], data[i + 4], data[i + 8],
            data[i + 1], data[i + 5], data[i + 9],
            data[i + 2], data[i + 6], data[i + 10]
        ];
        
        // Detectar patrones repetitivos
        const varianza = calcularVarianza(bloque);
        if (varianza > 100 && varianza < 1000) {
            patrones++;
        }
        muestras++;
    }
    
    const ratio = muestras > 0 ? patrones / muestras : 0;
    return {
        detectadas: ratio > 0.1,
        confianza: Math.min(ratio * 5, 1.0),
        ratio: ratio
    };
}

function detectarHolograma(ctx, width, height) {
    // Detectar características iridescentes/holográficas
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    let iridiscencia = 0;
    let muestras = 0;
    
    // Buscar cambios de color bruscos característicos de hologramas
    for (let i = 0; i < data.length - 12; i += 4) {
        const r1 = data[i];
        const g1 = data[i + 1];
        const b1 = data[i + 2];
        
        const r2 = data[i + 4];
        const g2 = data[i + 5];
        const b2 = data[i + 6];
        
        // Calcular diferencia de color
        const diffColor = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        
        if (diffColor > 50 && diffColor < 200) {
            iridiscencia++;
        }
        muestras++;
    }
    
    const ratio = muestras > 0 ? iridiscencia / muestras : 0;
    return {
        detectado: ratio > 0.05,
        confianza: Math.min(ratio * 8, 1.0),
        ratio: ratio
    };
}

function calcularVarianza(valores) {
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const varianza = valores.reduce((a, b) => a + Math.pow(b - media, 2), 0) / valores.length;
    return varianza;
}

// ==================== PREPROCESAMIENTO AVANZADO ====================
function preprocesarImagenOptimizada(imageData) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Reducir tamaño para procesamiento más rápido (máximo 800px)
            const maxSize = 800;
            let width = img.width;
            let height = img.height;
            
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                } else {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Preprocesamiento avanzado
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            // 1. Convertir a escala de grises con fórmula mejorada
            for (let i = 0; i < data.length; i += 4) {
                const gray = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }
            
            // 2. Reducir ruido con filtro mediano simple
            const smoothed = new Uint8ClampedArray(data);
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = (y * width + x) * 4;
                    
                    // Filtro mediano 3x3
                    const neighbors = [];
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nIdx = ((y + dy) * width + (x + dx)) * 4;
                            neighbors.push(data[nIdx]);
                        }
                    }
                    neighbors.sort((a, b) => a - b);
                    const median = neighbors[4]; // Mediana de 9 valores
                    
                    smoothed[idx] = median;
                    smoothed[idx + 1] = median;
                    smoothed[idx + 2] = median;
                }
            }
            
            // 3. Mejorar contraste con ecualización de histograma
            const histogram = new Array(256).fill(0);
            for (let i = 0; i < smoothed.length; i += 4) {
                histogram[smoothed[i]]++;
            }
            
            // Calcular CDF
            const cdf = new Array(256);
            cdf[0] = histogram[0];
            for (let i = 1; i < 256; i++) {
                cdf[i] = cdf[i - 1] + histogram[i];
            }
            
            // Normalizar
            const cdfMin = cdf.find(val => val > 0);
            const pixelCount = width * height;
            const equalizationMap = new Array(256);
            
            for (let i = 0; i < 256; i++) {
                equalizationMap[i] = Math.round(((cdf[i] - cdfMin) / (pixelCount - cdfMin)) * 255);
            }
            
            // Aplicar ecualización
            for (let i = 0; i < smoothed.length; i += 4) {
                const newValue = equalizationMap[smoothed[i]];
                smoothed[i] = newValue;
                smoothed[i + 1] = newValue;
                smoothed[i + 2] = newValue;
            }
            
            // 4. Binarización adaptativa local
            const windowSize = 15;
            const binary = new Uint8ClampedArray(smoothed.length);
            
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    
                    // Calcular umbral local
                    let sum = 0;
                    let count = 0;
                    
                    for (let dy = -windowSize; dy <= windowSize; dy++) {
                        for (let dx = -windowSize; dx <= windowSize; dx++) {
                            const ny = y + dy;
                            const nx = x + dx;
                            
                            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                                const nIdx = (ny * width + nx) * 4;
                                sum += smoothed[nIdx];
                                count++;
                            }
                        }
                    }
                    
                    const localMean = sum / count;
                    const threshold = localMean * 0.85; // 85% del promedio local
                    
                    const value = smoothed[idx] > threshold ? 255 : 0;
                    binary[idx] = value;
                    binary[idx + 1] = value;
                    binary[idx + 2] = value;
                    binary[idx + 3] = 255;
                }
            }
            
            ctx.putImageData(new ImageData(binary, width, height), 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.src = imageData;
    });
}

// OCR helpers optimizado
async function recognizeImage(image) {
    // Preprocesar imagen primero
    const imagenProcesada = await preprocesarImagenOptimizada(image);
    
    // Configuración optimizada para números y seriales
    const customConfig = {
        lang: 'spa',
        logger: m => {
            if (m.status === 'recognizing text') {
                console.log(`[OCR] Procesando: ${Math.round(m.progress * 100)}%`);
            }
        },
        // Opciones optimizadas para números
        tessedit_char_whitelist: '0123456789AB',
        tessedit_pageseg_mode: '7', // Single text line
        tessedit_ocr_engine_mode: '1', // LSTM only
        preserve_interword_spaces: '0',
        tessedit_do_auto_ocr: '0',
        tessedit_min_recog_char_rating: '20',
        tessedit_zero_rejection: '0',
        tessedit_zero_membership: '0'
    };
    
    try {
        const { data: { text } } = await Tesseract.recognize(imagenProcesada, customConfig);
        return text;
    } catch (error) {
        console.error('[OCR] Error en reconocimiento:', error);
        // Fallback con configuración más simple
        try {
            const { data: { text } } = await Tesseract.recognize(image, 'spa', {
                logger: m => console.log('[OCR Fallback]', m.status, m.progress),
                tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
            });
            return text;
        } catch (fallbackError) {
            console.error('[OCR] Error en fallback:', fallbackError);
            return '';
        }
    }
}

function parseText(text) {
    // Parser mejorado y más preciso para seriales de billetes bolivianos
    console.log('[Parser] Texto crudo recibido:', text);
    
    // Limpiar texto manteniendo solo caracteres relevantes
    const cleanText = text.toUpperCase()
        .replace(/[^0-9A-Z\n\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    console.log('[Parser] Texto limpiado:', cleanText);
    
    const results = [];
    const denoms = new Set();
    
    // Detectar denominaciones primero
    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l);
    lines.forEach(line => {
        const d = line.match(/\b(10|20|50)\b/);
        if (d) denoms.add(parseInt(d[1], 10));
    });
    
    const defaultDenom = denoms.size > 0 ? Array.from(denoms)[0] : 10;
    
    // Patrones específicos para seriales bolivianos (más precisos)
    const serialPatterns = [
        // Patrón 1: 8-9 dígitos + espacio + letra (ej: "032288398 B")
        /(\d{7,9})\s+([AB])/g,
        // Patrón 2: Letra + espacio + 8-9 dígitos (ej: "B 032288398")
        /([AB])\s+(\d{7,9})/g,
        // Patrón 3: 8-9 dígitos seguidos de letra (ej: "032288398B")
        /(\d{7,9})([AB])/g,
        // Patrón 4: Letra seguida de 8-9 dígitos (ej: "B032288398")
        /([AB])(\d{7,9})/g
    ];
    
    const foundSerials = new Set();
    
    // Probar cada patrón
    serialPatterns.forEach((pattern, patternIndex) => {
        let match;
        while ((match = pattern.exec(cleanText)) !== null) {
            let letter, number;
            
            // Determinar letra y número según el patrón
            if (patternIndex === 0) { // dígitos + espacio + letra
                number = match[1];
                letter = match[2];
            } else if (patternIndex === 1) { // letra + espacio + dígitos
                letter = match[1];
                number = match[2];
            } else if (patternIndex === 2) { // dígitos + letra
                number = match[1];
                letter = match[2];
            } else { // letra + dígitos
                letter = match[1];
                number = match[2];
            }
            
            // Validar formato del número
            if (number.length >= 7 && number.length <= 9) {
                // Correcciones comunes de OCR
                letter = correctOCRErrors(letter);
                number = correctNumberErrors(number);
                
                const serialKey = `${letter}${number}`;
                
                if (!foundSerials.has(serialKey)) {
                    foundSerials.add(serialKey);
                    results.push({
                        denom: defaultDenom,
                        letter: letter,
                        number: number
                    });
                    
                    console.log(`[Parser] Serial encontrado: ${letter}${number} (patrón ${patternIndex + 1})`);
                }
            }
        }
        
        // Resetear lastIndex para el siguiente patrón
        pattern.lastIndex = 0;
    });
    
    // Si no se encontraron seriales con patrones estrictos, intentar búsqueda más laxa
    if (results.length === 0) {
        console.log('[Parser] Intentando búsqueda laxa...');
        
        // Buscar cualquier combinación de 7-9 dígitos y A/B
        const laxPattern = /(\d{7,9})[^0-9]*([AB])/g;
        let match;
        
        while ((match = laxPattern.exec(cleanText)) !== null) {
            const number = match[1];
            let letter = correctOCRErrors(match[2]);
            
            const serialKey = `${letter}${number}`;
            if (!foundSerials.has(serialKey)) {
                foundSerials.add(serialKey);
                results.push({
                    denom: defaultDenom,
                    letter: letter,
                    number: number
                });
                
                console.log(`[Parser] Serial encontrado (búsqueda laxa): ${letter}${number}`);
            }
        }
    }
    
    console.log(`[Parser] Total seriales encontrados: ${results.length}`);
    return results;
}

// Corrección de errores comunes de OCR
function correctOCRErrors(letter) {
    const corrections = {
        '0': 'O', // Cero a O (raro en seriales)
        '8': 'B', // Ocho a B (muy común)
        '6': 'B', // Seis a B (común)
        'U': 'B', // U a B (común)
        'V': 'B', // V a B (común)
        '4': 'A', // Cuatro a A (común)
        'I': '1', // I a uno (raro)
        'O': '0', // O a cero (contextual)
        'S': '5', // S a cinco (raro)
        'G': '6', // G a seis (raro)
        'Z': '2', // Z a dos (raro)
        'T': '7', // T a siete (raro)
    };
    
    // Solo corregir si no es A o B ya
    if (letter !== 'A' && letter !== 'B') {
        return corrections[letter] || letter;
    }
    
    return letter;
}

// Corrección de errores en números
function correctNumberErrors(number) {
    // Correcciones comunes en dígitos
    return number
        .replace(/O/g, '0') // O a cero
        .replace(/I/g, '1') // I a uno
        .replace(/S/g, '5') // S a cinco
        .replace(/G/g, '6') // G a seis
        .replace(/Z/g, '2') // Z a dos
        .replace(/T/g, '7') // T a siete
        .replace(/B/g, '8') // B a ocho (solo si está en medio de números)
        .replace(/U/g, '0'); // U a cero
}

async function processImage(img) {
    // clear previous results for a fresh run
    document.getElementById('results').innerHTML = '';
    
    console.log('[Proceso] Iniciando análisis optimizado del billete...');
    
    // Mostrar indicador de procesamiento
    showProcessingIndicator();
    
    try {
        // 1. Corregir rotación automáticamente (rápido)
        console.log('[Proceso] Paso 1: Corrigiendo rotación...');
        const imagenCorregida = await corregirRotacion(img);
        
        // 2. Detectar valor por color (muy rápido)
        console.log('[Proceso] Paso 2: Detectando valor por color...');
        const valorPorColor = await detectarValorPorColor(imagenCorregida);
        console.log('[Proceso] Valor detectado por color:', valorPorColor);
        
        // 3. OCR optimizado para seriales (prioridad principal)
        console.log('[Proceso] Paso 3: Extrayendo seriales con OCR optimizado...');
        const text = await recognizeImage(imagenCorregida);
        console.log('[Proceso] Texto OCR obtenido:', text);
        
        // 4. Parsear seriales con algoritmo mejorado
        const parsed = parseText(text);
        console.log('[Proceso] Seriales encontrados:', parsed);
        
        // 5. Si no se encuentran seriales, intentar detección multi-área
        if (parsed.length === 0) {
            console.log('[Proceso] Paso 4: Intentando detección multi-área...');
            const areas = await detectarValorMultiArea(imagenCorregida);
            const resultadosAreas = await procesarAreasMultiArea(areas);
            
            // Detectar seguridad solo si es necesario
            const seguridad = await detectarCaracteristicasSeguridad(imagenCorregida);
            
            hideProcessingIndicator();
            mostrarErrorAnalisis(valorPorColor, resultadosAreas, seguridad, text);
            return;
        }
        
        // 6. Procesar seriales encontrados
        hideProcessingIndicator();
        
        for (const p of parsed) {
            // Determinar valor final (prioridad: color > OCR)
            const valorFinal = valorPorColor || p.denom;
            
            // Normalizar serie letter con correcciones mejoradas
            let letter = correctOCRErrors(p.letter.toUpperCase());
            
            // Validar serial con valor determinado
            const res = checkSerial(valorFinal, letter, p.number);
            
            // Enriquecer resultado con información adicional
            res.valorDetectado = valorFinal;
            res.valorPorColor = valorPorColor;
            res.confianzaValor = valorPorColor === valorFinal ? 0.8 : 0.5;
            
            appendResult(res);
        }
        
    } catch (error) {
        console.error('[Proceso] Error en análisis:', error);
        hideProcessingIndicator();
        mostrarErrorGeneral(error);
    }
}

// Indicador de procesamiento
function showProcessingIndicator() {
    const container = document.getElementById('results');
    const indicator = document.createElement('div');
    indicator.id = 'processing-indicator';
    indicator.className = 'result-item';
    indicator.innerHTML = `
        <div class="result-header">⏳ Procesando imagen...</div>
        <div class="result-message">
            <div class="processing-bar">
                <div class="processing-progress"></div>
            </div>
            <small>Analizando billete con IA avanzada...</small>
        </div>
    `;
    container.appendChild(indicator);
    
    // Animación de progreso
    let progress = 0;
    const progressBar = indicator.querySelector('.processing-progress');
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        progressBar.style.width = progress + '%';
    }, 200);
    
    // Guardar interval para limpiar después
    indicator.dataset.interval = interval;
}

function hideProcessingIndicator() {
    const indicator = document.getElementById('processing-indicator');
    if (indicator) {
        const interval = indicator.dataset.interval;
        if (interval) clearInterval(interval);
        indicator.remove();
    }
}

function determinarValorFinal(valorColor, resultadosAreas, valorOCR) {
    // Prioridad: Color > Multi-área > OCR
    const valoresAreas = resultadosAreas
        .filter(r => r.valor)
        .map(r => r.valor);
    
    // Contar frecuencia de valores por área
    if (valoresAreas.length > 0) {
        const frecuencia = {};
        valoresAreas.forEach(v => {
            frecuencia[v] = (frecuencia[v] || 0) + 1;
        });
        
        const valorMasFrecuente = Object.keys(frecuencia).reduce((a, b) => 
            frecuencia[a] > frecuencia[b] ? a : b
        );
        
        // Si coincide con el color, usar ese valor
        if (valorColor === parseInt(valorMasFrecuente)) {
            return valorColor;
        }
        
        // Si no hay color pero hay áreas consistentes
        if (!valorColor && frecuencia[valorMasFrecuente] >= 2) {
            return parseInt(valorMasFrecuente);
        }
    }
    
    // Priorizar color si está disponible
    if (valorColor) {
        return valorColor;
    }
    
    // Usar OCR como último recurso
    return valorOCR || 10; // Default a 10 si no se detecta nada
}

function calcularConfianzaValor(valorColor, resultadosAreas, valorFinal) {
    let confianza = 0;
    let factores = 0;
    
    // Confianza por color
    if (valorColor === valorFinal) {
        confianza += 0.4;
        factores++;
    }
    
    // Confianza por áreas
    const areasCorrectas = resultadosAreas.filter(r => r.valor === valorFinal).length;
    if (areasCorrectas > 0) {
        confianza += (areasCorrectas / resultadosAreas.length) * 0.4;
        factores++;
    }
    
    // Confianza base si hay factores
    if (factores > 0) {
        confianza += 0.2; // Base por tener alguna detección
    } else {
        confianza = 0.1; // Mínima si solo hay OCR
    }
    
    return Math.min(confianza, 1.0);
}

function mostrarErrorAnalisis(valorColor, resultadosAreas, seguridad, textoOCR) {
    const debugDiv = document.createElement('div');
    debugDiv.className = 'result-item error';
    debugDiv.innerHTML = `
        <div class="result-header">❌ No se detectó el billete o no es válido</div>
    `;
    document.getElementById('results').appendChild(debugDiv);
}

function mostrarErrorGeneral(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'result-item error';
    errorDiv.innerHTML = `
        <div class="result-header">❌ Error en el procesamiento</div>
        <div class="result-message">Ocurrió un error: ${error.message}</div>
    `;
    document.getElementById('results').appendChild(errorDiv);
}

// Modificar appendResult para mostrar información adicional
function appendResult(r) {
    const container = document.getElementById('results');
    const div = document.createElement('div');
    div.className = `result-item ${r.status}`;
    
    const statusEmoji = r.status === 'bad' ? '🔴' : '🟢';
    
    div.innerHTML = `
        <div class="result-header">${statusEmoji} ${r.valorDetectado} Bs - Serie ${r.letter} ${r.number}</div>
        <div class="result-message">
            ${r.message}
        </div>
    `;
    container.appendChild(div);
}

// camera and upload logic
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
    document.getElementById('video-container').classList.remove('hidden');
}

document.getElementById('use-camera').addEventListener('click', startCamera);
document.getElementById('capture').addEventListener('click', () => {
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    processImage(dataUrl);
});

document.getElementById('upload-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        // save the image data and enable verify button
        window.__lastUpload = reader.result;
        document.getElementById('verify').disabled = false;
    };
    reader.readAsDataURL(file);
});

// verify button handler to process last upload
document.getElementById('verify').addEventListener('click', () => {
    if (window.__lastUpload) {
        processImage(window.__lastUpload);
        document.getElementById('verify').disabled = true;
        window.__lastUpload = null;
    }
});

// display last updated date
document.getElementById('last-updated').textContent = new Date().toLocaleDateString();

// ==================== SERVICE WORKER REGISTRATION ====================
// Registrar el service worker para habilitar funcionalidad offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('js/service-worker.js')
            .then((registration) => {
                console.log('[App] Service Worker registrado:', registration);
                const statusElement = document.getElementById('pwa-status');
                statusElement.textContent = '✓ App lista para usar offline';
                statusElement.style.color = '#48bb78';

                // Escuchar actualizaciones del service worker
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[App] Nueva versión disponible');
                            showUpdateNotification();
                        }
                    });
                });

                // Verificar conexión periódicamente
                setInterval(() => {
                    if (navigator.onLine) {
                        // Intentar actualizar cache cuando hay conexión
                        if (registration.active) {
                            const messageChannel = new MessageChannel();
                            registration.active.postMessage({
                                type: 'UPDATE_CACHE'
                            }, [messageChannel.port2]);
                        }
                    }
                }, 30000); // Cada 30 segundos
            })
            .catch((error) => {
                console.error('[App] Error al registrar Service Worker:', error);
                const statusElement = document.getElementById('pwa-status');
                statusElement.textContent = '⚠ Funcionalidad offline no disponible';
                statusElement.style.color = '#f56565';
            });
    });
} else {
    console.warn('[App] Service Workers no soportados en este navegador');
    document.getElementById('pwa-status').textContent = '⚠ Este navegador no soporta PWA';
}

// Escuchar cambios de conexión
window.addEventListener('online', () => {
    console.log('[App] Conexión restaurada');
    const statusElement = document.getElementById('pwa-status');
    statusElement.textContent = '✓ App lista para usar offline';
    statusElement.style.color = '#48bb78';
});

window.addEventListener('offline', () => {
    console.log('[App] Conexión perdida');
    const statusElement = document.getElementById('pwa-status');
    statusElement.textContent = '📱 Modo offline';
    statusElement.style.color = '#f6ad55';
});

// ==================== PWA INSTALL PROMPT ====================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] Instalación disponible');
    e.preventDefault();
    deferredPrompt = e;
    // Mostrar botón de instalación
    document.getElementById('install-pwa').classList.remove('hidden');
});

document.getElementById('install-pwa').addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] Usuario respondió: ${outcome}`);
        deferredPrompt = null;
        document.getElementById('install-pwa').classList.add('hidden');
    }
});

window.addEventListener('appinstalled', () => {
    console.log('[PWA] App instalada exitosamente');
    showUpdateNotification('✓ ¡Aplicación instalada! Ahora funciona offline.');
});

// Notificar al usuario cuando hay una actualización disponible
function showUpdateNotification(message = '📱 Nueva versión disponible. Recarga la página.') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: #667eea;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-weight: 600;
        max-width: 90%;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 6000);
}
