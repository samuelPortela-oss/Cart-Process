// ============================================================
// checkout.js - Página de pago (checkout.html)
// ============================================================

// --- Referencias al DOM ---
const productsBox = document.querySelector(".productos");
const shippingEl = document.querySelector(".valor-domi");
const destinationEl = document.querySelector(".destino");
const discountEl = document.querySelector(".promo");
const subtotalEl = document.querySelector(".res-sub-total");
const totalEl = document.querySelector(".total");
const paymentRadios = document.querySelectorAll('input[name="radio"]');
const checkoutBtn = document.querySelector(".btn-checkout");

// Recargo según método de pago (value del input radio)
const PAYMENT_FEES = { 1: 0.05, 2: 0.03, 3: 0 };
const PAYMENT_NAMES = {
    1: "Contraentrega (+5%)",
    2: "PSE (+3%)",
    3: "Transferencia",
};

// ============================================================
// LOCALSTORAGE - Casilleros: "cart", "orderSummary" y "order"
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

// LEER el resumen que guardó cart.html (objeto o null)
function getSummary() {
    const stored = localStorage.getItem("orderSummary");
    if (stored === null) return null;

    try {
        return JSON.parse(stored);
    } catch (error) {
        console.warn("No se pudo leer el resumen:", error);
        return null;
    }
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

// GUARDAR la orden confirmada (thankyou.html la leerá)
function saveOrder(order) {
    localStorage.setItem("order", JSON.stringify(order));
}

// ============================================================
// VISTA (DOM) - Resumen de la orden
// ============================================================

// Pintar productos en el resumen
function renderProducts() {
    const cart = getCart();
    productsBox.innerHTML = "";

    if (cart.length === 0) {
        productsBox.innerHTML =
            '<p class="lead py-2 mb-0">No hay productos en el carrito.</p>';
        return;
    }

    cart.forEach((product) => {
        const item = document.createElement("div");
        item.className = "d-flex justify-content-between py-2";
        item.innerHTML = `
            <span>${product.name} x${product.quantity}</span>
            <span>${formatMoney(parsePrice(product.price) * product.quantity)}</span>
        `;
        productsBox.appendChild(item);
    });
}

// Recalcular totales: subtotal + domicilio - promo + recargo de pago
function updateSummary() {
    const summary = getSummary() || {
        subtotal: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        destination: "-",
    };

    subtotalEl.textContent = formatMoney(summary.subtotal);
    shippingEl.textContent = formatMoney(summary.shipping);
    destinationEl.textContent = summary.destination;
    discountEl.textContent = formatMoney(summary.discount);

    const selected = document.querySelector('input[name="radio"]:checked');
    const feePercent = PAYMENT_FEES[selected.value] || 0;
    const total = summary.total * (1 + feePercent);

    totalEl.textContent = formatMoney(total);
}

// ============================================================
// ACCIONES
// ============================================================

// Validación del formulario
function validateForm() {
    const requiredFields = [
        { id: "nombres-input", label: "Nombres" },
        { id: "apellidos-input", label: "Apellidos" },
        { id: "email-input", label: "Email" },
        { id: "celular-input", label: "Celular" },
        { id: "direccion-input", label: "Dirección" },
    ];

    for (const field of requiredFields) {
        const input = document.getElementById(field.id);
        if (input.value.trim() === "") {
            alert(`Completa el campo: ${field.label}`);
            input.focus();
            return false;
        }
    }

    const email = document.getElementById("email-input").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("El email no tiene un formato válido.");
        document.getElementById("email-input").focus();
        return false;
    }

    const phone = document.getElementById("celular-input").value.trim();
    if (!/^\d{7,}$/.test(phone)) {
        alert("El celular debe tener al menos 7 dígitos.");
        document.getElementById("celular-input").focus();
        return false;
    }

    return true;
}

// ============================================================
// EVENTOS
// ============================================================

// Cambiar método de pago -> recalcular total
paymentRadios.forEach((radio) => {
    radio.addEventListener("change", updateSummary);
});

// Botón "Place Order"
checkoutBtn.addEventListener("click", () => {
    const cart = getCart();
    if (cart.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }
    if (!validateForm()) return;

    const summary = getSummary() || {};
    const selected = document.querySelector('input[name="radio"]:checked');

    const order = {
        number: "#" + Date.now().toString().slice(-6),
        date: new Date().toLocaleString("es-CO"),
        customer: {
            firstName: document.getElementById("nombres-input").value.trim(),
            lastName: document.getElementById("apellidos-input").value.trim(),
            email: document.getElementById("email-input").value.trim(),
            phone: document.getElementById("celular-input").value.trim(),
            address: document.getElementById("direccion-input").value.trim(),
            address2: document.getElementById("direccion-2-input").value.trim(),
            note: document.getElementById("additiona-note").value.trim(),
        },
        products: cart,
        summary: summary,
        payment: PAYMENT_NAMES[selected.value] || "-",
    };

    // Guardamos la orden y navegamos; thankyou.html vacía el carrito al cargar
    saveOrder(order);

    window.location.href = "thankyou.html";
});

// --- Al cargar la página: pintar productos y resumen ---
renderProducts();
updateSummary();
