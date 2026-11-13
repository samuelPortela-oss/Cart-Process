// ============================================================
// thankyou.js - Página de confirmación (thankyou.html)
// ============================================================

// --- Referencias al DOM ---
const customerNameEl = document.querySelector(".customer-name");
const orderNumberEl = document.querySelector(".order-number");
const orderDateEl = document.querySelector(".order-date");
const orderItemsEl = document.querySelector(".order-items");
const orderTotalEl = document.querySelector(".order-total");
const orderPaymentEl = document.querySelector(".order-payment");
const orderDestinationEl = document.querySelector(".order-destination");
const againBtn = document.querySelector(".btn-gracias");

// ============================================================
// LOCALSTORAGE - Casillero: "order"
// Regla JSON: JSON.stringify al GUARDAR, JSON.parse al LEER
// ============================================================

// LEER la orden confirmada (objeto o null)
function getOrder() {
    const stored = localStorage.getItem("order");
    if (stored === null) return null;

    try {
        return JSON.parse(stored);
    } catch (error) {
        console.warn("No se pudo leer la orden:", error);
        return null;
    }
}

// parsePrice() y formatMoney() vienen de js/datos.js

function clearCart() {
    localStorage.removeItem("cart");
    localStorage.removeItem("orderSummary");
}

// ============================================================
// VISTA (DOM) - Pintar la orden
// ============================================================

function renderOrder() {
    const order = getOrder();

    if (!order) {
        // Si alguien entró a la página sin comprar, mostramos un mensaje
        customerNameEl.textContent = "Cliente";
        orderNumberEl.textContent = "Orden no encontrada";
        orderItemsEl.innerHTML =
            "<p>No encontramos tu orden. Realiza una compra primero.</p>";
        return;
    }

    // Datos del cliente
    customerNameEl.textContent =
        `${order.customer.firstName} ${order.customer.lastName}`;

    // Número y fecha de la orden
    orderNumberEl.textContent = `Orden ${order.number}`;
    orderDateEl.textContent = order.date;

    // Lista de productos comprados
    order.products.forEach((product) => {
        const item = document.createElement("div");
        item.className = "d-flex justify-content-between py-1";
        item.innerHTML = `
            <span>${product.name} x${product.quantity}</span>
            <span>${formatMoney(parsePrice(product.price) * product.quantity)}</span>
        `;
        orderItemsEl.appendChild(item);
    });

    // Totales y datos de la compra
    orderTotalEl.textContent = formatMoney(order.summary.total);
    orderPaymentEl.textContent = order.payment;
    orderDestinationEl.textContent = order.summary.destination;

    clearCart();
}

// ============================================================
// EVENTOS
// ============================================================

// Botón: realizar otra compra
againBtn.addEventListener("click", () => {
    window.location.href = "index.html";
});

// --- Al cargar la página: pintar la orden guardada ---
renderOrder();
