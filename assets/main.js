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

/* ---------- Value: same team, better hours ---------- */
const AUTOMATABLE = 0.5; // share of repetitive work AI can typically take over
const WORK_WEEKS = 46;
const WEEK = 40;
const people = $("#people"), hours = $("#hours"), rate = $("#rate");
const bar = $(".week-bar");
let mode = "today";

const euro = (n) => "€" + Math.round(n).toLocaleString("en").replace(/,/g, ".");

function renderValue() {
  const p = +people.value, h = +hours.value, r = +rate.value;
  $("#peopleOut").textContent = p;
  $("#hoursOut").textContent = h;
  $("#rateOut").textContent = "€" + r;

  const freed = h * AUTOMATABLE;               // hours per person per week
  const busy = mode === "today" ? h : h - freed;
  const moved = mode === "today" ? 0 : freed;
  const core = WEEK - h;
  const pct = (x) => `${(x / WEEK) * 100}%`;
  bar.querySelector(".seg-busy").style.width = pct(busy);
  bar.querySelector(".seg-analysis").style.width = pct(moved / 3);
  bar.querySelector(".seg-clients").style.width = pct(moved / 3);
  bar.querySelector(".seg-ideas").style.width = pct(moved / 3);
  bar.querySelector(".seg-core").style.width = pct(core);

  $("#spend").textContent = euro(p * h * r * WORK_WEEKS);
  $("#moved").textContent = Math.round(p * freed * WORK_WEEKS).toLocaleString("en").replace(/,/g, ".") + " h";
}
[people, hours, rate].forEach((el) => el.addEventListener("input", renderValue));
document.querySelectorAll(".week-toggle button").forEach((b) => b.addEventListener("click", () => {
  mode = b.dataset.mode;
  document.querySelectorAll(".week-toggle button").forEach((x) => x.classList.toggle("active", x === b));
  renderValue();
}));
renderValue();

// Show the shift once, the first time the section comes into view
new IntersectionObserver(([e], io) => {
  if (!e.isIntersecting) return;
  io.disconnect();
  setTimeout(() => $('.week-toggle [data-mode="flow"]').click(), 900);
}, { threshold: 0.5 }).observe($(".week"));

/* ---------- Contact form ---------- */
// Connect to a form service (e.g. Formspree) to actually receive messages.
$("form.contact").addEventListener("submit", (e) => {
  e.preventDefault();
  e.target.reset();
  $(".form-note").hidden = false;
});

$("#year").textContent = new Date().getFullYear();

/* ---------- Scroll reveal ---------- */
const els = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: 0.1 });
  els.forEach((el) => io.observe(el));
} else {
  els.forEach((el) => el.classList.add("in"));
}
