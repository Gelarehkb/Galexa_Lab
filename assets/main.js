const $ = (s, el = document) => el.querySelector(s);

/* ---------- Header ---------- */
const header = $(".site-header");
addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 10), { passive: true });

const nav = $(".nav"), toggle = $(".menu-toggle");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
  toggle.textContent = open ? "Close" : "Menu";
});
nav.addEventListener("click", (e) => {
  if (e.target.closest("a")) { nav.classList.remove("open"); toggle.textContent = "Menu"; }
});

/* ---------- Hero tiles: a soft grid outside the office windows ---------- */
// Tiles light up under the cursor (or finger) and fade out over two seconds.
const tilesCanvas = $(".hero-tiles"), heroEl = $(".hero");
if (tilesCanvas) {
  const ctx = tilesCanvas.getContext("2d");
  const TILE = "#dcefe4", LINE = "rgba(0, 0, 0, .055)", FADE = 2000;
  const lit = new Map();
  let size = 48, W = 0, H = 0, ox = 0, oy = 0, dpr = 1, raf = 0, hoverKey = null;

  const draw = () => {
    raf = 0;
    const now = performance.now();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = TILE;
    for (const [key, t] of lit) {
      const a = key === hoverKey ? 1 : 1 - (now - t) / FADE;
      if (a <= 0) { lit.delete(key); continue; }
      const [c, r] = key.split(",").map(Number);
      ctx.globalAlpha = a;
      ctx.fillRect(ox + c * size, oy + r * size, size, size);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = ox; x <= W; x += size) { ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, H); }
    for (let y = oy; y <= H; y += size) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(W, Math.round(y) + 0.5); }
    ctx.stroke();
    if (lit.size && !(lit.size === 1 && lit.has(hoverKey))) raf = requestAnimationFrame(draw);
  };
  const resizeTiles = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = heroEl.clientWidth; H = heroEl.clientHeight;
    tilesCanvas.width = W * dpr; tilesCanvas.height = H * dpr;
    size = W < 768 ? 36 : 48;
    ox = (W % size) / 2; oy = (H % size) / 2;
    draw();
  };
  const light = (x, y) => {
    const r = heroEl.getBoundingClientRect();
    const key = Math.floor((x - r.left - ox) / size) + "," + Math.floor((y - r.top - oy) / size);
    if (hoverKey && hoverKey !== key) lit.set(hoverKey, performance.now()); // start fading the tile we left
    hoverKey = key;
    lit.set(key, performance.now());
    if (!raf) raf = requestAnimationFrame(draw);
  };
  const leave = () => {
    if (hoverKey) lit.set(hoverKey, performance.now());
    hoverKey = null;
    if (!raf) raf = requestAnimationFrame(draw);
  };
  heroEl.addEventListener("pointermove", (e) => light(e.clientX, e.clientY));
  heroEl.addEventListener("pointerleave", leave);
  heroEl.addEventListener("touchmove", (e) => { const t = e.touches[0]; if (t) light(t.clientX, t.clientY); }, { passive: true });
  heroEl.addEventListener("touchend", leave, { passive: true });
  new ResizeObserver(resizeTiles).observe(heroEl);
}

/* ---------- Opening: reveal the message piece by piece while scrolling ---------- */
const opening = $(".opening");
const steps = [...opening.querySelectorAll("[data-step]")];
let shown = 0, wanted = 0, pumpTimer = null;

function pump() {
  if (shown >= wanted) { pumpTimer = null; return; }
  steps[shown++].classList.add("shown");
  pumpTimer = setTimeout(pump, 260); // keep them one after another, even on a fast scroll
}
function want(n) {
  wanted = Math.max(wanted, Math.min(n, steps.length));
  if (!pumpTimer) pump();
}
function onOpeningScroll() {
  const r = opening.getBoundingClientRect(), vh = innerHeight;
  if (r.bottom < vh) return want(steps.length);
  const into = vh * 0.75 - r.top;                     // px scrolled into the section
  const per = Math.max(60, (r.height - vh) / steps.length);
  if (into > 0) want(1 + Math.floor(into / per));
}
if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
  steps.forEach((el) => el.classList.add("shown"));
} else {
  addEventListener("scroll", onOpeningScroll, { passive: true });
  onOpeningScroll();
}

/* ---------- Value: two inputs, one visual report ---------- */
// General averages for employers in the region (full- and part-time staff together):
// about 35 hours a week and €45 labour cost per working hour, over about 44 working weeks.
const WEEK = 35, RATE = 45;
const WORK_WEEKS = 44;
const AUTOMATABLE = 0.5;                 // share of the routine work AI can typically take over
const RING = 2 * Math.PI * 52;           // circumference of the ring
const peopleIn = $("#people");
const fmt = (n) => Math.round(n).toLocaleString("en").replace(/,/g, ".");
let ringPlayed = false;

function renderValue() {
  const people = +peopleIn.value;
  const share = +$('input[name="work"]:checked').value;  // routine share of the week (our estimate per type of work)
  const perPerson = WEEK * share * AUTOMATABLE;         // hours back per person, per week
  const moved = people * perPerson * WORK_WEEKS;

  $("#peopleOut").innerHTML = `<b>${people}</b> ${people === 1 ? "person" : "people"}`;
  $("#perPerson").textContent = (Math.round(perPerson * 2) / 2).toString().replace(".", ",") + " h";
  $("#moved").textContent = fmt(moved) + " h";
  $("#worth").textContent = "€" + fmt(moved * RATE);

  // ring: whole circle = the week; light arc = routine work; mint arc = the part AI frees up
  const busyLen = RING * share, freeLen = ringPlayed ? busyLen * AUTOMATABLE : 0;
  $(".r-busy").style.strokeDasharray = `${busyLen} ${RING}`;
  $(".r-free").style.strokeDasharray = `${freeLen} ${RING}`;
}
peopleIn.addEventListener("input", renderValue);
document.querySelectorAll('input[name="work"]').forEach((el) => el.addEventListener("change", renderValue));
renderValue();

new IntersectionObserver(([e], io) => {
  if (!e.isIntersecting) return;
  io.disconnect();
  setTimeout(() => { ringPlayed = true; renderValue(); }, 600);
}, { threshold: 0.5 }).observe($(".ring"));

/* ---------- Contact form ---------- */
// Works out of the box on Netlify (Netlify Forms picks up data-netlify="true").
// On other hosts, set the form's action to a form service such as
// https://formspree.io/f/<your-id> — this handler posts to whatever action is set.
const CONTACT_EMAIL = "hello@example.com";
$("form.contact").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target, note = $(".form-note"), button = form.querySelector("button");
  button.disabled = true;
  note.hidden = true;
  try {
    const external = /^https?:/.test(form.getAttribute("action"));
    const res = await fetch(form.getAttribute("action") || "/", {
      method: "POST",
      headers: external
        ? { Accept: "application/json" }
        : { "Content-Type": "application/x-www-form-urlencoded" },
      body: external ? new FormData(form) : new URLSearchParams(new FormData(form)).toString(),
    });
    if (!res.ok) throw new Error(res.status);
    form.reset();
    note.textContent = "Thank you — we'll be in touch within one working day.";
  } catch {
    note.textContent = `Sorry, that didn't go through. Please email us at ${CONTACT_EMAIL}.`;
  }
  note.hidden = false;
  button.disabled = false;
});

$("#year").textContent = new Date().getFullYear();

/* ---------- Scroll reveal: every text and block appears one after another ---------- */
const REVEAL = [
  ".statement p", ".section-title", ".intro", ".solution",
  ".team-size", ".chips", ".ring-wrap", ".stats > div", ".note",
  "#contact .center", "form.contact > .field", "form.contact > .btn-icon", ".form-consent",
  ".site-footer > *",
].join(",");
const revealEls = [...document.querySelectorAll(REVEAL)];
revealEls.forEach((el) => el.classList.add("reveal"));

if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
  revealEls.forEach((el) => el.classList.add("in"));
} else {
  // Elements that scroll into view are queued and shown one by one, in page order.
  const queue = new Set();
  let revealTimer = null;
  const nextReveal = () => {
    const el = revealEls.find((x) => queue.has(x));
    if (!el) { revealTimer = null; return; }
    queue.delete(el);
    el.classList.add("in");
    revealTimer = setTimeout(nextReveal, 140);
  };
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    queue.add(en.target);
    if (!revealTimer) nextReveal();
  }), { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
  revealEls.forEach((el) => io.observe(el));
}
