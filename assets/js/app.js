/*
 * Mafos Design — site script.
 * Plain JavaScript: no build step, no dependencies. Open index.html and it works.
 * All words, projects and categories come from content/content.js.
 */
(() => {
  "use strict";

  const LANG_KEY = "mafos:lang";
  const state = { content: null, lang: "sq", category: "all" };
  const lightbox = { pictures: [], index: 0, title: "" };

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
  const isEmbed = (item) => Boolean(item && item.embed);

  // How wide each image is shown, so the browser can pick the right web copy.
  const CARD_SIZES = "(max-width: 560px) 50vw, (max-width: 1240px) 33vw, 400px";
  const GALLERY_SIZES = "(max-width: 1240px) 100vw, 1120px";

  // An image is a plain path (placeholders, hand-added files) or the object that
  // scripts/add-project.ps1 writes: { src, srcset, width, height }.
  function imageAttrs(image, sizes) {
    if (!image || typeof image === "string") return `src="${escapeHtml(image || "")}" width="800" height="1000"`;
    const srcset = image.srcset ? ` srcset="${escapeHtml(image.srcset)}" sizes="${sizes}"` : "";
    return `src="${escapeHtml(image.src)}"${srcset} width="${Number(image.width) || 800}" height="${Number(image.height) || 1000}"`;
  }

  // YouTube and Vimeo links become privacy-friendly player URLs; anything else is ignored.
  function embedUrl(link) {
    const youtube = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/.exec(link);
    if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}`;
    const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(link);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?dnt=1`;
    console.warn(`[content] Unsupported video link: ${link}`);
    return null;
  }

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
          <img ${imageAttrs(project.cover, CARD_SIZES)} alt="${escapeHtml(title)}" loading="lazy" decoding="async">
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
    const media = galleryOf(project);
    const pictures = media.filter((item) => !isEmbed(item));
    const next = nextProject(project);
    document.title = `${title} — ${brandTitle()}`;
    lightbox.pictures = pictures;
    lightbox.title = title;

    let pictureIndex = -1;
    const mediaHtml = (item, i) => {
      if (isEmbed(item)) {
        const src = embedUrl(item.embed);
        return src
          ? `<figure class="embed"><iframe src="${escapeHtml(src)}" title="${escapeHtml(title)}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></figure>`
          : "";
      }
      pictureIndex += 1;
      // The ratio lets tall images shrink to fit the screen height instead of filling the width.
      const ratio = item && item.width && item.height ? item.width / item.height : 0.8;
      return `<figure><button type="button" class="zoom" data-zoom="${pictureIndex}" style="--ratio: ${ratio.toFixed(4)}" aria-label="${escapeHtml(ui("project.zoom"))}">
          <img ${imageAttrs(item, GALLERY_SIZES)} alt="${escapeHtml(`${title} — ${pictureIndex + 1}`)}"${i > 0 ? ' loading="lazy"' : ""} decoding="async">
        </button></figure>`;
    };

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
      <div class="project-gallery">
        ${media.map(mediaHtml).join("")}
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

  /* ---------- Full-screen image viewer (project page) ---------- */
  function showPicture(index) {
    const dialog = $("[data-lightbox]");
    const count = lightbox.pictures.length;
    lightbox.index = (index + count) % count;
    const picture = lightbox.pictures[lightbox.index];
    const img = $(".lightbox-image", dialog);
    img.removeAttribute("srcset");
    if (picture && typeof picture === "object" && picture.srcset) {
      img.sizes = "100vw";
      img.srcset = picture.srcset;
    }
    img.src = typeof picture === "string" ? picture : picture.src;
    img.alt = `${lightbox.title} — ${lightbox.index + 1}`;
    $(".lightbox-count", dialog).textContent = `${lightbox.index + 1} / ${count}`;
    dialog.classList.toggle("is-single", count < 2);
  }

  function openLightbox(index) {
    const dialog = $("[data-lightbox]");
    if (!dialog || !lightbox.pictures.length) return;
    showPicture(index);
    document.documentElement.classList.add("lightbox-open");
    dialog.showModal();
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

      const zoom = event.target.closest("[data-zoom]");
      if (zoom) {
        openLightbox(Number(zoom.dataset.zoom));
        return;
      }

      const dialog = event.target.closest("[data-lightbox]");
      if (dialog) {
        if (event.target.closest("[data-lightbox-prev]")) showPicture(lightbox.index - 1);
        else if (event.target.closest("[data-lightbox-next]")) showPicture(lightbox.index + 1);
        else if (event.target.closest("[data-lightbox-close]") || event.target === dialog) dialog.close();
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
      if ($("[data-lightbox]")?.open) {
        if (event.key === "ArrowLeft") showPicture(lightbox.index - 1);
        if (event.key === "ArrowRight") showPicture(lightbox.index + 1);
      }
    });

    $("[data-lightbox]")?.addEventListener("close", () => document.documentElement.classList.remove("lightbox-open"));
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
