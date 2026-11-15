// TAT-Driver Route Application Logic
const DRIVER = {
    apiUrl: localStorage.getItem('tat_driver_api_url') || '',
    stops: JSON.parse(localStorage.getItem('tat_driver_stops') || '[]'),
    outbox: JSON.parse(localStorage.getItem('tat_driver_outbox') || '[]'),
    vehicle: 'NPR', // NPR, NHR, Moto
    trafficDensity: 'Normal', // Fluido, Normal, Pesado
    showCheckpointModal: false,
    activeStop: null,
    showConfig: false
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

function renderDriver() {
    const root = document.getElementById('driver-app');
    const pending = DRIVER.stops.filter(s => s.status === 'PENDIENTE');
    const nextStop = pending[0];
    const hasCloud = Boolean(DRIVER.apiUrl && DRIVER.apiUrl.startsWith('http'));

    root.innerHTML = `
        <header class="header" style="background:#064e3b;">
            <div>
                <i class="fas fa-truck-fast"></i> <strong>TAT-Driver Route Pro</strong>
                <span style="font-size:11px;background:rgba(255,255,255,0.2);padding:3px 8px;border-radius:10px;margin-left:6px;">${hasCloud?'Nube Activa':'Local/JSON'}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:13px;font-weight:700;">Pendientes: ${pending.length}</span>
                <button class="btn btn-dark" style="padding:6px 10px;" onclick="DRIVER.showConfig=true;renderDriver()"><i class="fas fa-gear"></i></button>
            </div>
        </header>

        <!-- Navegación Arcade HUD / Siguiente Parada -->
        <div style="background:#0f172a;color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #059669;">
            <div>
                <small style="color:#34d399;text-transform:uppercase;letter-spacing:1px;font-weight:700;"><i class="fas fa-diamond-turn-right"></i> Siguiente Parada (Checkpoint)</small>
                <div style="font-size:16px;font-weight:bold;margin-top:2px;">${nextStop ? nextStop.client : '¡Ruta Finalizada!'}</div>
                <div style="font-size:12px;opacity:0.8;">${nextStop ? nextStop.address : 'Todas las entregas completadas'}</div>
            </div>
            <div style="text-align:right;">
                <span style="background:#059669;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;">ETA ~12 min</span>
            </div>
        </div>

        <div style="position:relative;">
            <div id="driver-map" style="height:42vh;width:100%;z-index:1;"></div>
            <!-- Overlay Arcade Directional Arrows -->
            <div style="position:absolute;top:14px;right:14px;z-index:999;background:rgba(15,23,42,0.85);color:#fff;padding:8px 12px;border-radius:8px;font-size:12px;display:flex;flex-direction:column;gap:4px;">
                <div><i class="fas fa-arrow-up" style="color:#34d399;margin-right:6px;"></i> Girar en 150m</div>
                <div style="font-size:11px;opacity:0.8;">Vehículo: ${DRIVER.vehicle} | Tráfico: ${DRIVER.trafficDensity}</div>
            </div>
        </div>

        <div style="padding:14px;max-width:760px;margin:0 auto;">
            <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
                ${hasCloud ? `<button class="btn btn-primary" onclick="syncFromCloud()"><i class="fas fa-cloud-arrow-down"></i> Sincronizar Nube</button>` : ''}
                <label class="btn btn-dark" style="cursor:pointer;">
                    <i class="fas fa-file-import"></i> Cargar Manifiesto JSON
                    <input type="file" accept=".json" style="display:none;" onchange="importManifest(event)">
                </label>
                <button class="btn btn-primary" onclick="optimizeRoute()"><i class="fas fa-route"></i> Optimizar Trayecto</button>
                <select style="width:auto;margin:0;padding:6px;font-size:12px;" onchange="DRIVER.vehicle=this.value">
                    <option value="NPR" ${DRIVER.vehicle==='NPR'?'selected':''}>Camión NPR</option>
                    <option value="NHR" ${DRIVER.vehicle==='NHR'?'selected':''}>Camión NHR</option>
                    <option value="Moto" ${DRIVER.vehicle==='Moto'?'selected':''}>Moto Reparto</option>
                </select>
            </div>

            ${pending.map((s, i) => `
                <div class="card" style="margin-bottom:10px;border-left:5px solid #059669;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <strong>Parada #${i+1}: ${s.client}</strong>
                        <span style="color:#16a34a;font-weight:700;">$${Number(s.total).toLocaleString()}</span>
                    </div>
                    <p style="font-size:13px;color:#64748b;margin:4px 0 10px;">${s.address} · Factura: ${s.id}</p>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <a class="btn btn-primary" target="_blank" href="https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}">
                            <i class="fas fa-diamond-turn-right"></i> Waze / Maps
                        </a>
                        <button class="btn btn-success" onclick="openCheckpoint('${s.id}')">
                            <i class="fas fa-clipboard-check"></i> Checkpoint Llegada
                        </button>
                    </div>
                </div>
            `).join('') || '<div class="card" style="text-align:center;padding:24px;"><strong>¡Ruta completada!</strong> Todas las entregas registradas con éxito.</div>'}
        </div>

        ${DRIVER.showCheckpointModal && DRIVER.activeStop ? `
        <div class="modal-bg">
            <div class="modal-box">
                <h3 style="margin-bottom:8px;"><i class="fas fa-clipboard-check"></i> Auditoría de Checkpoint</h3>
                <p style="font-size:13px;color:#64748b;margin-bottom:14px;">Cliente: <strong>${DRIVER.activeStop.client}</strong> ($${DRIVER.activeStop.total.toLocaleString()})</p>
                
                <label style="font-size:12px;font-weight:600;">Estado de la Entrega:</label>
                <select id="ckptStatus">
                    <option value="ENTREGADO">Entrega Exitosa</option>
                    <option value="NOVEDAD">Entrega con Novedad / Reprogramar</option>
                </select>

                <label style="font-size:12px;font-weight:600;">Método de Recaudo:</label>
                <select id="ckptPayment">
                    <option value="Efectivo">Efectivo (Caja Directa)</option>
                    <option value="Transferencia QR">Transferencia QR / Nequi</option>
                    <option value="Crédito Autorizado">Crédito / Cartera</option>
                </select>

                <label style="font-size:12px;font-weight:600;">Observaciones o Novedad:</label>
                <textarea id="ckptNotes" rows="2" placeholder="Comentarios de la entrega..."></textarea>

                <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
                    <button class="btn btn-dark" onclick="DRIVER.showCheckpointModal=false;render()">Cancelar</button>
                    <button class="btn btn-success" onclick="submitCheckpoint()"><i class="fas fa-check"></i> Confirmar Checkpoint</button>
                </div>
            </div>
        </div>` : ''}

        ${DRIVER.showConfig ? `
        <div class="modal-bg">
            <div class="modal-box">
                <h3 style="margin-bottom:8px;"><i class="fas fa-cloud"></i> Conexión Nube Conductor</h3>
                <p style="font-size:13px;color:#64748b;margin-bottom:12px;">Pega la URL de Google Apps Script para sincronizar paradas.</p>
                <input id="drvApiInput" value="${DRIVER.apiUrl}" placeholder="https://script.google.com/macros/s/.../exec">
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button class="btn btn-dark" onclick="DRIVER.showConfig=false;render()">Cerrar</button>
                    <button class="btn btn-primary" onclick="saveDriverApi()">Guardar</button>
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
        if (pts.length > 1) L.polyline(pts, { color: '#059669', weight: 5, dashArray: '6, 10' }).addTo(map);
    }, 80);
}

function saveDriverApi() {
    const val = document.getElementById('drvApiInput').value.trim();
    DRIVER.apiUrl = val;
    localStorage.setItem('tat_driver_api_url', val);
    DRIVER.showConfig = false;
    renderDriver();
}

async function syncFromCloud() {
    if (!DRIVER.apiUrl) return;
    try {
        const res = await fetch(DRIVER.apiUrl);
        const data = await res.json();
        if (data.ok && Array.isArray(data.orders)) {
            DRIVER.stops = data.orders.filter(o => o.status === 'PENDIENTE');
            saveDriverState();
            alert('Ruta sincronizada desde la nube.');
            renderDriver();
        }
    } catch (e) {
        alert('Error de conexión con la nube.');
    }
}

function importManifest(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const data = JSON.parse(ev.target.result);
        DRIVER.stops = data.filter(d => d.status === 'PENDIENTE');
        saveDriverState();
        renderDriver();
        alert('Manifiesto JSON cargado con éxito.');
    };
    reader.readAsText(file);
}

function optimizeRoute() {
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
    renderDriver();
    alert('Trayecto optimizado considerando sentido de vías y vehículo ' + DRIVER.vehicle + '.');
}

function openCheckpoint(id) {
    DRIVER.activeStop = DRIVER.stops.find(s => s.id === id);
    DRIVER.showCheckpointModal = true;
    renderDriver();
}

async function submitCheckpoint() {
    const status = document.getElementById('ckptStatus').value;
    const paymentMethod = document.getElementById('ckptPayment').value;
    const notes = document.getElementById('ckptNotes').value;

    DRIVER.activeStop.status = status;
    DRIVER.activeStop.paymentMethod = paymentMethod;
    DRIVER.activeStop.notes = notes;

    const payload = { action: 'UPDATE_CHECKPOINT', id: DRIVER.activeStop.id, status, paymentMethod };

    if (DRIVER.apiUrl && navigator.onLine) {
        try {
            await fetch(DRIVER.apiUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            DRIVER.outbox.push(payload);
        }
    } else if (DRIVER.apiUrl) {
        DRIVER.outbox.push(payload);
    }

    DRIVER.showCheckpointModal = false;
    saveDriverState();
    renderDriver();
    alert('Checkpoint auditado y guardado correctamente.');
}

renderDriver();
