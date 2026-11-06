// ============================================================
// cart.js - Carrito de la página principal (index.html)
// Patrón de trabajo: leer estado -> modificar -> guardar -> repintar DOM
// ============================================================

// --- Variables globales ---
const btnProducts = document.querySelectorAll(".btn-product");
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

// Agregar un producto al carrito
function addCart(btn) {
    // closest() sube al ancestro .card (más seguro que parentElement x3)
    const card = btn.closest(".card");
    const image = card.querySelector("img").getAttribute("src");

    const product = {
        id: image, // la imagen es el identificador único del producto
        name: card.querySelector("h3").textContent,
        price: card.querySelector("h5").textContent.trim(),
        image: image,
        quantity: 1,
    };

    const cart = getCart();
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
        // Ya estaba: solo aumentamos la cantidad (no duplicamos filas)
        existing.quantity += 1;
    } else {
        // Producto nuevo: lo agregamos al array
        cart.push(product);
    }

    saveCart(cart);
    renderCart();
}

// ============================================================
// EVENTOS
// ============================================================

// Agregar producto (un listener por botón; los 12 existen al cargar)
btnProducts.forEach((btn) => {
    btn.addEventListener("click", () => addCart(btn));
});

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

// --- Al cargar la página: mostrar lo que quedó guardado ---
renderCart();
