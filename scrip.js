// =========================================================================
// CONFIGURACIÓN DE FIREBASE FIRESTORE (UNERMB 2026)
// =========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyA8lUOC24vw5ygSSnJLJH2_ZCxjT7_QVK8",
  authDomain: "unermb-expoferia.firebaseapp.com",
  projectId: "unermb-expoferia",
  storageBucket: "unermb-expoferia.firebasestorage.app",
  messagingSenderId: "506583817897",
  appId: "1:506583817897:web:866cb1c9e6cd59ed9553b8"
};

// Inicializar Firebase y la referencia a Firestore
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const coleccionParticipantes = db.collection("participantes");

// =========================================================================
// DATOS INICIALES Y VARIABLES DE ESTADO
// =========================================================================
const EVENTOS_INICIALES = [
  {
    id: 1,
    sede: "Cabimas",
    lugar: "Cabimas - Aud. Principal",
    horario: "09:00 AM - 10:30 AM",
    titulo: "Foro: Inteligencia Artificial en la Educación Superior",
    ponente: "Dra. Carmen Silva",
    tipo: "Foro Central"
  },
  {
    id: 2,
    sede: "Ciudad Ojeda",
    lugar: "Ciudad Ojeda - Lab 2",
    horario: "11:00 AM - 01:00 PM",
    titulo: "Taller: Despliegue de Aplicaciones con Docker",
    ponente: "Ing. Roberto Gómez",
    tipo: "Taller Práctico"
  },
  {
    id: 3,
    sede: "San Francisco",
    lugar: "San Francisco - Salón A",
    horario: "02:00 PM - 03:30 PM",
    titulo: "Mesa de Trabajo: Innovación Tecnológica Regional",
    ponente: "MSc. Alejandro Rincón",
    tipo: "Mesa de Investigación"
  },
  {
    id: 4,
    sede: "Cabimas",
    lugar: "Cabimas - Sala 3",
    horario: "03:45 PM - 05:00 PM",
    titulo: "Ponencia: Base de Datos y Optimización en MySQL",
    ponente: "Dr. Luis Morales",
    tipo: "Ponencia Libre"
  },
  {
    id: 5,
    sede: "Los Puertos de Altagracia",
    lugar: "Los Puertos - Sala de Conferencias",
    horario: "10:00 AM - 11:30 AM",
    titulo: "Simposio: Desarrollo Sustentable en la Costa Oriental",
    ponente: "Dra. Beatriz Nava",
    tipo: "Simposio"
  }
];

const STANDS_INICIALES = [
  {
    id: 101,
    titulo: "Portal Automatizado de Gestión de Expoferias UNERMB",
    categoria: "Software y Web",
    sede: "Cabimas",
    equipo: "PNF Informática - Trayecto III",
    descripcion: "Plataforma web responsive para registro de ponencias, control de asistencia y emisión inmediata de certificados PDF.",
    votos: 28
  },
  {
    id: 102,
    titulo: "Estación Meteorológica IoT con ESP32 y Panel Solar",
    categoria: "Robótica e IoT",
    sede: "Ciudad Ojeda",
    equipo: "Semillero de Robótica Aplicada",
    descripcion: "Monitoreo en tiempo real de temperatura, humedad y calidad del aire en los laboratorios universitarios.",
    votos: 19
  },
  {
    id: 103,
    titulo: "Modelo de Gestión Contable para PYMES en el Zulia",
    categoria: "Gestión e Industria",
    sede: "San Francisco",
    equipo: "Grupo de Investigación Gerencial",
    descripcion: "Herramienta de análisis financiero y control tributario adaptada a emprendimientos regionales.",
    votos: 15
  }
];

let participantes = [];
let eventosCronograma = JSON.parse(localStorage.getItem("unermb_eventos")) || [...EVENTOS_INICIALES];
let standsExpoferia = JSON.parse(localStorage.getItem("unermb_stands")) || [...STANDS_INICIALES];
let certificadoSeleccionado = null;

function guardarEnStorage() {
  localStorage.setItem("unermb_eventos", JSON.stringify(eventosCronograma));
  localStorage.setItem("unermb_stands", JSON.stringify(standsExpoferia));
  actualizarContadores();
}

function actualizarContadores() {
  const badge = document.getElementById("badgeTotalInscritos");
  const statP = document.getElementById("statPonentes");
  const statE = document.getElementById("statEventos");
  const statS = document.getElementById("statStands");

  if (badge) badge.innerText = participantes.length;
  if (statP) statP.innerText = participantes.length;
  if (statE) statE.innerText = eventosCronograma.length;
  if (statS) statS.innerText = standsExpoferia.length;
}

// Formatear fecha legible: Día de la semana, Fecha y Hora exacta
function formatearFechaRegistro(fechaIso) {
  if (!fechaIso) return "Fecha no registrada";
  try {
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString("es-VE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  } catch (e) {
    return fechaIso;
  }
}

// Sincronización en tiempo real con Firebase Firestore
function escucharFirebase() {
  coleccionParticipantes.onSnapshot((snapshot) => {
    const datosNube = [];
    snapshot.forEach((doc) => {
      datosNube.push(doc.data());
    });
    participantes = [...datosNube];
    actualizarContadores();
    renderizarTablaParticipantes();
  }, (error) => {
    console.error("Error al conectar con Firestore:", error);
  });
}

// =========================================================================
// NAVEGACIÓN POR PESTAÑAS (SPA)
// =========================================================================
function cambiarPestana(tabId) {
  document.querySelectorAll(".tab-view").forEach(vista => vista.classList.remove("active"));
  const targetView = document.getElementById(`tab-${tabId}`);
  if (targetView) targetView.classList.add("active");

  document.querySelectorAll(".navbar-nav .nav-link").forEach(link => {
    if (link.getAttribute("data-tab-target") === tabId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  const navCollapse = document.getElementById("navContent");
  if (navCollapse && navCollapse.classList.contains("show")) {
    const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
    if (bsCollapse) bsCollapse.hide();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// =========================================================================
// MODO CLARO / OSCURO
// =========================================================================
function inicializarTema() {
  const temaGuardado = localStorage.getItem("unermb_theme") || "light";
  aplicarTema(temaGuardado);

  const btnTheme = document.getElementById("themeToggle");
  if (btnTheme) {
    btnTheme.addEventListener("click", () => {
      const actual = document.documentElement.getAttribute("data-bs-theme");
      const nuevo = actual === "dark" ? "light" : "dark";
      aplicarTema(nuevo);
      localStorage.setItem("unermb_theme", nuevo);
    });
  }
}

function aplicarTema(tema) {
  document.documentElement.setAttribute("data-bs-theme", tema);
  const icon = document.getElementById("themeIcon");
  if (icon) {
    icon.className = tema === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }
}

// =========================================================================
// RENDERIZADOS DINÁMICOS
// =========================================================================
function renderizarCronograma() {
  const contenedor = document.getElementById("listaEventos");
  const filtroSede = document.getElementById("filtroSede")?.value || "todas";
  const textoBusqueda = document.getElementById("buscarEvento")?.value.trim().toLowerCase() || "";
  const sinEventosMsg = document.getElementById("sinEventosMsg");

  if (!contenedor) return;
  contenedor.innerHTML = "";

  const filtrados = eventosCronograma.filter(ev => {
    const coincideSede = filtroSede === "todas" || ev.sede === filtroSede;
    const coincideTexto =
      ev.titulo.toLowerCase().includes(textoBusqueda) ||
      ev.ponente.toLowerCase().includes(textoBusqueda) ||
      ev.lugar.toLowerCase().includes(textoBusqueda);
    return coincideSede && coincideTexto;
  });

  if (filtrados.length === 0) {
    sinEventosMsg?.classList.remove("d-none");
    return;
  } else {
    sinEventosMsg?.classList.add("d-none");
  }

  filtrados.forEach(ev => {
    const col = document.createElement("div");
    col.className = "col-md-6 evento-item";
    col.innerHTML = `
      <div class="card card-event shadow-sm h-100 p-3 d-flex flex-column justify-content-between">
        <div>
          <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-1">
            <span class="badge badge-sede px-2 py-1">
              <i class="fa-solid fa-location-dot me-1"></i>${ev.lugar}
            </span>
            <span class="text-muted small">
              <i class="fa-regular fa-clock me-1"></i>${ev.horario}
            </span>
          </div>
          <h5 class="fw-bold mb-1">${ev.titulo}</h5>
          <p class="text-muted small mb-3"><strong>Ponente:</strong> ${ev.ponente}</p>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
          <span class="badge bg-body-tertiary text-body border">${ev.tipo}</span>
          <button class="btn btn-sm btn-outline-primary fw-semibold btn-inscribir-evento"
            data-titulo="${ev.titulo}" data-sede="${ev.sede}">
            <i class="fa-solid fa-user-plus me-1"></i>Inscribirme
          </button>
        </div>
      </div>
    `;
    contenedor.appendChild(col);
  });

  document.querySelectorAll(".btn-inscribir-evento").forEach(btn => {
    btn.addEventListener("click", () => {
      const titulo = btn.getAttribute("data-titulo");
      const sede = btn.getAttribute("data-sede");
      document.getElementById("eventoInscribirTitulo").value = titulo;
      document.getElementById("eventoInscribirSede").value = sede;
      document.getElementById("modalEventoNombreDisplay").innerText = titulo;
      document.getElementById("modalEventoSedeBadge").innerText = `Sede ${sede}`;
      const modal = new bootstrap.Modal(document.getElementById("modalInscribirEvento"));
      modal.show();
    });
  });
}

function renderizarStands(categoriaFiltro = "todas") {
  const contenedor = document.getElementById("listaStands");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  const filtrados = standsExpoferia.filter(
    st => categoriaFiltro === "todas" || st.categoria === categoriaFiltro
  );

  filtrados.forEach(st => {
    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4";
    col.innerHTML = `
      <div class="card h-100 shadow-sm border-0 rounded-3">
        <div class="card-body p-4 d-flex flex-column justify-content-between">
          <div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-warning text-dark fw-semibold">${st.categoria}</span>
              <span class="badge badge-sede"><i class="fa-solid fa-location-dot me-1"></i>${st.sede}</span>
            </div>
            <h5 class="fw-bold mt-2 mb-2">${st.titulo}</h5>
            <p class="text-muted small mb-3">${st.descripcion}</p>
          </div>
          <div class="pt-3 border-top d-flex justify-content-between align-items-center">
            <small class="text-muted"><i class="fa-solid fa-users me-1"></i>${st.equipo}</small>
            <button class="btn btn-sm btn-outline-warning text-body fw-semibold btn-votar-stand" data-id="${st.id}">
              <i class="fa-solid fa-thumbs-up text-warning me-1"></i><span>${st.votos}</span>
            </button>
          </div>
        </div>
      </div>
    `;
    contenedor.appendChild(col);
  });

  document.querySelectorAll(".btn-votar-stand").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-id"));
      const stand = standsExpoferia.find(s => s.id === id);
      if (stand) {
        stand.votos += 1;
        guardarEnStorage();
        const catActiva = document.querySelector(".filtro-stand.active")?.getAttribute("data-cat") || "todas";
        renderizarStands(catActiva);
      }
    });
  });
}

function renderizarTablaParticipantes() {
  const tbody = document.getElementById("tablaParticipantesBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  participantes.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="ps-4 fw-semibold">${p.cedula}</td>
      <td>${p.nombre}</td>
      <td><span class="badge bg-primary-subtle text-primary-emphasis">${p.rol}</span></td>
      <td class="small">${p.evento}</td>
      <td>${p.sede || "General"}</td>
      <td><code class="small">${p.codigo}</code></td>
      <td class="text-end pe-4">
        <button class="btn btn-sm btn-outline-success btn-ver-cert-tabla" data-cedula="${p.cedula}">
          <i class="fa-solid fa-award me-1"></i>Certificado
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".btn-ver-cert-tabla").forEach(btn => {
    btn.addEventListener("click", () => {
      const cedula = btn.getAttribute("data-cedula");
      cambiarPestana("certificados");
      const input = document.getElementById("buscarCedula");
      if (input) {
        input.value = cedula;
        validarCertificadoPorCedula(cedula);
      }
    });
  });
}

// =========================================================================
// VALIDACIÓN Y DESCARGA DE CERTIFICADOS PDF
// =========================================================================
function validarCertificadoPorCedula(valorBusqueda) {
  const inputVal = valorBusqueda.trim().toLowerCase().replace(/[^a-z0-9]/gi, "");
  const resBox = document.getElementById("resultadoCertificado");
  const errBox = document.getElementById("errorCertificado");

  const encontrado = participantes.find(p => {
    const cedulaLimpia = (p.cedula || "").toLowerCase().replace(/[^a-z0-9]/gi, "");
    const codigoLimpio = (p.codigo || "").toLowerCase().replace(/[^a-z0-9]/gi, "");
    return (cedulaLimpia.includes(inputVal) || codigoLimpio.includes(inputVal)) && inputVal !== "";
  });

  if (encontrado) {
    certificadoSeleccionado = encontrado;
    const fechaTexto = formatearFechaRegistro(encontrado.fechaCreacion);

    document.getElementById("certNombre").innerText = encontrado.nombre;
    document.getElementById("certDetalle").innerText = `Calidad: ${encontrado.rol} en "${encontrado.evento}"`;
    document.getElementById("certCodigo").innerText = `Código de Verificación: ${encontrado.codigo}`;
    
    const certFechaEl = document.getElementById("certFechaRegistro");
    if (certFechaEl) {
      certFechaEl.innerHTML = `<i class="fa-regular fa-clock me-1"></i><strong>Registrado el:</strong> ${fechaTexto}`;
    }

    document.getElementById("previewNombre").innerText = encontrado.nombre.toUpperCase();
    document.getElementById("previewCedula").innerText = `Cédula de Identidad: ${encontrado.cedula}`;
    document.getElementById("previewEvento").innerText = `Por su destacada participación como ${encontrado.rol} en "${encontrado.evento}"`;
    
    const previewFechaEl = document.getElementById("previewFecha");
    if (previewFechaEl) {
      previewFechaEl.innerHTML = `<i class="fa-regular fa-calendar-days me-1"></i>Fecha y hora de registro: <strong>${fechaTexto}</strong>`;
    }

    resBox.classList.remove("d-none");
    errBox.classList.add("d-none");
  } else {
    certificadoSeleccionado = null;
    resBox.classList.add("d-none");
    errBox.classList.remove("d-none");
  }
}

// =========================================================================
// INICIALIZACIÓN DE EVENTOS DEL DOM
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  inicializarTema();
  actualizarContadores();
  renderizarCronograma();
  renderizarStands();
  renderizarTablaParticipantes();
  escucharFirebase();

  document.querySelectorAll("[data-tab-target]").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      cambiarPestana(el.getAttribute("data-tab-target"));
    });
  });

  document.querySelectorAll("[data-go-tab]").forEach(btn => {
    btn.addEventListener("click", () => cambiarPestana(btn.getAttribute("data-go-tab")));
  });

  const textareaResumen = document.getElementById("resumen");
  const contadorPalabras = document.getElementById("contadorPalabras");
  if (textareaResumen && contadorPalabras) {
    textareaResumen.addEventListener("input", () => {
      const texto = textareaResumen.value.trim();
      contadorPalabras.innerText = texto ? texto.split(/\\s+/).length : 0;
    });
  }

  // 1. REGISTRO CON CÉDULA (PK), CORREO (UNIQUE) Y TELÉFONO (UNIQUE)
  const formPonente = document.getElementById("formPonente");
  if (formPonente) {
    formPonente.addEventListener("submit", async (e) => {
      e.preventDefault();

      const btnSubmit = formPonente.querySelector('button[type="submit"]');
      const alertSuccess = document.getElementById("alertSuccess");
      const alertError = document.getElementById("alertErrorCedula");
      const msgError = document.getElementById("msgErrorCedula");

      if (alertSuccess) alertSuccess.classList.add("d-none");
      if (alertError) alertError.classList.add("d-none");

      const nombre = document.getElementById("nombre").value.trim();
      const cedulaRaw = document.getElementById("cedula").value.trim();
      const cedulaDocId = cedulaRaw.replace(/[^0-9]/g, ""); // PK

      const correo = document.getElementById("correo").value.trim().toLowerCase();
      const telefonoRaw = document.getElementById("telefono").value.trim();
      const telefonoLimpio = telefonoRaw.replace(/[^0-9]/g, ""); // UNIQUE

      const rol = document.getElementById("rol").value;
      const sede = document.getElementById("sede").value;
      const linea = document.getElementById("linea").value;
      const titulo = document.getElementById("titulo").value.trim();
      const resumen = document.getElementById("resumen").value.trim();
      const publicarEnCronograma = document.getElementById("agregarAlCronograma").checked;

      if (!cedulaDocId) {
        alert("Por favor ingresa una cédula válida.");
        return;
      }
      if (!telefonoLimpio) {
        alert("Por favor ingresa un número telefónico válido.");
        return;
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Validando datos...';
      }

      try {
        // A. Cédula única (PK)
        const docRef = coleccionParticipantes.doc(cedulaDocId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          const datos = docSnap.data();
          if (alertError && msgError) {
            msgError.innerHTML = `La cédula <strong>${cedulaRaw}</strong> ya está registrada en el sistema a nombre de <strong>${datos.nombre}</strong>.`;
            alertError.classList.remove("d-none");
          }
          return;
        }

        // B. Correo único (UNIQUE)
        const consultaCorreo = await coleccionParticipantes.where("correo", "==", correo).get();
        if (!consultaCorreo.empty) {
          const datos = consultaCorreo.docs[0].data();
          if (alertError && msgError) {
            msgError.innerHTML = `El correo electrónico <strong>${correo}</strong> ya está registrado para el participante <strong>${datos.nombre}</strong>.`;
            alertError.classList.remove("d-none");
          }
          return;
        }

        // C. Teléfono único (UNIQUE)
        const consultaTelefono = await coleccionParticipantes.where("telefonoLimpio", "==", telefonoLimpio).get();
        if (!consultaTelefono.empty) {
          const datos = consultaTelefono.docs[0].data();
          if (alertError && msgError) {
            msgError.innerHTML = `El número telefónico <strong>${telefonoRaw}</strong> ya se encuentra registrado a nombre de <strong>${datos.nombre}</strong>. No se permiten números duplicados.`;
            alertError.classList.remove("d-none");
          }
          return;
        }

        // Si todas las comprobaciones son exitosas:
        const codigoGenerado = "UNERMB-2026-" + Math.floor(1000 + Math.random() * 9000);
        const fechaExactaRegistro = new Date().toISOString();

        const nuevoParticipante = {
          cedula: cedulaRaw,
          cedulaId: cedulaDocId,
          correo: correo,
          telefono: telefonoRaw,
          telefonoLimpio: telefonoLimpio,
          nombre,
          evento: `Ponencia: ${titulo}`,
          rol: rol || "Ponente",
          sede,
          linea,
          resumen,
          codigo: codigoGenerado,
          fechaCreacion: fechaExactaRegistro
        };

        // Guardar con ID de cédula
        await docRef.set(nuevoParticipante);

        if (publicarEnCronograma) {
          eventosCronograma.unshift({
            id: Date.now(),
            sede,
            lugar: `${sede} - Sala de Ponencias`,
            horario: "Horario por asignar",
            titulo,
            ponente: nombre,
            tipo: linea
          });
          guardarEnStorage();
          renderizarCronograma();
        }

        const msgCodigo = document.getElementById("msgCodigoRegistrado");
        if (msgCodigo) {
          msgCodigo.innerText = `Participante: ${nombre} (${cedulaRaw}) | Código: ${codigoGenerado}`;
        }
        if (alertSuccess) alertSuccess.classList.remove("d-none");

        const btnIrCert = document.getElementById("btnIrACertificadoRecienCreado");
        if (btnIrCert) {
          btnIrCert.onclick = () => {
            cambiarPestana("certificados");
            document.getElementById("buscarCedula").value = cedulaRaw;
            validarCertificadoPorCedula(cedulaRaw);
          };
        }

        formPonente.reset();
        if (contadorPalabras) contadorPalabras.innerText = "0";

      } catch (err) {
        console.error("Error al procesar en Firebase:", err);
        if (alertError && msgError) {
          msgError.innerText = "Error de conexión con la base de datos. Intenta nuevamente.";
          alertError.classList.remove("d-none");
        }
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = '<i class="fa-solid fa-paper-plane me-2"></i>Enviar Postulación';
        }
      }
    });
  }

  // 2. Cronograma y Registro de Asistente
  const filtroSede = document.getElementById("filtroSede");
  const buscarEvento = document.getElementById("buscarEvento");
  if (filtroSede) filtroSede.addEventListener("change", renderizarCronograma);
  if (buscarEvento) buscarEvento.addEventListener("input", renderizarCronograma);

  const formInscribirAsistente = document.getElementById("formInscribirAsistente");
  if (formInscribirAsistente) {
    formInscribirAsistente.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("asistenteNombre").value.trim();
      const cedulaRaw = document.getElementById("asistenteCedula").value.trim();
      const cedulaDocId = cedulaRaw.replace(/[^0-9]/g, "");
      const rol = document.getElementById("asistenteRol").value;
      const tituloEvento = document.getElementById("eventoInscribirTitulo").value;
      const sedeEvento = document.getElementById("eventoInscribirSede").value;
      const codigoGenerado = "UNERMB-2026-" + Math.floor(1000 + Math.random() * 9000);
      const fechaExactaRegistro = new Date().toISOString();

      const nuevoAsistente = {
        cedula: cedulaRaw,
        cedulaId: cedulaDocId,
        nombre,
        evento: tituloEvento,
        rol,
        sede: sedeEvento,
        codigo: codigoGenerado,
        fechaCreacion: fechaExactaRegistro
      };

      await coleccionParticipantes.doc(cedulaDocId).set(nuevoAsistente);

      const modalEl = document.getElementById("modalInscribirEvento");
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();

      formInscribirAsistente.reset();
      cambiarPestana("certificados");
      document.getElementById("buscarCedula").value = cedulaRaw;
      validarCertificadoPorCedula(cedulaRaw);
    });
  }

  // 3. Stands Expoferia
  document.querySelectorAll(".filtro-stand").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filtro-stand").forEach(b => {
        b.classList.remove("btn-warning", "fw-semibold", "active");
        b.classList.add("btn-outline-secondary");
      });
      btn.classList.remove("btn-outline-secondary");
      btn.classList.add("btn-warning", "fw-semibold", "active");
      renderizarStands(btn.getAttribute("data-cat"));
    });
  });

  const formNuevoStand = document.getElementById("formNuevoStand");
  if (formNuevoStand) {
    formNuevoStand.addEventListener("submit", e => {
      e.preventDefault();
      const nuevoStand = {
        id: Date.now(),
        titulo: document.getElementById("standTitulo").value.trim(),
        categoria: document.getElementById("standCategoria").value,
        sede: document.getElementById("standSede").value,
        equipo: document.getElementById("standEquipo").value.trim(),
        descripcion: document.getElementById("standDesc").value.trim(),
        votos: 1
      };
      standsExpoferia.unshift(nuevoStand);
      guardarEnStorage();
      renderizarStands();

      const modalEl = document.getElementById("modalNuevoStand");
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
      formNuevoStand.reset();
    });
  }

  // 4. Búsqueda y Validación de Certificado
  const btnValidar = document.getElementById("btnValidar");
  const inputBuscarCedula = document.getElementById("buscarCedula");
  if (btnValidar && inputBuscarCedula) {
    btnValidar.addEventListener("click", () => validarCertificadoPorCedula(inputBuscarCedula.value));
    inputBuscarCedula.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        validarCertificadoPorCedula(inputBuscarCedula.value);
      }
    });
  }

  document.querySelectorAll(".cedula-demo").forEach(badge => {
    badge.addEventListener("click", () => {
      const demoVal = badge.getAttribute("data-Demo");
      if (inputBuscarCedula) {
        inputBuscarCedula.value = demoVal;
        validarCertificadoPorCedula(demoVal);
      }
    });
  });

  // 5. Descarga de Certificado PDF con Fecha y Hora
  const btnDescargar = document.getElementById("btnDescargar");
  if (btnDescargar) {
    btnDescargar.addEventListener("click", () => {
      if (!certificadoSeleccionado) return;

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const fechaTexto = formatearFechaRegistro(certificadoSeleccionado.fechaCreacion);

      // Bordes Institucionales UNERMB
      doc.setDrawColor(13, 59, 102);
      doc.setLineWidth(3);
      doc.rect(10, 10, 277, 190);

      doc.setDrawColor(244, 211, 94);
      doc.setLineWidth(1);
      doc.rect(13, 13, 271, 184);

      // Encabezados
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(13, 59, 102);
      doc.text("UNIVERSIDAD NACIONAL EXPERIMENTAL RAFAEL MARÍA BARALT", 148, 30, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text("VICERRECTORADO ACADÉMICO - COORDINACIÓN DE INVESTIGACIÓN", 148, 38, { align: "center" });

      // Título
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(13, 59, 102);
      doc.text("CERTIFICADO DE PARTICIPACIÓN", 148, 58, { align: "center" });

      doc.setFont("helvetica", "italic");
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("Otorgado a:", 148, 72, { align: "center" });

      // Datos del Participante
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 0);
      doc.text(certificadoSeleccionado.nombre.toUpperCase(), 148, 86, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text(`Cédula de Identidad: ${certificadoSeleccionado.cedula}`, 148, 94, { align: "center" });

      doc.setFontSize(12);
      doc.text(`Por su participación como ${certificadoSeleccionado.rol} en:`, 148, 108, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(13, 59, 102);
      const lineasEvento = doc.splitTextToSize(`"${certificadoSeleccionado.evento}"`, 220);
      doc.text(lineasEvento, 148, 118, { align: "center" });

      // Fecha y Hora de Registro
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(70, 70, 70);
      doc.text(`Fecha y hora de registro: ${fechaTexto}`, 148, 138, { align: "center" });

      // Código de Verificación
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Código de Verificación Digital: ${certificadoSeleccionado.codigo}`, 148, 148, { align: "center" });

      // Firmas
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      doc.line(60, 172, 120, 172);
      doc.line(177, 172, 237, 172);

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text("Comité Organizador UNERMB", 90, 178, { align: "center" });
      doc.text("Secretaría Académica", 207, 178, { align: "center" });

      doc.save(`Certificado_${certificadoSeleccionado.cedula}.pdf`);
    });
  }
});