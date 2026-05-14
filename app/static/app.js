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

const STATUS_OPTIONS = [
  { value: "active", label: "Disponible", color: "#3b82f6" },
  { value: "in_progress", label: "En curso", color: "#f59e0b" },
  { value: "done", label: "Aprobada", color: "#16a34a" },
  { value: "adeuda_final", label: "Adeuda final", color: "#d946ef" },
  { value: "regular", label: "Regular", color: "#06b6d4" },
  { value: "planned", label: "Planeada", color: "#8b5cf6" },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s]));

const state = {
  courses: [],
  authMode: "login",
  catalog: [],
  catalogLookup: {},
  prereqCache: {},
  careers: [],
  careerSlugLookup: {},
  userStatuses: {},
  relations: {
    prereqsById: new Map(),
    dependentsById: new Map(),
  },
};

const listEl = document.getElementById("course-list");
const mapLines = document.getElementById("map-lines");
const emptyEl = document.getElementById("empty-state");

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
const themeToggle = document.getElementById("theme-toggle");
const careerSearch = document.getElementById("career-search");
const careerOptions = document.getElementById("career-options");
const careerGo = document.getElementById("career-go");
const mapSection = document.getElementById("map-section");
const homeSection = document.getElementById("home-section");
const mapCareer = document.getElementById("map-career");
const mapBack = document.getElementById("map-back");

applyTheme(localStorage.getItem("theme") || "light");

function loadUserStatuses() {
  try {
    const old = localStorage.getItem("completedCourses");
    if (old) {
      const ids = JSON.parse(old);
      if (Array.isArray(ids)) {
        const migrated = Object.fromEntries(ids.map((id) => [String(id), "done"]));
        localStorage.setItem("userStatuses", JSON.stringify(migrated));
        localStorage.removeItem("completedCourses");
        return migrated;
      }
    }
    const data = localStorage.getItem("userStatuses");
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveUserStatuses() {
  localStorage.setItem("userStatuses", JSON.stringify(state.userStatuses));
}

state.userStatuses = loadUserStatuses();

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
  return STATUS_MAP[status]?.label || status;
}

function renderCourses() {
  listEl.innerHTML = "";
  if (mapLines) {
    mapLines.innerHTML = "";
  }
  state.relations.prereqsById = new Map();
  state.relations.dependentsById = new Map();
  if (state.courses.length === 0) {
    emptyEl.style.display = "block";
    listEl.appendChild(emptyEl);
  } else {
    emptyEl.style.display = "none";
    const grouped = state.courses.reduce((acc, course) => {
      const year = course.year || "Sin anio";
      if (!acc[year]) acc[year] = [];
      acc[year].push(course);
      return acc;
    }, {});

    state.courses.forEach((course) => {
      const prereqIds = (course.prereqs || []).map((item) => item.id);
      state.relations.prereqsById.set(course.id, prereqIds);
      prereqIds.forEach((id) => {
        if (!state.relations.dependentsById.has(id)) {
          state.relations.dependentsById.set(id, []);
        }
        state.relations.dependentsById.get(id).push(course.id);
      });
    });

    Object.keys(grouped)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((year) => {
        const column = document.createElement("div");
        column.className = "year-column";
        const titleRow = document.createElement("div");
        titleRow.className = "year-header";
        const title = document.createElement("div");
        title.className = "year-title";
        title.textContent = formatYearLabel(year);
        const batchWrap = document.createElement("div");
        batchWrap.className = "year-batch-wrap";
        batchWrap.innerHTML = `
          <button class="year-batch" type="button">●</button>
          <div class="batch-menu">
            ${STATUS_OPTIONS.map(
              (opt) => `
              <button class="batch-option" data-value="${opt.value}">
                <span class="opt-dot" style="background:${opt.color}"></span>
                <span class="opt-label">${opt.label}</span>
              </button>
            `
            ).join("")}
          </div>
        `;
        batchWrap.querySelector(".year-batch").addEventListener("click", (event) => {
          event.stopPropagation();
          const menu = batchWrap.querySelector(".batch-menu");
          const isOpen = menu.classList.contains("open");
          closeAllDropdowns();
          if (!isOpen) menu.classList.add("open");
        });
        batchWrap.querySelectorAll(".batch-option").forEach((btn) => {
          btn.addEventListener("click", (event) => {
            event.stopPropagation();
            const status = btn.dataset.value;
            state.courses
              .filter((c) => String(c.year) === year)
              .forEach((c) => { state.userStatuses[c.id] = status; });
            saveUserStatuses();
            closeAllDropdowns();
            renderCourses();
            if (mapSection && mapSection.classList.contains("active")) {
              requestAnimationFrame(() => requestAnimationFrame(drawConnections));
            }
          });
        });
        titleRow.appendChild(title);
        titleRow.appendChild(batchWrap);
        column.appendChild(titleRow);
        const list = document.createElement("div");
        list.className = "year-list";

        grouped[year].forEach((course) => {
          const prereqs = course.prereqs || [];
          const completedPrereqs = prereqs.filter((item) =>
            state.userStatuses[item.id] === "done"
          ).length;
          const hasPrereqs = prereqs.length > 0;
          const status = getCourseStatus(course.id);
          const userStatus = state.userStatuses[course.id] || "active";
          const card = document.createElement("div");
          card.className = `course-card ${status}`.trim();
          card.dataset.courseId = course.id;
          card.dataset.status = status;
          card.innerHTML = `
            <div class="course-title">
              <strong>${course.name}</strong>
              <span class="course-chip">${course.term ? `Cuat. ${course.term}` : ""}</span>
            </div>
            <div class="course-meta">
              <span class="course-code">${course.code || ""}</span>
              <span class="course-term">${hasPrereqs ? `${completedPrereqs}/${prereqs.length} correlativas` : "Sin correlativas"}</span>
            </div>
            <div class="status-dropdown" data-course-id="${course.id}">
              ${STATUS_OPTIONS.map(
                (opt) => `
                <button class="status-option ${opt.value === userStatus ? " selected" : ""}" data-value="${opt.value}">
                  <span class="opt-dot" style="background:${opt.color}"></span>
                  <span class="opt-label">${opt.label}</span>
                </button>
              `
              ).join("")}
            </div>
          `;
          card.addEventListener("click", (event) => {
            const option = event.target.closest(".status-option");
            if (option) {
              event.stopPropagation();
              setUserStatus(course.id, option.dataset.value);
              return;
            }
            const dd = card.querySelector(".status-dropdown");
            const isOpen = dd?.classList.contains("open");
            closeAllDropdowns();
            if (!isOpen) dd?.classList.add("open");
          });
          card.addEventListener("mouseenter", () => highlightRelations(course.id));
          card.addEventListener("mouseleave", clearHighlights);
          card.addEventListener("focus", () => highlightRelations(course.id));
          card.addEventListener("blur", clearHighlights);
          list.appendChild(card);
        });

        column.appendChild(list);
        listEl.appendChild(column);
      });
  }

  const total = state.courses.length;
  const completed = Object.values(state.userStatuses).filter((s) => s === "done").length;
  const inProgress = Object.values(state.userStatuses).filter((s) => s === "in_progress").length;
  statPlanned.textContent = total;
  statActive.textContent = completed;
  statDone.textContent = inProgress;
}

function formatYearLabel(value) {
  const yearNumber = Number(value);
  if (!Number.isFinite(yearNumber) || yearNumber <= 0) {
    return String(value);
  }
  if (yearNumber === 1) return "1er año";
  if (yearNumber === 2) return "2do año";
  if (yearNumber === 3) return "3er año";
  return `${yearNumber}to año`;
}

function formatCareerLabel(career, university) {
  if (!career) return "";
  if (university) {
    return `${career} (${university})`;
  }
  return career;
}

function setCareerOptions(careers) {
  if (!careerOptions) return;
  careerOptions.innerHTML = "";
  careers.forEach((item) => {
    const option = document.createElement("option");
    option.value = formatCareerLabel(item.career, item.university);
    careerOptions.appendChild(option);
  });
}

function getCareerKey(item) {
  const career = item.career || "";
  const university = item.university || "";
  return `${career}||${university}`;
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getCareerSlug(career, university) {
  const base = `${career || ""} ${university || ""}`.trim();
  return slugify(base);
}

function getCareerSlugFromKey(key) {
  const [career, university] = key.split("||");
  return getCareerSlug(career, university);
}

function getCareerKeyFromLabel(label) {
  const trimmed = label.trim();
  if (!trimmed) return "";
  const withUniversity = trimmed.match(/^(.*)\s+\((.*)\)$/);
  if (withUniversity) {
    return `${withUniversity[1]}||${withUniversity[2]}`;
  }
  return `${trimmed}||`;
}

function getCareerLabelFromKey(key) {
  const [career, university] = key.split("||");
  return formatCareerLabel(career, university);
}

function hasToken() {
  return Boolean(localStorage.getItem("token"));
}

async function loadCatalog() {
  try {
    const catalog = await api.request("/api/catalog");
    state.catalog = catalog;
    state.catalogLookup = Object.fromEntries(
      catalog.map((course) => [course.id, course])
    );
    const careerMap = new Map();
    catalog.forEach((course) => {
      const key = getCareerKey(course);
      if (!careerMap.has(key)) {
        careerMap.set(key, {
          key,
          career: course.career || "",
          university: course.university || "",
        });
      }
    });
    const careers = Array.from(careerMap.values());
    state.careers = careers;
    state.careerSlugLookup = Object.fromEntries(
      careers.map((item) => [
        getCareerSlug(item.career, item.university),
        item.key,
      ])
    );
    setCareerOptions(careers);
  } catch (err) {
    state.catalog = [];
    state.catalogLookup = {};
    state.careers = [];
    state.careerSlugLookup = {};
    if (careerOptions) {
      careerOptions.innerHTML = "";
    }
  }
  openCareerFromUrl();
}

async function getPrereqs(catalogId) {
  if (!catalogId) return [];
  if (state.prereqCache[catalogId]) {
    return state.prereqCache[catalogId];
  }
  try {
    const prereqs = await api.request(`/api/catalog/${catalogId}/prereqs`);
    const normalized = prereqs.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      status: "done",
    }));
    state.prereqCache[catalogId] = normalized;
    return normalized;
  } catch (err) {
    return [];
  }
}

async function loadCareerMap(careerKey) {
  const filtered = state.catalog.filter(
    (course) => getCareerKey(course) === careerKey
  );
  const courses = await Promise.all(
    filtered.map(async (course) => {
      const prereqs = await getPrereqs(course.id);
      return {
        id: course.id,
        name: course.name,
        code: course.code,
        term: course.term,
        year: course.year,
        status: prereqs.length > 0 ? "done" : "failed",
        prereqs,
      };
    })
  );
  state.courses = courses;
  if (mapCareer) {
    mapCareer.textContent = getCareerLabelFromKey(careerKey);
  }
  renderCourses();
}

function getBasePath() {
  const path = window.location.pathname;
  return path.replace(/\/[^/]*$/, "/");
}

function updateCareerUrl(careerKey) {
  const slug = getCareerSlugFromKey(careerKey);
  if (!slug) return;
  const url = new URL(window.location.href);
  url.pathname = `${getBasePath()}career/${encodeURIComponent(slug)}`;
  url.search = "";
  window.history.pushState({ career: slug }, "", url.toString());
}

function resetCareerUrl() {
  const url = new URL(window.location.href);
  url.pathname = getBasePath();
  url.search = "";
  window.history.pushState({}, "", url.toString());
}

const careerLanding = document.getElementById("career-landing");
const careerGrid = document.getElementById("career-grid");

function showCareerLanding() {
  if (!careerLanding || !careerGrid) return;
  careerGrid.innerHTML = state.careers.map((item) => {
    const slug = getCareerSlug(item.career, item.university);
    return `
      <div class="career-card" data-slug="${slug}">
        <div class="career-card-name">${item.career}</div>
        <div class="career-card-univ">${item.university || ""}</div>
        <button class="primary career-card-go">Ver mapa</button>
      </div>
    `;
  }).join("");
  careerGrid.querySelectorAll(".career-card-go").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".career-card");
      const slug = card.dataset.slug;
      const careerKey = state.careerSlugLookup[slug];
      if (careerKey) {
        hideCareerLanding();
        const url = new URL(window.location.href);
        url.pathname = `${getBasePath()}career/${encodeURIComponent(slug)}`;
        url.search = "";
        window.history.pushState({ career: slug }, "", url.toString());
        loadCareerMap(careerKey);
        openMap();
      }
    });
  });
  careerLanding.classList.add("active");
  careerLanding.setAttribute("aria-hidden", "false");
  homeSection.style.display = "none";
}

function hideCareerLanding() {
  if (careerLanding) {
    careerLanding.classList.remove("active");
    careerLanding.setAttribute("aria-hidden", "true");
  }
}

function openCareerFromUrl() {
  if (isCareerLandingPath()) {
    closeMap();
    showCareerLanding();
    return;
  }
  const slug = getCareerSlugFromPath();
  if (!slug) return;
  const careerKey = state.careerSlugLookup[slug];
  if (!careerKey) {
    if (Object.keys(state.careerSlugLookup).length === 0) {
      showToast("No se pudieron cargar las carreras. Verificá tu conexión o iniciá sesión.");
    } else {
      showToast("Carrera no encontrada.");
    }
    return;
  }
  hideCareerLanding();
  loadCareerMap(careerKey);
  openMap();
}

function getCareerSlugFromPath() {
  const path = window.location.pathname.replace(/\/+$/, "");
  const match = path.match(/\/career\/([^/]+)$/);
  if (!match) return "";
  return decodeURIComponent(match[1] || "");
}

function isCareerLandingPath() {
  const path = window.location.pathname.replace(/\/+$/, "");
  return path === "/career" || path.endsWith("/career");
}

function isAllPrereqsDone(courseId) {
  const course = state.courses.find((c) => c.id === courseId);
  if (!course) return false;
  return (course.prereqs || []).every((p) => {
    const s = state.userStatuses[p.id];
    return s === "done" || s === "adeuda_final" || s === "regular";
  });
}

function getCourseStatus(courseId) {
  const userStatus = state.userStatuses[courseId];
  if (userStatus === "done") return "done";
  if (userStatus === "in_progress") return "in_progress";
  if (userStatus === "adeuda_final") return "adeuda_final";
  if (userStatus === "regular") return "regular";
  if (userStatus === "planned") return "planned";
  if (isAllPrereqsDone(courseId)) return "active";
  return "locked";
}

function drawConnections() {
  if (!mapLines) return;
  const svgRect = mapLines.getBoundingClientRect();
  const w = Math.round(svgRect.width);
  const h = Math.round(svgRect.height);
  if (!w || !h) return;
  mapLines.setAttribute("viewBox", `0 0 ${w} ${h}`);
  mapLines.innerHTML = "";
  const ox = Math.round(svgRect.left);
  const oy = Math.round(svgRect.top);
  const nodes = Array.from(listEl.querySelectorAll(".course-card"));
  const nodeMap = new Map(
    nodes.map((node) => [Number(node.dataset.courseId), node])
  );
  state.courses.forEach((course) => {
    const target = nodeMap.get(course.id);
    if (!target) return;
    const tr = target.getBoundingClientRect();
    const targetX = Math.round(tr.left - ox);
    const targetY = Math.round(tr.top + tr.height / 2 - oy);
    (course.prereqs || []).forEach((prereq) => {
      const source = nodeMap.get(prereq.id);
      if (!source) return;
      const sr = source.getBoundingClientRect();
      const sourceX = Math.round(sr.left + sr.width - ox);
      const sourceY = Math.round(sr.top + sr.height / 2 - oy);
      const dx = Math.max(30, Math.abs(targetX - sourceX) * 0.45);
      const d = `M ${sourceX} ${sourceY} C ${sourceX + dx} ${sourceY}, ${targetX - dx} ${targetY}, ${targetX} ${targetY}`;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      const sourceStatus = getCourseStatus(prereq.id);
      path.setAttribute("class", `connector conn-${sourceStatus}`);
      path.dataset.from = prereq.id;
      path.dataset.to = course.id;
      mapLines.appendChild(path);
    });
  });
}

function setUserStatus(courseId, status) {
  state.userStatuses[courseId] = status;
  saveUserStatuses();
  closeAllDropdowns();
  renderCourses();
  if (mapSection && mapSection.classList.contains("active")) {
    requestAnimationFrame(() => requestAnimationFrame(drawConnections));
  }
}

function closeAllDropdowns() {
  document.querySelectorAll(".status-dropdown.open").forEach((d) => d.classList.remove("open"));
}

function highlightRelations(courseId) {
  const nodes = Array.from(listEl.querySelectorAll(".course-card"));
  nodes.forEach((node) => node.classList.add("is-dimmed"));
  const active = listEl.querySelector(`[data-course-id="${courseId}"]`);
  if (active) active.classList.add("is-active");

  const prereqs = state.relations.prereqsById.get(courseId) || [];
  const dependents = state.relations.dependentsById.get(courseId) || [];
  prereqs.forEach((id) => {
    const node = listEl.querySelector(`[data-course-id="${id}"]`);
    if (node) node.classList.add("is-related");
  });
  dependents.forEach((id) => {
    const node = listEl.querySelector(`[data-course-id="${id}"]`);
    if (node) node.classList.add("is-related");
  });

  const paths = Array.from(mapLines.querySelectorAll("path.connector"));
  paths.forEach((path) => {
    const from = Number(path.dataset.from);
    const to = Number(path.dataset.to);
    if (from === courseId || to === courseId) {
      path.classList.add("is-highlighted");
    } else {
      path.classList.add("is-dimmed");
    }
  });
}

function clearHighlights() {
  const nodes = Array.from(listEl.querySelectorAll(".course-card"));
  nodes.forEach((node) =>
    node.classList.remove("is-dimmed", "is-active", "is-related")
  );
  const paths = Array.from(mapLines.querySelectorAll("path.connector"));
  paths.forEach((path) =>
    path.classList.remove("is-highlighted", "is-dimmed")
  );
}

function setAuthMode(mode) {
  state.authMode = mode;
  authTitle.textContent = mode === "login" ? "Ingresar" : "Crear cuenta";
  authSubmit.textContent = mode === "login" ? "Ingresar" : "Registrarme";
  authHelper.textContent =
    mode === "login"
      ? "Usa tu cuenta para guardar y sincronizar cambios."
      : "Crea tu cuenta para guardar el progreso.";
}

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("theme-dark");
    if (themeToggle) themeToggle.textContent = "Modo claro";
  } else {
    document.body.classList.remove("theme-dark");
    if (themeToggle) themeToggle.textContent = "Modo oscuro";
  }
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = localStorage.getItem("theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyTheme(next);
  });
}

if (careerSearch) {
  careerSearch.addEventListener("input", (event) => {
    const term = event.target.value.trim().toLowerCase();
    if (!term) {
      state.courses = [];
      renderCourses();
    }
  });
}

function openMap() {
  hideCareerLanding();
  if (mapSection) {
    mapSection.classList.add("active");
    mapSection.setAttribute("aria-hidden", "false");
  }
  if (homeSection) {
    homeSection.style.display = "none";
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
  requestAnimationFrame(() => requestAnimationFrame(drawConnections));
}

function closeMap() {
  if (mapSection) {
    mapSection.classList.remove("active");
    mapSection.setAttribute("aria-hidden", "true");
  }
  if (homeSection) {
    homeSection.style.display = "flex";
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getCareerKeyFromInput() {
  if (!careerSearch) return "";
  const key = getCareerKeyFromLabel(careerSearch.value || "");
  return key;
}

if (careerGo) {
  careerGo.addEventListener("click", () => {
    const key = getCareerKeyFromInput();
    if (!key) return;
    loadCareerMap(key);
    updateCareerUrl(key);
    openMap();
  });
}

if (careerSearch) {
  careerSearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const key = getCareerKeyFromInput();
      if (!key) return;
      loadCareerMap(key);
      updateCareerUrl(key);
      openMap();
    }
  });
}

if (mapBack) {
  mapBack.addEventListener("click", () => {
    resetCareerUrl();
    closeMap();
  });
}

window.addEventListener("resize", () => {
  if (state.courses.length > 0) {
    requestAnimationFrame(() => requestAnimationFrame(drawConnections));
  }
});

window.addEventListener("popstate", () => {
  if (isCareerLandingPath()) {
    closeMap();
    showCareerLanding();
    return;
  }
  const slug = getCareerSlugFromPath();
  if (slug && state.careerSlugLookup[slug]) {
    hideCareerLanding();
    loadCareerMap(state.careerSlugLookup[slug]);
    openMap();
  } else {
    closeMap();
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".status-dropdown, .course-card, .batch-menu, .year-batch")) {
    closeAllDropdowns();
  }
});

authClose.addEventListener("click", () => closeModal(authModal));

authOpen.addEventListener("click", () => {
  setAuthMode("login");
  openModal(authModal);
});

registerOpen.addEventListener("click", () => {
  setAuthMode("register");
  openModal(authModal);
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
  } catch (err) {
    showToast(err.message);
  }
});

loadCatalog();
renderCourses();
