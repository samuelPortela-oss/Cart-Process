// ============================================================
// auth.js - Sesión y permisos por rol del Dashboard
// Requiere ../js/datos.js cargado antes
// ============================================================

// Operaciones que puede hacer cada rol
const PERMISOS = {
    administrador: ["crear", "leer", "editar", "eliminar"],
    vendedor: ["crear", "leer", "editar"],
    cajero: ["leer"],
};

// ============================================================
// LOCALSTORAGE - Casillero: "sesion" (objeto {id, usuario, rol} o null)
// ============================================================

function getSesion() {
    const stored = localStorage.getItem("sesion");
    if (stored === null) return null;

    try {
        return JSON.parse(stored);
    } catch (error) {
        console.warn("No se pudo leer la sesión:", error);
        return null;
    }
}

function saveSesion(usuario) {
    localStorage.setItem(
        "sesion",
        JSON.stringify({ id: usuario.id, usuario: usuario.usuario, rol: usuario.rol })
    );
}

function cerrarSesion() {
    localStorage.removeItem("sesion");
}

// ¿El usuario en sesión puede hacer esta acción?
function puede(accion) {
    const sesion = getSesion();
    if (!sesion) return false;
    return (PERMISOS[sesion.rol] || []).includes(accion);
}

// Sin sesión no se entra al Dashboard
function requireLogin() {
    if (!getSesion()) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

// Para las páginas crear-*: si el rol no tiene permiso, vuelve al listado
function protegerPagina(accion, listado) {
    if (!getSesion()) return false; // requireLogin() ya está redirigiendo
    if (!puede(accion)) {
        alert(`Tu rol no tiene permiso para ${accion} en este módulo.`);
        window.location.href = listado;
        return false;
    }
    return true;
}

// Ocultar los elementos con data-permiso="crear|editar|eliminar" que el rol no tenga
function aplicarPermisos(contenedor = document) {
    contenedor.querySelectorAll("[data-permiso]").forEach((el) => {
        if (!puede(el.getAttribute("data-permiso"))) el.remove();
    });
}

// Leer el ?id= de la URL (modo edición)
function getIdUrl() {
    const id = new URLSearchParams(window.location.search).get("id");
    return id === null ? null : Number(id);
}

// ============================================================
// AL CARGAR - Login, o topbar con el usuario, permisos y logout
// ============================================================

const formLogin = document.querySelector("#formulario-login");

if (formLogin) {
    // login.html: validar contra el casillero "usuarios"
    if (getSesion()) window.location.href = "index.html";

    formLogin.addEventListener("submit", (event) => {
        event.preventDefault();
        const nombre = document.querySelector("#login-usuario").value.trim().toLowerCase();
        const contrasena = document.querySelector("#login-contrasena").value;

        const usuario = getData("usuarios").find(
            (u) => u.usuario.toLowerCase() === nombre && u.contrasena === contrasena
        );
        if (!usuario) return alert("Usuario o contraseña incorrectos.");

        saveSesion(usuario);
        window.location.href = "index.html";
    });
} else if (requireLogin()) {
    const sesion = getSesion();

    const nombreTopbar = document.querySelector("#userDropdown span");
    if (nombreTopbar) nombreTopbar.textContent = `${sesion.usuario} (${sesion.rol})`;

    aplicarPermisos();

    // El botón Logout del modal borra la sesión antes de ir a login.html
    const btnLogout = document.querySelector('#logoutModal a[href="login.html"]');
    if (btnLogout) btnLogout.addEventListener("click", cerrarSesion);
}
