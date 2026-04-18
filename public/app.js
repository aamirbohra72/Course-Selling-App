const api = (path, opts = {}) =>
  fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...opts.headers,
    },
    ...opts,
    body: opts.body && typeof opts.body !== "string" ? JSON.stringify(opts.body) : opts.body,
  });

function showToast(message, isError = false) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.remove("hidden", "error");
  if (isError) el.classList.add("error");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add("hidden"), 4200);
}

async function parseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const state = {
  userToken: sessionStorage.getItem("userToken"),
  adminToken: sessionStorage.getItem("adminToken"),
  user: JSON.parse(sessionStorage.getItem("user") || "null"),
  admin: JSON.parse(sessionStorage.getItem("admin") || "null"),
  courseAccess: new Set(),
};

function centsToUsd(cents) {
  return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function usdToCents(usd) {
  return Math.round(Number(usd) * 100);
}

function setView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  const view = document.getElementById(`view-${name}`);
  if (view) view.classList.add("active");
  const btn = document.querySelector(`[data-view="${name}"]`);
  if (btn) btn.classList.add("active");

  if (name === "catalog") loadCatalog();
  if (name === "library") loadLibrary();
  if (name === "admin") refreshAdminUi();
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

function refreshSessionBars() {
  const u = document.getElementById("user-session");
  const a = document.getElementById("admin-session");
  u.textContent = state.user
    ? `Signed in as ${state.user.name} (${state.user.email}) · Sign out available via clearing session`
    : "No student session.";
  a.textContent = state.admin
    ? `Signed in as ${state.admin.name} (${state.admin.email})`
    : "No admin session.";
}

function persistUserSession(user, token) {
  state.user = user;
  state.userToken = token;
  sessionStorage.setItem("user", JSON.stringify(user));
  sessionStorage.setItem("userToken", token);
  refreshSessionBars();
}

function persistAdminSession(admin, token) {
  state.admin = admin;
  state.adminToken = token;
  sessionStorage.setItem("admin", JSON.stringify(admin));
  sessionStorage.setItem("adminToken", token);
  refreshSessionBars();
}

document.getElementById("form-user-signup").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = {
    name: String(fd.get("name")),
    email: String(fd.get("email")),
    password: String(fd.get("password")),
  };
  const res = await api("/api/users/signup", { method: "POST", body });
  const data = await parseJson(res);
  if (!res.ok) {
    showToast(data?.error || "Signup failed", true);
    return;
  }
  persistUserSession(data.user, data.token);
  await refreshCourseAccess();
  showToast("Student account created.");
  setView("library");
});

document.getElementById("form-user-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = { email: String(fd.get("email")), password: String(fd.get("password")) };
  const res = await api("/api/users/login", { method: "POST", body });
  const data = await parseJson(res);
  if (!res.ok) {
    showToast(data?.error || "Login failed", true);
    return;
  }
  persistUserSession(data.user, data.token);
  await refreshCourseAccess();
  showToast("Welcome back.");
  setView("library");
});

document.getElementById("form-admin-signup").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = {
    name: String(fd.get("name")),
    email: String(fd.get("email")),
    password: String(fd.get("password")),
  };
  const res = await api("/api/admin/signup", { method: "POST", body });
  const data = await parseJson(res);
  if (!res.ok) {
    showToast(data?.error || "Admin signup failed", true);
    return;
  }
  persistAdminSession(data.admin, data.token);
  showToast("Admin created.");
  refreshAdminUi();
});

document.getElementById("form-admin-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = { email: String(fd.get("email")), password: String(fd.get("password")) };
  const res = await api("/api/admin/login", { method: "POST", body });
  const data = await parseJson(res);
  if (!res.ok) {
    showToast(data?.error || "Admin login failed", true);
    return;
  }
  persistAdminSession(data.admin, data.token);
  showToast("Admin session started.");
  refreshAdminUi();
});

document.getElementById("form-course-create").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.adminToken) {
    showToast("Admin sign in required.", true);
    return;
  }
  const fd = new FormData(e.target);
  const imageUrlRaw = String(fd.get("imageUrl") || "").trim();
  const body = {
    title: String(fd.get("title")),
    description: String(fd.get("description")),
    priceCents: usdToCents(fd.get("priceUsd")),
    imageUrl: imageUrlRaw || null,
  };
  const res = await api("/api/admin/courses", {
    method: "POST",
    body,
    token: state.adminToken,
  });
  const data = await parseJson(res);
  if (!res.ok) {
    showToast(data?.error || "Could not create course", true);
    return;
  }
  e.target.reset();
  showToast("Course published.");
  loadAdminCourses();
  loadCatalog();
});

async function refreshCourseAccess() {
  state.courseAccess = new Set();
  if (!state.userToken) return;
  const res = await api("/api/users/me/course-access", { token: state.userToken });
  const data = await parseJson(res);
  if (res.ok && data?.courseIds) {
    data.courseIds.forEach((id) => state.courseAccess.add(id));
  }
}

async function loadCatalog() {
  if (state.userToken) await refreshCourseAccess();
  const grid = document.getElementById("course-grid");
  const empty = document.getElementById("catalog-empty");
  grid.innerHTML = "";
  const res = await api("/api/users/courses");
  const data = await parseJson(res);
  if (!res.ok) {
    showToast(data?.error || "Failed to load catalog", true);
    return;
  }
  const courses = data.courses || [];
  empty.classList.toggle("hidden", courses.length > 0);
  for (const c of courses) {
    const card = document.createElement("article");
    card.className = "course-card";
    const owned = state.courseAccess.has(c.id);
    card.innerHTML = `
      ${c.imageUrl ? `<img src="${encodeURI(c.imageUrl)}" alt="" loading="lazy" />` : ""}
      <div>
        ${owned ? '<span class="badge">Owned</span>' : ""}
        <h3>${escapeHtml(c.title)}</h3>
        <p class="muted small">${escapeHtml(truncate(c.description, 140))}</p>
        <p class="price">${centsToUsd(c.priceCents)}</p>
      </div>
      <div class="row-actions">
        <button type="button" class="ghost purchase" data-id="${c.id}" ${owned ? "disabled" : ""}>
          ${owned ? "Purchased" : "Purchase"}
        </button>
      </div>
    `;
    const btn = card.querySelector(".purchase");
    btn.addEventListener("click", () => purchaseCourse(c.id, btn));
    grid.appendChild(card);
  }
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(s, n) {
  if (s.length <= n) return s;
  return `${s.slice(0, n)}…`;
}

async function purchaseCourse(courseId, button) {
  if (!state.userToken) {
    showToast("Sign in as a student to purchase.", true);
    setView("user-auth");
    return;
  }
  button.disabled = true;
  const res = await api(`/api/users/courses/${courseId}/purchase`, {
    method: "POST",
    token: state.userToken,
  });
  const data = await parseJson(res);
  if (!res.ok) {
    showToast(data?.error || "Purchase failed", true);
    button.disabled = false;
    return;
  }
  state.courseAccess.add(courseId);
  showToast("Purchase complete.");
  loadCatalog();
  loadLibrary();
}

async function loadLibrary() {
  const list = document.getElementById("library-list");
  const hint = document.getElementById("library-hint");
  list.innerHTML = "";
  if (!state.userToken) {
    hint.classList.remove("hidden");
    return;
  }
  hint.classList.add("hidden");
  const res = await api("/api/users/me/purchases", { token: state.userToken });
  const data = await parseJson(res);
  if (!res.ok) {
    showToast(data?.error || "Could not load purchases", true);
    return;
  }
  const rows = data.purchases || [];
  if (!rows.length) {
    list.innerHTML = '<p class="muted">No purchases yet. Browse the catalog.</p>';
    return;
  }
  for (const row of rows) {
    const c = row.course;
    const el = document.createElement("div");
    el.className = "course-card";
    el.innerHTML = `
      ${c.imageUrl ? `<img src="${encodeURI(c.imageUrl)}" alt="" loading="lazy" />` : ""}
      <h3>${escapeHtml(c.title)}</h3>
      <p class="muted small">${escapeHtml(truncate(c.description, 200))}</p>
      <p class="muted small">Purchased ${new Date(row.purchasedAt).toLocaleString()}</p>
    `;
    list.appendChild(el);
  }
}

function refreshAdminUi() {
  const tools = document.getElementById("admin-tools");
  tools.classList.toggle("hidden", !state.adminToken);
  refreshSessionBars();
  if (state.adminToken) loadAdminCourses();
}

async function loadAdminCourses() {
  const host = document.getElementById("admin-course-list");
  host.innerHTML = "";
  const res = await api("/api/admin/courses", { token: state.adminToken });
  const data = await parseJson(res);
  if (!res.ok) {
    host.innerHTML = `<p class="muted">${data?.error || "Failed to load"}</p>`;
    return;
  }
  const courses = data.courses || [];
  if (!courses.length) {
    host.innerHTML = '<p class="muted">No courses yet.</p>';
    return;
  }
  for (const c of courses) {
    const wrap = document.createElement("div");
    wrap.className = "admin-item";
    const priceUsd = (c.priceCents / 100).toFixed(2);
    wrap.innerHTML = `
      <h4>${escapeHtml(c.title)}</h4>
      <p class="muted small">${escapeHtml(truncate(c.description, 120))} · ${centsToUsd(c.priceCents)}</p>
      <div class="row-actions">
        <button type="button" class="ghost edit-btn">Edit</button>
        <button type="button" class="ghost danger del-btn">Delete</button>
      </div>
      <div class="edit-panel hidden" style="margin-top:0.75rem"></div>
    `;
    wrap.querySelector(".del-btn").addEventListener("click", async () => {
      if (!confirm("Delete this course?")) return;
      const dres = await api(`/api/admin/courses/${c.id}`, {
        method: "DELETE",
        token: state.adminToken,
      });
      if (!dres.ok) {
        const d = await parseJson(dres);
        showToast(d?.error || "Delete failed", true);
        return;
      }
      showToast("Course deleted.");
      loadAdminCourses();
      loadCatalog();
    });
    wrap.querySelector(".edit-btn").addEventListener("click", () => {
      const panel = wrap.querySelector(".edit-panel");
      const open = !panel.classList.contains("hidden");
      document.querySelectorAll(".edit-panel").forEach((p) => p.classList.add("hidden"));
      if (open) return;
      panel.classList.remove("hidden");
      panel.innerHTML = `
        <label class="muted" style="display:block;margin-bottom:0.35rem">Title
          <input class="edit-title" value="${escapeHtml(c.title)}" />
        </label>
        <label class="muted" style="display:block;margin-bottom:0.35rem">Description
          <textarea class="edit-desc" rows="3">${escapeHtml(c.description)}</textarea>
        </label>
        <label class="muted" style="display:block;margin-bottom:0.35rem">Price (USD)
          <input class="edit-price" type="number" step="0.01" min="0" value="${priceUsd}" />
        </label>
        <label class="muted" style="display:block;margin-bottom:0.35rem">Image URL
          <input class="edit-img" type="url" value="${c.imageUrl ? escapeHtml(c.imageUrl) : ""}" />
        </label>
        <button type="button" class="primary save-edit" style="margin-top:0.5rem">Save changes</button>
      `;
      panel.querySelector(".save-edit").addEventListener("click", async () => {
        const title = panel.querySelector(".edit-title").value.trim();
        const description = panel.querySelector(".edit-desc").value.trim();
        const priceCents = usdToCents(panel.querySelector(".edit-price").value);
        const imageUrlRaw = panel.querySelector(".edit-img").value.trim();
        const body = {
          title,
          description,
          priceCents,
          imageUrl: imageUrlRaw || null,
        };
        const pres = await api(`/api/admin/courses/${c.id}`, {
          method: "PUT",
          body,
          token: state.adminToken,
        });
        const pd = await parseJson(pres);
        if (!pres.ok) {
          showToast(pd?.error || "Update failed", true);
          return;
        }
        showToast("Course updated.");
        panel.classList.add("hidden");
        loadAdminCourses();
        loadCatalog();
      });
    });
    host.appendChild(wrap);
  }
}

refreshSessionBars();
refreshCourseAccess().then(() => {
  loadCatalog();
});
refreshAdminUi();
