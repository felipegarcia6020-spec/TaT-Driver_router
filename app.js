const DRIVER = {
    apiUrl: localStorage.getItem('tat_driver_api_url') || '',
    stops: JSON.parse(localStorage.getItem('tat_driver_stops') || '[]'),
    outbox: JSON.parse(localStorage.getItem('tat_driver_outbox') || '[]'),
    showConfig: false,
    loading: false
};

if (!DRIVER.stops.length) {
    DRIVER.stops = [
        { id: 'INV-10021', client: 'Minimercado La Esquina', address: 'Cra 6 # 12-40', total: 142000, lat: 4.3382, lng: -74.3612, status: 'PENDIENTE' },
        { id: 'INV-10022', client: 'Tienda Don Pedro', address: 'Cll 18 # 9-15', total: 88000, lat: 4.3335, lng: -74.3670, status: 'PENDIENTE' }
    ];
}

function saveDriverState() {
    localStorage.setItem('tat_driver_stops', JSON.stringify(DRIVER.stops));
    localStorage.setItem('tat_driver_outbox', JSON.stringify(DRIVER.outbox));
}

function renderDriverApp() {
    const pending = DRIVER.stops.filter(s => s.status === 'PENDIENTE');
    const hasCloud = Boolean(DRIVER.apiUrl && DRIVER.apiUrl.startsWith('http'));

    document.getElementById('driver-app').innerHTML = `
        <header>
            <div>
                <i class="fas fa-truck-fast"></i> <strong>TAT-Driver Route</strong>
                <span style="font-size:11px;background:rgba(255,255,255,0.18);padding:3px 8px;border-radius:12px;margin-left:6px;">
                    ${hasCloud ? 'Nube Activa' : 'Modo Local / JSON'}
                </span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:13px;font-weight:700;">Paradas: ${pending.length}</span>
                <button class="btn btn-dark" style="padding:6px 10px;" onclick="DRIVER.showConfig=true;renderDriverApp()"><i class="fas fa-gear"></i></button>
            </div>
        </header>

        <div id="driver-map"></div>

        <div class="sheet">
            <div class="toolbar">
                ${hasCloud ? `<button class="btn" onclick="syncFromCloud()"><i class="fas fa-cloud-arrow-down"></i> ${DRIVER.loading ? 'Sincronizando...' : 'Sincronizar Nube'}</button>` : ''}
                ${DRIVER.outbox.length > 0 ? `<button class="btn" style="background:#d97706;" onclick="flushDriverOutbox()"><i class="fas fa-cloud-arrow-up"></i> Subir Reportes (${DRIVER.outbox.length})</button>` : ''}
                <label class="btn btn-dark" style="cursor:pointer;">
                    <i class="fas fa-file-import"></i> Cargar Manifiesto JSON
                    <input type="file" accept=".json" style="display:none;" onchange="importManifest(event)">
                </label>
                <button class="btn btn-nav" onclick="optimizeNearest()"><i class="fas fa-route"></i> Optimizar Ruta Más Corta</button>
            </div>

            ${pending.map((s, i) => `
                <div class="stop-card">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <strong>Parada #${i+1}: ${s.client}</strong>
                        <span style="color:#059669;font-weight:700;">$${Number(s.total).toLocaleString()}</span>
                    </div>
                    <p style="font-size:13px;color:#475569;margin:4px 0 10px;">${s.address} · Factura: ${s.id}</p>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <a class="btn btn-nav" target="_blank" href="https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}">
                            <i class="fas fa-diamond-turn-right"></i> Navegar GPS
                        </a>
                        <button class="btn" onclick="checkpointAudit('${s.id}')">
                            <i class="fas fa-clipboard-check"></i> Checkpoint Entrega
                        </button>
                    </div>
                </div>
            `).join('') || '<div class="stop-card"><strong>¡Ruta completada con éxito!</strong> Todas las entregas fueron auditadas.</div>'}
        </div>

        ${DRIVER.showConfig ? `
        <div class="modal-bg">
            <div class="modal-box">
                <h3 style="margin-bottom:8px;"><i class="fas fa-cloud"></i> Configuración Nube Conductor</h3>
                <p style="font-size:13px;color:#475569;margin-bottom:12px;">Pega la URL de tu aplicación web de Google Apps Script para recibir despachos en tiempo real.</p>
                <input id="drvApiInput" value="${DRIVER.apiUrl}" placeholder="https://script.google.com/macros/s/.../exec">
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button class="btn btn-dark" onclick="DRIVER.showConfig=false;renderDriverApp()">Cerrar</button>
                    <button class="btn" onclick="saveDriverApi()">Guardar</button>
                </div>
            </div>
        </div>` : ''}
    `;

    setTimeout(() => {
        const map = L.map('driver-map').setView([4.3365, -74.3638], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        const pts = [];
        pending.forEach((s, idx) => {
            L.marker([s.lat, s.lng]).addTo(map).bindPopup(`<b>#${idx+1} ${s.client}</b><br>$${Number(s.total).toLocaleString()}`);
            pts.push([s.lat, s.lng]);
        });
        if (pts.length > 1) L.polyline(pts, { color: '#059669', weight: 5 }).addTo(map);
    }, 80);
}

function saveDriverApi() {
    const val = document.getElementById('drvApiInput').value.trim();
    DRIVER.apiUrl = val;
    localStorage.setItem('tat_driver_api_url', val);
    DRIVER.showConfig = false;
    renderDriverApp();
}

async function syncFromCloud() {
    if (!DRIVER.apiUrl) return;
    DRIVER.loading = true;
    renderDriverApp();
    try {
        const res = await fetch(DRIVER.apiUrl);
        const data = await res.json();
        if (data.ok && Array.isArray(data.orders)) {
            DRIVER.stops = data.orders.filter(o => o.status === 'PENDIENTE');
            saveDriverState();
            alert('Ruta sincronizada desde la nube (' + DRIVER.stops.length + ' paradas pendientes).');
        }
    } catch (e) {
        alert('No se pudo conectar a la nube. Verifica tu conexión o carga el archivo JSON.');
    }
    DRIVER.loading = false;
    renderDriverApp();
}

function importManifest(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const data = JSON.parse(ev.target.result);
        DRIVER.stops = data.filter(d => d.status === 'PENDIENTE');
        saveDriverState();
        renderDriverApp();
        alert('Manifiesto JSON cargado con éxito.');
    };
    reader.readAsText(file);
}

function optimizeNearest() {
    if (DRIVER.stops.length < 2) return;
    const ordered = [DRIVER.stops[0]];
    const rest = DRIVER.stops.slice(1);
    while (rest.length) {
        const last = ordered[ordered.length - 1];
        rest.sort((a, b) => Math.hypot(a.lat - last.lat, a.lng - last.lng) - Math.hypot(b.lat - last.lat, b.lng - last.lng));
        ordered.push(rest.shift());
    }
    DRIVER.stops = ordered;
    saveDriverState();
    renderDriverApp();
    alert('Ruta optimizada por distancia más corta (Nearest Neighbor).');
}

async function pushCheckpointToCloud(payload) {
    if (!DRIVER.apiUrl) return false;
    try {
        await fetch(DRIVER.apiUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return true;
    } catch (e) {
        return false;
    }
}

async function checkpointAudit(id) {
    const res = prompt('¿Cómo estuvo tu entrega?\n1 = Entregado y Pagado en Efectivo\n2 = Entregado (Nequi / Daviplata / Transferencia)\n3 = Venta a Crédito / Cartera\n4 = Entrega Fallida / Novedad', '1');
    if (!res) return;

    const st = DRIVER.stops.find(s => s.id === id);
    if (!st) return;

    const status = res === '4' ? 'NOVEDAD' : 'ENTREGADO';
    const paymentMethod = res === '1' ? 'Efectivo' : res === '2' ? 'Transferencia' : res === '3' ? 'Crédito' : 'Novedad';

    st.status = status;
    st.paymentMethod = paymentMethod;

    const updatePayload = { action: 'UPDATE_CHECKPOINT', id, status, paymentMethod };

    if (DRIVER.apiUrl && navigator.onLine) {
        const ok = await pushCheckpointToCloud(updatePayload);
        if (!ok) DRIVER.outbox.push(updatePayload);
    } else if (DRIVER.apiUrl) {
        DRIVER.outbox.push(updatePayload);
    }

    saveDriverState();
    renderDriverApp();
    alert('Checkpoint registrado correctamente. Siguiente parada lista.');
}

async function flushDriverOutbox() {
    if (!DRIVER.apiUrl || !navigator.onLine) return alert('Sin internet para subir reportes.');
    const remaining = [];
    for (const item of DRIVER.outbox) {
        const ok = await pushCheckpointToCloud(item);
        if (!ok) remaining.push(item);
    }
    DRIVER.outbox = remaining;
    saveDriverState();
    alert('Reportes de entrega sincronizados con éxito.');
    renderDriverApp();
}

window.addEventListener('online', () => { if (DRIVER.outbox.length) flushDriverOutbox(); });
renderDriverApp();
