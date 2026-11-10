const STEPS = [
  { id: 2, name: "Documentos" },
  { id: 3, name: "Proyecto" },
  { id: 4, name: "Análisis" },
  { id: 5, name: "Reporte" },
];

const state = {
  loggedIn: false,
  screen: 1,
  analyzing: false,
  analyzed: false,
  projectName: "Regularización, calle de ejemplo 120",
  comuna: "Concepción",
  tramite: "Regularización de ampliación de vivienda",
  motivo: "Venta con crédito hipotecario",
  condominio: false,
  adosamiento: true,
  certificado: "ine",
  files: {
    plano: { label: "Plano de arquitectura", file: "Plano-planta.pdf", uploaded: true, formatOk: false },
    eett: { label: "Especificaciones técnicas (EETT)", file: "EETT-ampliacion.pdf", uploaded: true },
    vecino: { label: "Autorización del vecino", file: "Autorizacion-vecino.pdf", uploaded: false },
    ine: { label: "Certificado de recepción del formulario INE", file: "Certificado-INE.pdf", uploaded: false },
    seim: { label: "Certificado SEIM de impacto vial", file: "Certificado-SEIM.pdf", uploaded: false },
    copro: { label: "Autorización de copropietarios", file: "Autorizacion-copropietarios.pdf", uploaded: false },
  },
};

const workspace = document.querySelector("#workspace");
const steps = document.querySelector("#steps");
const nextButton = document.querySelector("#next");
const logoutButton = document.querySelector("#logout");
const crumb = document.querySelector("#crumb");
const dialog = document.querySelector("#export-dialog");
const exportBody = document.querySelector("#export-body");

function findings() {
  const plano = state.files.plano;
  const certId = state.certificado === "seim" ? "seim" : "ine";
  const cert = state.files[certId];
  const items = [
    {
      id: "vecino",
      title: "Autorización de vecino por adosamiento",
      status: !state.adosamiento ? "na" : state.files.vecino.uploaded ? "listo" : "pendiente",
      detail: !state.adosamiento
        ? "La configuración indica que no se supera el porcentaje de adosamiento."
        : state.files.vecino.uploaded
          ? "El archivo está cargado."
          : "El proyecto supera el adosamiento y el archivo no está en el expediente.",
      action: "Conseguir la firma del vecino y adjuntarla antes de ingresar.",
      family: "Necesitamos que el vecino firme para poder ingresar la regularización.",
    },
    {
      id: certId,
      title: cert.label,
      status: cert.uploaded ? "listo" : "pendiente",
      detail: cert.uploaded
        ? "El certificado que corresponde a este proyecto está cargado."
        : state.certificado === "seim"
          ? "La configuración pide SEIM. El formulario INE no reemplaza ese certificado."
          : "La configuración pide el formulario INE. El certificado SEIM no corresponde.",
      action: state.certificado === "seim"
        ? "Adjuntar el certificado SEIM de impacto vial."
        : "Adjuntar el certificado de recepción del formulario INE.",
      family: "Este certificado es necesario para seguir con la venta con crédito.",
    },
    {
      id: "formato",
      title: "Formato de los documentos",
      status: !plano.uploaded ? "pendiente" : plano.formatOk ? "listo" : "pendiente",
      detail: !plano.uploaded
        ? "Falta el plano de arquitectura."
        : plano.formatOk
          ? "El plano cargado está en tamaño oficio y reserva la firma digital."
          : "Plano-planta.pdf está cargado, pero no está en tamaño oficio o no deja margen para la firma digital.",
      action: "Dejar el plano en tamaño oficio y reservar el espacio de firma digital.",
      family: "Hay que corregir el formato de los papeles antes de entrar a la municipalidad.",
    },
    {
      id: "eett",
      title: "Especificaciones técnicas (EETT)",
      status: state.files.eett.uploaded ? "listo" : "pendiente",
      detail: state.files.eett.uploaded
        ? "Las modificaciones del proyecto están en el archivo cargado."
        : "Falta el archivo de especificaciones técnicas.",
      action: "Incorporar las modificaciones del proyecto en las EETT y adjuntarlas.",
      family: "Falta actualizar un documento técnico del expediente.",
    },
    {
      id: "copro",
      title: "Autorización de copropietarios",
      status: !state.condominio ? "na" : state.files.copro.uploaded ? "listo" : "pendiente",
      detail: !state.condominio
        ? "El inmueble no está en condominio, así que este documento no se pide."
        : state.files.copro.uploaded
          ? "La autorización está cargada."
          : "El proyecto está en condominio y falta la autorización.",
      action: "Adjuntar la autorización de los copropietarios.",
      family: "En un condominio hace falta la autorización de los copropietarios.",
    },
  ];
  return items;
}

function counts(items) {
  return {
    pending: items.filter((item) => item.status === "pendiente"),
    ready: items.filter((item) => item.status === "listo"),
    skipped: items.filter((item) => item.status === "na"),
  };
}

function statusLabel(status) {
  if (status === "listo") return "Listo";
  if (status === "pendiente") return "Pendiente";
  return "No aplica";
}

function fileRow(id) {
  const file = state.files[id];
  const formatIssue = id === "plano" && file.uploaded && !file.formatOk;
  const klass = formatIssue ? "warn" : file.uploaded ? "ok" : "";
  const detail = !file.uploaded
    ? "Sin archivo"
    : formatIssue
      ? `${file.file} · el formato no cumple`
      : file.file;
  const action = file.uploaded
    ? `<button class="btn-text" type="button" data-action="detach" data-id="${id}">Quitar</button>`
    : `<button class="btn btn-ghost btn-compact" type="button" data-action="attach" data-id="${id}">Adjuntar ejemplo</button>`;
  const fix = formatIssue
    ? `<button class="btn btn-ghost btn-compact" type="button" data-action="fix-format">Corregir formato</button>`
    : "";
  return `<article class="doc ${klass}"><div><strong>${file.label}</strong><small>${detail}</small></div><div class="doc-actions"><span class="pill ${file.uploaded ? "file" : "na"}">${file.uploaded ? "Cargado" : "Vacío"}</span>${fix}${action}</div></article>`;
}

function screenLogin() {
  return `<section class="login">
    <div>
      <p class="kicker">Expedita · Concepción</p>
      <h1>Revisa el expediente antes de la DOM</h1>
      <p class="lede">Autorevisión para arquitectos que ingresan expedientes a la Dirección de Obras Municipales.</p>
    </div>
    <form class="login-card" id="login-form">
      <h2>Iniciar sesión</h2>
      <p class="hint">Cualquier correo abre el caso demo.</p>
      <label>Correo<input type="email" value="arquitecto@estudio.cl" autocomplete="username"></label>
      <label>Contraseña<input type="password" value="demo" autocomplete="current-password"></label>
      <button class="btn btn-primary" type="submit">Entrar</button>
    </form>
  </section>`;
}

function screenDocs() {
  return `<header class="page-head"><div><h1>Documentos del expediente</h1><p class="intro">Sube los archivos del ingreso. En este prototipo el botón adjunta un archivo de ejemplo: no se lee el PDF.</p></div></header>
    <div class="list">
      ${fileRow("plano")}
      ${fileRow("eett")}
      ${fileRow("vecino")}
      ${fileRow("ine")}
      ${fileRow("seim")}
      ${fileRow("copro")}
    </div>`;
}

function screenProject() {
  return `<header class="page-head"><div><h1>Configuración del proyecto</h1><p class="intro">Estos datos dicen qué documentos exige el caso. No son una encuesta: son la ficha del encargo.</p></div></header>
    <form class="form-grid">
      <label class="field wide">Nombre del proyecto<input data-field="projectName" value="${escapeAttr(state.projectName)}"></label>
      <label class="field">Comuna<select data-field="comuna"><option>Concepción</option></select></label>
      <label class="field">Trámite<select data-field="tramite"><option>Regularización de ampliación de vivienda</option></select></label>
      <label class="field wide">Motivo del encargo<select data-field="motivo"><option ${state.motivo.startsWith("Venta") ? "selected" : ""}>Venta con crédito hipotecario</option><option ${state.motivo === "Otro" ? "selected" : ""}>Otro</option></select></label>
      <label class="field switch"><span><strong>Condominio</strong><small>Si está activo, el análisis pide autorización de copropietarios.</small></span><input data-field="condominio" type="checkbox" ${state.condominio ? "checked" : ""}></label>
      <label class="field switch"><span><strong>Supera el porcentaje de adosamiento</strong><small>Si está activo, el análisis pide la autorización del vecino.</small></span><input data-field="adosamiento" type="checkbox" ${state.adosamiento ? "checked" : ""}></label>
      <div class="field wide"><strong>Certificado que corresponde</strong><div class="choice-row"><button type="button" data-action="cert" data-value="ine" aria-pressed="${state.certificado === "ine"}">Formulario INE</button><button type="button" data-action="cert" data-value="seim" aria-pressed="${state.certificado === "seim"}">Certificado SEIM</button></div></div>
    </form>`;
}

function screenAnalysis() {
  if (state.analyzing) {
    return `<header class="page-head"><div><h1>Análisis</h1><p class="intro">Cruzando los archivos cargados con la ficha del proyecto.</p></div></header><section class="working"><h2>Revisando el expediente…</h2><p class="help">Esto es una espera simulada. Expedita no abre los PDF ni interpreta el plano.</p></section>`;
  }
  if (!state.analyzed) {
    return `<header class="page-head"><div><h1>Análisis</h1><p class="intro">Cuando el expediente y la ficha están listos, Expedita marca qué falta, qué está y qué no aplica.</p></div><button class="btn btn-primary" type="button" data-action="analyze">Analizar expediente</button></header><section class="working"><h2>${escapeText(state.projectName)}</h2><p class="help">${escapeText(state.tramite)} · ${escapeText(state.comuna)} · ${escapeText(state.motivo)}</p></section>`;
  }
  const items = findings();
  const { pending, ready, skipped } = counts(items);
  const rows = items.map((item) => `<article class="finding"><div class="doc" style="padding:0;border:0;background:transparent"><div><strong>${item.title}</strong><p>${item.detail}</p></div><span class="pill ${item.status}">${statusLabel(item.status)}</span></div></article>`).join("");
  return `<header class="page-head"><div><h1>Análisis</h1><p class="intro">Resultado del cruce entre archivos y configuración. Si cambias un documento o la ficha, hay que analizar de nuevo.</p></div><button class="btn btn-ghost" type="button" data-action="analyze">Volver a analizar</button></header>
    <div class="summary"><article><strong>${pending.length}</strong><span>Pendientes</span></article><article><strong>${ready.length}</strong><span>Listos</span></article><article><strong>${skipped.length}</strong><span>No aplican</span></article></div>
    <div class="findings">${rows}</div>`;
}

function screenReport() {
  if (!state.analyzed) {
    return `<header class="page-head"><div><h1>Reporte</h1><p class="intro">El reporte sale del último análisis.</p></div><button class="btn btn-primary" type="button" data-action="goto" data-screen="4">Ir al análisis</button></header>`;
  }
  const items = findings();
  const { pending, ready, skipped } = counts(items);
  const blocked = pending.length > 0;
  const banner = blocked
    ? `<div class="alert"><span class="label">Recomendación</span><h2>No ingresar todavía</h2><p class="help">${ready.length + skipped.length} requisitos listos o que no aplican, ${pending.length} pendientes. Si ingresas hoy, el expediente puede volver por documentos o por formato. Expedita no asegura la aprobación de la DOM.</p></div>`
    : `<div class="alert ok"><span class="label">Recomendación</span><h2>Listo para una revisión final</h2><p class="help">El cruce documental no tiene pendientes. La DOM sigue siendo quien resuelve el ingreso. Expedita no asegura la aprobación.</p></div>`;
  const fixes = pending.map((item, index) => `<article class="fix"><strong>${index + 1}. ${item.title}</strong><p>Acción: ${item.action}</p><p>Para la familia: «${item.family}»</p></article>`).join("");
  return `<header class="page-head"><div><h1>Reporte de estado</h1><p class="intro">${escapeText(state.projectName)} · ${escapeText(state.comuna)}</p></div></header>
    <div class="report">${banner}<aside class="side-card"><button class="btn btn-primary" type="button" data-action="export">Exportar resumen</button><button class="btn btn-ghost" type="button" data-action="goto" data-screen="2">Volver a los documentos</button><p class="hint">La exportación es una vista previa. No genera un archivo.</p></aside></div>
    ${fixes ? `<div class="fixes">${fixes}</div>` : ""}`;
}

function escapeText(value) {
  return String(value).replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char]));
}
function escapeAttr(value) {
  return escapeText(value).replace(/"/g, "&quot;");
}

function render() {
  const screens = { 1: screenLogin, 2: screenDocs, 3: screenProject, 4: screenAnalysis, 5: screenReport };
  document.body.classList.toggle("logged-out", !state.loggedIn);
  workspace.innerHTML = (screens[state.loggedIn ? state.screen : 1] || screenLogin)();
  steps.innerHTML = STEPS.map((step) => `<button type="button" data-action="goto" data-screen="${step.id}" ${step.id === state.screen ? 'aria-current="true"' : ""}>${step.name}</button>`).join("");
  crumb.textContent = state.loggedIn ? state.projectName : "Concepción";
  nextButton.hidden = !state.loggedIn;
  logoutButton.hidden = !state.loggedIn;
  nextButton.disabled = !state.loggedIn || state.screen >= 5;
}

function invalidate() {
  state.analyzed = false;
  state.analyzing = false;
}

document.body.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "goto") state.screen = Number(target.dataset.screen);
  if (action === "next" && state.screen < 5) state.screen += 1;
  if (action === "login") {
    state.loggedIn = true;
    state.screen = 2;
  }
  if (action === "logout") {
    state.loggedIn = false;
    state.screen = 1;
  }
  if (action === "attach") {
    state.files[target.dataset.id].uploaded = true;
    if (target.dataset.id === "plano") state.files.plano.formatOk = false;
    invalidate();
  }
  if (action === "detach") {
    state.files[target.dataset.id].uploaded = false;
    invalidate();
  }
  if (action === "fix-format") {
    state.files.plano.formatOk = true;
    invalidate();
  }
  if (action === "cert") {
    state.certificado = target.dataset.value;
    invalidate();
  }
  if (action === "analyze") {
    state.analyzing = true;
    render();
    window.setTimeout(() => {
      state.analyzing = false;
      state.analyzed = true;
      render();
    }, 800);
    return;
  }
  if (action === "export") {
    const items = findings();
    const { pending } = counts(items);
    exportBody.innerHTML = `<p class="help">${escapeText(state.projectName)}. ${escapeText(state.comuna)}. ${pending.length ? "Recomendación: no ingresar todavía." : "Recomendación: revisión final antes de ingresar."}</p><ul class="export-list">${items.map((item) => `<li><strong>${item.title}:</strong> ${statusLabel(item.status)}</li>`).join("")}</ul><p class="hint">Exportación simulada.</p>`;
    dialog.showModal();
    return;
  }
  render();
});

document.body.addEventListener("submit", (event) => {
  if (event.target.id !== "login-form") return;
  event.preventDefault();
  state.loggedIn = true;
  state.screen = 2;
  render();
});

document.body.addEventListener("input", (event) => {
  const field = event.target.closest("[data-field]");
  if (!field || field.type === "checkbox") return;
  state[field.dataset.field] = field.value;
  crumb.textContent = state.projectName || "Proyecto sin nombre";
});

document.body.addEventListener("change", (event) => {
  const field = event.target.closest("[data-field]");
  if (!field) return;
  state[field.dataset.field] = field.type === "checkbox" ? field.checked : field.value;
  invalidate();
  render();
});

render();
