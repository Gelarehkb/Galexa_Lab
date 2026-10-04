const $ = (s, el = document) => el.querySelector(s);

/* ---------- Hero background: calm, blurred colour field ---------- */
function heroSVG(w = 1600, h = 900) {
  const fields = [
    { cx: 0.78, cy: 0.30, r: 0.42, c: "#e4ddd2", o: 0.9 },
    { cx: 0.95, cy: 0.85, r: 0.38, c: "#d5dbd6", o: 0.8 },
    { cx: 0.55, cy: 0.95, r: 0.30, c: "#ece4da", o: 0.7 },
  ];
  const circles = fields
    .map((f) => `<circle cx="${f.cx * w}" cy="${f.cy * h}" r="${f.r * w}" fill="${f.c}" opacity="${f.o}" filter="url(#blur)"/>`)
    .join("");
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${w * 0.08}"/></filter>
      <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${w * 0.006}"/></filter>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .05 0"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="#faf9f6"/>
    ${circles}
    <circle cx="${0.74 * w}" cy="${0.42 * h}" r="${0.035 * w}" fill="#2b2b2b" opacity=".85" filter="url(#soft)"/>
    <rect width="${w}" height="${h}" filter="url(#grain)"/>
  </svg>`;
}
$(".hero-art").innerHTML = heroSVG();

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

/* ---------- Time-back calculator ---------- */
const AUTOMATABLE = 0.5; // share of repetitive work that can typically be automated
const WORK_WEEKS = 46;
const people = $("#people"), hours = $("#hours");
function calc() {
  $("#peopleOut").textContent = people.value;
  $("#hoursOut").textContent = hours.value;
  const total = Math.round(people.value * hours.value * WORK_WEEKS * AUTOMATABLE);
  $("#result").textContent = total.toLocaleString("en");
}
people.addEventListener("input", calc);
hours.addEventListener("input", calc);
calc();

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
