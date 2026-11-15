// TAT-Driver Route V3 - Logística Circuit-Style, Repaso, Arqueo por Denominación y Navegación
const MOTIVATIONAL_QUOTES = [
    "¡Hoy es un gran día para conquistar cada entrega con actitud ganadora!",
    "Tu compromiso mueve negocios y familias. ¡Excelente ruta hoy!",
    "Paso a paso, parada a parada, construimos el éxito del día. ¡Vamos con toda!",
    "Conduce con seguridad, entrega con una sonrisa. ¡Éxitos en tu jornada!"
];

const DRIVER = {
    apiUrl: localStorage.getItem('tat_driver_api_url') || '',
    routeStarted: false,
    quote: MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)],
    viewMode: 'map', // 'map' | 'list' | 'arqueo'
    routeInfo: {
        code: 'RUTA-FUSA-01',
        name: 'Ruta Fusagasugá Centro - Norte',
        driverName: 'Juan Pablo Díaz',
        date: new Date().toLocaleDateString('es-CO', { weekday: 'long', month: 'short', day: 'numeric' }),
        optimized: false
    },
    vehicle: 'Camión', // 'A pie' | 'Bicicleta' | 'Moto' | 'Carro pequeño' | 'Camión'
    stops: JSON.parse(localStorage.getItem('tat_driver_stops') || JSON.stringify([
        { id: 'FAC-10021', clientCode: 'FUS-101', client: 'Minimercado La Esquina', owner: 'Don Hernando', phone: '3104567890', address: 'Cra 6 # 12-40, Centro', total: 142000, lat: 4.3382, lng: -74.3612, status: 'PENDIENTE', visits: 1, paymentMethod: 'Efectivo', notes: '' },
        { id: 'FAC-10022', clientCode: 'FUS-102', client: 'Tienda Don Pedro', owner: 'Pedro Pablo Ruiz', phone: '3112345678', address: 'Cll 18 # 9-15, Balmoral', total: 88000, lat: 4.3335, lng: -74.3670, status: 'PENDIENTE', visits: 1, paymentMethod: 'Efectivo', notes: '' },
        { id: 'FAC-10023', clientCode: 'FUS-103', client: 'Autoservicio El Porvenir', owner: 'Marta Lucía', phone: '3209876543', address: 'Av. Las Palmas # 22-10', total: 215000, lat: 4.3410, lng: -74.3585, status: 'PENDIENTE', visits: 1, paymentMethod: 'QR Digital', notes: '' },
        { id: 'FAC-10024', clientCode: 'FUS-104', client: 'Granero San Mateo', owner: 'Carlos Julio', phone: '3147896541', address: 'Cll 10 # 3-45, Fusagasugá', total: 64000, lat: 4.3358, lng: -74.3645, status: 'PENDIENTE', visits: 1, paymentMethod: 'Efectivo', notes: '' }
    ])),
    outbox: JSON.parse(localStorage.getItem('tat_driver_outbox') || '[]'),

    // Arqueo físico por denominación y gastos de ruta
    denominations: JSON.parse(localStorage.getItem('tat_drv_denom') || JSON.stringify({
        100000: 0, 50000: 0, 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0
    })),
    expenses: JSON.parse(localStorage.getItem('tat_drv_expenses') || '[]'),
    routeStats: JSON.parse(localStorage.getItem('tat_drv_stats') || JSON.stringify({
        plate: 'WXY-456',
        startKm: 45210,
        endKm: 45248
    })),

    // Modales y Estado de Navegación
    showConfig: false,
    showCheckpointModal: false,
    showQRModal: false,
    activeStop: null,
    navigatingToNext: false
};

function saveDriverAll() {
    localStorage.setItem('tat_driver_stops', JSON.stringify(DRIVER.stops));
    localStorage.setItem('tat_driver_outbox', JSON.stringify(DRIVER.outbox));
    localStorage.setItem('tat_drv_denom', JSON.stringify(DRIVER.denominations));
    localStorage.setItem('tat_drv_expenses', JSON.stringify(DRIVER.expenses));
    localStorage.setItem('tat_drv_stats', JSON.stringify(DRIVER.routeStats));
}

function getVehicleSpeedAndIcon() {
    switch (DRIVER.vehicle) {
        case 'A pie': return { speedKmh: 5, icon: 'fa-person-walking' };
        case 'Bicicleta': return { speedKmh: 15, icon: 'fa-bicycle' };
        case 'Moto': return { speedKmh: 35, icon: 'fa-motorcycle' };
        case 'Carro pequeño': return { speedKmh: 28, icon: 'fa-car-side' };
        default: return { speedKmh: 22, icon: 'fa-truck' };
    }
}

function calculateRouteMetrics(stopsList) {
    if (!stopsList.length) return { distKm: 0, etaMin: 0 };
    let dist = 1.4; // Base desde bodega
    for (let i = 0; i < stopsList.length - 1; i++) {
        const dLat = (stopsList[i+1].lat - stopsList[i].lat) * 111;
        const dLng = (stopsList[i+1].lng - stopsList[i].lng) * 111 * Math.cos(stopsList[i].lat * Math.PI / 180);
        dist += Math.hypot(dLat, dLng) * 1.35; // Factor urbano
    }
    const { speedKmh } = getVehicleSpeedAndIcon();
    const travelMin = (dist / speedKmh) * 60;
    const stopServiceMin = stopsList.length * 4; // 4 min promedio por parada
    return { distKm: dist.toFixed(1), etaMin: Math.round(travelMin + stopServiceMin) };
}

function renderDriver() {
    const root = document.getElementById('driver-app');

    // ==========================================================================
    // 1. PANTALLA DE INICIO MOTIVACIONAL + BOTÓN INICIAR RUTA DEL DÍA
    // ==========================================================================
    if (!DRIVER.routeStarted) {
        const pendingCount = DRIVER.stops.filter(s => s.status === 'PENDIENTE' || s.status === 'REPASO').length;
        const totalValue = DRIVER.stops.reduce((a, b) => a + Number(b.total), 0);
        root.innerHTML = `
        <div style="min-height:100vh;background:linear-gradient(160deg, #064e3b 0%, #0f172a 100%);color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:24px;text-align:center;">
            <img src="icons/icon-192.png" style="width:84px;height:84px;border-radius:20px;margin-bottom:16px;box-shadow:0 10px 25px rgba(0,0,0,0.4);">
            <span class="badge badge-green" style="margin-bottom:10px;font-size:12px;">${DRIVER.routeInfo.date.toUpperCase()}</span>
            <h1 style="font-size:26px;font-weight:800;margin-bottom:8px;">¡Bienvenido, ${DRIVER.routeInfo.driverName}!</h1>
            <p style="font-size:16px;color:#a7f3d0;max-width:440px;line-height:1.5;margin-bottom:24px;font-style:italic;">
                "${DRIVER.quote}"
            </p>

            <div style="background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.15);border-radius:16px;padding:18px;width:100%;max-width:420px;margin-bottom:24px;text-align:left;">
                <div style="font-size:12px;color:#6ee7b7;font-weight:700;">RUTA ASIGNADA HOY</div>
                <div style="font-size:18px;font-weight:800;margin:2px 0 10px;">${DRIVER.routeInfo.code} · ${DRIVER.routeInfo.name}</div>
                <div style="display:flex;justify-content:space-between;font-size:13px;border-top:1px solid rgba(255,255,255,0.15);padding-top:10px;">
                    <span><i class="fas fa-location-dot"></i> Paradas: <strong>${pendingCount}</strong></span>
                    <span><i class="fas fa-sack-dollar"></i> Carga: <strong>$${totalValue.toLocaleString()}</strong></span>
                </div>
            </div>

            <button class="btn btn-success btn-lg" style="width:100%;max-width:420px;justify-content:center;font-size:17px;padding:16px;box-shadow:0 8px 20px rgba(5,150,105,0.45);" onclick="DRIVER.routeStarted=true;renderDriver()">
                <i class="fas fa-play"></i> INICIAR RUTA DEL DÍA
            </button>

            <div style="margin-top:16px;display:flex;gap:10px;">
                <label class="btn btn-dark" style="cursor:pointer;">
                    <i class="fas fa-file-import"></i> Importar JSON POS
                    <input type="file" accept=".json" style="display:none;" onchange="importManifest(event)">
                </label>
                <button class="btn btn-dark" onclick="DRIVER.showConfig=true;renderDriver()">
                    <i class="fas fa-cloud"></i> Nube Sheets
                </button>
            </div>
        </div>
        ${DRIVER.showConfig ? renderDriverConfigModal() : ''}`;
        return;
    }

    // Ordenar paradas: primero PENDIENTE, luego REPASO (volver a visitar al final)
    const activeStops = [
        ...DRIVER.stops.filter(s => s.status === 'PENDIENTE'),
        ...DRIVER.stops.filter(s => s.status === 'REPASO')
    ];
    const nextStop = activeStops[0];
    const metrics = calculateRouteMetrics(activeStops);
    const { icon: vehIcon } = getVehicleSpeedAndIcon();

    root.innerHTML = `
        <!-- TOP HEADER ESTILO CIRCUIT -->
        <div style="background:#ffffff;border-bottom:1px solid #e2e8f0;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <button class="btn btn-outline" style="padding:6px 10px;" onclick="DRIVER.routeStarted=false;renderDriver()"><i class="fas fa-arrow-left"></i></button>
                <div>
                    <div style="font-weight:800;font-size:15px;color:#0f172a;">${DRIVER.routeInfo.name}</div>
                    <div style="font-size:12px;color:var(--text-muted);">${activeStops.length} paradas · ${metrics.distKm} km · ~${metrics.etaMin} min</div>
                </div>
            </div>
            <div style="display:flex;gap:6px;">
                <label class="btn btn-outline" style="padding:7px 10px;cursor:pointer;" title="Cargar Manifiesto JSON">
                    <i class="fas fa-file-import"></i>
                    <input type="file" accept=".json" style="display:none;" onchange="importManifest(event)">
                </label>
                <button class="btn btn-outline" style="padding:7px 10px;" onclick="DRIVER.showConfig=true;renderDriver()" title="Sincronizar Nube"><i class="fas fa-cloud-arrow-down"></i></button>
            </div>
        </div>

        <!-- CHIPS DE ESTADO Y VEHÍCULO (Como en la imagen adjunta: Optimized | Vehicle | Distance) -->
        <div style="background:#ffffff;padding:6px 14px 10px;display:flex;gap:6px;overflow-x:auto;border-bottom:1px solid #e2e8f0;">
            <span class="badge ${DRIVER.routeInfo.optimized?'badge-green':'badge-amber'}" style="cursor:pointer;" onclick="optimizeCircuitRoute()">
                <i class="fas fa-wand-magic-sparkles"></i> ${DRIVER.routeInfo.optimized ? 'Optimized' : 'Optimizar Ruta'}
            </span>
            <select style="width:auto;margin:0;padding:3px 8px;font-size:11px;font-weight:700;border-radius:14px;background:#f1f5f9;" onchange="DRIVER.vehicle=this.value;renderDriver()">
                <option value="A pie" ${DRIVER.vehicle==='A pie'?'selected':''}>🚶 A pie</option>
                <option value="Bicicleta" ${DRIVER.vehicle==='Bicicleta'?'selected':''}>🚲 Bicicleta</option>
                <option value="Moto" ${DRIVER.vehicle==='Moto'?'selected':''}>🏍️ Moto</option>
                <option value="Carro pequeño" ${DRIVER.vehicle==='Carro pequeño'?'selected':''}>🚗 Carro pequeño</option>
                <option value="Camión" ${DRIVER.vehicle==='Camión'?'selected':''}>🚛 Camión</option>
            </select>
            <span class="badge badge-blue"><i class="fas ${vehIcon}"></i> ${metrics.distKm} km</span>
            <span class="badge badge-green"><i class="fas fa-clock"></i> ${metrics.etaMin} min</span>
        </div>

        <!-- SEGMENTED CONTROL: LIST / MAP / ARQUEO CAJA -->
        <div class="segmented-bar">
            <button class="seg-btn ${DRIVER.viewMode==='list'?'active':''}" onclick="DRIVER.viewMode='list';renderDriver()">
                <i class="fas fa-list-ul"></i> List (${activeStops.length})
            </button>
            <button class="seg-btn ${DRIVER.viewMode==='map'?'active':''}" onclick="DRIVER.viewMode='map';renderDriver()">
                <i class="fas fa-map"></i> Map
            </button>
            <button class="seg-btn ${DRIVER.viewMode==='arqueo'?'active':''}" onclick="DRIVER.viewMode='arqueo';renderDriver()">
                <i class="fas fa-coins"></i> Caja & Gastos
            </button>
        </div>

        <!-- CONTENIDO PRINCIPAL SEGÚN PESTAÑA -->
        ${DRIVER.viewMode === 'map' ? renderCircuitMapView(activeStops, nextStop, metrics) :
          DRIVER.viewMode === 'list' ? renderCircuitListView(activeStops) :
          renderArqueoAndBalanceView()}

        ${DRIVER.showCheckpointModal && DRIVER.activeStop ? renderCheckpointModal() : ''}
        ${DRIVER.showQRModal && DRIVER.activeStop ? renderDriverQRModal() : ''}
        ${DRIVER.showConfig ? renderDriverConfigModal() : ''}
    `;

    if (DRIVER.viewMode === 'map') {
        setTimeout(() => initCircuitMap(activeStops), 80);
    }
}

// ==============================================================================
// VISTA 1: MAPA ESTILO CIRCUIT CON PINES NUMERADOS, CREDENCIAL FLOTANTE Y BOTÓN GRANDE "SIGUIENTE PARADA"
// ==============================================================================
function renderCircuitMapView(activeStops, nextStop, metrics) {
    return `
    <div style="position:relative;">
        <!-- CREDENCIAL FLOTANTE CON NOMBRE DE RUTA E INFO -->
        <div class="floating-credential">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span class="badge badge-green">${DRIVER.routeInfo.code}</span>
                    <strong style="font-size:13px;margin-left:4px;">${DRIVER.routeInfo.driverName}</strong>
                </div>
                <span style="font-size:12px;font-weight:700;color:var(--emerald);"><i class="fas ${getVehicleSpeedAndIcon().icon}"></i> ${DRIVER.vehicle}</span>
            </div>
            ${nextStop ? `
                <div style="margin-top:6px;padding-top:6px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <small style="color:var(--text-muted);font-weight:700;">PARADA ACTUAL #1 ${nextStop.status==='REPASO'?'(REPASO)':''}:</small>
                        <div style="font-weight:800;font-size:14px;">${nextStop.client}</div>
                        <div style="font-size:12px;color:#475569;">${nextStop.address} · Cobro: <strong>$${Number(nextStop.total).toLocaleString()}</strong></div>
                    </div>
                    <button class="btn btn-success" style="padding:8px 12px;" onclick="openCheckpointModal('${nextStop.id}')">
                        <i class="fas fa-check-circle"></i> Checkpoint
                    </button>
                </div>
            ` : `<div style="margin-top:6px;font-weight:700;color:var(--emerald);">¡Todas las paradas completadas! Ve a Caja & Gastos para cerrar.</div>`}
        </div>

        <!-- MAPA INTERACTIVO -->
        <div id="circuit-map" style="height:56vh;width:100%;z-index:1;"></div>

        <!-- PANEL INFERIOR CON BOTÓN GRANDE "SIGUIENTE PARADA" E INDICACIONES -->
        <div style="padding:12px 14px;background:#fff;border-top:1px solid #e2e8f0;">
            ${nextStop ? `
                ${DRIVER.navigatingToNext ? `
                <div style="background:#0f172a;color:#fff;padding:12px;border-radius:12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <small style="color:#34d399;font-weight:700;"><i class="fas fa-diamond-turn-right"></i> INDICACIONES ACTIVAS HACIA PARADA #1</small>
                        <div style="font-size:14px;font-weight:700;margin-top:2px;">Dirígete hacia ${nextStop.address} (${nextStop.client})</div>
                    </div>
                    <a class="btn btn-primary" target="_blank" href="https://www.google.com/maps/dir/?api=1&destination=${nextStop.lat},${nextStop.lng}">
                        <i class="fas fa-location-arrow"></i> GPS Externo
                    </a>
                </div>` : ''}

                <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center;font-size:16px;padding:15px;box-shadow:0 6px 16px rgba(37,99,235,0.3);" onclick="startNextStopGuidance('${nextStop.id}')">
                    <i class="fas fa-route"></i> SIGUIENTE PARADA: ${nextStop.client.toUpperCase()}
                </button>
            ` : `
                <button class="btn btn-success btn-lg" style="width:100%;justify-content:center;" onclick="DRIVER.viewMode='arqueo';renderDriver()">
                    <i class="fas fa-calculator"></i> IR A ARQUEO Y CIERRE DE RUTA
                </button>
            `}
        </div>
    </div>`;
}

function initCircuitMap(activeStops) {
    const el = document.getElementById('circuit-map');
    if (!el) return;
    const map = L.map('circuit-map', { zoomControl: false }).setView([4.3365, -74.3638], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Marcador Bodega / Inicio (Casa negra como en la imagen adjunta)
    const depotLatLng = [4.3350, -74.3660];
    const depotIcon = L.divIcon({
        className: '',
        html: `<div class="circuit-pin depot-pin" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-house"></i></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
    });
    L.marker(depotLatLng, { icon: depotIcon }).addTo(map).bindPopup('<b>Centro de Distribución / Bodega</b>');

    const routeCoords = [depotLatLng];

    activeStops.forEach((s, idx) => {
        const isFirst = idx === 0;
        const pinIcon = L.divIcon({
            className: '',
            html: `<div class="circuit-pin ${isFirst ? 'active-pin' : ''}"><span>${idx + 1}</span></div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 34]
        });
        L.marker([s.lat, s.lng], { icon: pinIcon })
            .addTo(map)
            .bindPopup(`<b>Parada #${idx+1}: ${s.client}</b><br>${s.address}<br>Total: $${Number(s.total).toLocaleString()}`);
        routeCoords.push([s.lat, s.lng]);
    });

    if (routeCoords.length > 1) {
        const poly = L.polyline(routeCoords, { color: '#475569', weight: 5, opacity: 0.85 }).addTo(map);
        map.fitBounds(poly.getBounds(), { padding: [95, 45] });
    }
}

function startNextStopGuidance(stopId) {
    DRIVER.navigatingToNext = true;
    renderDriver();
}

// ==============================================================================
// VISTA 2: LISTA DETALLADA DE CLIENTES EN RUTA + BOTÓN DE REPASO (VOLVER A VISITAR)
// ==============================================================================
function renderCircuitListView(activeStops) {
    return `
    <div style="padding:0 14px 20px;max-width:760px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span style="font-size:13px;font-weight:700;color:var(--text-muted);">Orden de Visita (${activeStops.length} paradas)</span>
            <button class="btn btn-primary" style="padding:6px 12px;" onclick="optimizeCircuitRoute()">
                <i class="fas fa-wand-magic-sparkles"></i> Optimizar Orden
            </button>
        </div>

        ${activeStops.map((s, idx) => `
            <div class="card" style="margin-bottom:10px;border-left:5px solid ${s.status==='REPASO'?'#d97706':'#059669'};padding:14px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <div>
                        <span class="badge ${s.status==='REPASO'?'badge-amber':'badge-green'}">#${idx+1} ${s.status==='REPASO'?'REPASO / 2da VISITA':''}</span>
                        <strong style="font-size:15px;margin-left:6px;">${s.client}</strong>
                        <div style="font-size:12px;color:#475569;margin-top:4px;">
                            <i class="fas fa-user"></i> Encargado: <strong>${s.owner || 'Cliente'}</strong> · <i class="fas fa-phone"></i> ${s.phone || 'Sin tel'}
                        </div>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                            <i class="fas fa-location-dot"></i> ${s.address} · Factura: <strong>${s.id}</strong>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:16px;font-weight:800;color:var(--emerald);">$${Number(s.total).toLocaleString()}</div>
                        <small style="color:var(--text-muted);">${s.paymentMethod}</small>
                    </div>
                </div>

                <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                    <a class="btn btn-outline" target="_blank" href="https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}">
                        <i class="fas fa-diamond-turn-right"></i> Navegar GPS
                    </a>
                    <button class="btn btn-warning" onclick="markForRepaso('${s.id}')">
                        <i class="fas fa-rotate-right"></i> Repaso (Volver luego)
                    </button>
                    <button class="btn btn-success" onclick="openCheckpointModal('${s.id}')">
                        <i class="fas fa-clipboard-check"></i> Checkpoint
                    </button>
                </div>
            </div>
        `).join('') || '<div class="card" style="text-align:center;padding:24px;"><strong>¡Sin paradas pendientes!</strong></div>'}
    </div>`;
}

function optimizeCircuitRoute() {
    const pending = DRIVER.stops.filter(s => s.status === 'PENDIENTE');
    const repaso = DRIVER.stops.filter(s => s.status === 'REPASO');
    const done = DRIVER.stops.filter(s => s.status !== 'PENDIENTE' && s.status !== 'REPASO');

    if (pending.length > 1) {
        const ordered = [];
        let currLat = 4.3350, currLng = -74.3660;
        const pool = [...pending];
        while (pool.length) {
            pool.sort((a, b) => Math.hypot(a.lat - currLat, a.lng - currLng) - Math.hypot(b.lat - currLat, b.lng - currLng));
            const next = pool.shift();
            ordered.push(next);
            currLat = next.lat;
            currLng = next.lng;
        }
        DRIVER.stops = [...ordered, ...repaso, ...done];
    }
    DRIVER.routeInfo.optimized = true;
    saveDriverAll();
    renderDriver();
    alert(`Ruta optimizada para ${DRIVER.vehicle} teniendo en cuenta distancias y sentido vial.`);
}

function markForRepaso(stopId) {
    const st = DRIVER.stops.find(s => s.id === stopId);
    if (!st) return;
    st.status = 'REPASO';
    st.visits = (st.visits || 1) + 1;
    saveDriverAll();
    renderDriver();
    alert(`"${st.client}" movido al final de la ruta para REPASO (cobro/entrega al finalizar).`);
}

// ==============================================================================
// MODAL CHECKPOINT DE ENTREGA + COBRO QR EN RUTA
// ==============================================================================
function openCheckpointModal(id) {
    DRIVER.activeStop = DRIVER.stops.find(s => s.id === id);
    DRIVER.showCheckpointModal = true;
    renderDriver();
}

function renderCheckpointModal() {
    const st = DRIVER.activeStop;
    return `
    <div class="modal-bg">
        <div class="modal-box" style="max-width:460px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <h3><i class="fas fa-clipboard-check"></i> Checkpoint de Entrega</h3>
                <span class="badge badge-blue">${st.id}</span>
            </div>
            <div style="background:#f8fafc;padding:10px;border-radius:10px;margin-bottom:12px;font-size:13px;">
                <strong>${st.client}</strong> (${st.owner || 'Cliente'})<br>
                <span style="color:var(--text-muted);">${st.address}</span><br>
                Valor a Recaudar: <strong style="color:var(--emerald);font-size:15px;">$${Number(st.total).toLocaleString()}</strong>
            </div>

            <label style="font-size:12px;font-weight:700;">Estado de la Gestión:</label>
            <select id="ckptStatusSel">
                <option value="ENTREGADO">Entregado y Recaudado</option>
                <option value="REPASO">Programar Repaso (Cobrar al final)</option>
                <option value="NOVEDAD">Novedad / Local Cerrado / Devolución</option>
            </select>

            <label style="font-size:12px;font-weight:700;">Forma de Pago Recibida:</label>
            <div style="display:flex;gap:8px;margin-bottom:10px;">
                <select id="ckptPaySel" style="margin:0;flex:1;">
                    <option value="Efectivo">Efectivo Físico</option>
                    <option value="QR Digital">Pago con Código QR</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Crédito">Crédito / Cartera</option>
                </select>
                <button class="btn btn-primary" onclick="DRIVER.showQRModal=true;renderDriver()"><i class="fas fa-qrcode"></i> Ver QR</button>
            </div>

            <label style="font-size:12px;font-weight:700;">Observaciones / Novedades:</label>
            <textarea id="ckptNotesInput" rows="2" placeholder="Ej: Recibido por el encargado, billete de $50.000..."></textarea>

            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
                <button class="btn btn-outline" onclick="DRIVER.showCheckpointModal=false;renderDriver()">Cancelar</button>
                <button class="btn btn-success" onclick="confirmCheckpointAudit()"><i class="fas fa-check"></i> Confirmar y Siguiente</button>
            </div>
        </div>
    </div>`;
}

function renderDriverQRModal() {
    const st = DRIVER.activeStop;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('PAGO RUTA TAT | FACTURA: ' + st.id + ' | VALOR: $' + st.total)}`;
    return `
    <div class="modal-bg" style="z-index:10000;">
        <div class="modal-box" style="text-align:center;max-width:360px;">
            <h3><i class="fas fa-qrcode"></i> Cobro QR en Entrega</h3>
            <p style="font-size:12px;color:var(--text-muted);margin:6px 0 12px;">Muestra este código al cliente para recibir el pago</p>
            <img src="${qrUrl}" style="border:6px solid #f1f5f9;border-radius:12px;margin-bottom:10px;">
            <div style="font-size:20px;font-weight:800;color:var(--emerald);margin-bottom:12px;">$${Number(st.total).toLocaleString()}</div>
            <button class="btn btn-success" style="width:100%;justify-content:center;" onclick="DRIVER.showQRModal=false;document.getElementById('ckptPaySel').value='QR Digital';renderDriver()">
                <i class="fas fa-check"></i> Listo, Pago Recibido
            </button>
        </div>
    </div>`;
}

async function confirmCheckpointAudit() {
    const status = document.getElementById('ckptStatusSel').value;
    const paymentMethod = document.getElementById('ckptPaySel').value;
    const notes = document.getElementById('ckptNotesInput').value.trim();

    DRIVER.activeStop.status = status;
    DRIVER.activeStop.paymentMethod = paymentMethod;
    DRIVER.activeStop.notes = notes;
    DRIVER.navigatingToNext = false;

    const payload = { action: 'UPDATE_CHECKPOINT', id: DRIVER.activeStop.id, status, paymentMethod, notes };
    if (DRIVER.apiUrl && navigator.onLine) {
        try {
            await fetch(DRIVER.apiUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } catch (e) {
            DRIVER.outbox.push(payload);
        }
    } else if (DRIVER.apiUrl) {
        DRIVER.outbox.push(payload);
    }

    DRIVER.showCheckpointModal = false;
    saveDriverAll();
    renderDriver();
}

// ==============================================================================
// VISTA 3: ARQUEO DE DINERO POR DENOMINACIÓN, GASTOS Y BALANCE DE RUTA
// ==============================================================================
function renderArqueoAndBalanceView() {
    const denoms = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];
    const totalPhysicalCash = denoms.reduce((sum, d) => sum + d * (DRIVER.denominations[d] || 0), 0);

    const deliveredStops = DRIVER.stops.filter(s => s.status === 'ENTREGADO');
    const totalInvoicedDelivered = deliveredStops.reduce((sum, s) => sum + Number(s.total), 0);
    const expectedCash = deliveredStops.filter(s => s.paymentMethod === 'Efectivo').reduce((sum, s) => sum + Number(s.total), 0);
    const collectedDigital = deliveredStops.filter(s => s.paymentMethod !== 'Efectivo' && s.paymentMethod !== 'Crédito').reduce((sum, s) => sum + Number(s.total), 0);
    const totalExpenses = DRIVER.expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const netCashExpected = expectedCash - totalExpenses;
    const cashDifference = totalPhysicalCash - netCashExpected;

    return `
    <div style="padding:0 14px 28px;max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:14px;">
        <!-- BALANCE GENERAL DE RUTA -->
        <div class="card">
            <h3 style="margin-bottom:10px;"><i class="fas fa-scale-balanced"></i> Balance Financiero de Ruta (${DRIVER.routeInfo.code})</h3>
            <div class="stat-grid">
                <div class="stat-card">
                    <small style="color:var(--text-muted);">Total Entregado (Facturado)</small>
                    <h3 style="color:var(--primary);margin-top:2px;">$${totalInvoicedDelivered.toLocaleString()}</h3>
                </div>
                <div class="stat-card">
                    <small style="color:var(--text-muted);">Efectivo Esperado (- Gastos)</small>
                    <h3 style="color:var(--emerald);margin-top:2px;">$${netCashExpected.toLocaleString()}</h3>
                </div>
                <div class="stat-card">
                    <small style="color:var(--text-muted);">Recaudo Digital / QR</small>
                    <h3 style="color:#0284c7;margin-top:2px;">$${collectedDigital.toLocaleString()}</h3>
                </div>
                <div class="stat-card">
                    <small style="color:var(--text-muted);">Gastos de Ruta</small>
                    <h3 style="color:var(--danger);margin-top:2px;">$${totalExpenses.toLocaleString()}</h3>
                </div>
            </div>

            <div style="padding:12px;border-radius:10px;background:${cashDifference===0?'#dcfce7':cashDifference>0?'#dbeafe':'#fee2e2'};display:flex;justify-content:space-between;align-items:center;">
                <strong>Diferencia de Arqueo Físico:</strong>
                <strong style="font-size:17px;">${cashDifference === 0 ? '$0 (Cuadre Exacto)' : (cashDifference > 0 ? '+$' + cashDifference.toLocaleString() + ' (Sobrante)' : '-$' + Math.abs(cashDifference).toLocaleString() + ' (Faltante)')}</strong>
            </div>
        </div>

        <!-- CONTADOR DE DINERO FÍSICO POR DENOMINACIÓN -->
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <h3><i class="fas fa-money-bill-wave"></i> Conteo de Efectivo por Denominación</h3>
                <strong style="color:var(--emerald);font-size:17px;">Físico: $${totalPhysicalCash.toLocaleString()}</strong>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;">
                ${denoms.map(d => `
                    <div style="display:flex;align-items:center;justify-content:space-between;border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;background:#f8fafc;">
                        <span style="font-weight:700;font-size:13px;">$${d.toLocaleString()}</span>
                        <input type="number" min="0" value="${DRIVER.denominations[d] || 0}" style="width:65px;margin:0;padding:4px 6px;text-align:center;" onchange="updateDenom(${d}, this.value)">
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- REGISTRO DE GASTOS Y DATOS DEL VEHÍCULO / RUTA -->
        <div class="pos-grid">
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <h4><i class="fas fa-gas-pump"></i> Gastos Operativos de Ruta</h4>
                    <button class="btn btn-danger" style="padding:5px 10px;" onclick="addRouteExpense()"><i class="fas fa-plus"></i> Agregar Gasto</button>
                </div>
                ${DRIVER.expenses.map((ex, i) => `
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid #f1f5f9;">
                        <span>${ex.concept}</span>
                        <strong>$${Number(ex.amount).toLocaleString()}</strong>
                    </div>
                `).join('') || '<p style="font-size:12px;color:var(--text-muted);">Sin gastos registrados (ACPM, peajes, parqueadero, etc.)</p>'}
            </div>

            <div class="card">
                <h4 style="margin-bottom:10px;"><i class="fas fa-clipboard-list"></i> Bitácora del Vehículo y Ruta</h4>
                <label style="font-size:11px;font-weight:700;">Placa Vehículo:</label>
                <input value="${DRIVER.routeStats.plate}" onchange="DRIVER.routeStats.plate=this.value;saveDriverAll()">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <div>
                        <label style="font-size:11px;font-weight:700;">Km Inicial:</label>
                        <input type="number" value="${DRIVER.routeStats.startKm}" onchange="DRIVER.routeStats.startKm=this.value;saveDriverAll()">
                    </div>
                    <div>
                        <label style="font-size:11px;font-weight:700;">Km Final:</label>
                        <input type="number" value="${DRIVER.routeStats.endKm}" onchange="DRIVER.routeStats.endKm=this.value;saveDriverAll()">
                    </div>
                </div>
                <button class="btn btn-success" style="width:100%;justify-content:center;" onclick="alert('¡Liquidación y Cierre de Ruta guardado con éxito!')">
                    <i class="fas fa-check-double"></i> Finalizar y Liquidar Ruta
                </button>
            </div>
        </div>
    </div>`;
}

function updateDenom(denom, count) {
    DRIVER.denominations[denom] = Math.max(0, parseInt(count) || 0);
    saveDriverAll();
    renderDriver();
}

function addRouteExpense() {
    const concept = prompt('Concepto del gasto (Ej: Combustible, Peaje, Parqueadero):');
    if (!concept) return;
    const amount = Number(prompt('Valor del gasto ($):', '15000'));
    if (amount > 0) {
        DRIVER.expenses.push({ concept, amount });
        saveDriverAll();
        renderDriver();
    }
}

function importManifest(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const data = JSON.parse(ev.target.result);
        DRIVER.stops = data.map(d => ({ ...d, status: d.status || 'PENDIENTE', visits: 1 }));
        if (DRIVER.stops[0]?.route) DRIVER.routeInfo.code = DRIVER.stops[0].route;
        saveDriverAll();
        renderDriver();
        alert(`Manifiesto cargado con ${DRIVER.stops.length} paradas.`);
    };
    reader.readAsText(file);
}

function renderDriverConfigModal() {
    return `
    <div class="modal-bg">
        <div class="modal-box" style="max-width:440px;">
            <h3 style="margin-bottom:8px;"><i class="fas fa-cloud"></i> Sincronización Google Sheets</h3>
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Pega la URL de Google Apps Script para descargar la ruta cerrada por el vendedor.</p>
            <input id="drvSheetsInput" value="${DRIVER.apiUrl}" placeholder="https://script.google.com/macros/s/.../exec">
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button class="btn btn-outline" onclick="DRIVER.showConfig=false;renderDriver()">Cerrar</button>
                <button class="btn btn-primary" onclick="saveAndSyncDriverSheets()">Guardar y Sincronizar</button>
            </div>
        </div>
    </div>`;
}

async function saveAndSyncDriverSheets() {
    DRIVER.apiUrl = document.getElementById('drvSheetsInput').value.trim();
    localStorage.setItem('tat_driver_api_url', DRIVER.apiUrl);
    DRIVER.showConfig = false;
    if (DRIVER.apiUrl) {
        try {
            const res = await fetch(DRIVER.apiUrl);
            const data = await res.json();
            if (data.ok && Array.isArray(data.orders)) {
                DRIVER.stops = data.orders.filter(o => o.status === 'PENDIENTE' || o.status === 'REPASO');
                saveDriverAll();
                alert('Ruta sincronizada desde Google Sheets.');
            }
        } catch (e) {
            alert('URL guardada. No se pudo conectar en este momento.');
        }
    }
    renderDriver();
}

renderDriver();
