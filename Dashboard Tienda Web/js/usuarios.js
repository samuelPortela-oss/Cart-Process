// ============================================================
// usuarios.js - Módulo Usuarios (listado-usuarios.html y crear-usuario.html)
// Casillero: "usuarios" (login.html valida contra este casillero)
// ============================================================

const tablaUsuarios = document.querySelector("#tabla-usuarios");
const formUsuario = document.querySelector("#formulario-usuario");

// Solo un administrador puede crear o modificar administradores
// (así un vendedor no puede subirse el rol a sí mismo)
function puedeGestionarRol(rol) {
    return rol !== "administrador" || getSesion().rol === "administrador";
}

// ============================================================
// LISTADO + BÚSQUEDA + ELIMINAR
// ============================================================

function renderUsuarios(filtro = "") {
    const texto = filtro.trim().toLowerCase();
    const sesion = getSesion();
    const usuarios = getData("usuarios").filter((u) =>
        `${u.usuario} ${u.rol}`.toLowerCase().includes(texto)
    );

    tablaUsuarios.innerHTML = "";

    if (usuarios.length === 0) {
        tablaUsuarios.innerHTML =
            '<tr><td colspan="5" class="text-center py-4">No se encontraron usuarios</td></tr>';
        return;
    }

    // La contraseña nunca se muestra en la tabla
    usuarios.forEach((u) => {
        const editable = puedeGestionarRol(u.rol);
        const esYo = u.id === sesion.id;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${u.id}</td>
            <td>${escapeHtml(u.usuario)}${esYo ? ' <span class="badge badge-primary">tú</span>' : ""}</td>
            <td>${escapeHtml(u.rol)}</td>
            <td>${escapeHtml(u.creado)}</td>
            <td>
                ${editable ? `<a data-permiso="editar" href="crear-usuario.html?id=${u.id}" class="btn btn-sm btn-warning">Editar</a>` : ""}
                ${esYo ? "" : `<button data-permiso="eliminar" data-id="${u.id}" class="btn btn-sm btn-danger">Eliminar</button>`}
            </td>
        `;
        tablaUsuarios.appendChild(row);
    });

    aplicarPermisos(tablaUsuarios);
}

if (tablaUsuarios && getSesion()) {
    const buscador = document.querySelector('input[type="search"]');
    buscador.addEventListener("input", () => renderUsuarios(buscador.value));

    tablaUsuarios.addEventListener("click", (event) => {
        const btn = event.target.closest("button[data-id]");
        if (!btn) return;
        if (!puede("eliminar")) return alert("Tu rol no puede eliminar usuarios.");

        const id = Number(btn.getAttribute("data-id"));
        if (id === getSesion().id) return alert("No puedes eliminar tu propio usuario.");
        if (!confirm("¿Eliminar este usuario?")) return;

        saveData("usuarios", getData("usuarios").filter((u) => u.id !== id));
        renderUsuarios(buscador.value);
    });

    renderUsuarios();
}

// ============================================================
// CREAR / EDITAR (crear-usuario.html?id=X)
// ============================================================

if (formUsuario && protegerPagina(getIdUrl() ? "editar" : "crear", "listado-usuarios.html")) {
    const idEditar = getIdUrl();
    const selRol = document.querySelector("#rol");
    const inputUsuario = document.querySelector("#usuario");
    const inputContrasena = document.querySelector("#contrasena");
    const inputConfirmar = document.querySelector("#confirmar_contrasena");

    // Un vendedor no ve la opción de rol administrador
    if (!puedeGestionarRol("administrador")) {
        selRol.querySelector('option[value="administrador"]').remove();
    }

    if (idEditar) {
        const usuario = getData("usuarios").find((u) => u.id === idEditar);
        if (!usuario || !puedeGestionarRol(usuario.rol)) {
            alert(usuario ? "No puedes editar a un administrador." : "Usuario no encontrado.");
            window.location.href = "listado-usuarios.html";
        } else {
            selRol.value = usuario.rol;
            inputUsuario.value = usuario.usuario;
            // Al editar, la contraseña es opcional: vacía = se conserva la actual
            inputContrasena.required = false;
            inputConfirmar.required = false;
            inputContrasena.placeholder = "Dejar vacío para no cambiarla";
            document.querySelector("#titulo-form").textContent = "Editar Usuario";
            formUsuario.querySelector('button[type="submit"]').textContent = "Actualizar Usuario";
        }
    }

    formUsuario.addEventListener("submit", (event) => {
        event.preventDefault();

        const rol = selRol.value;
        const nombre = inputUsuario.value.trim();
        const contrasena = inputContrasena.value;

        if (!rol) return alert("Selecciona un rol.");
        if (!puedeGestionarRol(rol)) return alert("Tu rol no puede asignar el rol administrador.");
        if (nombre.length < 3) return alert("El usuario debe tener al menos 3 caracteres.");
        if (contrasena !== inputConfirmar.value) return alert("Las contraseñas no coinciden.");
        if ((!idEditar || contrasena) && contrasena.length < 6) {
            return alert("La contraseña debe tener al menos 6 caracteres.");
        }

        const usuarios = getData("usuarios");
        const repetido = usuarios.some(
            (u) => u.usuario.toLowerCase() === nombre.toLowerCase() && u.id !== idEditar
        );
        if (repetido) return alert("Ese nombre de usuario ya existe.");

        if (idEditar) {
            const usuario = usuarios.find((u) => u.id === idEditar);
            usuario.usuario = nombre;
            usuario.rol = rol;
            if (contrasena) usuario.contrasena = contrasena;
            // Si me edito a mí mismo, actualizo la sesión
            if (usuario.id === getSesion().id) saveSesion(usuario);
        } else {
            usuarios.push({
                id: nextId(usuarios),
                usuario: nombre,
                contrasena,
                rol,
                creado: new Date().toISOString().slice(0, 10),
            });
        }
        saveData("usuarios", usuarios);

        alert(idEditar ? "Usuario actualizado." : "Usuario creado.");
        window.location.href = "listado-usuarios.html";
    });
}
