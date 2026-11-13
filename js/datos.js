// ============================================================
// datos.js - Capa de datos compartida (tienda + dashboard)
// La tienda lo carga con "js/datos.js" y el dashboard con "../js/datos.js"
// ============================================================

// ============================================================
// LOCALSTORAGE - Casilleros: "productos", "clientes", "pedidos",
// "usuarios" y "sesion"
// Regla JSON: JSON.stringify al GUARDAR, JSON.parse al LEER
// ============================================================

// LEER un casillero que guarda un array (texto -> array, nunca null)
function getData(key) {
    const stored = localStorage.getItem(key);
    if (stored === null) return [];

    try {
        const data = JSON.parse(stored);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.warn(`No se pudo leer "${key}":`, error);
        return [];
    }
}

// GUARDAR un array en un casillero (array -> texto)
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Siguiente id disponible: el mayor id + 1
function nextId(list) {
    return list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
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

// Las imágenes locales se guardan relativas a la raíz ("images/b1.png").
// Desde el dashboard (una carpeta adentro) hay que anteponer "../"
function resolveImg(src, base = "") {
    if (!src) return "";
    if (/^(https?:|data:|\/)/.test(src)) return src;
    return base + src;
}

// Evitar que el texto escrito por el usuario se interprete como HTML
function escapeHtml(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// ============================================================
// DATOS INICIALES - Solo se cargan si el casillero está vacío
// ============================================================

const PRODUCTOS_INICIALES = [
    { id: 1, nombre: "Italian Pizza", descripcion: "Pizza clásica italiana.", precio: 6500, stock: 20, imagen: "images/b1.png" },
    { id: 2, nombre: "Fried Chicken", descripcion: "Pollo frito crocante.", precio: 20300, stock: 20, imagen: "images/b2.png" },
    { id: 3, nombre: "Tasty Fries", descripcion: "Papas fritas de la casa.", precio: 12000, stock: 20, imagen: "images/b3.png" },
    { id: 4, nombre: "Pizza Slice", descripcion: "Porción de pizza.", precio: 32000, stock: 20, imagen: "images/b4.png" },
    { id: 5, nombre: "Pizza Familiar", descripcion: "Pizza para compartir.", precio: 6500, stock: 20, imagen: "images/b5.png" },
    { id: 6, nombre: "Alitas BBQ", descripcion: "Alitas en salsa BBQ.", precio: 20300, stock: 20, imagen: "images/b6.png" },
    { id: 7, nombre: "Papas Cheddar", descripcion: "Papas con queso cheddar.", precio: 12000, stock: 20, imagen: "images/b7.png" },
    { id: 8, nombre: "Pizza Pepperoni", descripcion: "Pizza con pepperoni.", precio: 32000, stock: 20, imagen: "images/b8.png" },
];

const USUARIOS_INICIALES = [
    { id: 1, usuario: "admin", contrasena: "admin123", rol: "administrador", creado: "2026-11-13" },
    { id: 2, usuario: "vendedor", contrasena: "vende123", rol: "vendedor", creado: "2026-11-13" },
    { id: 3, usuario: "cajero", contrasena: "caja123", rol: "cajero", creado: "2026-11-13" },
];

function seedData() {
    if (localStorage.getItem("productos") === null) saveData("productos", PRODUCTOS_INICIALES);
    if (localStorage.getItem("usuarios") === null) saveData("usuarios", USUARIOS_INICIALES);
    if (localStorage.getItem("clientes") === null) saveData("clientes", []);
    if (localStorage.getItem("pedidos") === null) saveData("pedidos", []);
}

// Descontar del stock las unidades vendidas: [{productoId, cantidad}]
function descontarStock(items) {
    const productos = getData("productos");
    items.forEach((item) => {
        const producto = productos.find((p) => p.id === Number(item.productoId));
        if (producto) producto.stock = Math.max(0, producto.stock - item.cantidad);
    });
    saveData("productos", productos);
}

// --- Al cargar cualquier página: asegurar que existan los datos ---
seedData();
