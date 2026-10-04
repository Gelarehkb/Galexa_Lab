/* ============================================================
   Isometric office: overwhelmed by default, calm on hover
   ============================================================ */
(() => {
  const host = document.getElementById("office");
  if (!host) return;

  /* ---------- Projection & primitives ---------- */
  const C = Math.cos(Math.PI / 6), S = 0.5;
  const P = (x, y, z = 0) => [(x - y) * C, (x + y) * S - z];
  const f = (n) => Math.round(n * 10) / 10;
  const pts = (a) => a.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
  const EDGE = 'stroke="#d2d2d7" stroke-width=".5" stroke-linejoin="round"';
  const poly = (a, fill, extra = EDGE) => `<polygon points="${pts(a)}" fill="${fill}" ${extra}/>`;
  const line = ([x1, y1], [x2, y2], stroke, w) =>
    `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/>`;

  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pick = (a) => a[Math.floor(rnd() * a.length)];

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const track = ([x, y], pad = 0) => {
    minX = Math.min(minX, x - pad); maxX = Math.max(maxX, x + pad);
    minY = Math.min(minY, y - pad); maxY = Math.max(maxY, y + pad);
  };

  // Axis-aligned box: draws the three faces visible from the viewer.
  function box(x, y, z, w, d, h, c = {}) {
    const top = c.top || "#ffffff", sx = c.sx || "#e2e2e6", sy = c.sy || "#efeff2";
    const T = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
    const X = [P(x + w, y, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x + w, y, z)];
    const Y = [P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)];
    return poly(X, sx) + poly(Y, sy) + poly(T, top);
  }
  // Flat quad on the plane y = const (a surface facing the viewer's left)
  const quadY = (x0, x1, z0, z1, y, fill) =>
    poly([P(x0, y, z1), P(x1, y, z1), P(x1, y, z0), P(x0, y, z0)], fill, "");

  /* ---------- Palette ---------- */
  const SKIN = ["#f1d3bd", "#e2b896", "#c68f6a", "#8d5b3e", "#f4dccb", "#a86f4c"];
  const HAIR = ["#2a2522", "#3b2b22", "#1f1f22", "#6b4a33", "#4a3a30", "#8a8580"];
  const SHIRT = ["#f4f4f5", "#e8e8eb", "#dfe5ec", "#efe9e1", "#e4ebe4", "#ece4ea"];
  const CHAIR = { top: "#f3f3f5", sx: "#d8d8dd", sy: "#e7e7eb" };

  /* ---------- Furniture ---------- */
  function desk(x0, y0, w, d, pedestalLeft) {
    const px = pedestalLeft ? x0 + 2 : x0 + w - 30;
    const panelX = pedestalLeft ? x0 + w - 5 : x0 + 2;
    let s = box(panelX, y0 + 2, 0, 3, d - 4, 34);
    s += box(px, y0 + 2, 0, 28, d - 4, 34);
    for (const z of [12, 23]) s += line(P(px + 3, y0 + d - 2, z), P(px + 25, y0 + d - 2, z), "#d6d6db", 0.6);
    s += box(x0, y0, 34, w, d, 3, { top: "#ffffff", sx: "#e3e3e7", sy: "#ececef" });
    return s;
  }

  function chairBase(x, y) {
    let s = "";
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + 0.3;
      const ex = x + Math.cos(a) * 10, ey = y + Math.sin(a) * 10;
      s += line(P(x, y, 4), P(ex, ey, 2), "#bdbdc2", 1.6);
      const [wx, wy] = P(ex, ey, 1);
      s += `<circle cx="${f(wx)}" cy="${f(wy)}" r="1.5" fill="#8f8f95"/>`;
    }
    s += line(P(x, y, 4), P(x, y, 18), "#c4c4c9", 2.4);
    return s;
  }
  const chairSeat = (x, y) => box(x - 11, y - 11, 18, 22, 22, 4, CHAIR);

  function keyboard(x, y) {
    return box(x - 9, y - 3.5, 37, 18, 7, 1, { top: "#f1f1f3", sx: "#d6d6da", sy: "#e2e2e6" });
  }

  function monitor(x, y, facesViewer) {
    let s = box(x - 6, y - 5, 37, 12, 10, 1, { top: "#e6e6ea", sx: "#cfcfd4", sy: "#dadade" });
    s += box(x - 1.5, y - 1.5, 38, 3, 3, 6, { top: "#d9d9de", sx: "#c3c3c8", sy: "#cfcfd4" });
    s += box(x - 15, y - 1.5, 43, 30, 3, 20, {
      top: "#e6e6ea", sx: "#cbcbd0", sy: facesViewer ? "#2b2e34" : "#e9e9ed",
    });
    if (facesViewer) {
      const yp = y + 1.6;
      s += `<g class="stress">
        ${quadY(x - 13.5, x + 13.5, 44.5, 61.5, yp, "#3a2f31")}
        ${quadY(x - 11, x + 6, 56.5, 59, yp, "#e0614a")}
        ${quadY(x - 11, x + 10, 52, 54.5, yp, "#f0a33a")}
        ${quadY(x - 11, x + 2, 47.5, 50, yp, "#e0614a")}
      </g>
      <g class="calm-el">
        ${quadY(x - 13.5, x + 13.5, 44.5, 61.5, yp, "#e2f5e9")}
        <polyline points="${pts([P(x - 5, yp, 53), P(x - 1.5, yp, 49.5), P(x + 5, yp, 57.5)])}" fill="none" stroke="#2fa862" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </g>`;
    }
    return s;
  }

  function pile(x, y) {
    let s = '<g class="stress">';
    for (let k = 0; k < 5; k++) {
      s += box(x + (rnd() - 0.5) * 3, y + (rnd() - 0.5) * 3, 37 + k * 2.2, 16, 12, 2,
        { top: "#ffffff", sx: "#dedee2", sy: "#ebebee" });
    }
    s += box(x + 18, y + 1, 37, 6, 10, 14, { top: "#f6d9cf", sx: "#d98c78", sy: "#e9a896" }); // binder
    s += "</g>";
    // calm: a cup of coffee instead
    s += `<g class="calm-el">${box(x + 5, y + 3, 37, 6, 6, 7, { top: "#7a5236", sx: "#dedee2", sy: "#f4f4f6" })}</g>`;
    return s;
  }

  function plant(x, y) {
    let s = box(x - 3, y - 3, 37, 6, 6, 6, { top: "#cfcfd3", sx: "#d9d9dd", sy: "#e8e8eb" });
    for (const [dx, dy, dz, r] of [[-2, 1, 47, 3.4], [2, -2, 48, 3.2], [0, 0, 51, 3.4], [-1, -3, 50, 2.8], [2, 2, 46, 2.8]]) {
      const [cx, cy] = P(x + dx, y + dy, dz);
      s += `<circle class="leaf" cx="${f(cx)}" cy="${f(cy)}" r="${r}"/>`;
    }
    return s;
  }

  /* ---------- People (drawn as billboards) ---------- */
  function torso(bx, by, look) {
    return `<path d="M${bx - 9},${by - 24} L${bx - 10},${by - 43} Q${bx - 10},${by - 50} ${bx - 4},${by - 50} L${bx + 4},${by - 50} Q${bx + 10},${by - 50} ${bx + 10},${by - 43} L${bx + 9},${by - 24} Z" fill="${look.shirt}" stroke="#c9c9ce" stroke-width=".6"/>`;
  }

  function personFront([bx, by], look) {
    const hy = by - 59;
    let s = "";
    // upper arms reaching to the desk (forearms hidden by the desk)
    s += `<path d="M${bx - 8},${by - 45} Q${bx - 16},${by - 36} ${bx - 22},${by - 26}" stroke="${look.shirt}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M${bx + 8},${by - 45} Q${bx + 4},${by - 34} ${bx - 6},${by - 26}" stroke="${look.shirt}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += torso(bx, by, look);
    if (look.long) s += `<rect x="${bx - 8.6}" y="${hy - 2}" width="17.2" height="12" rx="4" fill="${look.hair}"/>`;
    s += `<rect x="${bx - 2.5}" y="${by - 54}" width="5" height="5" fill="${look.skin}"/>`;
    s += `<circle cx="${bx}" cy="${hy}" r="7.5" fill="${look.skin}"/>`;
    s += `<path d="M${bx - 7.9},${hy - 1.5} A7.9 7.9 0 0 1 ${bx + 7.9},${hy - 1.5} Q${bx + 2},${hy - 4.5} ${bx - 7.9},${hy - 1.5} Z" fill="${look.hair}"/>`;
    if (look.bun) s += `<circle cx="${bx + 1}" cy="${hy - 9}" r="3.2" fill="${look.hair}"/>`;
    s += `<circle cx="${bx - 2.7}" cy="${hy + 1}" r=".9" fill="#2a2a2a"/><circle cx="${bx + 2.7}" cy="${hy + 1}" r=".9" fill="#2a2a2a"/>`;
    // stressed face
    s += `<g class="stress"><path d="M${bx - 4.6},${hy - 1.4} L${bx - 1.6},${hy - .4} M${bx + 4.6},${hy - 1.4} L${bx + 1.6},${hy - .4}" stroke="${look.hair}" stroke-width=".9" stroke-linecap="round"/>
      <path d="M${bx - 2.4},${hy + 5} Q${bx},${hy + 3.2} ${bx + 2.4},${hy + 5}" stroke="#7a4b3a" stroke-width=".9" fill="none" stroke-linecap="round"/>
      <path d="M${bx + 9},${hy - 4} q1.7 2.7 0 3.5 q-1.7 -.8 0 -3.5z" fill="#8ec5e8"/></g>`;
    // calm face
    s += `<g class="calm-el"><path d="M${bx - 3},${hy + 3.6} Q${bx},${hy + 6.6} ${bx + 3},${hy + 3.6}" stroke="#7a4b3a" stroke-width=".9" fill="none" stroke-linecap="round"/>
      <circle cx="${bx - 4.6}" cy="${hy + 3.4}" r="1.4" fill="#f19c94" opacity=".55"/><circle cx="${bx + 4.6}" cy="${hy + 3.4}" r="1.4" fill="#f19c94" opacity=".55"/></g>`;
    return s;
  }

  function personBack([bx, by], look) {
    const hy = by - 59;
    let s = "";
    s += `<path d="M${bx - 7},${by - 45} Q${bx + 6},${by - 52} ${bx + 20},${by - 50}" stroke="${look.shirt}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M${bx + 7},${by - 45} Q${bx + 18},${by - 48} ${bx + 30},${by - 55}" stroke="${look.shirt}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += torso(bx, by, look);
    s += `<circle cx="${bx - 7.4}" cy="${hy + 1}" r="1.7" fill="${look.skin}"/><circle cx="${bx + 7.4}" cy="${hy + 1}" r="1.7" fill="${look.skin}"/>`;
    s += `<circle cx="${bx}" cy="${hy}" r="7.8" fill="${look.hair}"/>`;
    if (look.long) s += `<rect x="${bx - 7.8}" y="${hy}" width="15.6" height="11" rx="4" fill="${look.hair}"/>`;
    if (look.bun) s += `<circle cx="${bx}" cy="${hy - 8.5}" r="3.2" fill="${look.hair}"/>`;
    return s;
  }

  function randomLook() {
    return { skin: pick(SKIN), hair: pick(HAIR), shirt: pick(SHIRT), long: rnd() < 0.4, bun: rnd() < 0.2 };
  }

  /* ---------- Thought bubbles & smileys (overlay layer) ---------- */
  const ICONS = [
    (u, v) => { // tangled scribble
      const a = [];
      for (let k = 0; k < 14; k++) a.push([u + (rnd() - 0.5) * 15, v + (rnd() - 0.5) * 11]);
      return `<polyline points="${pts(a)}" fill="none" stroke="#d6543d" stroke-width="1.1" stroke-linejoin="round"/>`;
    },
    (u, v) => `<rect x="${u - 7}" y="${v - 5}" width="14" height="10" rx="1.2" fill="#fff" stroke="#6b6b70"/>
      <path d="M${u - 7},${v - 5} l7,5.5 l7,-5.5" fill="none" stroke="#6b6b70"/>
      <circle cx="${u + 7}" cy="${v - 5}" r="4.8" fill="#e0533d"/>
      <text x="${u + 7}" y="${v - 3.1}" font-size="5.4" font-weight="700" text-anchor="middle" fill="#fff" font-family="Helvetica, Arial, sans-serif">${30 + Math.floor(rnd() * 69)}</text>`,
    (u, v) => `<circle cx="${u}" cy="${v}" r="7" fill="#fff" stroke="#6b6b70" stroke-width="1.1"/>
      <path d="M${u},${v} V${v - 4.6} M${u},${v} L${u + 3.6},${v + 1.6}" stroke="#d6543d" stroke-width="1.2" stroke-linecap="round"/>`,
    (u, v) => `<text x="${u}" y="${v + 5}" font-size="14" font-weight="700" text-anchor="middle" fill="#d6543d" font-family="Helvetica, Arial, sans-serif">!!</text>`,
    (u, v) => `<rect x="${u - 7}" y="${v - 6}" width="10" height="12" fill="#fff" stroke="#8a8a90" stroke-width=".9" transform="rotate(-14 ${u} ${v})"/>
      <rect x="${u - 4}" y="${v - 6}" width="10" height="12" fill="#fff" stroke="#8a8a90" stroke-width=".9" transform="rotate(10 ${u} ${v})"/>
      <path d="M${u - 1.5},${v - 2} h6 M${u - 1.5},${v + 1} h6 M${u - 1.5},${v + 4} h4" stroke="#b5b5ba" stroke-width=".8" transform="rotate(10 ${u} ${v})"/>`,
    (u, v) => `<polyline points="${u - 7},${v - 5} ${u - 2},${v - 1} ${u + 1},${v - 3} ${u + 7},${v + 4}" fill="none" stroke="#d6543d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M${u + 7},${v + 4} l-4,.3 M${u + 7},${v + 4} l-.6,-4" stroke="#d6543d" stroke-width="1.5" stroke-linecap="round"/>`,
    (u, v) => `<text x="${u}" y="${v + 5}" font-size="13" font-weight="700" text-anchor="middle" fill="#6b6b70" font-family="Helvetica, Arial, sans-serif">?!</text>`,
  ];

  const sparkle = (x, y, s, fill = "#f2c14e") =>
    `<path d="M${x},${y - s} Q${x},${y} ${x + s},${y} Q${x},${y} ${x},${y + s} Q${x},${y} ${x - s},${y} Q${x},${y} ${x},${y - s} Z" fill="${fill}"/>`;

  function personUI([bx, by], side) {
    const u = bx + side * 18, v = by - 94;
    track([u, v], 26);
    const delay = (-rnd() * 2).toFixed(2);
    const cloud = [[-9, 2, 9], [0, -4, 11], [10, 1, 9], [2, 6, 9]];
    let s = `<g class="stress"><g class="jitter" style="animation-delay:${delay}s">`;
    s += `<circle cx="${bx + side * 5}" cy="${by - 72}" r="1.8" fill="#fff" stroke="#cdcdd2" stroke-width=".8"/>`;
    s += `<circle cx="${bx + side * 10}" cy="${by - 79}" r="2.8" fill="#fff" stroke="#cdcdd2" stroke-width=".8"/>`;
    s += cloud.map(([dx, dy, r]) => `<circle cx="${u + dx}" cy="${v + dy}" r="${r + 0.8}" fill="#cdcdd2"/>`).join("");
    s += cloud.map(([dx, dy, r]) => `<circle cx="${u + dx}" cy="${v + dy}" r="${r}" fill="#fff"/>`).join("");
    s += pick(ICONS)(u, v);
    s += "</g></g>";

    s += `<g class="calm-el"><g class="float" style="animation-delay:${delay}s">
      <circle cx="${u}" cy="${v}" r="11.5" fill="#35c06c"/>
      <circle cx="${u - 3.8}" cy="${v - 2.6}" r="1.4" fill="#fff"/><circle cx="${u + 3.8}" cy="${v - 2.6}" r="1.4" fill="#fff"/>
      <path d="M${u - 5},${v + 2} Q${u},${v + 7.5} ${u + 5},${v + 2}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      ${sparkle(u + side * 17, v - 9, 4)}${sparkle(u - side * 15, v - 12, 2.6)}${sparkle(u + side * 11, v + 12, 2.2, "#9ad9b0")}
    </g></g>`;
    return s;
  }

  /* ---------- Platform ---------- */
  const RX = 345, RY = 365, N = 160, TH = 16, RAIL = 24;
  const rim = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    const k = 1 + 0.045 * Math.sin(3 * t + 0.6) + 0.03 * Math.sin(5 * t + 2.1);
    rim.push([RX * k * Math.sign(c) * Math.abs(c) ** 0.6, RY * k * Math.sign(s) * Math.abs(s) ** 0.6]);
  }

  let floor = "", railBack = "", railFront = "";
  for (let i = 0; i < N; i++) {
    const a = rim[i], b = rim[(i + 1) % N];
    track(P(a[0], a[1], 0), 10); track(P(a[0], a[1], -TH), 10); track(P(a[0], a[1], RAIL), 10);
    floor += poly([P(...a, 0), P(...b, 0), P(...b, -TH), P(...a, -TH)], "#e8e8eb", 'stroke="#e8e8eb" stroke-width=".8"');
    const glass = poly([P(...a, 0), P(...b, 0), P(...b, RAIL), P(...a, RAIL)], "rgba(190,214,226,.16)", "")
      + line(P(...a, RAIL), P(...b, RAIL), "#c6d9e3", 1.6)
      + (i % 8 === 0 ? line(P(...a, 0), P(...a, RAIL), "rgba(165,192,207,.55)", 0.8) : "");
    if ((a[0] + b[0]) / 2 + (a[1] + b[1]) / 2 > 0) railFront += glass; else railBack += glass;
  }
  floor += poly(rim.map((p) => P(...p, 0)), "#fafafa", 'stroke="#e2e2e6" stroke-width="1"');
  const [sx, sy] = P(0, 0, -TH);

  /* ---------- Pods ---------- */
  const pods = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      pods.push({ cx: (j - 1) * 188 + (i === 1 ? 20 : -8), cy: (i - 1) * 190 + (j === 1 ? 12 : 0) });
    }
  }
  pods.sort((a, b) => a.cx + a.cy - (b.cx + b.cy));

  let scene = "", ui = "";
  pods.forEach(({ cx, cy }, i) => {
    const fx = cx + 22, fy = cy - 72, nx = cx - 22, ny = cy + 72;
    const lookF = randomLook(), lookN = randomLook();
    const [ex, ey] = P(cx, cy, 0);
    const plantFar = rnd() < 0.5;

    let g = `<g class="pod" data-pod="${i}">`;
    g += `<ellipse class="stress" cx="${f(ex)}" cy="${f(ey)}" rx="120" ry="70" fill="#f8e6e0" filter="url(#patch)"/>`;
    g += `<ellipse class="calm-el" cx="${f(ex)}" cy="${f(ey)}" rx="120" ry="70" fill="#d8f2e2" filter="url(#patch)"/>`;
    // far person (faces the viewer)
    g += chairBase(fx, fy) + chairSeat(fx, fy) + box(fx - 11, fy - 14, 22, 22, 3, 26, CHAIR);
    g += personFront(P(fx, fy), lookF);
    // far desk
    g += desk(cx - 50, cy - 46, 100, 46, true);
    g += keyboard(fx, cy - 36);
    g += plantFar ? plant(cx - 38, cy - 24) : pile(cx - 46, cy - 34);
    g += monitor(fx, cy - 10, false);
    // near desk
    g += desk(cx - 50, cy, 100, 46, false);
    g += monitor(nx, cy + 8, true);
    g += plantFar ? pile(cx + 18, cy + 18) : plant(cx + 38, cy + 24);
    g += keyboard(nx, cy + 34);
    // near person (back to the viewer)
    g += chairBase(nx, ny) + chairSeat(nx, ny);
    g += personBack(P(nx, ny), lookN);
    g += box(nx - 11, ny + 11, 18, 22, 3, 20, CHAIR);
    g += "</g>";
    scene += g;

    ui += `<g class="pod-ui" data-pod="${i}">${personUI(P(fx, fy), 1)}${personUI(P(nx, ny), -1)}</g>`;
  });

  const w = maxX - minX, h = maxY - minY;
  host.innerHTML = `<svg viewBox="${f(minX)} ${f(minY)} ${f(w)} ${f(h)}" xmlns="http://www.w3.org/2000/svg" role="img"
      aria-label="An isometric office. People at their desks are overwhelmed by emails, deadlines and paperwork. Hovering over them makes them calm, smiling and creative.">
    <defs>
      <filter id="patch" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="16"/></filter>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="20"/></filter>
    </defs>
    <ellipse cx="${f(sx)}" cy="${f(sy + 24)}" rx="${f(w * 0.42)}" ry="${f(h * 0.3)}" fill="#000" opacity=".07" filter="url(#shadow)"/>
    ${floor}${railBack}${scene}${railFront}${ui}
  </svg>`;

  /* ---------- Interaction ---------- */
  const svg = host.querySelector("svg");
  const centers = pods.map(({ cx, cy }) => P(cx, cy, 40));
  const calm = pods.map(() => false);
  const total = pods.length * 2;
  const countEl = document.getElementById("flowCount");
  const hintEl = document.getElementById("flowHint");
  const touchy = matchMedia("(hover: none)").matches;
  let timers = [];

  if (document.getElementById("flowTotal")) document.getElementById("flowTotal").textContent = total;

  function update() {
    const n = calm.filter(Boolean).length * 2;
    if (countEl) countEl.textContent = n;
    if (hintEl) hintEl.textContent = n === total ? "everyone's in flow." : touchy ? "tap the office" : "hover over the office";
  }
  function set(i, on) {
    if (calm[i] === on) return;
    calm[i] = on;
    svg.querySelectorAll(`[data-pod="${i}"]`).forEach((el) => el.classList.toggle("calm", on));
    update();
  }
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const toSvg = (e) => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  const byDistance = (p) => centers.map(([x, y], i) => [Math.hypot(p.x - x, p.y - y), i]).sort((a, b) => a[0] - b[0]);

  svg.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    clearTimers();
    const p = toSvg(e);
    byDistance(p).forEach(([d, i]) => d < 150 && set(i, true));
  });
  svg.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "mouse") return;
    clearTimers();
    pods.forEach((_, i) => set(i, false));
  });
  // Touch: a tap calms everyone (spreading from the tap), a second tap resets.
  svg.addEventListener("pointerup", (e) => {
    if (e.pointerType === "mouse") return;
    clearTimers();
    const on = calm.some((c) => !c);
    timers = byDistance(toSvg(e)).map(([, i], k) => setTimeout(() => set(i, on), k * 90));
  });

  update();
})();
