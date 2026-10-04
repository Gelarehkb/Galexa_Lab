/* ============================================================
   Site config — edit these to make the site yours
   ============================================================ */
const SITE = {
  name: "Mira Solenne",
  currency: "€",
  instagram: "https://instagram.com/",
  email: "studio@example.com",
};

const COLLECTIONS = [
  { id: "april", label: "April Edit" },
  { id: "december", label: "December Edit" },
];

const PRODUCTS = [
  { id: "quiet-field-01", title: "Quiet Field No. 1", collection: "april", price: 350, seed: 11, palette: "sage", size: "21 × 29.7 cm", medium: "Pigment print on cotton rag", edition: "Edition of 15", sold: false },
  { id: "quiet-field-02", title: "Quiet Field No. 2", collection: "april", price: 350, seed: 24, palette: "sand", size: "21 × 29.7 cm", medium: "Pigment print on cotton rag", edition: "Edition of 15", sold: false },
  { id: "morning-hold", title: "Morning Hold", collection: "april", price: 350, seed: 37, palette: "blush", size: "21 × 29.7 cm", medium: "Pigment print on cotton rag", edition: "Edition of 15", sold: true },
  { id: "soft-horizon", title: "Soft Horizon", collection: "april", price: 350, seed: 48, palette: "sky", size: "21 × 29.7 cm", medium: "Pigment print on cotton rag", edition: "Edition of 15", sold: false },
  { id: "small-weather", title: "Small Weather", collection: "december", price: 350, seed: 59, palette: "ink", size: "21 × 29.7 cm", medium: "Pigment print on cotton rag", edition: "Edition of 10", sold: false },
  { id: "long-night", title: "Long Night", collection: "december", price: 350, seed: 63, palette: "dusk", size: "21 × 29.7 cm", medium: "Pigment print on cotton rag", edition: "Edition of 10", sold: false },
  { id: "first-snow", title: "First Snow", collection: "december", price: 350, seed: 72, palette: "frost", size: "21 × 29.7 cm", medium: "Pigment print on cotton rag", edition: "Edition of 10", sold: true },
  { id: "ember", title: "Ember", collection: "december", price: 350, seed: 85, palette: "rust", size: "21 × 29.7 cm", medium: "Pigment print on cotton rag", edition: "Edition of 10", sold: false },
];

const ARTWORKS = [
  { title: "Untitled (Threshold)", year: 2026, seed: 101, palette: "sand", medium: "Oil on linen, 120 × 150 cm" },
  { title: "Between Rooms", year: 2026, seed: 112, palette: "sage", medium: "Oil on linen, 100 × 120 cm" },
  { title: "Afterglow II", year: 2025, seed: 127, palette: "blush", medium: "Acrylic on canvas, 90 × 110 cm" },
  { title: "Still Water", year: 2025, seed: 133, palette: "sky", medium: "Oil on linen, 140 × 180 cm" },
  { title: "Low Light", year: 2025, seed: 141, palette: "dusk", medium: "Oil on canvas, 80 × 100 cm" },
  { title: "Field Study", year: 2024, seed: 156, palette: "rust", medium: "Oil on paper, 50 × 65 cm" },
];

const PRESS = [
  { year: 2026, title: "In the studio: painting the in-between", pub: "Placeholder Magazine", url: "#" },
  { year: 2026, title: "Ten artists to watch this spring", pub: "Example Journal", url: "#" },
  { year: 2025, title: "Colour as a quiet language", pub: "Sample Review", url: "#" },
  { year: 2025, title: "Group show: Soft Matter", pub: "Gallery Notes", url: "#" },
  { year: 2024, title: "Interview — on slowness and light", pub: "Studio Weekly", url: "#" },
];

/* ============================================================
   Generative artwork (placeholder images — swap for real photos)
   ============================================================ */
const PALETTES = {
  sage:  ["#e9ebe2", "#b7c2a6", "#7f8f6c", "#d9cdb4", "#3f4a36"],
  sand:  ["#f1ebe1", "#dcc8a8", "#b8946a", "#efe0cc", "#5a4632"],
  blush: ["#f4ece9", "#e7c4bb", "#c98f84", "#f0dcd2", "#6b3d36"],
  sky:   ["#ebeff2", "#bccbd6", "#7d96aa", "#e2e6e0", "#2e3f4f"],
  ink:   ["#e7e6e3", "#9a9a98", "#3d3f44", "#c9c3b8", "#141518"],
  dusk:  ["#e6e2ea", "#b3a6c2", "#6d5f84", "#d8c6c0", "#2b2436"],
  frost: ["#f3f4f4", "#dfe4e6", "#b7c1c5", "#eceae4", "#6f7b80"],
  rust:  ["#f2e8df", "#dfa98a", "#b3593a", "#ead2bd", "#4a2216"],
};

function rng(seed) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

function artSVG(seed, paletteName, ratio = [400, 500]) {
  const [w, h] = ratio;
  const p = PALETTES[paletteName] || PALETTES.sand;
  const r = rng(seed);
  const id = `g${seed}${w}`;
  let shapes = "";

  // soft colour fields
  for (let i = 0; i < 4; i++) {
    const cx = r() * w, cy = r() * h, rad = (0.35 + r() * 0.5) * Math.max(w, h);
    shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad.toFixed(1)}" fill="${p[1 + (i % 3)]}" opacity="${(0.35 + r() * 0.4).toFixed(2)}" filter="url(#b${id})"/>`;
  }
  // a horizon / band
  const by = h * (0.45 + r() * 0.3);
  shapes += `<rect x="0" y="${by.toFixed(1)}" width="${w}" height="${(h * (0.04 + r() * 0.1)).toFixed(1)}" fill="${p[2]}" opacity=".35" filter="url(#s${id})"/>`;
  // a single small accent form
  const ax = w * (0.2 + r() * 0.6), ay = h * (0.2 + r() * 0.5), ar = w * (0.04 + r() * 0.07);
  shapes += `<circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="${ar.toFixed(1)}" fill="${p[4]}" opacity=".75" filter="url(#s${id})"/>`;

  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <filter id="b${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${(w * 0.09).toFixed(0)}"/></filter>
      <filter id="s${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${(w * 0.012).toFixed(1)}"/></filter>
      <filter id="n${id}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="${p[0]}"/>
    ${shapes}
    <rect width="${w}" height="${h}" filter="url(#n${id})"/>
  </svg>`;
}

/* ============================================================
   Helpers
   ============================================================ */
const $ = (s, el = document) => el.querySelector(s);
const money = (n) => `${SITE.currency}${n.toLocaleString("de-DE")},00`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const page = document.body.dataset.page;

function store(key, val) {
  try {
    if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null");
    localStorage.setItem(key, JSON.stringify(val));
  } catch { return null; }
}

function toast(msg) {
  const t = $(".toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2200);
}

function card(p) {
  return `<a class="card reveal" href="product.html?id=${p.id}">
    <div class="thumb">${artSVG(p.seed, p.palette)}</div>
    <div class="meta">
      <div class="name">${esc(p.title)}</div>
      <div class="price">${p.sold ? '<span class="badge">Sold out</span>' : money(p.price)}</div>
    </div>
  </a>`;
}

/* ============================================================
   Shell: header, footer, cart, search
   ============================================================ */
function renderShell() {
  const link = (href, label, key) =>
    `<a href="${href}" class="${page === key ? "active" : ""}">${label}</a>`;

  document.body.insertAdjacentHTML("afterbegin", `
    <header class="site-header">
      <div class="wrap header-top">
        <button class="icon-btn menu-toggle" aria-label="Menu">Menu</button>
        <a href="index.html" class="logo">${esc(SITE.name)}</a>
        <div class="header-icons">
          <button class="icon-btn" data-open="search">Search</button>
          <button class="icon-btn" data-open="cart">Cart (<span class="cart-count">0</span>)</button>
        </div>
      </div>
      <nav class="wrap nav">
        ${link("index.html", "Start", "home")}
        <div class="dropdown">
          ${link("edits.html", "Micro Edits", "edits")}
          <div class="dropdown-menu">
            ${COLLECTIONS.map((c) => `<a href="edits.html?c=${c.id}">${c.label}</a>`).join("")}
          </div>
        </div>
        ${link("artworks.html", "Artworks", "artworks")}
        ${link("about.html", "About", "about")}
        ${link("press.html", "Press", "press")}
        ${link("contact.html", "Contact", "contact")}
      </nav>
    </header>
    <div class="search-panel" role="dialog" aria-label="Search">
      <input type="search" placeholder="Search works…" />
      <div class="search-results"></div>
    </div>
  `);

  document.body.insertAdjacentHTML("beforeend", `
    <section class="wrap newsletter">
      <h2>Newsletter</h2>
      <p>Be the first to know about new edits and exhibitions.</p>
      <form class="newsletter-form"><input type="email" required placeholder="Email address" /><button>Subscribe</button></form>
    </section>
    <footer class="wrap site-footer">
      <span>© ${new Date().getFullYear()} ${esc(SITE.name)}</span>
      <nav>
        <a href="contact.html">Shipping</a>
        <a href="contact.html">Returns</a>
        <a href="contact.html">Privacy</a>
        <a href="${SITE.instagram}" target="_blank" rel="noopener">Instagram</a>
      </nav>
    </footer>
    <div class="overlay"></div>
    <aside class="drawer" aria-label="Cart">
      <div class="drawer-head"><h2>Cart</h2><button class="icon-btn" data-close>Close</button></div>
      <div class="drawer-items"></div>
      <div class="drawer-foot">
        <div class="drawer-total"><span>Subtotal</span><span class="cart-total"></span></div>
        <button class="btn checkout">Checkout</button>
      </div>
    </aside>
    <div class="toast"></div>
  `);

  // header border on scroll
  const header = $(".site-header");
  addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 10), { passive: true });

  // mobile menu
  $(".menu-toggle").onclick = () => $(".nav").classList.toggle("open");

  // drawers
  const overlay = $(".overlay"), drawer = $(".drawer"), search = $(".search-panel");
  const closeAll = () => [overlay, drawer, search].forEach((e) => e.classList.remove("open"));
  document.addEventListener("click", (e) => {
    const o = e.target.closest("[data-open]");
    if (o) {
      closeAll();
      overlay.classList.add("open");
      if (o.dataset.open === "cart") { renderCart(); drawer.classList.add("open"); }
      else { search.classList.add("open"); setTimeout(() => $("input", search).focus(), 50); }
    }
    if (e.target === overlay || e.target.closest("[data-close]")) closeAll();
  });
  addEventListener("keydown", (e) => e.key === "Escape" && closeAll());

  // search
  $("input", search).addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    const hits = q ? PRODUCTS.filter((p) => p.title.toLowerCase().includes(q)) : [];
    $(".search-results").innerHTML = q
      ? hits.length ? hits.map((p) => `<a href="product.html?id=${p.id}">${esc(p.title)} — ${money(p.price)}</a>`).join("")
                    : `<span style="color:var(--muted)">No results</span>`
      : "";
  });

  // newsletter
  $(".newsletter-form").addEventListener("submit", (e) => {
    e.preventDefault();
    e.target.reset();
    toast("Thank you for subscribing");
  });

  // checkout (placeholder — connect Shopify / Stripe here)
  $(".checkout").onclick = () => toast("Checkout not connected yet");

  updateCartCount();
}

/* ---------- Cart ---------- */
const getCart = () => store("cart") || [];
const setCart = (c) => { store("cart", c); updateCartCount(); };
function updateCartCount() {
  const n = getCart().reduce((a, i) => a + i.qty, 0);
  document.querySelectorAll(".cart-count").forEach((el) => (el.textContent = n));
}
function addToCart(id) {
  const c = getCart();
  const item = c.find((i) => i.id === id);
  item ? item.qty++ : c.push({ id, qty: 1 });
  setCart(c);
}
function renderCart() {
  const c = getCart();
  const box = $(".drawer-items");
  let total = 0;
  box.innerHTML = c.length ? c.map((i) => {
    const p = PRODUCTS.find((x) => x.id === i.id);
    if (!p) return "";
    total += p.price * i.qty;
    return `<div class="cart-item">
      <div class="mini">${artSVG(p.seed, p.palette)}</div>
      <div><div>${esc(p.title)}</div><div class="small">Qty ${i.qty} · ${money(p.price)}</div></div>
      <button data-remove="${p.id}">Remove</button>
    </div>`;
  }).join("") : `<p class="empty">Your cart is empty.</p>`;
  $(".cart-total").textContent = money(total);
  $(".checkout").disabled = !c.length;
  box.querySelectorAll("[data-remove]").forEach((b) => (b.onclick = () => {
    setCart(getCart().filter((i) => i.id !== b.dataset.remove));
    renderCart();
  }));
}

/* ============================================================
   Pages
   ============================================================ */
const PAGES = {
  home(main) {
    main.innerHTML = `
      <div class="wrap">
        <div class="hero reveal">${artSVG(7, "sand", [1600, 700])}
          <div class="hero-caption"><a href="edits.html">Shop the December Edit</a></div>
        </div>
        <h2 class="section-title">New Micro Edits</h2>
        <div class="grid">${PRODUCTS.slice(0, 8).map(card).join("")}</div>
        <h2 class="section-title">Selected Artworks</h2>
        <div class="grid cols-3">${ARTWORKS.slice(0, 3).map(artCard).join("")}</div>
      </div>`;
  },

  edits(main) {
    const params = new URLSearchParams(location.search);
    let active = params.get("c") || "all";
    main.innerHTML = `
      <div class="wrap">
        <h1 class="section-title page-title">Micro Edits</h1>
        <p class="intro">Small-format works released in limited seasonal editions. Each piece is signed and numbered.</p>
        <div class="filters">
          <button data-c="all">All</button>
          ${COLLECTIONS.map((c) => `<button data-c="${c.id}">${c.label}</button>`).join("")}
        </div>
        <div class="grid"></div>
      </div>`;
    const draw = () => {
      main.querySelectorAll(".filters button").forEach((b) => b.classList.toggle("active", b.dataset.c === active));
      $(".grid", main).innerHTML = PRODUCTS.filter((p) => active === "all" || p.collection === active).map(card).join("");
      reveal();
    };
    main.querySelectorAll(".filters button").forEach((b) => (b.onclick = () => {
      active = b.dataset.c;
      history.replaceState(null, "", active === "all" ? "edits.html" : `edits.html?c=${active}`);
      draw();
    }));
    draw();
  },

  product(main) {
    const p = PRODUCTS.find((x) => x.id === new URLSearchParams(location.search).get("id")) || PRODUCTS[0];
    const col = COLLECTIONS.find((c) => c.id === p.collection);
    document.title = `${p.title} — ${SITE.name}`;
    main.innerHTML = `
      <div class="wrap">
        <div class="product">
          <div class="art reveal">${artSVG(p.seed, p.palette, [800, 1000])}</div>
          <div class="info">
            <span class="badge">${col ? col.label : ""}</span>
            <h1>${esc(p.title)}</h1>
            <div class="price">${money(p.price)}</div>
            <button class="btn add" ${p.sold ? "disabled" : ""}>${p.sold ? "Sold out" : "Add to cart"}</button>
            <dl>
              <dt>Medium</dt><dd>${esc(p.medium)}</dd>
              <dt>Size</dt><dd>${esc(p.size)}</dd>
              <dt>Edition</dt><dd>${esc(p.edition)}, signed &amp; numbered</dd>
            </dl>
            <p>A quiet study in colour and atmosphere, part of a small seasonal series. Printed to order on archival paper and shipped flat in protective packaging within 5–7 working days.</p>
            <a class="back" href="edits.html">← Back to Micro Edits</a>
          </div>
        </div>
        <h2 class="section-title">You may also like</h2>
        <div class="grid">${PRODUCTS.filter((x) => x.id !== p.id).slice(0, 4).map(card).join("")}</div>
      </div>`;
    const add = $(".add", main);
    if (!p.sold) add.onclick = () => {
      addToCart(p.id);
      toast("Added to cart");
    };
  },

  artworks(main) {
    main.innerHTML = `
      <div class="wrap">
        <h1 class="section-title page-title">Artworks</h1>
        <p class="intro">Original paintings. For availability and prices, please get in touch.</p>
        <div class="grid cols-3">${ARTWORKS.map(artCard).join("")}</div>
      </div>`;
  },

  about(main) {
    main.innerHTML = `
      <div class="wrap">
        <h1 class="section-title page-title">About</h1>
        <div class="two-col">
          <div class="portrait reveal">${artSVG(201, "blush", [600, 800])}</div>
          <div class="text-page reveal">
            <p>${esc(SITE.name)} is a painter working between abstraction and landscape. Her work explores atmosphere, memory and the quiet moments between light and dark.</p>
            <p>Working primarily in oil on linen, she builds her surfaces slowly in thin, translucent layers — letting colour settle until a feeling, rather than a place, emerges.</p>
            <p>Alongside her studio practice she releases <a href="edits.html"><u>Micro Edits</u></a>: small, affordable limited editions published a few times a year.</p>
            <p>Her work has been shown in group and solo exhibitions across Europe and is held in private collections internationally.</p>
            <p style="color:var(--muted)">Replace this text with your own biography.</p>
          </div>
        </div>
      </div>`;
  },

  press(main) {
    main.innerHTML = `
      <div class="wrap">
        <h1 class="section-title page-title">Press</h1>
        <ul class="press-list">
          ${PRESS.map((x) => `<li class="reveal"><span class="year">${x.year}</span><a href="${x.url}">${esc(x.title)}</a><span class="pub">${esc(x.pub)}</span></li>`).join("")}
        </ul>
      </div>`;
  },

  contact(main) {
    main.innerHTML = `
      <div class="wrap">
        <h1 class="section-title page-title">Contact</h1>
        <p class="intro">For commissions, available works, press and collaborations, write to <a href="mailto:${SITE.email}"><u>${SITE.email}</u></a> or use the form below.</p>
        <form class="contact">
          <div class="field"><label for="n">Name</label><input id="n" required /></div>
          <div class="field"><label for="e">Email</label><input id="e" type="email" required /></div>
          <div class="field"><label for="m">Message</label><textarea id="m" required></textarea></div>
          <button class="btn">Send</button>
          <p class="form-note" hidden>Thank you — I'll be in touch soon.</p>
        </form>
      </div>`;
    $("form.contact", main).addEventListener("submit", (e) => {
      e.preventDefault();
      // Connect to a form service (Formspree, Netlify Forms, etc.) here.
      e.target.reset();
      $(".form-note", main).hidden = false;
    });
  },
};

function artCard(a) {
  return `<div class="card reveal">
    <div class="thumb">${artSVG(a.seed, a.palette)}</div>
    <div class="meta">
      <div class="name">${esc(a.title)}, ${a.year}</div>
      <div class="price">${esc(a.medium)}</div>
    </div>
  </div>`;
}

/* ---------- Scroll reveal ---------- */
function reveal() {
  const els = document.querySelectorAll(".reveal:not(.in)");
  if (!("IntersectionObserver" in window)) return els.forEach((e) => e.classList.add("in"));
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: 0.1 });
  els.forEach((e) => io.observe(e));
}

/* ---------- Boot ---------- */
renderShell();
const main = $("main");
(PAGES[page] || PAGES.home)(main);
reveal();
