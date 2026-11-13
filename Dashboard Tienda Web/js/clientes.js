// ============================================================
// clientes.js - Módulo Clientes (listado-clientes.html y crear-cliente.html)
// Casillero: "clientes" (checkout.js de la tienda también registra clientes)
// ============================================================

const tablaClientes = document.querySelector("#tabla-clientes");
const formCliente = document.querySelector("#formulario-cliente");

// ============================================================
// LISTADO + BÚSQUEDA + ELIMINAR
// ============================================================

function renderClientes(filtro = "") {
    const texto = filtro.trim().toLowerCase();
    const clientes = getData("clientes").filter((c) =>
        `${c.nombre} ${c.apellido} ${c.email} ${c.celular}`.toLowerCase().includes(texto)
    );

    tablaClientes.innerHTML = "";

    if (clientes.length === 0) {
        tablaClientes.innerHTML =
            '<tr><td colspan="7" class="text-center py-4">No se encontraron clientes</td></tr>';
        return;
    }

    clientes.forEach((c) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${c.id}</td>
            <td>${escapeHtml(c.nombre)}</td>
            <td>${escapeHtml(c.apellido)}</td>
            <td>${escapeHtml(c.email)}</td>
            <td>${escapeHtml(c.celular)}</td>
            <td>${escapeHtml(c.direccion)}</td>
            <td>
                <a data-permiso="editar" href="crear-cliente.html?id=${c.id}" class="btn btn-sm btn-warning">Editar</a>
                <button data-permiso="eliminar" data-id="${c.id}" class="btn btn-sm btn-danger">Eliminar</button>
            </td>
        `;
        tablaClientes.appendChild(row);
    });

    aplicarPermisos(tablaClientes);
}

if (tablaClientes && getSesion()) {
    const buscador = document.querySelector('input[type="search"]');
    buscador.addEventListener("input", () => renderClientes(buscador.value));

    tablaClientes.addEventListener("click", (event) => {
        const btn = event.target.closest("button[data-id]");
        if (!btn) return;
        if (!puede("eliminar")) return alert("Tu rol no puede eliminar clientes.");

        const id = Number(btn.getAttribute("data-id"));
        // Un cliente con pedidos no se elimina: los pedidos quedarían huérfanos
        if (getData("pedidos").some((p) => p.clienteId === id)) {
            return alert("Este cliente tiene pedidos. Elimina primero sus pedidos.");
        }
        if (!confirm("¿Eliminar este cliente?")) return;

        saveData("clientes", getData("clientes").filter((c) => c.id !== id));
        renderClientes(buscador.value);
    });

    renderClientes();
}

// ============================================================
// CREAR / EDITAR (crear-cliente.html?id=X)
// ============================================================

if (formCliente && protegerPagina(getIdUrl() ? "editar" : "crear", "listado-clientes.html")) {
    const idEditar = getIdUrl();
    const inputs = {
        nombre: document.querySelector("#nombre-cli"),
        apellido: document.querySelector("#apellido-cli"),
        email: document.querySelector("#email-cli"),
        celular: document.querySelector("#celular-cli"),
        direccion: document.querySelector("#direccion-cli"),
        direccion2: document.querySelector("#direccion2-cli"),
        descripcion: document.querySelector("#descripcion-cli"),
    };

    if (idEditar) {
        const cliente = getData("clientes").find((c) => c.id === idEditar);
        if (!cliente) {
            alert("Cliente no encontrado.");
            window.location.href = "listado-clientes.html";
        } else {
            Object.keys(inputs).forEach((campo) => (inputs[campo].value = cliente[campo] || ""));
            document.querySelector("#titulo-form").textContent = "Editar Cliente";
            formCliente.querySelector('button[type="submit"]').textContent = "Actualizar Cliente";
        }
    }

    formCliente.addEventListener("submit", (event) => {
        event.preventDefault();

        const datos = {};
        Object.keys(inputs).forEach((campo) => (datos[campo] = inputs[campo].value.trim()));

        // Mismas validaciones que checkout.js de la tienda
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) return alert("El email no tiene un formato válido.");
        if (!/^\d{7,}$/.test(datos.celular)) return alert("El celular debe tener al menos 7 dígitos.");

        const clientes = getData("clientes");
        const repetido = clientes.some(
            (c) => c.email.toLowerCase() === datos.email.toLowerCase() && c.id !== idEditar
        );
        if (repetido) return alert("Ya existe un cliente con ese email.");

        if (idEditar) {
            Object.assign(clientes.find((c) => c.id === idEditar), datos);
        } else {
            clientes.push({ id: nextId(clientes), ...datos });
        }
        saveData("clientes", clientes);

        alert(idEditar ? "Cliente actualizado." : "Cliente creado.");
        window.location.href = "listado-clientes.html";
    });
}
