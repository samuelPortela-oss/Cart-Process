// ============================================================
// productos.js - Módulo Productos (listado-pro.html y crear-pro.html)
// Casillero: "productos" (el mismo que pinta la tienda en index.html)
// ============================================================

const tablaProductos = document.querySelector("#tabla-productos");
const formProducto = document.querySelector("#formulario-producto");

// ============================================================
// LISTADO + BÚSQUEDA + ELIMINAR
// ============================================================

function renderProductos(filtro = "") {
    const texto = filtro.trim().toLowerCase();
    const productos = getData("productos").filter(
        (p) =>
            p.nombre.toLowerCase().includes(texto) ||
            (p.descripcion || "").toLowerCase().includes(texto)
    );

    tablaProductos.innerHTML = "";

    if (productos.length === 0) {
        tablaProductos.innerHTML =
            '<tr><td colspan="7" class="text-center py-4">No se encontraron productos</td></tr>';
        return;
    }

    productos.forEach((p) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${p.id}</td>
            <td>${escapeHtml(p.nombre)}</td>
            <td>${escapeHtml(p.descripcion)}</td>
            <td>${formatMoney(p.precio)}</td>
            <td>${p.stock <= 0 ? '<span class="badge badge-secondary">Agotado</span>' : p.stock}</td>
            <td><img src="${escapeHtml(resolveImg(p.imagen, "../"))}" width="60px" alt=""></td>
            <td>
                <a data-permiso="editar" href="crear-pro.html?id=${p.id}" class="btn btn-sm btn-warning">Editar</a>
                <button data-permiso="eliminar" data-id="${p.id}" class="btn btn-sm btn-danger">Eliminar</button>
            </td>
        `;
        tablaProductos.appendChild(row);
    });

    aplicarPermisos(tablaProductos);
}

if (tablaProductos && getSesion()) {
    const buscador = document.querySelector('input[type="search"]');
    buscador.addEventListener("input", () => renderProductos(buscador.value));

    // Eliminar con delegación de eventos
    tablaProductos.addEventListener("click", (event) => {
        const btn = event.target.closest("button[data-id]");
        if (!btn) return;
        if (!puede("eliminar")) return alert("Tu rol no puede eliminar productos.");

        const id = Number(btn.getAttribute("data-id"));
        if (!confirm("¿Eliminar este producto?")) return;

        saveData("productos", getData("productos").filter((p) => p.id !== id));
        renderProductos(buscador.value);
    });

    renderProductos();
}

// ============================================================
// CREAR / EDITAR (crear-pro.html?id=X)
// ============================================================

if (formProducto) {
    const idEditar = getIdUrl();
    const inputs = {
        nombre: document.querySelector("#nombre-pro"),
        precio: document.querySelector("#precio-pro"),
        stock: document.querySelector("#stock-pro"),
        imagen: document.querySelector("#imagen-url"),
        descripcion: document.querySelector("#descripcion-pro"),
    };
    const preview = document.querySelector("#imagen-pro");

    // Vista previa de la imagen mientras se escribe la ruta
    const actualizarPreview = () => {
        if (inputs.imagen.value.trim()) preview.src = resolveImg(inputs.imagen.value.trim(), "../");
    };
    inputs.imagen.addEventListener("input", actualizarPreview);

    if (protegerPagina(idEditar ? "editar" : "crear", "listado-pro.html")) {
        // Modo edición: cargar el producto en el formulario
        if (idEditar) {
            const producto = getData("productos").find((p) => p.id === idEditar);
            if (!producto) {
                alert("Producto no encontrado.");
                window.location.href = "listado-pro.html";
            } else {
                Object.keys(inputs).forEach((campo) => (inputs[campo].value = producto[campo]));
                actualizarPreview();
                document.querySelector("#titulo-form").textContent = "Editar Producto";
                formProducto.querySelector('button[type="submit"]').textContent = "Actualizar Producto";
            }
        }

        formProducto.addEventListener("submit", (event) => {
            event.preventDefault();

            const datos = {
                nombre: inputs.nombre.value.trim(),
                precio: Number(inputs.precio.value),
                stock: Number(inputs.stock.value),
                imagen: inputs.imagen.value.trim(),
                descripcion: inputs.descripcion.value.trim(),
            };

            if (!datos.nombre || !datos.imagen) return alert("Nombre e imagen son obligatorios.");
            if (datos.precio <= 0) return alert("El precio debe ser mayor a 0.");
            if (datos.stock < 0 || !Number.isInteger(datos.stock)) return alert("El stock debe ser un número entero positivo.");

            const productos = getData("productos");
            if (idEditar) {
                Object.assign(productos.find((p) => p.id === idEditar), datos);
            } else {
                productos.push({ id: nextId(productos), ...datos });
            }
            saveData("productos", productos);

            alert(idEditar ? "Producto actualizado." : "Producto creado.");
            window.location.href = "listado-pro.html";
        });
    }
}
