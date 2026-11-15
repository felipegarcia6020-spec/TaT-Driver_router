// TAT-Driver Pro Logic (100% Offline & Sincronizado con POS)
const GREETINGS = [
    "¡Hola! Qué gusto tenerte de nuevo. ¡A romper récords hoy!",
    "¡Buen día! Tu dedicación mueve la economía local. ¡Vamos con toda!",
    "¡Hola! Cada entrega y venta exitosa construye un gran futuro. ¡Muchos éxitos!"
];

const DRIVER_STATE = {
    driverName: localStorage.getItem('tat_driver_name') || 'Juan Pablo Díaz',
    routeCode: localStorage.getItem('tat_driver_route') || 'RUTA-FUSA-01',
    pin: localStorage.getItem('tat_driver_pin') || '1234',
    isLoggedIn: localStorage.getItem('tat_driver_logged') === 'true',
    viewMode: 'map', // 'map' | 'list' | 'agenda' | 'arqueo'
    
    // Base de datos sincronizada en LocalStorage con TAT-POS
    stops: JSON.parse(localStorage.getItem('tat_stops') || JSON.stringify([
        { id: 'FAC-10021', client: 'Minimercado La Esquina', owner: 'Don Hernando', phone: '3104567890', address: 'Cra 6 # 12-40, Centro', total: 142000, x: 35, y: 40, status: 'PENDIENTE', paymentMethod: 'Efectivo', notes: '' },
        { id: 'FAC-10022', client: 'Tienda Don Pedro', owner: 'Pedro Ruiz', phone: '3112345678', address: 'Cll 18 # 9-15, Balmoral', total: 88000, x: 60, y: 65, status: 'PENDIENTE', paymentMethod: 'Efectivo', notes: '' }
    ])),
    clients: JSON.parse(localStorage.getItem('tat_clients') || JSON.stringify([
        { id: 'c1', name: 'Minimercado La Esquina', owner: 'Don Hernando', address: 'Cra 6 # 12-40', phone: '3104567890' },
        { id: 'c2', name: 'Tienda Don Pedro', owner: 'Pedro Ruiz', address: 'Cll 18 # 9-15', phone: '3112345678' }
    ])),
    denominations: JSON.parse(localStorage.getItem('tat_driver_denom') || JSON.stringify({
        100000: 0, 50000: 0, 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0
    })),
    activeStop: null,
    showModal: null,
    selectedCoords: null
};

function saveDriverData() {
    localStorage.setItem('tat_driver_name', DRIVER_STATE.driverName);
    localStorage.setItem('tat_driver_route', DRIVER_STATE.routeCode);
    localStorage.setItem('tat_driver_pin', DRIVER_STATE.pin);
    localStorage.setItem('tat_driver_logged', DRIVER_STATE.isLoggedIn);
    localStorage.setItem('tat_stops', JSON.stringify(DRIVER_STATE.stops));
    localStorage.setItem('tat_clients', JSON.stringify(DRIVER_STATE.clients));
    localStorage.setItem('tat_driver_denom', JSON.stringify(DRIVER_STATE.denominations));
}

window.addEventListener('DOMContentLoaded', () => {
    initClock();
    document.getElementById('greeting-subtitle').innerText = `"${GREETINGS[Math.floor(Math.random()*GREETINGS.length)]}"`;
    if (DRIVER_STATE.isLoggedIn) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        renderDriverApp();
    }
});

function initClock() {
    setInterval(() => {
        const now = new Date();
        const str = now.toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        const el = document.getElementById('live-clock');
        if (el) el.innerText = str;
    }, 1000);
}

function loginDriver() {
    const name = document.getElementById('driver-name').value.trim();
    const route = document.getElementById('driver-route-code').value.trim();
    const pin = document.getElementById('driver-pin').value.trim();
    if (!pin) return alert('Ingresa tu PIN de seguridad.');
    
    if (name) DRIVER_STATE.driverName = name;
    if (route) DRIVER_STATE.routeCode = route;
    DRIVER_STATE.pin = pin;
    DRIVER_STATE.isLoggedIn = true;

    saveDriverData();
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    renderDriverApp();
}

function logoutDriverWithPin() {
    const entered = prompt('Ingresa tu PIN de seguridad para cerrar sesión:');
    if (entered === DRIVER_STATE.pin) {
        DRIVER_STATE.isLoggedIn = false;
        saveDriverData();
        document.getElementById('app-container').style.display = 'none';
        document.getElementById('auth-screen').style.display = 'flex';
    } else if (entered !== null) {
        alert('PIN incorrecto.');
    }
}

function renderDriverApp() {
    const container = document.getElementById('app-container');
    container.innerHTML = `
        <div class="topbar">
            <div class="brand">
                <div style="width:30px;height:30px;background:var(--emerald);border-radius:6px;display:flex;align-items:center;justify-content:center;">TAT</div>
                <span>TAT-Driver (${DRIVER_STATE.routeCode}: ${DRIVER_STATE.driverName})</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span id="live-clock" class="clock-display">--</span>
                <button class="btn btn-dark" style="padding:5px 8px;" onclick="changeDriverPin()"><i class="fas fa-key"></i></button>
                <button class="btn btn-danger" style="padding:5px 8px;" onclick="logoutDriverWithPin()"><i class="fas fa-lock"></i></button>
            </div>
        </div>

        <div class="segmented-bar">
            <button class="seg-btn ${DRIVER_STATE.viewMode==='map'?'active':''}" onclick="DRIVER_STATE.viewMode='map';renderDriverApp()"><i class="fas fa-map"></i> Mapa Offline</button>
            <button class="seg-btn ${DRIVER_STATE.viewMode==='list'?'active':''}" onclick="DRIVER_STATE.viewMode='list';renderDriverApp()"><i class="fas fa-list-ul"></i> Ruta</button>
            <button class="seg-btn ${DRIVER_STATE.viewMode==='agenda'?'active':''}" onclick="DRIVER_STATE.viewMode='agenda';renderDriverApp()"><i class="fas fa-address-book"></i> Agenda</button>
            <button class="seg-btn ${DRIVER_STATE.viewMode==='arqueo'?'active':''}" onclick="DRIVER_STATE.viewMode='arqueo';renderDriverApp()"><i class="fas fa-coins"></i> Caja Reparto</button>
        </div>

        ${renderDriverBody()}
        ${renderDriverModals()}
    `;
}

function renderDriverBody() {
    switch(DRIVER_STATE.viewMode) {
        case 'map': return renderOfflineMapView();
        case 'list': return renderRouteListView();
        case 'agenda': return renderAgendaView();
        case 'arqueo': return renderArqueoView();
        default: return '';
    }
}

// 1 & 3 & 12. MAPA OFFLINE CON MARCADOR PARA AÑADIR PARADAS
function renderOfflineMapView() {
    const pending = DRIVER_STATE.stops.filter(s => s.status === 'PENDIENTE');
    const next = pending[0];

    return `
    <div class="container" style="position:relative;">
        <div class="floating-box">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="badge badge-green">MODO 100% OFFLINE</span>
                <button class="btn btn-primary" style="padding:5px 10px;font-size:11px;" onclick="openAddStopModal()"><i class="fas fa-map-marker-alt"></i> + Añadir Parada aquí</button>
            </div>
            ${next ? `
                <div style="margin-top:6px;padding-top:6px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <small style="color:#64748b;font-weight:700;">SIGUIENTE PARADA:</small>
                        <div style="font-weight:800;font-size:14px;">${next.client}</div>
                        <div style="font-size:12px;color:#475569;">${next.address} · Cobro: <strong>$${Number(next.total).toLocaleString()}</strong></div>
                    </div>
                    <button class="btn btn-success" style="padding:6px 10px;" onclick="openCheckpoint('${next.id}')">Checkpoint</button>
                </div>
            ` : '<div style="margin-top:6px;font-weight:700;color:var(--emerald);">¡Todas las entregas completadas!</div>'}
        </div>

        <div class="offline-map" onclick="handleMapClick(event)">
            <div class="map-grid"></div>
            <div class="map-pin depot" style="left:50%;top:50%;" title="Bodega"><i class="fas fa-warehouse" style="color:#fff;font-size:12px;"></i></div>
            ${DRIVER_STATE.stops.map((s, idx) => `
                <div class="map-pin ${idx===0 && s.status==='PENDIENTE'?'active-pin':''}" style="left:${s.x}%;top:${s.y}%;" onclick="event.stopPropagation();openCheckpoint('${s.id}')">
                    <span>${idx+1}</span>
                </div>
            `).join('')}
        </div>
        <p style="font-size:11px;color:#64748b;text-align:center;margin-top:6px;">Haz clic en cualquier punto del mapa offline para añadir una nueva parada.</p>
    </div>`;
}

function handleMapClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    DRIVER_STATE.selectedCoords = { x, y };
    DRIVER_STATE.showModal = 'map_add';
    renderDriverApp();
}

// 4. RUTA Y AGREGAR PARADA (CLIENTE EXISTENTE O NUEVO)
function renderRouteListView() {
    return `
    <div class="container">
        <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
            <h3>Manifiesto de Ruta (${DRIVER_STATE.routeCode})</h3>
            <button class="btn btn-success" style="padding:6px 12px;" onclick="DRIVER_STATE.showModal='client';renderDriverApp()"><i class="fas fa-plus"></i> Añadir Parada</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
            ${DRIVER_STATE.stops.map((s, idx) => `
                <div class="card" style="border-left:5px solid ${s.status==='ENTREGADO'?'#2563eb':'#059669'};padding:12px;margin-bottom:0;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                        <div>
                            <span class="badge ${s.status==='ENTREGADO'?'badge-blue':'badge-green'}">#${idx+1} ${s.status}</span>
                            <strong style="font-size:14px;margin-left:4px;">${s.client}</strong>
                            <div style="font-size:12px;color:#475569;margin-top:2px;">${s.address} · Tel: ${s.phone}</div>
                        </div>
                        <strong style="color:var(--emerald);">$${Number(s.total).toLocaleString()}</strong>
                    </div>
                    <div style="margin-top:8px;">
                        <button class="btn btn-success" style="padding:5px 10px;" onclick="openCheckpoint('${s.id}')">Checkpoint</button>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>`;
}

// 10. AGENDA DE CLIENTES INTERACTIVA CON TARJETAS DESPLEGABLES
function renderAgendaView() {
    return `
    <div class="container">
        <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
            <h3>Agenda Interactiva de Clientes</h3>
            <button class="btn btn-success" onclick="DRIVER_STATE.showModal='client';renderDriverApp()"><i class="fas fa-user-plus"></i> Nuevo Cliente</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
            ${DRIVER_STATE.clients.map(c => `
                <div class="card" style="padding:12px;margin-bottom:0;cursor:pointer;" onclick="toggleClientCard('${c.id}')">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <strong style="font-size:14px;color:var(--primary);">${c.name}</strong>
                            <div style="font-size:12px;color:#64748b;">${c.address} · ${c.phone}</div>
                        </div>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div id="details-${c.id}" style="display:none;margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:12px;">
                        <p><strong>Encargado:</strong> ${c.owner || 'N/A'}</p>
                        <div style="display:flex;gap:6px;margin-top:6px;">
                            <a class="btn btn-success" style="padding:4px 8px;font-size:11px;" href="tel:${c.phone}">Llamar</a>
                            <button class="btn btn-primary" style="padding:4px 8px;font-size:11px;" onclick="event.stopPropagation();addClientToRoute('${c.name}')">Añadir a Ruta</button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>`;
}

function toggleClientCard(id) {
    const el = document.getElementById(`details-${id}`);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function addClientToRoute(name) {
    const cli = DRIVER_STATE.clients.find(c => c.name === name);
    if (!cli) return;
    DRIVER_STATE.stops.push({
        id: 'FAC-' + Math.floor(10000+Math.random()*90000),
        client: cli.name, owner: cli.owner, phone: cli.phone, address: cli.address,
        total: 95000, x: 50, y: 50, status: 'PENDIENTE', paymentMethod: 'Efectivo', notes: ''
    });
    saveDriverData();
    alert(`Cliente "${cli.name}" añadido a la ruta.`);
    renderDriverApp();
}

// 9. CAJA DEDICADA PARA REPARTO
function renderArqueoView() {
    const denoms = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];
    const totalCash = denoms.reduce((sum, d) => sum + d * (DRIVER_STATE.denominations[d] || 0), 0);
    return `
    <div class="container">
        <div class="card">
            <h3>Caja y Arqueo de Reparto (100% Offline)</h3>
            <p style="font-size:12px;color:#64748b;margin-bottom:10px;">Conteo físico del recaudo en ruta.</p>
            <div style="background:#f8fafc;padding:12px;border-radius:10px;margin-bottom:12px;">
                <strong>Efectivo Contado:</strong> <span style="color:var(--emerald);font-size:16px;">$${totalCash.toLocaleString()}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px;">
                ${denoms.map(d => `
                    <div style="display:flex;justify-content:space-between;align-items:center;border:1px solid #e2e8f0;padding:6px;border-radius:6px;">
                        <span style="font-size:12px;font-weight:750;">$${d.toLocaleString()}</span>
                        <input type="number" min="0" value="${DRIVER_STATE.denominations[d] || 0}" style="width:55px;margin:0;padding:3px;text-align:center;" onchange="updateDriverDenom(${d}, this.value)">
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-success btn-lg" style="margin-top:14px;" onclick="alert('¡Arqueo de ruta guardado con éxito!')">Guardar Arqueo</button>
        </div>
    </div>`;
}

function updateDriverDenom(d, val) {
    DRIVER_STATE.denominations[d] = Math.max(0, parseInt(val) || 0);
    saveDriverData();
    renderDriverApp();
}

// MODALES REPARTO
function renderDriverModals() {
    if (!DRIVER_STATE.showModal) return '';
    let content = '';

    if (DRIVER_STATE.showModal === 'checkpoint' && DRIVER_STATE.activeStop) {
        const s = DRIVER_STATE.activeStop;
        content = `
            <h3>Checkpoint: ${s.client}</h3>
            <label style="font-size:12px;font-weight:700;margin-top:8px;">Estado:</label>
            <select id="ckptStatus"><option value="ENTREGADO">Entregado y Recaudado</option><option value="REPASO">Repaso</option><option value="NOVEDAD">Novedad</option></select>
            <label style="font-size:12px;font-weight:700;">Pago:</label>
            <select id="ckptPay"><option value="Efectivo">Efectivo</option><option value="QR Digital">QR Digital</option><option value="Transferencia">Transferencia</option></select>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
                <button class="btn btn-outline" onclick="DRIVER_STATE.showModal=null;renderDriverApp()">Cancelar</button>
                <button class="btn btn-success" onclick="confirmDriverCheckpoint()">Confirmar</button>
            </div>`;
    } else if (DRIVER_STATE.showModal === 'client') {
        content = `
            <h3>Nuevo Cliente / Parada</h3>
            <input id="newCName" placeholder="Nombre del Negocio" style="margin-top:8px;">
            <input id="newCOwner" placeholder="Encargado">
            <input id="newCPhone" placeholder="Teléfono">
            <input id="newCAddr" placeholder="Dirección">
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">
                <button class="btn btn-outline" onclick="DRIVER_STATE.showModal=null;renderDriverApp()">Cancelar</button>
                <button class="btn btn-success" onclick="saveDriverClient()">Guardar</button>
            </div>`;
    } else if (DRIVER_STATE.showModal === 'map_add') {
        content = `
            <h3>Agregar Parada en Coordenadas</h3>
            <select id="mapSelClient">
                ${DRIVER_STATE.clients.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
            </select>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">
                <button class="btn btn-outline" onclick="DRIVER_STATE.showModal=null;renderDriverApp()">Cancelar</button>
                <button class="btn btn-success" onclick="confirmMapStop()">Agregar</button>
            </div>`;
    }
    return `<div class="modal-bg"><div class="modal-box">${content}</div></div>`;
}

function openCheckpoint(id) {
    DRIVER_STATE.activeStop = DRIVER_STATE.stops.find(s => s.id === id);
    DRIVER_STATE.showModal = 'checkpoint';
    renderDriverApp();
}

function confirmDriverCheckpoint() {
    DRIVER_STATE.activeStop.status = document.getElementById('ckptStatus').value;
    DRIVER_STATE.activeStop.paymentMethod = document.getElementById('ckptPay').value;
    saveDriverData();
    DRIVER_STATE.showModal = null;
    renderDriverApp();
}

function saveDriverClient() {
    const name = document.getElementById('newCName').value.trim();
    if (!name) return;
    const cli = { id: 'c-'+Date.now(), name, owner: document.getElementById('newCOwner').value, phone: document.getElementById('newCPhone').value, address: document.getElementById('newCAddr').value };
    DRIVER_STATE.clients.push(cli);
    DRIVER_STATE.stops.push({ id: 'FAC-'+Math.floor(10000+Math.random()*90000), client: cli.name, owner: cli.owner, phone: cli.phone, address: cli.address, total: 90000, x: 50, y: 50, status: 'PENDIENTE', paymentMethod: 'Efectivo', notes: '' });
    saveDriverData();
    DRIVER_STATE.showModal = null;
    renderDriverApp();
}

function openAddStopModal() {
    DRIVER_STATE.selectedCoords = { x: 50, y: 50 };
    DRIVER_STATE.showModal = 'map_add';
    renderDriverApp();
}

function confirmMapStop() {
    const name = document.getElementById('mapSelClient').value;
    const cli = DRIVER_STATE.clients.find(c => c.name === name);
    DRIVER_STATE.stops.push({ id: 'FAC-'+Math.floor(10000+Math.random()*90000), client: name, owner: cli?.owner || '', phone: cli?.phone || '', address: cli?.address || 'Mapa', total: 100000, x: 50, y: 50, status: 'PENDIENTE', paymentMethod: 'Efectivo', notes: '' });
    saveDriverData();
    DRIVER_STATE.showModal = null;
    renderDriverApp();
}

function changeDriverPin() {
    const pin = prompt('Nuevo PIN de seguridad (4 dígitos):', DRIVER_STATE.pin);
    if (pin && pin.length === 4) { DRIVER_STATE.pin = pin; saveDriverData(); alert('PIN actualizado.'); }
}
