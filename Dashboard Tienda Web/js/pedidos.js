// ============================================================
// pedidos.js - Módulo Pedidos (listado-pedidos.html y crear-pedido.html)
// Casillero: "pedidos" (checkout.js de la tienda también registra pedidos)
// ============================================================

const tablaPedidos = document.querySelector("#tabla-pedidos");
const formPedido = document.querySelector("#formulario-pedido");

const COLORES_ESTADO = {
    Pendiente: "warning",
    Enviado: "info",
    Entregado: "success",
    Cancelado: "secondary",
};

// ============================================================
// LISTADO + BÚSQUEDA + ELIMINAR
// ============================================================

function renderPedidos(filtro = "") {
    const texto = filtro.trim().toLowerCase();
    const clientes = getData("clientes");

    // Unimos cada pedido con su cliente para mostrar nombre y email
    const pedidos = getData("pedidos")
        .map((p) => ({ ...p, cliente: clientes.find((c) => c.id === p.clienteId) }))
        .filter((p) => {
            const nombre = p.cliente ? `${p.cliente.nombre} ${p.cliente.apellido} ${p.cliente.email}` : "";
            return `${p.numero} ${nombre} ${p.estado} ${p.origen}`.toLowerCase().includes(texto);
        });

    tablaPedidos.innerHTML = "";

    if (pedidos.length === 0) {
        tablaPedidos.innerHTML =
            '<tr><td colspan="8" class="text-center py-4">No se encontraron pedidos</td></tr>';
        return;
    }

    pedidos.forEach((p) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(p.numero)}</td>
            <td>${p.cliente ? escapeHtml(`${p.cliente.nombre} ${p.cliente.apellido}`) : "-"}</td>
            <td>${p.cliente ? escapeHtml(p.cliente.email) : "-"}</td>
            <td>${escapeHtml(p.fecha)}</td>
            <td>${formatMoney(p.total)}</td>
            <td><span class="badge badge-${COLORES_ESTADO[p.estado] || "light"}">${escapeHtml(p.estado)}</span></td>
            <td>${escapeHtml(p.origen)}</td>
            <td>
                <a data-permiso="editar" href="crear-pedido.html?id=${p.id}" class="btn btn-sm btn-warning">Editar</a>
                <button data-permiso="eliminar" data-id="${p.id}" class="btn btn-sm btn-danger">Eliminar</button>
            </td>
        `;
        tablaPedidos.appendChild(row);
    });

    aplicarPermisos(tablaPedidos);
}

if (tablaPedidos && getSesion()) {
    const buscador = document.querySelector('input[type="search"]');
    buscador.addEventListener("input", () => renderPedidos(buscador.value));

    tablaPedidos.addEventListener("click", (event) => {
        const btn = event.target.closest("button[data-id]");
        if (!btn) return;
        if (!puede("eliminar")) return alert("Tu rol no puede eliminar pedidos.");

        const id = Number(btn.getAttribute("data-id"));
        if (!confirm("¿Eliminar este pedido?")) return;

        saveData("pedidos", getData("pedidos").filter((p) => p.id !== id));
        renderPedidos(buscador.value);
    });

    renderPedidos();
}

// ============================================================
// CREAR / EDITAR (crear-pedido.html?id=X)
// ============================================================

if (formPedido && protegerPagina(getIdUrl() ? "editar" : "crear", "listado-pedidos.html")) {
    const idEditar = getIdUrl();
    const pedidoOriginal = idEditar ? getData("pedidos").find((p) => p.id === idEditar) : null;

    const selCliente = document.querySelector("#id_cliente");
    const selPago = document.querySelector("#metodo_pago");
    const selEstado = document.querySelector("#estado");
    const selProducto = document.querySelector("#producto-select");
    const inputCantidad = document.querySelector("#cantidad");
    const tbodyItems = document.querySelector("#tabla-carrito tbody");
    const inputDescuento = document.querySelector("#descuento");
    const inputAumento = document.querySelector("#aumento");
    const totalEl = document.querySelector("#total-pedido");

    // Líneas del pedido en memoria: [{productoId, nombre, precio, cantidad}]
    let items = [];

    // Stock disponible de un producto: si editamos, las unidades que ya tenía
    // este pedido cuentan como disponibles (se le devolverán al guardar)
    function stockDisponible(productoId) {
        const producto = getData("productos").find((p) => p.id === productoId);
        const yaReservado = pedidoOriginal
            ? pedidoOriginal.productos
                  .filter((i) => i.productoId === productoId)
                  .reduce((sum, i) => sum + i.cantidad, 0)
            : 0;
        return (producto ? producto.stock : 0) + yaReservado;
    }

    function calcularTotal() {
        const subtotal = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
        const total = subtotal - Number(inputDescuento.value || 0) + Number(inputAumento.value || 0);
        return Math.max(0, total);
    }

    function renderItems() {
        tbodyItems.innerHTML = "";

        if (items.length === 0) {
            tbodyItems.innerHTML =
                '<tr><td colspan="5" class="text-center">Agrega productos al pedido</td></tr>';
        }

        items.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${escapeHtml(item.nombre)}</td>
                <td>${formatMoney(item.precio)}</td>
                <td>${item.cantidad}</td>
                <td>${formatMoney(item.precio * item.cantidad)}</td>
                <td><button type="button" class="btn btn-sm btn-danger" data-index="${index}">X</button></td>
            `;
            tbodyItems.appendChild(row);
        });

        totalEl.textContent = formatMoney(calcularTotal());
    }

    // --- Llenar selects desde localStorage ---
    getData("clientes").forEach((c) => {
        selCliente.innerHTML += `<option value="${c.id}">${escapeHtml(`${c.nombre} ${c.apellido} - ${c.email}`)}</option>`;
    });
    getData("productos").forEach((p) => {
        selProducto.innerHTML += `<option value="${p.id}">${escapeHtml(p.nombre)} - ${formatMoney(p.precio)} (stock ${p.stock})</option>`;
    });

    // --- Modo edición: cargar el pedido ---
    if (idEditar) {
        if (!pedidoOriginal) {
            alert("Pedido no encontrado.");
            window.location.href = "listado-pedidos.html";
        } else {
            selCliente.value = pedidoOriginal.clienteId;
            // Los pedidos de la tienda traen métodos como "PSE (+3%)" que no están en el select
            if (![...selPago.options].some((o) => o.value === pedidoOriginal.metodoPago)) {
                selPago.innerHTML += `<option value="${escapeHtml(pedidoOriginal.metodoPago)}">${escapeHtml(pedidoOriginal.metodoPago)}</option>`;
            }
            selPago.value = pedidoOriginal.metodoPago;
            selEstado.value = pedidoOriginal.estado;
            inputDescuento.value = pedidoOriginal.descuento;
            inputAumento.value = pedidoOriginal.aumento;
            items = pedidoOriginal.productos.map((i) => ({ ...i }));
            document.querySelector("#titulo-form").textContent = `Editar Pedido ${pedidoOriginal.numero}`;
            formPedido.querySelector('button[type="submit"]').textContent = "Actualizar Pedido";
        }
    }

    // --- Eventos ---
    document.querySelector("#btn-agregar").addEventListener("click", () => {
        const productoId = Number(selProducto.value);
        const cantidad = Number(inputCantidad.value);
        if (!productoId) return alert("Selecciona un producto.");
        if (!Number.isInteger(cantidad) || cantidad <= 0) return alert("La cantidad debe ser mayor a 0.");

        const producto = getData("productos").find((p) => p.id === productoId);
        const existente = items.find((i) => i.productoId === productoId);
        const nuevaCantidad = (existente ? existente.cantidad : 0) + cantidad;

        if (nuevaCantidad > stockDisponible(productoId)) {
            return alert(`Solo hay ${stockDisponible(productoId)} unidades de ${producto.nombre}.`);
        }

        if (existente) {
            existente.cantidad = nuevaCantidad;
        } else {
            items.push({ productoId, nombre: producto.nombre, precio: producto.precio, cantidad });
        }
        inputCantidad.value = 1;
        renderItems();
    });

    // Quitar línea (delegación de eventos)
    tbodyItems.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-index]");
        if (!btn) return;
        items.splice(Number(btn.getAttribute("data-index")), 1);
        renderItems();
    });

    inputDescuento.addEventListener("input", renderItems);
    inputAumento.addEventListener("input", renderItems);

    formPedido.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!selCliente.value) return alert("Selecciona un cliente.");
        if (!selPago.value) return alert("Selecciona un método de pago.");
        if (items.length === 0) return alert("Agrega al menos un producto.");

        // Stock: devolvemos lo que tenía el pedido original y descontamos lo nuevo
        if (pedidoOriginal) {
            descontarStock(pedidoOriginal.productos.map((i) => ({ ...i, cantidad: -i.cantidad })));
        }
        descontarStock(items);

        const datos = {
            clienteId: Number(selCliente.value),
            metodoPago: selPago.value,
            estado: selEstado.value,
            productos: items,
            descuento: Number(inputDescuento.value || 0),
            aumento: Number(inputAumento.value || 0),
            total: calcularTotal(),
        };

        const pedidos = getData("pedidos");
        if (idEditar) {
            Object.assign(pedidos.find((p) => p.id === idEditar), datos);
        } else {
            pedidos.push({
                id: nextId(pedidos),
                numero: "#" + Date.now().toString().slice(-6),
                fecha: new Date().toISOString().slice(0, 10),
                origen: "Dashboard",
                ...datos,
            });
        }
        saveData("pedidos", pedidos);

        alert(idEditar ? "Pedido actualizado." : "Pedido creado.");
        window.location.href = "listado-pedidos.html";
    });

    renderItems();
}
