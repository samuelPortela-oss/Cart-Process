// ============================================================
// cart.js - Carrito de la página principal (index.html)
// Patrón de trabajo: leer estado -> modificar -> guardar -> repintar DOM
// ============================================================

// --- Variables globales ---
const productsGrid = document.querySelector(".content-pro"); // solo existe en index.html
const cartCount = document.querySelector(".contar-pro");
const cartList = document.querySelector(".list-cart");
const cartIcon = document.querySelector(".carrito");
const cartTbody = cartList.querySelector("tbody");

// ============================================================
// LOCALSTORAGE - Casillero: "cart"
// Regla JSON: JSON.stringify al GUARDAR, JSON.parse al LEER
// ============================================================

// LEER el carrito (texto -> array)
function getCart() {
    const stored = localStorage.getItem("cart");

    // Si nunca se guardó nada, devolvemos un array vacío (nunca null)
    if (stored === null) return [];

    try {
        const cart = JSON.parse(stored);
        // Defensa: si el JSON no era un array, tratamos el carrito como vacío
        return Array.isArray(cart) ? cart : [];
    } catch (error) {
        console.warn("No se pudo leer el carrito:", error);
        return [];
    }
}

// GUARDAR el carrito (array -> texto)
function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// Total de unidades del carrito (para el contador)
function getCartQuantity() {
    return getCart().reduce((total, item) => total + item.quantity, 0);
}

// ============================================================
// VISTA (DOM) - Pintar el mini-carrito
// ============================================================

// Pintar el mini-carrito a partir de lo que hay en localStorage
function renderCart() {
    const cart = getCart();

    // Siempre vaciamos primero: el DOM es una foto del estado, no el estado
    cartTbody.innerHTML = "";

    // index = orden de agregación (1, 2, 3...); la cantidad se ve en cart.html
    cart.forEach((product, index) => {
        const row = document.createElement("tr");
    row.innerHTML = `
            <td>${index + 1}</td>
            <td><img src="${product.image}" width="100px"></td>
            <td>${product.name}</td>
            <td>${product.price}</td>
            <td><button class="btn btn-danger" data-id="${product.id}">X</button></td>
    `;
        cartTbody.appendChild(row);
    });

    updateCartCount();
}

// El contador siempre es la suma de unidades del carrito
function updateCartCount() {
    cartCount.textContent = getCartQuantity();
}

// ============================================================
// ACCIONES
// ============================================================

// Pintar las tarjetas de productos desde localStorage "productos" (datos.js)
// El Dashboard es quien crea / edita / elimina estos productos
function renderProducts() {
    const productos = getData("productos");
    productsGrid.innerHTML = "";

    if (productos.length === 0) {
        productsGrid.innerHTML = '<p class="lead text-center">No hay productos disponibles.</p>';
        return;
    }

    productos.forEach((producto) => {
        const agotado = producto.stock <= 0;
        const col = document.createElement("div");
        col.className = "col-md-3 py-3 py-md-0";
        col.innerHTML = `
            <div class="card">
                <img src="${escapeHtml(resolveImg(producto.imagen))}" alt="${escapeHtml(producto.nombre)}">
                <div class="card-body">
                    <h3>${escapeHtml(producto.nombre)}</h3>
                    <p>${escapeHtml(producto.descripcion)}</p>
                    <h5>${formatMoney(producto.precio)}
                        ${agotado
                            ? '<span class="btn-product" style="opacity: 0.5; cursor: not-allowed;">Agotado</span>'
                            : `<span class="btn-product" data-producto="${producto.id}"><i class="fa-solid fa-basket-shopping"></i></span>`}
                    </h5>
                </div>
            </div>
        `;
        productsGrid.appendChild(col);
    });
}

// Agregar un producto al carrito (a partir de su id en "productos")
function addCart(productoId) {
    const producto = getData("productos").find((p) => p.id === productoId);
    if (!producto) return;

    const cart = getCart();
    // id como texto: detalleCarrito.js lo compara con el data-id de los botones
    const existing = cart.find((item) => item.id === String(producto.id));
    const enCarrito = existing ? existing.quantity : 0;

    // No dejamos pedir más unidades de las que hay en stock
    if (enCarrito + 1 > producto.stock) {
        alert(`Solo quedan ${producto.stock} unidades de ${producto.nombre}.`);
        return;
    }

    if (existing) {
        // Ya estaba: solo aumentamos la cantidad (no duplicamos filas)
        existing.quantity += 1;
    } else {
        // Producto nuevo: lo agregamos al array
        cart.push({
            id: String(producto.id),
            productoId: producto.id,
            name: producto.nombre,
            price: formatMoney(producto.precio),
            image: resolveImg(producto.imagen),
            quantity: 1,
        });
    }

    saveCart(cart);
    renderCart();
}

// ============================================================
// EVENTOS
// ============================================================

// Agregar producto con delegación de eventos: las tarjetas se crean
// dinámicamente, así que escuchamos en el contenedor .content-pro
if (productsGrid) {
    productsGrid.addEventListener("click", (event) => {
        const btn = event.target.closest(".btn-product");
        if (!btn) return;
        addCart(Number(btn.getAttribute("data-producto")));
    });
}

// Eliminar productos con delegación de eventos:
// un solo listener en el tbody resuelve los clics de cualquier botón X,
// incluso los que se crearon después de cargar la página.
cartTbody.addEventListener("click", (event) => {
    const deleteBtn = event.target.closest("[data-id]");
    if (!deleteBtn) return; // el clic fue en otra parte de la fila

    const id = deleteBtn.getAttribute("data-id");
    const cart = getCart().filter((product) => product.id !== id);

    saveCart(cart);
    renderCart();
});

// Abrir / cerrar el mini-carrito
cartIcon.addEventListener("click", () => {
    cartList.classList.toggle("ocultar");
});

// --- Al cargar la página: pintar productos y lo que quedó guardado ---
if (productsGrid) renderProducts();
renderCart();
