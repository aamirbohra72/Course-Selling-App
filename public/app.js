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

const FX_INR_PER_USD = 83;

const PENDING_CHECKOUT_KEY = "pendingCheckoutCourseId";

const state = {
  userToken: sessionStorage.getItem("userToken"),
  adminToken: sessionStorage.getItem("adminToken"),
  user: JSON.parse(sessionStorage.getItem("user") || "null"),
  admin: JSON.parse(sessionStorage.getItem("admin") || "null"),
  courseAccess: new Set(),
  catalogCourses: [],
  catalogSearch: "",
  catalogScrollTarget: "top",
  displayCurrency: sessionStorage.getItem("displayCurrency") || "INR",
  checkoutCourseId: null,
  checkoutCourse: null,
  checkoutAppliedCoupon: null,
};

function centsToUsd(cents) {
  return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatDisplayPrice(cents) {
  const usd = cents / 100;
  if (state.displayCurrency === "INR") {
    const inr = usd * FX_INR_PER_USD;
    return inr.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  }
  return usd.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

/** Subtotal in checkout display units: whole INR, or USD cents. */
function usdCentsToCheckoutSubtotal(priceCents) {
  if (state.displayCurrency === "INR") {
    return Math.round((priceCents / 100) * FX_INR_PER_USD);
  }
  return priceCents;
}

function formatCheckoutAmount(displayUnits) {
  if (state.displayCurrency === "INR") {
    return displayUnits.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  }
  return (displayUnits / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

/**
 * @returns {number | null} discount in same units as subtotal, or null if code invalid
 */
function discountForCoupon(subtotal, codeRaw) {
  const code = String(codeRaw || "")
    .trim()
    .toUpperCase();
  if (!code) return null;
  if (code === "SAVE10") return Math.round(subtotal * 0.1);
  if (code === "WELCOME500") {
    if (state.displayCurrency === "INR") return Math.min(500, subtotal);
    return Math.min(500, subtotal);
  }
  return null;
}

function usdToCents(usd) {
  return Math.round(Number(usd) * 100);
}

function updateHeaderNavForView(name) {
  document.querySelectorAll(".header-nav .nav-link").forEach((b) => b.classList.remove("active"));
  if (name === "catalog") {
    const target = state.catalogScrollTarget === "courses" ? "courses" : "top";
    document.querySelector(`.header-nav [data-scroll="${target}"]`)?.classList.add("active");
  } else if (name === "library") {
    document.querySelector('.header-nav [data-view="library"]')?.classList.add("active");
  }
}

function syncCurrencySelects() {
  const v = state.displayCurrency;
  if (currencySelect) currencySelect.value = v;
  const c1 = document.getElementById("checkout-currency");
  const c2 = document.getElementById("checkout-currency-bottom");
  if (c1) c1.value = v;
  if (c2) c2.value = v;
}

function updateAvatar() {
  const el = document.getElementById("header-avatar");
  if (!el) return;
  const name = state.user?.name || state.admin?.name;
  el.textContent = name?.trim() ? name.trim().charAt(0).toUpperCase() : "A";
}

function setView(name, opts = {}) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  const view = document.getElementById(`view-${name}`);
  if (view) view.classList.add("active");

  if (name === "catalog" && opts.scroll) {
    state.catalogScrollTarget = opts.scroll;
  }

  if (name === "catalog" && opts.scroll === "courses") {
    requestAnimationFrame(() =>
      document.getElementById("courses-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }
  if (name === "catalog" && opts.scroll === "top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  updateHeaderNavForView(name);
  syncCurrencySelects();

  if (name === "catalog") loadCatalog();
  if (name === "library") loadLibrary();
  if (name === "admin") refreshAdminUi();
  if (name === "checkout") {
    window.scrollTo(0, 0);
    void renderCheckout();
  }
}

document.querySelectorAll(".js-nav").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const view = btn.dataset.view;
    const scroll = btn.dataset.scroll;
    if (!view) return;
    setView(view, { scroll });
  });
});

const currencySelect = document.getElementById("currency-select");
function onCurrencyChange(sourceEl) {
  state.displayCurrency = sourceEl.value;
  sessionStorage.setItem("displayCurrency", state.displayCurrency);
  syncCurrencySelects();
  renderCatalogFromState();
  if (document.getElementById("view-library")?.classList.contains("active")) loadLibrary();
  if (document.getElementById("view-checkout")?.classList.contains("active")) updateCheckoutPricing();
}
if (currencySelect) {
  currencySelect.value = state.displayCurrency;
  currencySelect.addEventListener("change", () => onCurrencyChange(currencySelect));
}

function bindCheckoutPage() {
  const backBtns = document.querySelectorAll(".js-back-catalog");
  backBtns.forEach((b) =>
    b.addEventListener("click", () => setView("catalog", { scroll: "courses" })),
  );

  const c1 = document.getElementById("checkout-currency");
  const c2 = document.getElementById("checkout-currency-bottom");
  [c1, c2].forEach((el) => {
    if (!el) return;
    el.addEventListener("change", () => onCurrencyChange(el));
  });

  document.getElementById("checkout-coupon-apply")?.addEventListener("click", applyCheckoutCoupon);

  document.getElementById("checkout-toggle-coupons")?.addEventListener("click", (e) => {
    e.preventDefault();
    const det = document.querySelector(".checkout-coupons-hint");
    if (det) det.open = true;
  });

  document.getElementById("checkout-buy-now")?.addEventListener("click", completeCheckoutPurchase);
  document.getElementById("checkout-pay-crypto")?.addEventListener("click", () => {
    showToast("Crypto checkout is not connected in this demo.", true);
  });
}
bindCheckoutPage();

const searchInput = document.getElementById("catalog-search");
if (searchInput) {
  searchInput.value = state.catalogSearch;
  searchInput.addEventListener("input", () => {
    state.catalogSearch = searchInput.value.trim().toLowerCase();
    renderCatalogFromState();
  });
}

function refreshSessionBars() {
  const u = document.getElementById("user-session");
  const a = document.getElementById("admin-session");
  if (u)
    u.textContent = state.user
      ? `Signed in as ${state.user.name} (${state.user.email}) · Sign out available via clearing session`
      : "No student session.";
  if (a)
    a.textContent = state.admin
      ? `Signed in as ${state.admin.name} (${state.admin.email})`
      : "No admin session.";
  updateAvatar();
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
  await maybeResumeCheckout();
  if (!document.getElementById("view-checkout")?.classList.contains("active")) setView("library");
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
  await maybeResumeCheckout();
  if (!document.getElementById("view-checkout")?.classList.contains("active")) setView("library");
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

function filterCourses(courses, q) {
  if (!q) return courses;
  return courses.filter((c) => {
    const t = `${c.title} ${c.description}`.toLowerCase();
    return t.includes(q);
  });
}

function renderCatalogFromState() {
  const grid = document.getElementById("course-grid");
  const empty = document.getElementById("catalog-empty");
  if (!grid || !empty) return;

  const q = state.catalogSearch;
  const courses = filterCourses(state.catalogCourses, q);
  grid.innerHTML = "";
  empty.classList.toggle("hidden", courses.length > 0);
  if (!courses.length) {
    empty.textContent =
      state.catalogCourses.length && q
        ? "No courses match your search."
        : "No courses yet. Admins can publish from the Admin tab.";
  }

  for (const c of courses) {
    const card = document.createElement("article");
    card.className = "market-card";
    const owned = state.courseAccess.has(c.id);
    const media = c.imageUrl
      ? `<div class="market-card-media"><img src="${encodeURI(c.imageUrl)}" alt="" loading="lazy" /></div>`
      : `<div class="market-card-media" role="img" aria-label="Course visual"></div>`;

    card.innerHTML = `
      ${media}
      <div class="market-card-body">
        ${owned ? '<span class="badge-owned">Owned</span>' : ""}
        <h3>${escapeHtml(c.title)}</h3>
        <p class="market-desc">${escapeHtml(truncate(c.description, 220))}</p>
        <div class="price-row">
          <span class="price-current">${formatDisplayPrice(c.priceCents)}</span>
        </div>
        <div class="market-actions">
          <button type="button" class="btn-navy purchase" data-id="${c.id}" ${owned ? "disabled" : ""}>
            ${owned ? "Purchased" : "View Details"}
          </button>
        </div>
      </div>
    `;
    const btn = card.querySelector(".purchase");
    btn.addEventListener("click", () => void openCheckout(c.id));
    grid.appendChild(card);
  }
}

async function loadCatalog() {
  if (state.userToken) await refreshCourseAccess();
  const res = await api("/api/users/courses");
  const data = await parseJson(res);
  if (!res.ok) {
    showToast(data?.error || "Failed to load catalog", true);
    return;
  }
  state.catalogCourses = data.courses || [];
  renderCatalogFromState();
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

async function maybeResumeCheckout() {
  const id = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
  if (!id || !state.userToken) return;
  sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
  await refreshCourseAccess();
  if (state.courseAccess.has(id)) {
    showToast("You already own this course.");
    setView("library");
    return;
  }
  state.checkoutCourseId = id;
  state.checkoutAppliedCoupon = null;
  const input = document.getElementById("checkout-coupon-input");
  if (input) input.value = "";
  setView("checkout");
}

function buildCheckoutMeta(description) {
  const t = String(description || "").trim();
  if (!t) return "Web dev (Every Friday)\nDevops (Every Friday)";
  const parts = t
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) return `${parts[0]}\n${parts[1]}`;
  const sentences = t.split(/(?<=[.!?])\s+/);
  if (sentences.length >= 2) return `${sentences[0]}\n${sentences[1]}`;
  return t.length > 120 ? `${t.slice(0, 117)}…` : t;
}

function applyCheckoutCoupon() {
  const input = document.getElementById("checkout-coupon-input");
  const err = document.getElementById("checkout-coupon-error");
  const raw = input?.value?.trim() ?? "";
  if (!state.checkoutCourse) return;
  const subtotal = usdCentsToCheckoutSubtotal(state.checkoutCourse.priceCents);
  if (!raw) {
    state.checkoutAppliedCoupon = null;
    err?.classList.remove("hidden");
    updateCheckoutPricing();
    return;
  }
  const d = discountForCoupon(subtotal, raw);
  if (d === null) {
    state.checkoutAppliedCoupon = null;
    err?.classList.remove("hidden");
  } else {
    state.checkoutAppliedCoupon = raw.toUpperCase();
    err?.classList.add("hidden");
  }
  updateCheckoutPricing();
}

function updateCheckoutPricing() {
  const grossEl = document.getElementById("checkout-line-gross");
  const discEl = document.getElementById("checkout-line-discount");
  const totEl = document.getElementById("checkout-line-total");
  if (!state.checkoutCourse || !grossEl || !discEl || !totEl) return;
  const subtotal = usdCentsToCheckoutSubtotal(state.checkoutCourse.priceCents);
  let discount = 0;
  if (state.checkoutAppliedCoupon) {
    const d = discountForCoupon(subtotal, state.checkoutAppliedCoupon);
    discount = d ?? 0;
  }
  const total = Math.max(0, subtotal - discount);
  grossEl.textContent = formatCheckoutAmount(subtotal);
  discEl.textContent = formatCheckoutAmount(discount);
  totEl.textContent = formatCheckoutAmount(total);
}

async function renderCheckout() {
  const empty = document.getElementById("checkout-empty");
  const content = document.getElementById("checkout-content");
  const err = document.getElementById("checkout-coupon-error");
  err?.classList.add("hidden");

  if (!state.checkoutCourseId) {
    empty?.classList.remove("hidden");
    content?.classList.add("hidden");
    return;
  }
  empty?.classList.add("hidden");
  content?.classList.remove("hidden");

  if (state.userToken) await refreshCourseAccess();

  let course = state.checkoutCourse;
  if (!course || course.id !== state.checkoutCourseId) {
    const cached = state.catalogCourses.find((c) => c.id === state.checkoutCourseId);
    if (cached) {
      course = cached;
    } else {
      const res = await api(`/api/users/courses/${state.checkoutCourseId}`);
      const data = await parseJson(res);
      if (!res.ok || !data?.course) {
        showToast(data?.error || "Course not found", true);
        state.checkoutCourseId = null;
        state.checkoutCourse = null;
        empty?.classList.remove("hidden");
        content?.classList.add("hidden");
        setView("catalog", { scroll: "courses" });
        return;
      }
      course = data.course;
    }
  }
  state.checkoutCourse = course;

  const media = document.getElementById("checkout-media");
  const titleEl = document.getElementById("checkout-course-title");
  const metaEl = document.getElementById("checkout-course-meta");
  if (media) {
    if (course.imageUrl) {
      media.innerHTML = `<img src="${encodeURI(course.imageUrl)}" alt="" loading="lazy" />`;
    } else {
      media.innerHTML = "";
    }
  }
  if (titleEl) titleEl.textContent = course.title;
  if (metaEl) metaEl.textContent = buildCheckoutMeta(course.description);

  const owned = state.courseAccess.has(course.id);
  const buyBtn = document.getElementById("checkout-buy-now");
  if (buyBtn) {
    buyBtn.disabled = owned;
    buyBtn.textContent = owned ? "Already enrolled" : "Buy Now";
  }

  syncCurrencySelects();
  updateCheckoutPricing();
}

async function openCheckout(courseId) {
  if (!state.userToken) {
    sessionStorage.setItem(PENDING_CHECKOUT_KEY, courseId);
    showToast("Sign in to continue to checkout.", true);
    setView("user-auth");
    return;
  }
  sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
  await refreshCourseAccess();
  if (state.courseAccess.has(courseId)) {
    showToast("You already own this course.");
    setView("library");
    return;
  }
  state.checkoutCourseId = courseId;
  state.checkoutAppliedCoupon = null;
  const input = document.getElementById("checkout-coupon-input");
  if (input) input.value = "";
  setView("checkout");
}

async function completeCheckoutPurchase() {
  if (!state.userToken || !state.checkoutCourseId) {
    showToast("Sign in to purchase.", true);
    setView("user-auth");
    return;
  }
  const btn = document.getElementById("checkout-buy-now");
  if (btn?.disabled) return;
  if (btn) btn.disabled = true;
  const res = await api(`/api/users/courses/${state.checkoutCourseId}/purchase`, {
    method: "POST",
    token: state.userToken,
  });
  const data = await parseJson(res);
  if (!res.ok) {
    showToast(data?.error || "Purchase failed", true);
    if (btn) btn.disabled = false;
    return;
  }
  state.courseAccess.add(state.checkoutCourseId);
  showToast("Purchase complete.");
  state.checkoutCourseId = null;
  state.checkoutCourse = null;
  loadCatalog();
  setView("library");
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
    const el = document.createElement("article");
    el.className = "market-card";
    const media = c.imageUrl
      ? `<div class="market-card-media"><img src="${encodeURI(c.imageUrl)}" alt="" loading="lazy" /></div>`
      : `<div class="market-card-media" role="img" aria-label="Course visual"></div>`;
    el.innerHTML = `
      ${media}
      <div class="market-card-body">
        <span class="badge-owned">Owned</span>
        <h3>${escapeHtml(c.title)}</h3>
        <p class="market-desc">${escapeHtml(truncate(c.description, 260))}</p>
        <p class="muted small" style="margin:0">Purchased ${new Date(row.purchasedAt).toLocaleString()}</p>
        <div class="price-row">
          <span class="price-current">${formatDisplayPrice(c.priceCents)}</span>
        </div>
      </div>
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
updateHeaderNavForView("catalog");
