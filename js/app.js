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

// OCR helpers
async function recognizeImage(image) {
    const { data: { text } } = await Tesseract.recognize(image, 'spa', {
        logger: m => console.log(m)
    });
    return text;
}

function parseText(text) {
    // improved parsing: find all serials and denominaciones
    // split into lines for denomination detection
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const denoms = new Set();
    lines.forEach(line => {
        const d = line.match(/\b(10|20|50)\b/);
        if (d) denoms.add(parseInt(d[1], 10));
    });
    // if no denomination found, default to 10
    const defaultDenom = denoms.size > 0 ? Array.from(denoms)[0] : 10;
    const results = [];
    // find serials anywhere in text, capturing letter before or after number
    // pattern covers "B032288398", "032288398 B" and similar
    // explicitly keep any leading zeros in the number portion
    const serialRegex = /([A-Za-z])\s*(\d{7,9})|(\d{7,9})\s*([A-Za-z])/g;
    let match;
    while ((match = serialRegex.exec(text)) !== null) {
        if (match[1] && match[2]) {
            results.push({ denom: defaultDenom, letter: match[1], number: match[2] });
        } else if (match[3] && match[4]) {
            results.push({ denom: defaultDenom, letter: match[4], number: match[3] });
        }
    }
    return results;
}

async function processImage(img) {
    // clear previous results for a fresh run
    document.getElementById('results').innerHTML = '';
    const text = await recognizeImage(img);
    console.log('OCR texto:', text);
    const parsed = parseText(text);
    if (parsed.length === 0) {
        appendResult({ denom: '', letter: '', number: '', message: 'No se detectaron billetes' });
        return;
    }
    parsed.forEach(p => {
        // normalize series letter: only A or B are valid, map common misreads
        let letter = p.letter.toUpperCase();
        if (letter === 'U') {
            // OCR frequently confuses B/U; assume B when number begins with 0 or
            // when the letter is not A (only A/B exist)
            letter = 'B';
        }
        if (letter !== 'A' && letter !== 'B') {
            // if another character appears, treat as invalid; default to A
            letter = 'A';
        }
        const res = checkSerial(p.denom, letter, p.number);
        appendResult(res);
    });
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

// Notificar al usuario cuando hay una actualización disponible
function showUpdateNotification() {
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
    `;
    notification.textContent = '📱 Nueva versión disponible. Recarga la página.';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 6000);
}
