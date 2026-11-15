// TAT-Driver Route v3.2 Enterprise - Logística, Navegación Waze & Marcadores Numéricos
const MOTIVATIONAL_QUOTES = [
    "¡Hoy es un gran día para conquistar cada entrega con actitud ganadora!",
    "Tu compromiso mueve negocios y familias. ¡Excelente ruta en Fusagasugá!",
    "Paso a paso, parada a parada, construimos el éxito del día. ¡Vamos con toda!",
    "Conduce con seguridad, entrega con una sonrisa. ¡Éxitos en tu jornada!"
];

let state = {
    activeTab: 'map',
    apiUrl: localStorage.getItem('tat_driver_api_url') || '',
    vehicle: 'Camión', // A pie, Bicicleta, Moto, Carro pequeño, Camión
    stops: JSON.parse(localStorage.getItem('tat_driver_stops') || JSON.stringify([
        { id: 'FAC-10021', clientCode: 'FUS-101', client: 'Minimercado La Esquina', owner: 'Don Hernando', phone: '3104567890', address: 'Cra 6 # 12-40, Centro', total: 142000, lat: 4.3382, lng: -74.3612, status: 'PENDIENTE', visits: 1, paymentMethod: 'Efectivo', notes: '' },
        { id: 'FAC-10022', clientCode: 'FUS-102', client: 'Tienda Don Pedro', owner: 'Pedro Pablo Ruiz', phone: '3112345678', address: 'Cll 18 # 9-15, Balmoral', total: 88000, lat: 4.3335, lng: -74.3670, status: 'PENDIENTE', visits: 1, paymentMethod: 'Efectivo', notes: '' },
        { id: 'FAC-10023', clientCode: 'FUS-103', client: 'Autoservicio El Porvenir', owner: 'Marta Lucía', phone: '3209876543', address: 'Av. Las Palmas # 22-10', total: 215000, lat: 4.3410, lng: -74.3585, status: 'PENDIENTE', visits: 1, paymentMethod: 'QR Digital', notes: '' },
        { id: 'FAC-10024', clientCode: 'FUS-104', client: 'Granero San Mateo', owner: 'Carlos Julio', phone: '3147896541', address: 'Cll 10 # 3-45, Fusagasugá', total: 64000, lat: 4.3358, lng: -74.3645, status: 'PENDIENTE', visits: 1, paymentMethod: 'Efectivo', notes: '' }
    ])),
    denominations: JSON.parse(localStorage.getItem('tat_drv_denom') || JSON.stringify({
        100000: 0, 50000: 0, 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0
    })),
    expenses: JSON.parse(localStorage.getItem('tat_drv_expenses') || '[]'),
    currentStopIndex: 0
};

let mapInstance = null;
let markersLayer = [];

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initMap();
    renderStopsList();
    renderDenominations();
    renderExpenses();
    updateFinancialSummary();

    // Mostrar frase motivadora aleatoria en consola o bienvenida
    console.log("%c " + MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)], "background: #064e3b; color: #a7f3d0; padding: 6px; font-weight: bold; border-radius: 8px;");
});

function switchTab(tabId) {
    state.activeTab = tabId;
    ['map', 'routes', 'agenda', 'finances'].forEach(t => {
        const el = document.getElementById(`view-${t}`);
        const btn = document.getElementById(`nav-btn-${t}`);
        if (el) el.classList.toggle('hidden', t !== tabId);
        if (btn) {
            btn.classList.toggle('text-cyan-400', t === tabId);
            btn.classList.toggle('text-neutral-400', t !== tabId);
        }
    });
    if (tabId === 'map' && mapInstance) {
        setTimeout(() => mapInstance.invalidateSize(), 150);
    }
}

function initMap() {
    if (mapInstance) return;
    mapInstance = L.map('map', { zoomControl: false }).setView([4.3365, -74.3638], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
    }).addTo(mapInstance);

    renderMapMarkers();
}

function renderMapMarkers() {
    if (!mapInstance) return;
    markersLayer.forEach(m => mapInstance.removeLayer(m));
    markersLayer = [];

    const activeStops = state.stops.filter(s => s.status === 'PENDIENTE' || s.status === 'REPASO');
    
    // Marcador Bodega / Inicio
    const depotIcon = L.divIcon({
        className: '',
        html: `<div style="background:#0f172a;color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.4);border:2px solid #fff;"><i class="fas fa-house" style="font-size:13px;"></i></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
    });
    markersLayer.push(L.marker([4.3350, -74.3660], { icon: depotIcon }).addTo(mapInstance).bindPopup('<b>Centro de Distribución Fusa</b>'));

    let latLngs = [[4.3350, -74.3660]];

    activeStops.forEach((s, idx) => {
        const isFirst = idx === 0;
        const bgPin = isFirst ? '#059669' : '#ffffff';
        const txtColor = isFirst ? '#ffffff' : '#0f172a';
        const borderColor = isFirst ? '#ffffff' : '#0f172a';

        const pinHtml = `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:${bgPin};border:3px solid ${borderColor};transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.4);"><span style="transform:rotate(45deg);font-weight:800;font-size:13px;color:${txtColor};">${idx+1}</span></div>`;
        
        const customIcon = L.divIcon({
            className: '',
            html: pinHtml,
            iconSize: [34, 34],
            iconAnchor: [17, 34]
        });

        const marker = L.marker([s.lat, s.lng], { icon: customIcon }).addTo(mapInstance)
            .bindPopup(`<b>Parada #${idx+1}: ${s.client}</b><br>${s.address}<br>Total: $${Number(s.total).toLocaleString()}`);
        
        markersLayer.push(marker);
        latLngs.push([s.lat, s.lng]);
    });

    if (latLngs.length > 1) {
        const polyline = L.polyline(latLngs, { color: '#2563eb', weight: 4, opacity: 0.8 }).addTo(mapInstance);
        markersLayer.push(polyline);
    }

    // Actualizar banner de navegación Waze con la parada #1
    if (activeStops.length > 0) {
        const next = activeStops[0];
        document.getElementById('nav-next-stop-title').innerText = `Siguiente: Parada #1 • ${next.client}`;
        document.getElementById('waze-nav-banner').classList.remove('hidden');
    } else {
        document.getElementById('waze-nav-banner').classList.add('hidden');
    }
}

function centrarGPS() {
    if (mapInstance) {
        mapInstance.setView([4.3365, -74.3638], 15);
    }
}

function renderStopsList() {
    const container = document.getElementById('routes-list-container');
    if (!container) return;

    container.innerHTML = state.stops.map((s, idx) => `
        <div class="bg-neutral-900 border ${s.status==='ENTREGADO'?'border-emerald-500/30 opacity-75':s.status==='REPASO'?'border-amber-500/40':'border-neutral-800'} rounded-2xl p-3.5 space-y-2">
            <div class="flex justify-between items-start">
                <div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${s.status==='ENTREGADO'?'bg-emerald-500/20 text-emerald-400':s.status==='REPASO'?'bg-amber-500/20 text-amber-400':'bg-cyan-500/20 text-cyan-400'}">
                        ${s.status==='ENTREGADO'?'ENTREGADO':s.status==='REPASO'?'REPASO / 2DA VISITA':'PENDIENTE'}
                    </span>
                    <h4 class="font-bold text-sm text-white mt-1">${idx+1}. ${s.client}</h4>
                    <p class="text-[11px] text-neutral-400">${s.address} • Tel: ${s.phone}</p>
                </div>
                <div class="text-right">
                    <div class="font-black text-emerald-400 text-sm">$${Number(s.total).toLocaleString()}</div>
                    <span class="text-[10px] text-neutral-400 uppercase font-bold">${s.paymentMethod}</span>
                </div>
            </div>
            <div class="flex gap-2 pt-1 border-t border-neutral-800">
                <a href="https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}" target="_blank" class="flex-1 bg-neutral-800 hover:bg-neutral-700 text-cyan-400 font-bold py-2 rounded-xl text-center text-xs">
                    🧭 Navegar GPS
                </a>
                <button onclick="abrirCheckpointModal('${s.id}')" class="flex-1 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black py-2 rounded-xl text-center text-xs">
                    📋 Checkpoint
                </button>
            </div>
        </div>
    `).join('');
}

function abrirCheckpointModal(id) {
    const s = state.stops.find(x => x.id === id);
    if (!s) return;
    document.getElementById('evidence-stop-id').value = id;
    document.getElementById('evidence-modal-title').innerText = `Checkpoint: ${s.client}`;
    document.getElementById('modal-evidence').classList.remove('hidden');
}

function mostrarQrCobroModal() {
    const stopId = document.getElementById('evidence-stop-id').value;
    const s = state.stops.find(x => x.id === stopId);
    const val = s ? s.total : 0;
    const qrText = `PAGO RUTA FUSA | FACTURA: ${stopId} | VALOR: $${val}`;
    document.getElementById('qr-cobro-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrText)}`;
    document.getElementById('qr-cobro-valor').innerText = `$${Number(val).toLocaleString()}`;
    document.getElementById('modal-qr-cobro').classList.remove('hidden');
}

function saveEvidence() {
    const stopId = document.getElementById('evidence-stop-id').value;
    const status = document.getElementById('evidence-status').value;
    const paymentMethod = document.getElementById('evidence-payment-method').value;
    const notes = document.getElementById('evidence-notes').value.trim();

    const s = state.stops.find(x => x.id === stopId);
    if (s) {
        s.status = status === 'delivered' ? 'ENTREGADO' : status === 'repaso' ? 'REPASO' : 'RECHAZADO';
        s.paymentMethod = paymentMethod;
        s.notes = notes;
    }

    localStorage.setItem('tat_driver_stops', JSON.stringify(state.stops));
    document.getElementById('modal-evidence').classList.add('hidden');
    renderStopsList();
    renderMapMarkers();
    updateFinancialSummary();
    alert('Checkpoint de entrega guardado correctamente.');
}

function completarParadaActualDesdeNavegador() {
    const activeStops = state.stops.filter(s => s.status === 'PENDIENTE' || s.status === 'REPASO');
    if (activeStops.length > 0) {
        abrirCheckpointModal(activeStops[0].id);
    }
}

function abrirNavegacionExternaActual() {
    const activeStops = state.stops.filter(s => s.status === 'PENDIENTE' || s.status === 'REPASO');
    if (activeStops.length > 0) {
        const s = activeStops[0];
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`, '_blank');
    }
}

function optimizarRutaInteligente() {
    const pending = state.stops.filter(s => s.status === 'PENDIENTE');
    const repaso = state.stops.filter(s => s.status === 'REPASO');
    const done = state.stops.filter(s => s.status === 'ENTREGADO' || s.status === 'RECHAZADO');

    if (pending.length > 1) {
        // Ordenamiento por cercanía geográfica (algoritmo voraz TSP)
        let currLat = 4.3350, currLng = -74.3660;
        const pool = [...pending];
        const ordered = [];
        while (pool.length) {
            pool.sort((a, b) => Math.hypot(a.lat - currLat, a.lng - currLng) - Math.hypot(b.lat - currLat, b.lng - currLng));
            const next = pool.shift();
            ordered.push(next);
            currLat = next.lat;
            currLng = next.lng;
        }
        state.stops = [...ordered, ...repaso, ...done];
    }
    localStorage.setItem('tat_driver_stops', JSON.stringify(state.stops));
    renderStopsList();
    renderMapMarkers();
    alert('¡Ruta optimizada con éxito para vehículo de reparto!');
}

function renderDenominations() {
    const denoms = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];
    const container = document.getElementById('denominations-container');
    if (!container) return;

    container.innerHTML = denoms.map(d => `
        <div class="flex items-center justify-between bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 text-xs">
            <span class="font-bold text-white">$${d.toLocaleString()}</span>
            <div class="flex items-center gap-2">
                <button onclick="updateDenom(${d}, -1)" class="w-7 h-7 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-bold">-</button>
                <input type="number" min="0" value="${state.denominations[d] || 0}" onchange="setDenom(${d}, this.value)" class="w-12 bg-neutral-900 border border-neutral-700 rounded-lg text-center text-white font-bold p-1">
                <button onclick="updateDenom(${d}, 1)" class="w-7 h-7 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-bold">+</button>
            </div>
        </div>
    `).join('');
}

function updateDenom(d, delta) {
    state.denominations[d] = Math.max(0, (state.denominations[d] || 0) + delta);
    localStorage.setItem('tat_drv_denom', JSON.stringify(state.denominations));
    renderDenominations();
    updateFinancialSummary();
}

function setDenom(d, val) {
    state.denominations[d] = Math.max(0, parseInt(val) || 0);
    localStorage.setItem('tat_drv_denom', JSON.stringify(state.denominations));
    renderDenominations();
    updateFinancialSummary();
}

function resetCashCounter() {
    Object.keys(state.denominations).forEach(k => state.denominations[k] = 0);
    localStorage.setItem('tat_drv_denom', JSON.stringify(state.denominations));
    renderDenominations();
    updateFinancialSummary();
}

function addExpense() {
    const concept = document.getElementById('expense-concept').value.trim();
    const amount = Number(document.getElementById('expense-amount').value);
    if (!concept || !amount) return alert('Ingrese concepto y monto válido.');
    state.expenses.push({ concept, amount });
    localStorage.setItem('tat_drv_expenses', JSON.stringify(state.expenses));
    document.getElementById('expense-concept').value = '';
    document.getElementById('expense-amount').value = '';
    renderExpenses();
    updateFinancialSummary();
}

function renderExpenses() {
    const container = document.getElementById('expenses-list');
    if (!container) return;
    container.innerHTML = state.expenses.map((e, idx) => `
        <div class="flex justify-between items-center bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 text-xs">
            <span>${e.concept}</span>
            <div class="flex items-center gap-2">
                <strong class="text-rose-400">-$${Number(e.amount).toLocaleString()}</strong>
                <button onclick="state.expenses.splice(${idx},1);localStorage.setItem('tat_drv_expenses',JSON.stringify(state.expenses));renderExpenses();updateFinancialSummary()" class="text-neutral-500 hover:text-rose-400 font-bold">×</button>
            </div>
        </div>
    `).join('');
}

function updateFinancialSummary() {
    const denoms = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];
    const totalPhysical = denoms.reduce((acc, d) => acc + d * (state.denominations[d] || 0), 0);
    
    const delivered = state.stops.filter(s => s.status === 'ENTREGADO');
    const totalFacturado = delivered.reduce((acc, s) => acc + Number(s.total), 0);
    const totalTransfer = delivered.filter(s => s.paymentMethod === 'qr' || s.paymentMethod === 'transfer').reduce((acc, s) => acc + Number(s.total), 0);
    const totalExpenses = state.expenses.reduce((acc, e) => acc + Number(e.amount), 0);

    const disp = document.getElementById('counter-total-display');
    if (disp) disp.innerText = `$${totalPhysical.toLocaleString()}`;

    const sf = document.getElementById('summary-facturado');
    if (sf) sf.innerText = `$${totalFacturado.toLocaleString()}`;

    const sfi = document.getElementById('summary-fisico');
    if (sfi) sfi.innerText = `$${totalPhysical.toLocaleString()}`;

    const st = document.getElementById('summary-transfer');
    if (st) st.innerText = `$${totalTransfer.toLocaleString()}`;

    const sc = document.getElementById('summary-credit');
    if (sc) sc.innerText = `$${totalExpenses.toLocaleString()}`;
}

function importarRutaJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                state.stops = data.map(d => ({ ...d, status: d.status || 'PENDIENTE', visits: 1 }));
                localStorage.setItem('tat_driver_stops', JSON.stringify(state.stops));
                renderStopsList();
                renderMapMarkers();
                alert(`¡Manifiesto JSON importado con éxito (${state.stops.length} paradas)!`);
            }
        } catch(err) {
            alert('Error al leer el archivo JSON.');
        }
    };
    reader.readAsText(file);
}

function ejecutarCierreJornadaCloud() {
    alert('¡Liquidación y Cierre de Ruta guardado y listo para sincronizar con el panel de administración!');
}

function saveSheetsConfig() {
    const url = document.getElementById('cfg-sheets-url').value.trim();
    state.apiUrl = url;
    localStorage.setItem('tat_driver_api_url', url);
    document.getElementById('modal-sheets-config').classList.add('hidden');
    alert('URL de Cloud Sheets guardada.');
}

function openSheetsConfigModal() {
    document.getElementById('cfg-sheets-url').value = state.apiUrl;
    document.getElementById('modal-sheets-config').classList.remove('hidden');
}

function startOnboardingTour() {
    const modal = document.getElementById('tour-onboarding-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeOnboardingTour() {
    const modal = document.getElementById('tour-onboarding-modal');
    if (modal) modal.classList.add('hidden');
}

let currentTourStep = 1;
function nextTourStep() {
    currentTourStep++;
    if (currentTourStep > 4) {
        closeOnboardingTour();
        currentTourStep = 1;
        return;
    }
    const title = document.getElementById('tour-step-title');
    const desc = document.getElementById('tour-step-desc');
    if (currentTourStep === 2) {
        title.innerText = '2. Navegación en Vivo & GPS';
        desc.innerText = 'El widget superior estilo Waze te indica distancia, tiempo estimado y acceso rápido a tus mapas externos.';
    } else if (currentTourStep === 3) {
        title.innerText = '3. Repaso & Checkpoint';
        desc.innerText = 'Gestiona entregas exitosas, marca cobros con QR o programa repasos para visitar al finalizar la ruta.';
    } else if (currentTourStep === 4) {
        title.innerText = '4. Arqueo por Denominación';
        desc.innerText = 'Lleva el control exacto de efectivo billete a billete y moneda a moneda antes de liquidar tu jornada.';
        document.getElementById('tour-btn-next').innerText = 'Finalizar';
    }
}
