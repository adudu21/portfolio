/* ============================================================
   NAV MENU (mobile)
============================================================ */
const menu = document.querySelector(".menu");
const nav = document.querySelector("nav");
menu?.addEventListener("click", () => nav.classList.toggle("open"));
document.querySelectorAll("nav a").forEach((a) =>
  a.addEventListener("click", () => nav.classList.remove("open")),
);

/* ============================================================
   GALLERY DATA
   ---------------------------------------------------------
   gallery-data.js contains the file list. This avoids probing
   hundreds of possible filenames with Image() just to discover
   which files exist. Only the images that are actually rendered
   are requested by the browser.
============================================================ */
const HERO_CATEGORIES = [
  "portrait",
  "community",
  "street",
  "urban",
  "architecture",
  "automotive",
  "design-graphic",
  "product",
];

const CATEGORIES = GALLERY_DATA.map(({ key, label }) => ({ key, label }));

/* ============================================================
   HERO CAROUSEL
   ---------------------------------------------------------
   Uses optimized thumbnails rather than the original 2–3 MB
   files. This keeps the hero responsive while scrolling.
============================================================ */
const HERO_AUTOPLAY_MS = 4500;

function initHeroCarousel() {
  const carousel = document.getElementById("heroCarousel");
  const frontCard = document.getElementById("heroFront");
  const frontImg = document.getElementById("heroImgFront");
  const backImg = document.getElementById("heroImgBack");
  const labelCat = document.getElementById("heroLabelCat");
  const labelIndex = document.getElementById("heroLabelIndex");
  const prevBtn = document.getElementById("heroPrev");
  const nextBtn = document.getElementById("heroNext");
  if (!carousel || !frontImg) return;

  const slides = HERO_CATEGORIES.map((key) => {
    const cat = GALLERY_DATA.find((item) => item.key === key);
    const file = cat?.files?.[0];
    return file
      ? { key, label: cat.label, src: file.src }
      : null;
  }).filter(Boolean);

  if (!slides.length) return;

  let index = 0;
  let animating = false;
  let timer = null;

  function labelFor(i) {
    labelCat.textContent = slides[i].label.toUpperCase();
    labelIndex.textContent = `${String(i + 1).padStart(2, "0")} / ${String(
      slides.length,
    ).padStart(2, "0")}`;
  }

  function render() {
    frontImg.src = slides[index].src;
    frontImg.decoding = "async";
    labelFor(index);
    backImg.src = slides[(index + 1) % slides.length].src;
  }

  function go(direction) {
    if (animating || slides.length < 2) return;
    animating = true;
    const exitClass = direction > 0 ? "fly-left" : "fly-right";
    const enterClass = direction > 0 ? "fly-right" : "fly-left";

    frontCard.classList.add(exitClass);
    setTimeout(() => {
      index = (index + direction + slides.length) % slides.length;
      frontCard.style.transition = "none";
      frontCard.classList.remove(exitClass);
      frontCard.classList.add(enterClass);
      frontImg.src = slides[index].src;
      labelFor(index);
      backImg.src = slides[(index + 1) % slides.length].src;
      void frontCard.offsetWidth;
      frontCard.style.transition = "";
      frontCard.classList.remove(enterClass);
      animating = false;
    }, 550);
  }

  function restartAutoplay() {
    if (timer) clearInterval(timer);
    if (slides.length > 1) timer = setInterval(() => go(1), HERO_AUTOPLAY_MS);
  }

  prevBtn?.addEventListener("click", () => {
    go(-1);
    restartAutoplay();
  });
  nextBtn?.addEventListener("click", () => {
    go(1);
    restartAutoplay();
  });
  carousel.addEventListener("mouseenter", () => timer && clearInterval(timer));
  carousel.addEventListener("mouseleave", restartAutoplay);

  render();
  restartAutoplay();
}

/* ============================================================
   GALLERY — PAGINATED / LAZY DOM
   ---------------------------------------------------------
   Only the current page is inserted into the DOM. The browser
   therefore does not have to decode 90+ high-resolution photos
   just because they exist in the project.

   Gallery thumbnails are generated in assets/_thumbs/.
   Clicking a card loads the original file in the lightbox.
============================================================ */
const GALLERY_PAGE_SIZE = 9;
const GALLERY_PEEK_SIZE = 3;

function initGallery() {
  const galleryEl = document.getElementById("gallery");
  const emptyEl = document.getElementById("galleryEmpty");
  const loadMoreWrap = document.getElementById("loadMoreWrap");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const peekEl = document.getElementById("loadMorePeek");
  const filters = document.querySelectorAll(".filter");

  if (!galleryEl) return;

  let activeFilter = "all";
  let visibleCount = GALLERY_PAGE_SIZE;

  const allItems = GALLERY_DATA.flatMap((cat) =>
    cat.files.map((file, index) => ({
      ...file,
      category: cat.key,
      label: cat.label,
      index: index + 1,
    })),
  );

  function getMatched() {
    return activeFilter === "all"
      ? allItems
      : allItems.filter((item) => item.category === activeFilter);
  }

  function makeCard(item) {
    const article = document.createElement("article");
    article.className = "work-card";
    article.dataset.category = item.category;
    article.dataset.full = item.full;
    article.innerHTML = `
      <img
        src="${item.src}"
        alt="${item.label} photography"
        width="${item.width}"
        height="${item.height}"
        loading="lazy"
        decoding="async"
        fetchpriority="low"
      >
      <div class="card-meta">
        <span>${item.label}</span>
        <b>${String(item.index).padStart(2, "0")}</b>
      </div>
    `;
    return article;
  }

  function renderPeek(matched) {
    if (!peekEl) return;
    peekEl.replaceChildren();
    const upcoming = matched.slice(visibleCount, visibleCount + GALLERY_PEEK_SIZE);
    if (!upcoming.length) return;

    upcoming.forEach((item) => {
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.setAttribute("aria-hidden", "true");
      peekEl.appendChild(img);
    });
  }

  function render() {
    const matched = getMatched();
    galleryEl.replaceChildren();

    matched.slice(0, visibleCount).forEach((item) => {
      galleryEl.appendChild(makeCard(item));
    });

    const hasMore = matched.length > visibleCount;
    if (loadMoreWrap) loadMoreWrap.hidden = !hasMore;
    if (emptyEl) emptyEl.hidden = matched.length !== 0;
    renderPeek(matched);
  }

  filters.forEach((btn) =>
    btn.addEventListener("click", () => {
      filters.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      visibleCount = GALLERY_PAGE_SIZE;
      render();
    }),
  );

  loadMoreBtn?.addEventListener("click", () => {
    visibleCount += GALLERY_PAGE_SIZE;
    render();
  });

  render();
  initLightbox();
}

/* ============================================================
   LIGHTBOX
   ---------------------------------------------------------
   The original high-resolution file is loaded ONLY when a user
   opens a photo. Gallery thumbnails never get replaced by the
   original file during normal scrolling.
============================================================ */
function initLightbox() {
  const lightbox = document.querySelector(".lightbox");
  if (!lightbox) return;

  const lightImg = lightbox.querySelector("img");
  const close = () => {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightImg.removeAttribute("src");
    document.body.style.overflow = "";
  };

  document.getElementById("gallery")?.addEventListener("click", (e) => {
    const card = e.target.closest(".work-card");
    if (!card) return;

    const img = card.querySelector("img");
    const full = card.dataset.full;
    if (!img || !full) return;

    lightImg.src = full;
    lightImg.alt = img.alt;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  });

  lightbox.querySelector(".close")?.addEventListener("click", close);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

initGallery();
initHeroCarousel();
