const api = {
  async request(path, options = {}) {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(path, { ...options, headers });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || "Error inesperado");
    }
    if (response.status === 204) {
      return null;
    }
    return response.json();
  },
};

const state = {
  courses: [],
  editing: null,
  authMode: "login",
  catalog: [],
  catalogLookup: {},
  prereqCache: {},
};

const LOCAL_KEY = "localCourses";

const listEl = document.getElementById("course-list");
const emptyEl = document.getElementById("empty-state");
const courseModal = document.getElementById("course-modal");
const courseOpen = document.getElementById("course-open");
const courseClose = document.getElementById("course-close");
const courseForm = document.getElementById("course-form");
const catalogSelect = document.getElementById("catalog-select");

const authModal = document.getElementById("auth-modal");
const authOpen = document.getElementById("login-open");
const registerOpen = document.getElementById("register-open");
const authClose = document.getElementById("auth-close");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubmit = document.getElementById("auth-submit");
const authHelper = document.getElementById("auth-helper");

const toast = document.getElementById("toast");
const statPlanned = document.getElementById("stat-planned");
const statActive = document.getElementById("stat-active");
const statDone = document.getElementById("stat-done");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function openModal(el) {
  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");
}

function closeModal(el) {
  el.classList.remove("open");
  el.setAttribute("aria-hidden", "true");
}

function statusLabel(status) {
  if (status === "active") return "En curso";
  if (status === "done") return "Aprobada";
  if (status === "failed") return "Desaprobada";
  if (status === "dropped") return "Abandonada";
  return "Planificada";
}

function pillClass(status) {
  if (status === "active") return "pill active";
  if (status === "done") return "pill done";
  if (status === "failed") return "pill failed";
  if (status === "dropped") return "pill dropped";
  return "pill";
}

function renderCourses() {
  listEl.innerHTML = "";
  if (state.courses.length === 0) {
    emptyEl.style.display = "block";
    listEl.appendChild(emptyEl);
  } else {
    emptyEl.style.display = "none";
    state.courses.forEach((course) => {
      const prereqs = course.prereqs || [];
      const blocked = prereqs.some(
        (item) => item.status === "planned" || item.status === "failed" || item.status === "dropped"
      );
      const progressLabel = prereqs.length > 0 ? "Correlativas" : "Sin correlativas";
      const card = document.createElement("div");
      card.className = blocked ? "course-card locked" : "course-card";
      const header = document.createElement("div");
      header.className = "course-header";
      header.innerHTML = `
        <div>
          <strong>${course.name}</strong>
          <div class="course-meta">${course.code || ""} ${course.term || ""}</div>
        </div>
        <span class="${pillClass(course.status)}">${statusLabel(course.status)}</span>
      `;
      const notes = document.createElement("div");
      notes.className = "course-meta";
      notes.textContent = course.notes || "Sin notas";

      const progress = document.createElement("div");
      progress.className = "progress-wrap";
      const segments = prereqs.length > 0 ? prereqs : [{ status: "planned" }];
      const segmentHtml = segments
        .map((item, index) =>
          `<span class="status-${item.status}" style="animation-delay: ${
            index * 0.1
          }s"></span>`
        )
        .join("");
      const tooltipLines = prereqs.length
        ? prereqs
            .map(
              (item) =>
                `${item.code} ${item.name} - ${statusLabel(item.status)}`
            )
            .join("<br/>")
        : "No tiene correlativas anteriores.";
      progress.innerHTML = `
        <div class="progress-label">${progressLabel}</div>
        <div class="tooltip">
          <div class="progress-bar">${segmentHtml}</div>
          <div class="tooltip-content">${tooltipLines}</div>
        </div>
      `;

      if (blocked) {
        const banner = document.createElement("div");
        banner.className = "lock-banner";
        banner.textContent = "Bloqueada por correlativas";
        card.appendChild(banner);
      }

      const actions = document.createElement("div");
      actions.className = "course-meta";
      actions.innerHTML = `
        <button class="ghost" data-action="cycle" data-id="${course.id}">Cambiar estado</button>
        <button class="ghost" data-action="edit" data-id="${course.id}">Editar</button>
        <button class="ghost" data-action="delete" data-id="${course.id}">Eliminar</button>
      `;

      card.appendChild(header);
      card.appendChild(progress);
      card.appendChild(notes);
      card.appendChild(actions);
      listEl.appendChild(card);
    });
  }

  const planned = state.courses.filter((c) => c.status === "planned").length;
  const active = state.courses.filter((c) => c.status === "active").length;
  const done = state.courses.filter((c) => c.status === "done").length;
  statPlanned.textContent = planned;
  statActive.textContent = active;
  statDone.textContent = done;
}

function setCatalogOptions(catalog) {
  if (!catalogSelect) return;
  catalogSelect.innerHTML = "";
  catalog.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = `${course.code} - ${course.name}`;
    catalogSelect.appendChild(option);
  });
}

function getLocalCourses() {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function setLocalCourses(courses) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(courses));
}

function hasToken() {
  return Boolean(localStorage.getItem("token"));
}

function nextStatus(status) {
  if (status === "planned") return "active";
  if (status === "active") return "done";
  if (status === "done") return "failed";
  if (status === "failed") return "dropped";
  return "planned";
}

async function loadCourses() {
  try {
    if (!hasToken()) {
      if (state.catalog.length === 0) {
        await loadCatalog();
      }
      const localCourses = getLocalCourses();
      const localStatusLookup = Object.fromEntries(
        localCourses.map((course) => [course.catalogId, course.status])
      );
      state.courses = await Promise.all(
        localCourses.map(async (course) => {
          const catalog = state.catalogLookup[course.catalogId];
          const prereqs = await getPrereqs(course.catalogId, localStatusLookup);
          return {
            ...course,
            name: catalog ? catalog.name : course.name,
            code: catalog ? catalog.code : course.code,
            term: course.term || (catalog ? catalog.term : ""),
            prereqs,
          };
        })
      );
      setLocalCourses(state.courses);
      renderCourses();
      return;
    }
    const response = await api.request("/api/courses");
    state.courses = response.map((item) => ({
      id: item.id,
      name: item.catalog_course.name,
      code: item.catalog_course.code,
      year: item.catalog_course.year,
      catalogId: item.catalog_course.id,
      status: item.status,
      term: item.term || item.catalog_course.term,
      notes: item.notes,
      prereqs: (item.prereqs || []).map((prereq) => ({
        ...prereq,
        status: prereq.status || "planned",
      })),
    }));
    renderCourses();
  } catch (err) {
    if (!hasToken()) {
      state.courses = getLocalCourses();
    }
    renderCourses();
  }
}

async function loadCatalog() {
  try {
    const catalog = await api.request("/api/catalog");
    state.catalog = catalog;
    state.catalogLookup = Object.fromEntries(
      catalog.map((course) => [course.id, course])
    );
    setCatalogOptions(catalog);
  } catch (err) {
    state.catalog = [];
    state.catalogLookup = {};
    if (catalogSelect) {
      catalogSelect.innerHTML = "";
    }
  }
}

async function getPrereqs(catalogId, localStatusLookup = {}) {
  if (!catalogId) return [];
  if (state.prereqCache[catalogId]) {
    return state.prereqCache[catalogId].map((item) => ({
      ...item,
      status: localStatusLookup[item.id] || item.status || "planned",
    }));
  }
  try {
    const prereqs = await api.request(`/api/catalog/${catalogId}/prereqs`);
    const normalized = prereqs.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      status: localStatusLookup[item.id] || "planned",
    }));
    state.prereqCache[catalogId] = normalized;
    return normalized;
  } catch (err) {
    return [];
  }
}

function setAuthMode(mode) {
  state.authMode = mode;
  authTitle.textContent = mode === "login" ? "Ingresar" : "Crear cuenta";
  authSubmit.textContent = mode === "login" ? "Ingresar" : "Registrarme";
  authHelper.textContent =
    mode === "login"
      ? "Usá tu cuenta para guardar y sincronizar cambios."
      : "Creá tu cuenta para guardar el progreso.";
}

courseOpen.addEventListener("click", () => {
  state.editing = null;
  courseForm.reset();
  openModal(courseModal);
});

courseClose.addEventListener("click", () => closeModal(courseModal));
authClose.addEventListener("click", () => closeModal(authModal));

authOpen.addEventListener("click", () => {
  setAuthMode("login");
  openModal(authModal);
});

registerOpen.addEventListener("click", () => {
  setAuthMode("register");
  openModal(authModal);
});

courseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(courseForm);
  const payload = {
    status: formData.get("status"),
    term: formData.get("term"),
    notes: formData.get("notes"),
  };
  try {
    if (!hasToken()) {
      if (state.editing) {
        state.courses = state.courses.map((course) =>
          course.id === state.editing
            ? { ...course, ...payload }
            : course
        );
        showToast("Materia actualizada (local)");
      } else {
        const selectedOption = catalogSelect.options[catalogSelect.selectedIndex];
        const selectedName = selectedOption.textContent.split(" - ").slice(1).join(" - ");
        const newCourse = {
          ...payload,
          id: Date.now(),
          catalogId: Number(formData.get("catalog_course_id")),
          name: selectedName,
          code: selectedOption.textContent.split(" - ")[0],
        };
        state.courses = [newCourse, ...state.courses];
        showToast("Materia creada (local)");
      }
      setLocalCourses(state.courses);
      closeModal(courseModal);
      await loadCourses();
      return;
    }
    if (state.editing) {
      await api.request(`/api/courses/${state.editing}`, {
        method: "PUT",
        body: JSON.stringify({
          status: payload.status,
          term: payload.term,
          notes: payload.notes,
        }),
      });
      showToast("Materia actualizada");
    } else {
      const catalogId = Number(formData.get("catalog_course_id"));
      await api.request("/api/courses", {
        method: "POST",
        body: JSON.stringify({
          catalog_course_id: catalogId,
          status: payload.status,
          term: payload.term,
          notes: payload.notes,
        }),
      });
      showToast("Materia creada");
    }
    closeModal(courseModal);
    await loadCourses();
  } catch (err) {
    showToast(err.message);
    if (err.message.includes("credentials")) {
      setAuthMode("login");
      openModal(authModal);
    }
  }
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(authForm);
  const payload = {
    email: formData.get("email"),
    password: formData.get("password"),
  };
  try {
    const response = await api.request(
      state.authMode === "login" ? "/api/login" : "/api/register",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    localStorage.setItem("token", response.access_token);
    closeModal(authModal);
    showToast("Sesion iniciada");
    if (getLocalCourses().length > 0) {
      const locals = getLocalCourses().filter((course) => course.catalogId);
      for (const course of locals) {
        await api.request("/api/courses", {
          method: "POST",
          body: JSON.stringify({
            catalog_course_id: course.catalogId || 0,
            status: course.status,
            term: course.term,
            notes: course.notes,
          }),
        });
      }
      setLocalCourses([]);
    }
    await loadCourses();
  } catch (err) {
    showToast(err.message);
  }
});

listEl.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  if (action === "edit") {
    const course = state.courses.find((c) => c.id === id);
    if (!course) return;
    state.editing = id;
    if (catalogSelect && course.catalogId) {
      catalogSelect.value = course.catalogId;
    }
    courseForm.status.value = course.status;
    courseForm.term.value = course.term;
    courseForm.notes.value = course.notes;
    openModal(courseModal);
  }
  if (action === "delete") {
    try {
      if (!hasToken()) {
        state.courses = state.courses.filter((course) => course.id !== id);
        setLocalCourses(state.courses);
        showToast("Materia eliminada (local)");
        await loadCourses();
        return;
      }
      await api.request(`/api/courses/${id}`, { method: "DELETE" });
      showToast("Materia eliminada");
      await loadCourses();
    } catch (err) {
      showToast(err.message);
    }
  }
  if (action === "cycle") {
    const course = state.courses.find((c) => c.id === id);
    if (!course) return;
    try {
      if (!hasToken()) {
        state.courses = state.courses.map((item) =>
          item.id === id ? { ...item, status: nextStatus(item.status) } : item
        );
        setLocalCourses(state.courses);
        await loadCourses();
        return;
      }
      await api.request(`/api/courses/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus(course.status) }),
      });
      await loadCourses();
    } catch (err) {
      showToast(err.message);
    }
  }
});

loadCatalog();
loadCourses();
