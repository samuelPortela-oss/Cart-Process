// ============================================================
// index.js - Inicio del Dashboard: tarjetas con datos reales
// ============================================================

// Reemplazar el contenido de una tarjeta KPI de la plantilla
function pintarTarjeta(color, titulo, valor, icono) {
    const body = document.querySelector(`.card.border-left-${color} .card-body`);
    if (!body) return;
    body.innerHTML = `
        <div class="row no-gutters align-items-center">
            <div class="col mr-2">
                <div class="text-xs font-weight-bold text-${color} text-uppercase mb-1">${titulo}</div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">${valor}</div>
            </div>
            <div class="col-auto">
                <i class="fas ${icono} fa-2x text-gray-300"></i>
            </div>
        </div>
    `;
}

if (getSesion()) {
    const pedidos = getData("pedidos");
    // Los pedidos cancelados no cuentan como venta
    const vendido = pedidos
        .filter((p) => p.estado !== "Cancelado")
        .reduce((sum, p) => sum + p.total, 0);

    pintarTarjeta("primary", "Total vendido", formatMoney(vendido), "fa-dollar-sign");
    pintarTarjeta("success", "Pedidos", pedidos.length, "fa-shopping-cart");
    pintarTarjeta("info", "Productos", getData("productos").length, "fa-box");
    pintarTarjeta("warning", "Clientes", getData("clientes").length, "fa-users");
}
