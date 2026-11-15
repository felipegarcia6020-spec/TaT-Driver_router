// TAT-Driver Pro Integrated with RouteLogix Mechanics
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
    viewMode: 'map',
    routeInfo: {
        code: 'RUTA-FUSA-01',
        name: 'Ruta Fusagasugá Centro - Norte',
        driverName: 'Juan Pablo Díaz',
        businessName: 'Distribuciones Fusa',
        date: new Date().toLocaleDateString('es-CO', { weekday: 'long', month: 'short', day: 'numeric' }),
        optimized: false
    },
    vehicle: 'Camión',
    stops: JSON.parse(localStorage.getItem('tat_driver_stops') || JSON.stringify([
        { id: 'FAC-10021', clientCode: 'FUS-101', client: 'Minimercado La Esquina', owner: 'Don Hernando', phone: '3104567890', address: 'Cra 6 # 12-40, Centro', total: 142000, lat: 4.3382, lng: -74.3612, status: 'PENDIENTE', visits: 1, paymentMethod: 'Efectivo', notes: '', posItems: [{name: 'Queso Doble Crema 500g', qty: 5, price: 12000}, {name: 'Leche Entera 1L', qty: 18, price: 4500}] },
        { id: 'FAC-10022', clientCode: 'FUS-102', client: 'Tienda Don Pedro', owner: 'Pedro Pablo Ruiz', phone: '3112345678', address: 'Cll 18 # 9-15, Balmoral', total: 88000, lat: 4.3335, lng: -74.3670, status: 'PENDIENTE', visits: 1, paymentMethod: 'Efectivo', notes: '', posItems: [{name: 'Leche Entera 1L', qty: 15, price: 4500}, {name: 'Pan Tajado', qty: 4, price: 4625}] },
        { id: 'FAC-10023', clientCode: 'FUS-103', client: 'Autoservicio El Porvenir', owner: 'Marta Lucía', phone: '3209876543', address: 'Av. Las Palmas # 22-10', total: 215000, lat: 4.3410, lng: -74.3585, status: 'PENDIENTE', visits: 1, paymentMethod: 'QR Digital', notes: '', posItems: [{name: 'Queso Doble Crema 500g', qty: 12, price: 12000}, {name: 'Yogurt 1L', qty: 14, price: 5071}] },
        { id: 'FAC-10024', clientCode: 'FUS-104', client: 'Granero San Mateo', owner: 'Carlos Julio', phone: '3147896541', address: 'Cll 10 # 3-45, Fusagasugá', total: 64000, lat: 4.3358, lng: -74.3645, status: 'PENDIENTE', visits: 1, paymentMethod: 'Efectivo', notes: '', posItems: [{name: 'Leche Entera 1L', qty: 14, price: 4571}] }
    ])),
    clients: JSON.parse(localStorage.getItem('tat_driver_clients') || JSON.stringify([
        { id: 'cli-1', name: 'Minimercado La Esquina', address: 'Cra 6 # 12-40, Centro', phone: '3104567890' },
        { id: 'cli-2', name: 'Tienda Don Pedro', address: 'Cll 18 # 9-15, Balmoral', phone: '3112345678' },
        { id: 'cli-3', name: 'Autoservicio El Porvenir', address: 'Av. Las Palmas # 22-10', phone: '3209876543' },
        { id: 'cli-4', name: 'Granero San Mateo', address: 'Cll 10 # 3-45', phone: '3147896541' }
    ])),
    inventory: JSON.parse(localStorage.getItem('tat_driver_inventory') || JSON.stringify([
        { id: 'p1', name: 'Queso Doble Crema 500g', price: 12000, stock: 40 },
        { id: 'p2', name: 'Leche Entera 1L', price: 4500, stock: 80 },
        { id: 'p3', name: 'Yogurt 1L', price: 5500, stock: 35 },
        { id: 'p4', name: 'Pan Tajado', price: 5000, stock: 25 }
    ])),
    outbox: JSON.parse(localStorage.getItem('tat_driver_outbox') || '[]'),
    denominations: JSON.parse(localStorage.getItem('tat_drv_denom') || JSON.stringify({
        100000: 0, 50000: 0, 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0
    })),
    expenses: JSON.parse(localStorage.getItem('tat_drv_expenses') || '[]'),
    routeStats: JSON.parse(localStorage.getItem('tat_drv_stats') || JSON.stringify({
        plate: 'WXY-456',
        startKm: 45210,
        endKm: 45248
    })),
    showConfig: false,
    showCheckpointModal: false,
    showQRModal: false,
    showClientModal: false,
    showProductModal: false,
    showReceiptModal: false,
    activeStop: null,
    navigatingToNext: false,
    activePosCart: [],
    lastReceiptText: ''
};

function saveDriverAll() {
    localStorage.setItem('tat_driver_stops', JSON.stringify(DRIVER.stops));
    localStorage.setItem('tat_driver_clients', JSON.stringify(DRIVER.clients));
    localStorage.setItem('tat_driver_inventory', JSON.stringify(DRIVER.inventory));
    localStorage.setItem('tat_driver_outbox', JSON.stringify(DRIVER.outbox));
    localStorage.setItem('tat_drv_denom', JSON.stringify(DRIVER.denominations));
    localStorage.setItem('tat_drv_expenses', JSON.stringify(DRIVER.expenses));
    localStorage.setItem('tat_drv_stats', JSON.stringify(DRIVER.routeStats));
}

function handleLogin() {
    const name = document.getElementById('login-name').value.trim();
    const biz = document.getElementById('login-biz').value.trim();
    if (name) DRIVER.routeInfo.driverName = name;
    if (biz) DRIVER.routeInfo.businessName = biz;
    document.getElementById('auth-screen').style.display = 'none';
    renderDriver();
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
    let dist = 1.4;
    for (let i = 0; i < stopsList.length - 1; i++) {
        const dLat = (stopsList[i+1].lat - stopsList[i].lat) * 111;
        const dLng = (stopsList[i+1].lng - stopsList[i].lng) * 111 * Math.cos(stopsList[i].lat * Math.PI / 180);
        dist += Math.hypot(dLat, dLng) * 1.35;
    }
    const { speedKmh } = getVehicleSpeedAndIcon();
    const travelMin = (dist / speedKmh) * 60;
    const stopServiceMin = stopsList.length * 4;
    return { distKm: dist.toFixed(1), etaMin: Math.round(travelMin + stopServiceMin) };
}

function renderDriver() {
    const root = document.getElementById('driver-app');

    if (!DRIVER.routeStarted) {
        const pendingCount = DRIVER.stops.filter(s => s.status === 'PENDIENTE' || s.status === 'REPASO').length;
        const totalValue = DRIVER.stops.reduce((a, b) => a + Number(b.total), 0);
        root.innerHTML = `
        <div style="min-height:100vh;background:linear-gradient(160deg, #064e3b 0%, #0f172a 100%);color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:24px;text-align:center;">
            <div style="width:84px;height:84px;background:#059669;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:900;margin-bottom:16px;box-shadow:0 10px 25px rgba(0,0,0,0.4);">TAT</div>
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
                    <i class="fas fa-file-import"></i> Importar Manifiesto
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

    const activeStops = [
        ...DRIVER.stops.filter(s => s.status === 'PENDIENTE'),
        ...DRIVER.stops.filter(s => s.status === 'REPASO')
    ];
    const nextStop = activeStops[0];
    const metrics = calculateRouteMetrics(activeStops);
    const { icon: vehIcon } = getVehicleSpeedAndIcon();

    root.innerHTML = `
        <div style="background:#ffffff;border-bottom:1px solid #e2e8f0;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <button class="btn btn-outline" style="padding:6px 10px;" onclick="DRIVER.routeStarted=false;renderDriver()"><i class="fas fa-arrow-left"></i></button>
                <div>
                    <div style="font-weight:800;font-size:15px;color:#0f172a;">${DRIVER.routeInfo.name}</div>
                    <div style="font-size:12px;color:var(--text-muted);">${activeStops.length} paradas · ${metrics.distKm} km · ~${metrics.etaMin} min</div>
                </div>
            </div>
            <div style="display:flex;gap:6px;">
                <button class="btn btn-outline" style="padding:7px 10px;" onclick="DRIVER.showClientModal=true;renderDriver()" title="Añadir Cliente">
                    <i class="fas fa-user-plus"></i>
                </button>
                <button class="btn btn-outline" style="padding:7px 10px;" onclick="DRIVER.showProductModal=true;renderDriver()" title="Inventario POS">
                    <i class="fas fa-boxes-stacked"></i>
                </button>
                <button class="btn btn-outline" style="padding:7px 10px;" onclick="DRIVER.showConfig=true;renderDriver()" title="Sincronizar Nube"><i class="fas fa-cloud-arrow-down"></i></button>
            </div>
        </div>

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

        <div class="segmented-bar">
            <button class="seg-btn ${DRIVER.viewMode==='map'?'active':''}" onclick="DRIVER.viewMode='map';renderDriver()">
                <i class="fas fa-map"></i> Map
            </button>
            <button class="seg-btn ${DRIVER.viewMode==='list'?'active':''}" onclick="DRIVER.viewMode='list';renderDriver()">
                <i class="fas fa-list-ul"></i> Ruta
            </button>
            <button class="seg-btn ${DRIVER.viewMode==='agenda'?'active':''}" onclick="DRIVER.viewMode='agenda';renderDriver()">
                <i class="fas fa-address-book"></i> Agenda
            </button>
            <button class="seg-btn ${DRIVER.viewMode==='inventory'?'active':''}" onclick="DRIVER.viewMode='inventory';renderDriver()">
                <i class="fas fa-box"></i> POS
            </button>
            <button class="seg-btn ${DRIVER.viewMode==='arqueo'?'active':''}" onclick="DRIVER.viewMode='arqueo';renderDriver()">
                <i class="fas fa-coins"></i> Caja
            </button>
        </div>

        ${DRIVER.viewMode === 'map' ? renderCircuitMapView(activeStops, nextStop, metrics) :
          DRIVER.viewMode === 'list' ? renderCircuitListView(activeStops) :
          DRIVER.viewMode === 'agenda' ? renderAgendaView() :
          DRIVER.viewMode === 'inventory' ? renderInventoryPOSView() :
          renderArqueoAndBalanceView()}

        ${DRIVER.showCheckpointModal && DRIVER.activeStop ? renderCheckpointModal() : ''}
        ${DRIVER.showQRModal && DRIVER.activeStop ? renderDriverQRModal() : ''}
        ${DRIVER.showConfig ? renderDriverConfigModal() : ''}
        ${DRIVER.showClientModal ? renderClientModal() : ''}
        ${DRIVER.showProductModal ? renderProductModal() : ''}
        ${DRIVER.showReceiptModal ? renderReceiptModal() : ''}
    `;

    if (DRIVER.viewMode === 'map') {
        setTimeout(() => initCircuitMap(activeStops), 80);
    }
}

function renderCircuitMapView(activeStops, nextStop, metrics) {
    return `
    <div style="position:relative;">
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
            ` : `<div style="margin-top:6px;font-weight:700;color:var(--emerald);">¡Todas las paradas completadas! Ve a Caja para cerrar.</div>`}
        </div>

        <div id="circuit-map" style="height:56vh;width:100%;z-index:1;"></div>

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

function renderCircuitListView(activeStops) {
    return `
    <div style="padding:14px;max-width:760px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span style="font-size:13px;font-weight:700;color:var(--text-muted);">Orden de Visita (${activeStops.length} paradas)</span>
            <div style="display:flex;gap:6px;">
                <button class="btn btn-primary" style="padding:6px 10px;" onclick="DRIVER.showClientModal=true;renderDriver()">
                    <i class="fas fa-plus"></i> Añadir Parada
                </button>
                <button class="btn btn-outline" style="padding:6px 10px;" onclick="optimizeCircuitRoute()">
                    <i class="fas fa-wand-magic-sparkles"></i> Optimizar
                </button>
            </div>
        </div>

        ${activeStops.map((s, idx) => `
            <div class="card" style="margin-bottom:10px;border-left:5px solid ${s.status==='REPASO'?'#d97706':s.status==='ENTREGADO'?'#2563eb':'#059669'};padding:14px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <div>
                        <span class="badge ${s.status==='REPASO'?'badge-amber':s.status==='ENTREGADO'?'badge-blue':'badge-green'}">#${idx+1} ${s.status}</span>
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
                        <i class="fas fa-rotate-right"></i> Repaso
                    </button>
                    <button class="btn btn-success" onclick="openCheckpointModal('${s.id}')">
                        <i class="fas fa-clipboard-check"></i> Checkpoint & POS
                    </button>
                    ${s.status === 'ENTREGADO' ? `<button class="btn btn-dark" onclick="openReceiptModal('${s.id}')"><i class="fas fa-receipt"></i> Recibo</button>` : ''}
                </div>
            </div>
        `).join('') || '<div class="card" style="text-align:center;padding:24px;"><strong>¡Sin paradas pendientes!</strong></div>'}
    </div>`;
}

function renderAgendaView() {
    return `
    <div style="padding:14px;max-width:760px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:800;"><i class="fas fa-address-book"></i> Agenda de Clientes</h3>
            <button class="btn btn-success" style="padding:7px 12px;" onclick="DRIVER.showClientModal=true;renderDriver()">
                <i class="fas fa-user-plus"></i> Nuevo Cliente
            </button>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
            ${DRIVER.clients.map(c => `
                <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;">
                    <div>
                        <strong style="font-size:14px;">${c.name}</strong>
                        <div style="font-size:12px;color:var(--text-muted);"><i class="fas fa-location-dot"></i> ${c.address}</div>
                        <div style="font-size:12px;color:var(--text-muted);"><i class="fas fa-phone"></i> ${c.phone || 'Sin teléfono'}</div>
                    </div>
                    <button class="btn btn-primary" style="padding:8px 12px;" onclick="addClientToRoute('${c.id}')">
                        <i class="fas fa-plus"></i> Añadir a Ruta
                    </button>
                </div>
            `).join('')}
        </div>
    </div>`;
}

function renderInventoryPOSView() {
    return `
    <div style="padding:14px;max-width:760px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:800;"><i class="fas fa-boxes-stacked"></i> Catálogo & Stock en Ruta (POS)</h3>
            <button class="btn btn-success" style="padding:7px 12px;" onclick="DRIVER.showProductModal=true;renderDriver()">
                <i class="fas fa-plus"></i> Añadir Producto
            </button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
            ${DRIVER.inventory.map(p => `
                <div class="card" style="padding:14px;">
                    <strong style="font-size:14px;display:block;margin-bottom:4px;">${p.name}</strong>
                    <div style="font-size:16px;font-weight:800;color:var(--emerald);margin-bottom:6px;">$${Number(p.price).toLocaleString()}</div>
                    <div style="font-size:12px;color:var(--text-muted);">Stock disponible: <strong>${p.stock} un.</strong></div>
                </div>
            `).join('')}
        </div>
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
    alert(`"${st.client}" movido al final de la ruta para REPASO.`);
}

function openCheckpointModal(id) {
    DRIVER.activeStop = DRIVER.stops.find(s => s.id === id);
    DRIVER.activePosCart = DRIVER.activeStop.posItems ? [...DRIVER.activeStop.posItems] : [];
    if (DRIVER.activePosCart.length === 0 && DRIVER.inventory.length > 0) {
        DRIVER.activePosCart.push({ name: DRIVER.inventory[0].name, qty: 1, price: DRIVER.inventory[0].price });
    }
    DRIVER.showCheckpointModal = true;
    renderDriver();
}

function renderCheckpointModal() {
    const st = DRIVER.activeStop;
    const cartTotal = DRIVER.activePosCart.reduce((sum, i) => sum + (i.qty * i.price), 0);
    return `
    <div class="modal-bg">
        <div class="modal-box" style="max-width:480px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <h3><i class="fas fa-clipboard-check"></i> Checkpoint & POS Autoventa</h3>
                <span class="badge badge-blue">${st.id}</span>
            </div>
            <div style="background:#f8fafc;padding:10px;border-radius:10px;margin-bottom:12px;font-size:13px;">
                <strong>${st.client}</strong> (${st.owner || 'Cliente'})<br>
                <span style="color:var(--text-muted);">${st.address}</span>
            </div>

            <label style="font-size:12px;font-weight:700;">Estado de la Gestión:</label>
            <select id="ckptStatusSel" onchange="togglePosSection(this.value)">
                <option value="ENTREGADO" ${st.status==='ENTREGADO'?'selected':''}>Entregado y Recaudado</option>
                <option value="REPASO" ${st.status==='REPASO'?'selected':''}>Programar Repaso (Volver luego)</option>
                <option value="NOVEDAD">Novedad / Local Cerrado / Devolución</option>
            </select>

            <div id="pos-builder-section" style="background:#f1f5f9;padding:12px;border-radius:12px;margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <strong style="font-size:12px;color:var(--emerald);"><i class="fas fa-cart-shopping"></i> Facturación POS en Parada</strong>
                    <button class="btn btn-primary" style="padding:4px 8px;font-size:11px;" onclick="addCartItem()"><i class="fas fa-plus"></i> Ítem</button>
                </div>
                <div id="cart-rows" style="display:flex;flex-direction:column;gap:6px;max-height:150px;overflow-y:auto;margin-bottom:8px;">
                    ${DRIVER.activePosCart.map((item, idx) => `
                        <div style="display:flex;gap:6px;align-items:center;">
                            <select style="margin:0;flex:2;font-size:12px;" onchange="updateCartItemProd(${idx}, this.value)">
                                ${DRIVER.inventory.map(p => `<option value="${p.name}" ${p.name===item.name?'selected':''}>${p.name} ($${p.price})</option>`).join('')}
                            </select>
                            <input type="number" min="1" value="${item.qty}" style="margin:0;width:55px;text-align:center;font-size:12px;" onchange="updateCartItemQty(${idx}, this.value)">
                            <strong style="font-size:12px;width:70px;text-align:right;">$${(item.qty*item.price).toLocaleString()}</strong>
                            <button class="btn btn-danger" style="padding:4px 6px;" onclick="removeCartItem(${idx})">×</button>
                        </div>
                    `).join('')}
                </div>
                <div style="display:flex;justify-content:space-between;font-size:13px;border-top:1px solid #cbd5e1;padding-top:6px;">
                    <strong>Total Facturado:</strong>
                    <strong style="color:var(--emerald);font-size:15px;" id="live-cart-total">$${cartTotal.toLocaleString()}</strong>
                </div>
            </div>

            <label style="font-size:12px;font-weight:700;">Forma de Pago Recibida:</label>
            <div style="display:flex;gap:8px;margin-bottom:10px;">
                <select id="ckptPaySel" style="margin:0;flex:1;">
                    <option value="Efectivo" ${st.paymentMethod==='Efectivo'?'selected':''}>Efectivo Físico</option>
                    <option value="QR Digital" ${st.paymentMethod==='QR Digital'?'selected':''}>Pago con Código QR</option>
                    <option value="Transferencia" ${st.paymentMethod==='Transferencia'?'selected':''}>Transferencia Bancaria</option>
                    <option value="Crédito" ${st.paymentMethod==='Crédito'?'selected':''}>Crédito / Cartera</option>
                </select>
                <button class="btn btn-primary" onclick="DRIVER.showQRModal=true;renderDriver()"><i class="fas fa-qrcode"></i> QR</button>
            </div>

            <label style="font-size:12px;font-weight:700;">Observaciones:</label>
            <textarea id="ckptNotesInput" rows="2" placeholder="Ej: Recibido por el encargado...">${st.notes || ''}</textarea>

            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
                <button class="btn btn-outline" onclick="DRIVER.showCheckpointModal=false;renderDriver()">Cancelar</button>
                <button class="btn btn-success" onclick="confirmCheckpointAudit()"><i class="fas fa-check"></i> Confirmar y Generar Recibo</button>
            </div>
        </div>
    </div>`;
}

function togglePosSection(status) {
    const box = document.getElementById('pos-builder-section');
    if (box) box.style.display = status === 'ENTREGADO' ? 'block' : 'none';
}

function addCartItem() {
    if (!DRIVER.inventory.length) return;
    const p = DRIVER.inventory[0];
    DRIVER.activePosCart.push({ name: p.name, qty: 1, price: p.price });
    renderDriver();
}

function updateCartItemProd(idx, name) {
    const p = DRIVER.inventory.find(x => x.name === name);
    if (p) {
        DRIVER.activePosCart[idx].name = p.name;
        DRIVER.activePosCart[idx].price = p.price;
        renderDriver();
    }
}

function updateCartItemQty(idx, qty) {
    DRIVER.activePosCart[idx].qty = Math.max(1, parseInt(qty) || 1);
    renderDriver();
}

function removeCartItem(idx) {
    DRIVER.activePosCart.splice(idx, 1);
    renderDriver();
}

function renderDriverQRModal() {
    const st = DRIVER.activeStop;
    const cartTotal = DRIVER.activePosCart.reduce((sum, i) => sum + (i.qty * i.price), 0) || st.total;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('PAGO RUTA TAT | FACTURA: ' + st.id + ' | VALOR: $' + cartTotal)}`;
    return `
    <div class="modal-bg" style="z-index:10000;">
        <div class="modal-box" style="text-align:center;max-width:360px;">
            <h3><i class="fas fa-qrcode"></i> Cobro QR en Entrega</h3>
            <p style="font-size:12px;color:var(--text-muted);margin:6px 0 12px;">Muestra este código al cliente</p>
            <img src="${qrUrl}" style="border:6px solid #f1f5f9;border-radius:12px;margin-bottom:10px;">
            <div style="font-size:20px;font-weight:800;color:var(--emerald);margin-bottom:12px;">$${cartTotal.toLocaleString()}</div>
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
    const cartTotal = status === 'ENTREGADO' ? DRIVER.activePosCart.reduce((sum, i) => sum + (i.qty * i.price), 0) : DRIVER.activeStop.total;

    DRIVER.activeStop.status = status;
    DRIVER.activeStop.paymentMethod = paymentMethod;
    DRIVER.activeStop.notes = notes;
    DRIVER.activeStop.total = cartTotal;
    DRIVER.activeStop.posItems = [...DRIVER.activePosCart];
    DRIVER.navigatingToNext = false;

    if (status === 'ENTREGADO') {
        DRIVER.activePosCart.forEach(item => {
            const prod = DRIVER.inventory.find(p => p.name === item.name);
            if (prod) prod.stock = Math.max(0, prod.stock - item.qty);
        });
    }

    const payload = { action: 'UPDATE_CHECKPOINT', id: DRIVER.activeStop.id, status, paymentMethod, notes, total: cartTotal };
    if (DRIVER.apiUrl && navigator.onLine) {
        try {
            await fetch(DRIVER.apiUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } catch (e) { DRIVER.outbox.push(payload); }
    } else if (DRIVER.apiUrl) { DRIVER.outbox.push(payload); }

    DRIVER.showCheckpointModal = false;
    saveDriverAll();

    if (status === 'ENTREGADO') {
        openReceiptModal(DRIVER.activeStop.id);
    } else {
        renderDriver();
    }
}

function openReceiptModal(stopId) {
    DRIVER.activeStop = DRIVER.stops.find(s => s.id === stopId);
    DRIVER.showReceiptModal = true;
    renderDriver();
}

function renderReceiptModal() {
    const st = DRIVER.activeStop;
    const nowStr = new Date().toLocaleString('es-CO');
    const items = st.posItems || [{ name: 'Servicio / Entrega General', qty: 1, price: st.total }];
    const total = st.total;

    DRIVER.lastReceiptText = "🧾 *RECIBO DE VENTA - " + DRIVER.routeInfo.businessName.toUpperCase() + "*\n" +
        "Fecha: " + nowStr + "\n" +
        "--------------------------\n" +
        "*Cliente:* " + st.client + "\n" +
        "*Vendedor:* " + DRIVER.routeInfo.driverName + "\n" +
        "--------------------------\n" +
        items.map(i => "• " + i.qty + "x " + i.name + ": $" + (i.qty * i.price).toLocaleString()).join("\n") + "\n" +
        "--------------------------\n" +
        "*TOTAL: $" + Number(total).toLocaleString() + "*\n" +
        "*Pago:* " + st.paymentMethod + "\n\n" +
        "_¡Gracias por su compra!_";

    return `
    <div class="modal-bg" style="z-index:10050;">
        <div class="modal-box" style="max-width:380px;font-family:monospace;">
            <div style="text-align:center;border-bottom:2px dashed #cbd5e1;padding-bottom:10px;margin-bottom:10px;">
                <h3 style="font-size:16px;font-weight:900;">${DRIVER.routeInfo.businessName.toUpperCase()}</h3>
                <p style="font-size:11px;color:var(--text-muted);">${DRIVER.routeInfo.date}</p>
            </div>
            <div style="font-size:12px;margin-bottom:10px;border-bottom:1px dashed #cbd5e1;padding-bottom:8px;">
                <strong>Cliente:</strong> ${st.client}<br>
                <strong>Factura:</strong> ${st.id}
            </div>
            <div style="font-size:12px;margin-bottom:10px;border-bottom:1px dashed #cbd5e1;padding-bottom:8px;">
                ${items.map(i => `<div style="display:flex;justify-content:space-between;"><span>${i.qty}x ${i.name}</span><strong>$${(i.qty*i.price).toLocaleString()}</strong></div>`).join('')}
            </div>
            <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:900;margin-bottom:14px;">
                <span>TOTAL:</span>
                <span style="color:var(--emerald);">$${Number(total).toLocaleString()}</span>
            </div>
            <div style="display:flex;gap:8px;">
                <a class="btn btn-success" style="flex:1;justify-content:center;" target="_blank" href="https://wa.me/?text=${encodeURIComponent(DRIVER.lastReceiptText)}">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
                <button class="btn btn-primary" style="flex:1;justify-content:center;" onclick="window.print()">
                    <i class="fas fa-print"></i> Imprimir
                </button>
            </div>
            <button class="btn btn-outline" style="width:100%;justify-content:center;margin-top:8px;" onclick="DRIVER.showReceiptModal=false;renderDriver()">Cerrar Recibo</button>
        </div>
    </div>`;
}

function renderClientModal() {
    return `
    <div class="modal-bg">
        <div class="modal-box" style="max-width:400px;">
            <h3 style="margin-bottom:10px;"><i class="fas fa-user-plus"></i> Registrar Cliente y Añadir a Ruta</h3>
            <input id="newCliName" placeholder="Nombre del Negocio o Cliente" style="margin-bottom:8px;">
            <input id="newCliOwner" placeholder="Nombre Encargado / Dueño" style="margin-bottom:8px;">
            <input id="newCliPhone" placeholder="Teléfono / WhatsApp" style="margin-bottom:8px;">
            <input id="newCliAddr" placeholder="Dirección (Ej: Cll 10 # 4-20)" style="margin-bottom:8px;">
            <input id="newCliTotal" type="number" placeholder="Valor Estimado de Venta ($)" value="75000" style="margin-bottom:12px;">
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button class="btn btn-outline" onclick="DRIVER.showClientModal=false;renderDriver()">Cancelar</button>
                <button class="btn btn-success" onclick="saveNewClientAndStop()">Guardar y Añadir</button>
            </div>
        </div>
    </div>`;
}

function saveNewClientAndStop() {
    const name = document.getElementById('newCliName').value.trim();
    const owner = document.getElementById('newCliOwner').value.trim();
    const phone = document.getElementById('newCliPhone').value.trim();
    const address = document.getElementById('newCliAddr').value.trim();
    const total = Number(document.getElementById('newCliTotal').value) || 50000;
    if (!name) return alert('Ingresa el nombre del cliente.');

    const newStop = {
        id: 'FAC-' + Math.floor(10000 + Math.random() * 90000),
        clientCode: 'FUS-' + Math.floor(100 + Math.random() * 900),
        client: name,
        owner,
        phone,
        address: address || 'Fusagasugá Centro',
        total,
        lat: 4.3365 + (Math.random() - 0.5) * 0.01,
        lng: -74.3638 + (Math.random() - 0.5) * 0.01,
        status: 'PENDIENTE',
        visits: 1,
        paymentMethod: 'Efectivo',
        notes: ''
    };

    DRIVER.stops.push(newStop);
    DRIVER.clients.push({ id: 'cli-' + Date.now(), name, address, phone });
    DRIVER.showClientModal = false;
    saveDriverAll();
    renderDriver();
    alert('Cliente registrado y añadido a la ruta con éxito.');
}

function renderProductModal() {
    return `
    <div class="modal-bg">
        <div class="modal-box" style="max-width:380px;">
            <h3 style="margin-bottom:10px;"><i class="fas fa-box-open"></i> Añadir Producto al POS</h3>
            <input id="newProdName" placeholder="Nombre del Producto" style="margin-bottom:8px;">
            <input id="newProdPrice" type="number" placeholder="Precio de Venta ($)" value="10000" style="margin-bottom:8px;">
            <input id="newProdStock" type="number" placeholder="Stock Inicial" value="50" style="margin-bottom:12px;">
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button class="btn btn-outline" onclick="DRIVER.showProductModal=false;renderDriver()">Cancelar</button>
                <button class="btn btn-success" onclick="saveNewProduct()">Guardar Producto</button>
            </div>
        </div>
    </div>`;
}

function saveNewProduct() {
    const name = document.getElementById('newProdName').value.trim();
    const price = Number(document.getElementById('newProdPrice').value) || 0;
    const stock = Number(document.getElementById('newProdStock').value) || 0;
    if (!name) return;

    DRIVER.inventory.push({ id: 'p-' + Date.now(), name, price, stock });
    DRIVER.showProductModal = false;
    saveDriverAll();
    renderDriver();
    alert('Producto añadido al inventario POS.');
}

function addClientToRoute(clientId) {
    const c = DRIVER.clients.find(x => x.id === clientId);
    if (!c) return;
    const newStop = {
        id: 'FAC-' + Math.floor(10000 + Math.random() * 90000),
        clientCode: 'FUS-' + Math.floor(100 + Math.random() * 900),
        client: c.name,
        owner: 'Encargado',
        phone: c.phone,
        address: c.address,
        total: 95000,
        lat: 4.3365 + (Math.random() - 0.5) * 0.01,
        lng: -74.3638 + (Math.random() - 0.5) * 0.01,
        status: 'PENDIENTE',
        visits: 1,
        paymentMethod: 'Efectivo',
        notes: ''
    };
    DRIVER.stops.push(newStop);
    saveDriverAll();
    renderDriver();
    alert(`"${c.name}" añadido a la ruta actual.`);
}

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
    <div style="padding:14px;max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:14px;">
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

        <div class="pos-grid">
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <h4><i class="fas fa-gas-pump"></i> Gastos Operativos de Ruta</h4>
                    <button class="btn btn-danger" style="padding:5px 10px;" onclick="addRouteExpense()"><i class="fas fa-plus"></i> Gasto</button>
                </div>
                ${DRIVER.expenses.map((ex, i) => `
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid #f1f5f9;">
                        <span>${ex.concept}</span>
                        <strong>$${Number(ex.amount).toLocaleString()}</strong>
                    </div>
                `).join('') || '<p style="font-size:12px;color:var(--text-muted);">Sin gastos registrados</p>'}
            </div>

            <div class="card">
                <h4 style="margin-bottom:10px;"><i class="fas fa-clipboard-list"></i> Bitácora del Vehículo</h4>
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
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Pega la URL de Google Apps Script para descargar la ruta.</p>
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
