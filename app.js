let STOPS = JSON.parse(localStorage.getItem('tat_driver_stops') || '[]');
if (!STOPS.length) {
    STOPS = [
        { id: 'INV-10021', client: 'Minimercado La Esquina', address: 'Cra 6 # 12-40', total: 142000, lat: 4.3382, lng: -74.3612, status: 'PENDIENTE' },
        { id: 'INV-10022', client: 'Tienda Don Pedro', address: 'Cll 18 # 9-15', total: 88000, lat: 4.3335, lng: -74.3670, status: 'PENDIENTE' }
    ];
}

function saveStops() {
    localStorage.setItem('tat_driver_stops', JSON.stringify(STOPS));
}

function renderDriverApp() {
    const pending = STOPS.filter(s => s.status === 'PENDIENTE');
    document.getElementById('driver-app').innerHTML = `
        <header>
            <div><i class="fas fa-truck-fast"></i> <strong>TAT-Driver Route</strong></div>
            <span style="font-size:13px;background:rgba(255,255,255,0.15);padding:4px 10px;border-radius:20px;">Paradas: ${pending.length}</span>
        </header>
        <div id="driver-map"></div>
        <div class="sheet">
            <div class="toolbar">
                <label class="btn" style="background:#334155;cursor:pointer;">
                    <i class="fas fa-file-import"></i> Cargar Manifiesto JSON
                    <input type="file" accept=".json" style="display:none;" onchange="importManifest(event)">
                </label>
                <button class="btn btn-nav" onclick="optimizeNearest()"><i class="fas fa-route"></i> Optimizar Ruta</button>
            </div>
            ${pending.map((s, i) => `
                <div class="stop-card">
                    <div style="display:flex;justify-content:space-between;">
                        <strong>Parada #${i+1}: ${s.client}</strong>
                        <span style="color:#059669;font-weight:700;">$${s.total.toLocaleString()}</span>
                    </div>
                    <p style="font-size:13px;color:#475569;margin:4px 0 10px;">${s.address} · ${s.id}</p>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <a class="btn btn-nav" target="_blank" href="https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}">
                            <i class="fas fa-diamond-turn-right"></i> Navegar GPS
                        </a>
                        <button class="btn" onclick="checkpointAudit('${s.id}')">
                            <i class="fas fa-clipboard-check"></i> Checkpoint
                        </button>
                    </div>
                </div>
            `).join('') || '<div class="stop-card"><strong>¡Ruta completada!</strong> Todas las entregas fueron auditadas.</div>'}
        </div>
    `;

    setTimeout(() => {
        const map = L.map('driver-map').setView([4.3365, -74.3638], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        const pts = [];
        pending.forEach((s, idx) => {
            L.marker([s.lat, s.lng]).addTo(map).bindPopup(`#${idx+1} ${s.client}`);
            pts.push([s.lat, s.lng]);
        });
        if (pts.length > 1) L.polyline(pts, { color: '#059669', weight: 5 }).addTo(map);
    }, 80);
}

function importManifest(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const data = JSON.parse(ev.target.result);
        STOPS = data.filter(d => d.status === 'PENDIENTE');
        saveStops();
        renderDriverApp();
    };
    reader.readAsText(file);
}

function optimizeNearest() {
    if (STOPS.length < 2) return;
    const ordered = [STOPS[0]];
    const rest = STOPS.slice(1);
    while (rest.length) {
        const last = ordered[ordered.length - 1];
        rest.sort((a, b) => Math.hypot(a.lat - last.lat, a.lng - last.lng) - Math.hypot(b.lat - last.lat, b.lng - last.lng));
        ordered.push(rest.shift());
    }
    STOPS = ordered;
    saveStops();
    renderDriverApp();
}

function checkpointAudit(id) {
    const res = prompt('Auditoría de Entrega:\n1 = Recibido y Pagado Efectivo\n2 = Recibido y Pagado Transferencia\n3 = Crédito / Cartera\n4 = Novedad / No Recibido', '1');
    if (!res) return;
    const st = STOPS.find(s => s.id === id);
    if (st) {
        st.status = res === '4' ? 'NOVEDAD' : 'ENTREGADO';
        saveStops();
        renderDriverApp();
    }
}

renderDriverApp();
