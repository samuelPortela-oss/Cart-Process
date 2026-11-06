// ============================================================
// detalleCarrito.js - Página del carrito (cart.html)
// ============================================================

// --- Referencias al DOM ---
const cartTableBody = document.querySelector(".cart-table tbody");
const destinationSelect = document.querySelector(".destino");
const subtotalEl = document.querySelector(".res-sub-total");
const shippingEl = document.querySelector(".valor-domi");
const discountEl = document.querySelector(".promo");
const totalEl = document.querySelector(".total");
const payBtn = document.querySelector(".btn-resumen");

// Valor del domicilio por ciudad (el value de cada option es el nombre)
const SHIPPING_PRICES = {
    Medellin: 0,
    Bello: 10000,
    Itagui: 15000,
    Envigado: 15000,
    Sabaneta: 15000,
    "La Estrella": 20000,
    Caldas: 20000,
    Copacabana: 20000,
};

// Descuento promocional: 10% del subtotal solo en compras superiores a 100.000
const PROMO_PERCENT = 0.1;
const PROMO_MIN_SUBTOTAL = 100000;

// ============================================================
// LOCALSTORAGE - Casilleros: "cart" y "orderSummary"
// Regla JSON: JSON.stringify al GUARDAR, JSON.parse al LEER
// ============================================================

// LEER el carrito (texto -> array)
function getCart() {
    const stored = localStorage.getItem("cart");

    // Si nunca se guardó nada, devolvemos un array vacío (nunca null)
    if (stored === null) return [];

    try {
        const cart = JSON.parse(stored);
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

// Convertir precio en texto a número: "$6.500" -> 6500 (pesos colombianos)
function parsePrice(text) {
    const digits = String(text).replace(/\D/g, "");
    return digits === "" ? 0 : parseInt(digits, 10);
}

// Convertir número a texto con formato de dinero: 6500 -> "$6.500"
function formatMoney(value) {
    return "$" + Math.round(value).toLocaleString("es-CO");
}

// GUARDAR el resumen de la orden (checkout.html lo leerá)
function saveSummary(summary) {
    localStorage.setItem("orderSummary", JSON.stringify(summary));
}

// ============================================================
// VISTA (DOM) - Tabla y resumen
// ============================================================

// Pintar la tabla del carrito
function renderCartPage() {
    const cart = getCart();
    cartTableBody.innerHTML = "";

    if (cart.length === 0) {
        cartTableBody.innerHTML =
            '<tr><td colspan="4" class="text-center py-4">Tu carrito está vacío</td></tr>';
        updateSummary();
        return;
    }

    cart.forEach((product) => {
        const price = parsePrice(product.price);
        const subtotal = price * product.quantity;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="product-block">
                <img src="${product.image}" width="80px" alt="${product.name}">
                <span class="ms-2">${product.name}</span>
            </td>
            <td>${formatMoney(price)}</td>
            <td>
                <button class="btn btn-sm btn-outline-secondary" data-action="decrease" data-id="${product.id}">&minus;</button>
                <span class="mx-2">${product.quantity}</span>
                <button class="btn btn-sm btn-outline-secondary" data-action="increase" data-id="${product.id}">+</button>
                <button class="btn btn-sm btn-danger ms-2" data-action="remove" data-id="${product.id}">X</button>
            </td>
            <td>${formatMoney(subtotal)}</td>
        `;
        cartTableBody.appendChild(row);
    });

    updateSummary();
}

// Calcular y pintar el resumen de la orden
function updateSummary() {
    const cart = getCart();
    const subtotal = cart.reduce(
        (sum, product) => sum + parsePrice(product.price) * product.quantity,
        0
    );

    const destination = destinationSelect.value; // nombre de la ciudad
    const shipping = SHIPPING_PRICES[destination] || 0;
    // 10% de descuento solo si el subtotal supera los 100.000
    const discount =
        subtotal > PROMO_MIN_SUBTOTAL ? subtotal * PROMO_PERCENT : 0;
    const total = subtotal + shipping - discount;

    subtotalEl.textContent = formatMoney(subtotal);
    shippingEl.textContent = formatMoney(shipping);
    discountEl.textContent = formatMoney(discount);
    totalEl.textContent = formatMoney(total);

    // Guardamos el resumen para que checkout.html lo use tal cual
    saveSummary({ subtotal, shipping, discount, total, destination });
}

// ============================================================
// EVENTOS
// ============================================================

// Cambiar cantidad / eliminar (delegación de eventos)
cartTableBody.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    const cart = getCart();
    const product = cart.find((item) => item.id === id);
    if (!product) return;

    let newCart;

    if (action === "remove") {
        newCart = cart.filter((item) => item.id !== id);
    } else {
        if (action === "increase") product.quantity += 1;
        if (action === "decrease") product.quantity -= 1;

        // Si la cantidad llega a 0, el producto se va del carrito
        newCart =
            product.quantity <= 0
                ? cart.filter((item) => item.id !== id)
                : cart;
    }

    saveCart(newCart);
    renderCartPage();
});

// Cambiar ciudad -> recalcular domicilio
destinationSelect.addEventListener("change", updateSummary);

// Botón "Ir a pagar"
payBtn.addEventListener("click", () => {
    if (getCart().length === 0) {
        alert("Tu carrito está vacío. Agrega productos antes de pagar.");
        return;
    }
    window.location.href = "checkout.html";
});

// --- Al cargar la página: pintar el carrito guardado ---
renderCartPage();
