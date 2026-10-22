/*
 * Mafos Design — site script.
 * Plain JavaScript: no build step, no dependencies. Open index.html and it works.
 * All words, projects and categories come from content/content.js.
 */
(() => {
  "use strict";

  const LANG_KEY = "mafos:lang";
  const state = { content: null, lang: "sq", category: "all" };

  /* ---------- Content source ----------
   * The only place that knows where content comes from. To move content into a
   * JSON file or a headless CMS later, change this function and nothing else.
   */
  function loadContent() {
    if (!window.SITE_CONTENT) {
      return Promise.reject(new Error("content/content.js did not load. Check it for a typo (a missing comma or quote)."));
    }
    return Promise.resolve(window.SITE_CONTENT);
  }

  /* ---------- Helpers ---------- */
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

  // A content field is either a plain value or { sq: ..., en: ... }.
  function pick(value) {
    if (value == null || typeof value !== "object" || Array.isArray(value)) return value;
    return value[state.lang] ?? value[state.content.site.defaultLang];
  }
  const tr = (value) => String(pick(value) ?? "");

  // Interface text from content.text, with {placeholders} filled in.
  function ui(key, vars = {}) {
    const { text, site } = state.content;
    const raw = text[state.lang]?.[key] ?? text[site.defaultLang]?.[key] ?? key;
    return raw.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
  }

  const getParam = (name) => new URLSearchParams(location.search).get(name);

  // Updates the address bar without reloading. Some browsers refuse this for
  // pages opened straight from disk (file://); the page still works.
  function setParam(name, value) {
    try {
      const url = new URL(location.href);
      if (value) url.searchParams.set(name, value);
      else url.searchParams.delete(name);
      history.replaceState(null, "", url);
    } catch {
      /* ignore */
    }
  }

  function readSavedLang() {
    try {
      return localStorage.getItem(LANG_KEY);
    } catch {
      return null;
    }
  }

  function saveLang(lang) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* private mode or blocked storage: the choice just isn't remembered */
    }
  }

  const brandTitle = () => `${state.content.site.name} ${state.content.site.descriptor}`.trim();
  const categoryBySlug = (slug) => state.content.categories.find((c) => c.slug === slug);
  const projectUrl = (project) => `project.html?p=${encodeURIComponent(project.slug)}`;
  const galleryOf = (project) => (project.images && project.images.length ? project.images : [project.cover]);

  function whatsappUrl(message) {
    return `https://wa.me/${state.content.site.contact.whatsapp}?text=${encodeURIComponent(message)}`;
  }

  /* ---------- Content checks (shown in the browser console) ---------- */
  function checkContent(content) {
    const categories = new Set(content.categories.map((c) => c.slug));
    const seen = new Set();
    content.projects.forEach((p) => {
      if (seen.has(p.slug)) console.warn(`[content] Two projects use the slug "${p.slug}". Each needs its own.`);
      seen.add(p.slug);
      if (!categories.has(p.category)) console.warn(`[content] Project "${p.slug}" uses unknown category "${p.category}".`);
      if (!p.cover) console.warn(`[content] Project "${p.slug}" has no cover image.`);
    });
  }

  /* ---------- Shared: text, language switch, contact links ---------- */
  function renderShared() {
    const { site } = state.content;
    document.documentElement.lang = state.lang;

    $$("[data-i18n]").forEach((el) => {
      el.textContent = ui(el.dataset.i18n, { brand: site.name });
    });
    $$("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", ui(el.dataset.i18nAria)));
    $$("[data-brand-name]").forEach((el) => (el.textContent = site.name));
    $$("[data-brand-sub]").forEach((el) => (el.textContent = site.descriptor));
    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

    const links = {
      whatsapp: whatsappUrl(ui("whatsapp.general", { brand: site.name })),
      email: `mailto:${site.contact.email}`,
      instagram: `https://instagram.com/${site.contact.instagram}`,
    };
    $$("[data-link]").forEach((el) => (el.href = links[el.dataset.link]));

    $$("[data-contact-meta]").forEach((el) => {
      el.textContent = [site.contact.email, site.contact.phone, ui("contact.city")].filter(Boolean).join("  ·  ");
    });

    const switcher = $("[data-lang-switch]");
    if (switcher) {
      switcher.innerHTML = site.languages
        .map((code) => `<button type="button" data-lang="${code}" aria-pressed="${code === state.lang}">${code.toUpperCase()}</button>`)
        .join("");
    }
  }

  /* ---------- Home page ---------- */
  function renderHome() {
    document.title = `${brandTitle()} — ${ui("meta.homeTitle")}`;
    renderWork();
    renderPackages();
    renderServices();
  }

  function renderWork() {
    const { categories, projects } = state.content;
    const counts = {};
    projects.forEach((p) => (counts[p.category] = (counts[p.category] || 0) + 1));

    const filters = [{ slug: "all", label: ui("work.all"), count: projects.length }].concat(
      categories.filter((c) => counts[c.slug]).map((c) => ({ slug: c.slug, label: tr(c.label), count: counts[c.slug] }))
    );

    const filterBar = $("[data-filters]");
    filterBar.setAttribute("aria-label", ui("work.filterLabel"));
    filterBar.innerHTML = filters
      .map(
        (f) => `<button type="button" class="chip" data-filter="${f.slug}" aria-pressed="${f.slug === state.category}">
          ${escapeHtml(f.label)}<span class="chip-count">${f.count}</span>
        </button>`
      )
      .join("");

    const shown = state.category === "all" ? projects : projects.filter((p) => p.category === state.category);
    $("[data-grid]").innerHTML = shown.length
      ? shown.map(cardHtml).join("")
      : `<p class="empty">${escapeHtml(ui("work.empty"))}</p>`;
  }

  function cardHtml(project) {
    const category = categoryBySlug(project.category);
    const title = tr(project.title);
    return `
      <a class="card" href="${projectUrl(project)}">
        <div class="card-media">
          <img src="${escapeHtml(project.cover)}" alt="${escapeHtml(title)}" width="800" height="1000" loading="lazy" decoding="async">
          ${project.sample ? `<span class="badge">${escapeHtml(ui("work.sample"))}</span>` : ""}
        </div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(title)}</h3>
          <p class="card-meta">${escapeHtml(category ? tr(category.label) : "")}${project.year ? ` · ${project.year}` : ""}</p>
        </div>
      </a>`;
  }

  function renderPackages() {
    const section = $("[data-packages-section]");
    if (!section) return;
    const packages = state.content.packages || [];
    section.hidden = packages.length === 0;

    $("[data-packages]").innerHTML = packages
      .map((pkg) => {
        const name = tr(pkg.name);
        const items = pick(pkg.includes) || [];
        return `
        <article class="package${pkg.highlight ? " is-highlight" : ""}">
          ${pkg.highlight ? `<p class="package-flag">${escapeHtml(ui("packages.highlight"))}</p>` : ""}
          <h3>${escapeHtml(name)}</h3>
          <p class="package-for">${escapeHtml(tr(pkg.for))}</p>
          <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          <p class="package-price">${escapeHtml(tr(pkg.price))}</p>
          <a class="btn ${pkg.highlight ? "btn-light" : "btn-primary"}" href="${whatsappUrl(ui("whatsapp.package", { name }))}" target="_blank" rel="noopener">${escapeHtml(ui("packages.cta"))}</a>
        </article>`;
      })
      .join("");
  }

  function renderServices() {
    const list = $("[data-services]");
    if (!list) return;
    list.innerHTML = state.content.categories
      .map(
        (c) => `<li><a href="index.html?c=${encodeURIComponent(c.slug)}#work">
          <strong>${escapeHtml(tr(c.label))}</strong>
          <span>${escapeHtml(tr(c.description))}</span>
        </a></li>`
      )
      .join("");
  }

  /* ---------- Project page ---------- */
  function nextProject(current) {
    const { projects } = state.content;
    const sameCategory = projects.filter((p) => p.category === current.category);
    const pool = sameCategory.length > 1 ? sameCategory : projects;
    if (pool.length < 2) return null;
    return pool[(pool.indexOf(current) + 1) % pool.length];
  }

  const fact = (label, value) =>
    value ? `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>` : "";

  function renderProject() {
    const root = $("[data-project]");
    const project = state.content.projects.find((p) => p.slug === getParam("p"));

    if (!project) {
      document.title = `${ui("project.notFound")} — ${brandTitle()}`;
      root.innerHTML = `
        <div class="not-found">
          <h1 class="project-title">${escapeHtml(ui("project.notFound"))}</h1>
          <a class="btn btn-primary" href="index.html#work">${escapeHtml(ui("project.back"))}</a>
        </div>`;
      return;
    }

    const title = tr(project.title);
    const category = categoryBySlug(project.category);
    const images = galleryOf(project);
    const next = nextProject(project);
    document.title = `${title} — ${brandTitle()}`;

    root.innerHTML = `
      <a class="back-link" href="index.html?c=${encodeURIComponent(project.category)}#work">← ${escapeHtml(ui("project.back"))}</a>
      <header class="project-head">
        <p class="eyebrow">${escapeHtml(category ? tr(category.label) : "")}</p>
        <h1 class="project-title">${escapeHtml(title)}</h1>
        ${project.summary ? `<p class="project-summary">${escapeHtml(tr(project.summary))}</p>` : ""}
        <dl class="project-facts">
          ${fact(ui("project.client"), tr(project.client))}
          ${fact(ui("project.year"), project.year)}
        </dl>
        ${project.sample ? `<p class="sample-note">${escapeHtml(ui("project.sampleNote"))}</p>` : ""}
      </header>
      <div class="project-gallery${images.length === 1 ? " is-single" : ""}">
        ${images
          .map(
            (src, i) => `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(`${title} — ${i + 1}`)}" width="800" height="1000"${i > 0 ? ' loading="lazy"' : ""} decoding="async"></figure>`
          )
          .join("")}
      </div>
      <section class="project-cta">
        <h2>${escapeHtml(ui("project.ctaTitle"))}</h2>
        <a class="btn btn-dark" href="${whatsappUrl(ui("whatsapp.project", { title }))}" target="_blank" rel="noopener">${escapeHtml(ui("project.ctaButton"))}</a>
      </section>
      ${
        next
          ? `<a class="next-project" href="${projectUrl(next)}"><span>${escapeHtml(ui("project.next"))}</span><strong>${escapeHtml(tr(next.title))} →</strong></a>`
          : ""
      }`;
  }

  /* ---------- Wiring ---------- */
  function render() {
    renderShared();
    if (document.body.dataset.page === "project") renderProject();
    else renderHome();
  }

  function closeMenu() {
    document.body.classList.remove("menu-open");
    $(".menu-toggle")?.setAttribute("aria-expanded", "false");
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const langButton = event.target.closest("[data-lang]");
      if (langButton) {
        state.lang = langButton.dataset.lang;
        saveLang(state.lang);
        setParam("lang", null);
        render();
        $(`[data-lang="${state.lang}"]`)?.focus();
        return;
      }

      const chip = event.target.closest("[data-filter]");
      if (chip) {
        state.category = chip.dataset.filter;
        setParam("c", state.category === "all" ? null : state.category);
        renderWork();
        $(`[data-filter="${state.category}"]`)?.focus();
        return;
      }

      const menuToggle = event.target.closest(".menu-toggle");
      if (menuToggle) {
        const open = document.body.classList.toggle("menu-open");
        menuToggle.setAttribute("aria-expanded", String(open));
        return;
      }

      if (event.target.closest(".site-nav a")) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  function init(content) {
    state.content = content;
    checkContent(content);

    const { site, categories } = content;
    state.lang = [getParam("lang"), readSavedLang()].find((code) => site.languages.includes(code)) || site.defaultLang;

    const requested = getParam("c");
    state.category = categories.some((c) => c.slug === requested) ? requested : "all";

    bindEvents();
    render();
  }

  loadContent()
    .then(init)
    .catch((error) => {
      console.error(error);
      const target = $("[data-grid]") || $("[data-project]");
      if (target) target.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
    });
})();
