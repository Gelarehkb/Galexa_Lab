/* ============================================================
   3D isometric office (three.js)
   A glass-walled office floor high above a minimal pastel skyline.
   People are overwhelmed by default; near the cursor they switch
   to focused, creative work. Falls back to office.js if WebGL fails.
   ============================================================ */
(async () => {
  // Minimal towers around the office. Set to false for a clean background.
  const SHOW_SKYLINE = true;
  const host = document.getElementById("office");
  const target = document.querySelector(".office-target");
  if (!host || !target) return;

  const fallback = () => {
    host.innerHTML = "";
    host.className = "office";
    target.appendChild(host); // flat version lives inside the target box
    const s = document.createElement("script");
    s.src = "assets/office.js";
    document.body.appendChild(s);
  };

  let THREE, RoundedBoxGeometry, RoomEnvironment;
  try {
    THREE = await import("three");
    ({ RoundedBoxGeometry } = await import("three/addons/geometries/RoundedBoxGeometry.js"));
    ({ RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js"));
  } catch (e) {
    return fallback();
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    return fallback();
  }

  host.classList.add("is-3d");
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const overlay = document.createElement("div");
  overlay.className = "office-overlay";
  host.appendChild(overlay);

  /* ---------- Scene, light, camera ---------- */
  const SKY = 0xeef0f2;
  const scene = new THREE.Scene();
  if (SHOW_SKYLINE) scene.fog = new THREE.Fog(0xf1eff0, 46, 92);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xf3eee6, 1.05));
  const sun = new THREE.DirectionalLight(0xfff3e4, 1.7);
  sun.position.set(-5, 12, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 32 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  camera.position.set(1, 0.82, 1).multiplyScalar(30);
  camera.lookAt(0, 0.4, 0);

  /* ---------- Helpers ---------- */
  let seed = 21;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const Y = new THREE.Vector3(0, 1, 0);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  const matCache = new Map();
  const M = (color, o = {}) => {
    const key = color + JSON.stringify(o);
    if (!matCache.has(key)) {
      matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, envMapIntensity: 0.9, ...o }));
    }
    return matCache.get(key);
  };
  const geoCache = new Map();
  const RB = (w, h, d, r = 0.015) => {
    const key = [w, h, d, r].join();
    if (!geoCache.has(key)) geoCache.set(key, new RoundedBoxGeometry(w, h, d, 3, r));
    return geoCache.get(key);
  };
  function add(parent, geo, mat, x = 0, y = 0, z = 0, shadows = true) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = shadows;
    parent.add(m);
    return m;
  }

  const cyl = new THREE.CylinderGeometry(1, 1, 1, 16);
  const sph = new THREE.SphereGeometry(1, 20, 14);
  function limb(parent, mat, jointMat, r, jr = r) {
    const m = add(parent, cyl, mat);
    const j = add(parent, sph, jointMat);
    j.scale.setScalar(jr);
    return { m, j, r };
  }
  const _d = new THREE.Vector3();
  function placeLimb(L, a, b) {
    _d.copy(b).sub(a);
    const len = _d.length();
    L.m.position.copy(a).addScaledVector(_d, 0.5);
    L.m.scale.set(L.r, len, L.r);
    L.m.quaternion.setFromUnitVectors(Y, _d.normalize());
    L.j.position.copy(b);
  }

  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  const radialTex = canvasTex(128, 128, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, "rgba(255,255,255,1)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });

  /* ---------- Screens: a long to-do list that ticks itself off ---------- */
  function taskScreen() {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 160;
    const g = c.getContext("2d");
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const ROWS = 8;
    const lens = Array.from({ length: ROWS }, () => 70 + rnd() * 120);
    const overdue = Array.from({ length: ROWS }, () => rnd() < 0.35);
    const open = 14 + Math.floor(rnd() * 30);
    let drawn = -1;
    function draw(done) {
      if (done === drawn) return;
      drawn = done;
      const all = done >= ROWS;
      g.fillStyle = all ? "#f1f9f4" : "#fbf7f5"; g.fillRect(0, 0, 256, 160);
      g.fillStyle = all ? "#d3efdd" : "#f3e2dd"; g.fillRect(0, 0, 256, 24);
      g.fillStyle = all ? "#4f9e74" : "#c98a80";
      g.font = "bold 13px Helvetica, Arial"; g.textAlign = "left";
      g.fillText(all ? "All done  \u2713" : `Tasks \u00b7 ${open - done} open`, 10, 17);
      for (let i = 0; i < ROWS; i++) {
        const y = 32 + i * 16, ok = i < done;
        g.fillStyle = ok ? "#cfeedb" : "#ffffff";
        g.strokeStyle = ok ? "#7cc49a" : "#dcc7c2"; g.lineWidth = 1.5;
        g.fillRect(10, y, 10, 10); g.strokeRect(10, y, 10, 10);
        if (ok) {
          g.strokeStyle = "#4f9e74"; g.lineWidth = 2;
          g.beginPath(); g.moveTo(12, y + 5); g.lineTo(14.5, y + 8); g.lineTo(18.5, y + 2); g.stroke();
        }
        g.fillStyle = ok ? "#d9eee2" : overdue[i] ? "#efc4bc" : "#e7dfdc";
        g.fillRect(28, y + 3, lens[i], 5);
        if (!ok && overdue[i]) { g.fillStyle = "#e8aaa0"; g.beginPath(); g.arc(240, y + 5, 3, 0, Math.PI * 2); g.fill(); }
      }
      tex.needsUpdate = true;
    }
    draw(0);
    return { tex, rows: ROWS, draw };
  }

  /* ---------- Materials ---------- */
  const mat = {
    floor: M("#f8f7f5", { roughness: 0.7 }),
    tableTop: M("#fbfbfa", { roughness: 0.35 }),
    leg: M("#dcd8d2", { roughness: 0.4, metalness: 0.2 }),
    stem: M("#d6d3ce", { roughness: 0.35, metalness: 0.3 }),
    monitor: M("#eceaea", { roughness: 0.25, metalness: 0.25 }),
    bezel: M("#dcdcdf", { roughness: 0.3 }),
    keyboard: M("#f2f2f3", { roughness: 0.5 }),
    pants: M("#8d919a", { roughness: 0.85 }),
    shoe: M("#707177", { roughness: 0.6 }),
    paper: M("#ffffff", { roughness: 0.9 }),
    pot: M("#ebe7e1", { roughness: 0.8 }),
    trunk: M("#cdbca8", { roughness: 0.8 }),
    rug: M("#efe7dc", { roughness: 1 }),
    sofa: M("#e3eadf", { roughness: 0.9 }),
    frame: M("#f4f5f6", { roughness: 0.25, metalness: 0.5 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: "#d7e7ee", transparent: true, opacity: 0.3, vertexColors: true, roughness: 0.04, metalness: 0,
      envMapIntensity: 1.5, side: THREE.DoubleSide, depthWrite: false,
    }),
  };
  const BINDERS = ["#efcbc1", "#f1e2b8", "#d3dae2"];
  const CHAIRS = ["#e2ebe0", "#f1e3e1", "#e0e8f1", "#f3ecda", "#ebe5f1", "#f1e6dc"];
  const SKIN = ["#f0cfb6", "#dcb08c", "#c48a63", "#8b5a3c", "#f3d9c6", "#a76c49"];
  const HAIR = ["#2a2522", "#3b2b22", "#1c1c1f", "#6b4a33", "#4a3a30", "#9a948d"];
  const SHIRT = ["#f6f6f7", "#ececef", "#e6ebf1", "#f1ece5", "#e8eee8", "#efe9ee"];

  /* ---------- Platform: an organic, pebble-like floor ---------- */
  const R = 6.1, NR = 220;
  const radius = (t) => R * (1 + 0.075 * Math.sin(3 * t + 0.5) + 0.04 * Math.sin(5 * t + 1.7) + 0.02 * Math.sin(7 * t + 0.3));
  const rim = [];
  for (let i = 0; i < NR; i++) {
    const t = (i / NR) * Math.PI * 2, r = radius(t);
    rim.push([Math.cos(t) * r, Math.sin(t) * r]);
  }
  // Walls: tall glass at the back, cut low at the front (dollhouse view)
  const wallH = rim.map(([x, z]) => {
    const facing = (x + z) / Math.hypot(x, z) / Math.SQRT2; // -1 back … +1 front
    return 0.45 + (2.6 - 0.45) * (1 - smooth(-0.45, 0.2, facing));
  });

  {
    const shape = new THREE.Shape(rim.map(([x, z]) => new THREE.Vector2(x, -z)));
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.32, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 6, curveSegments: 4,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -0.42, 0);
    add(scene, geo, mat.floor).castShadow = false;

    // glass that fades out toward the top instead of ending in a hard edge
    const pos = [], idx = [], col = [];
    rim.forEach(([x, z], i) => {
      pos.push(x, 0, z, x, wallH[i], z);
      col.push(1, 1, 1, 1, 1, 1, 1, 0);
      const a = i * 2, b = ((i + 1) % NR) * 2;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    });
    const glassGeo = new THREE.BufferGeometry();
    glassGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    glassGeo.setAttribute("color", new THREE.Float32BufferAttribute(col, 4));
    glassGeo.setIndex(idx);
    glassGeo.computeVertexNormals();
    const glass = new THREE.Mesh(glassGeo, mat.glass);
    glass.renderOrder = 2;
    scene.add(glass);

  }

  /* ---------- Skyline: tall, New York-style towers in soft pastels ---------- */
  const clouds = [];
  if (SHOW_SKYLINE) {
    const { mergeGeometries } = await import("three/addons/utils/BufferGeometryUtils.js");
    const BLD = ["#f3f1f2", "#eeecef", "#f2eff1", "#ebe8ec", "#f4f2f1"];
    const parts = BLD.map(() => []);
    const BASE = -95;
    const block = (w, h, d, x, y, z, k) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      geo.translate(x, y + h / 2, z);
      parts[k].push(geo);
    };
    // Minimal towers on every side. They rise from far below: tall behind the office,
    // mid-height at the sides, and in front their tops stay below the office floor.
    function tower(x, z, topY) {
      const k = Math.floor(rnd() * BLD.length);
      const w = 0.45 + rnd() * 0.5, d = 0.45 + rnd() * 0.5;
      const H = topY - BASE;
      if (rnd() < 0.3) {                         // one quiet setback
        block(w, H * 0.88, d, x, BASE, z, k);
        block(w * 0.66, H * 0.12, d * 0.66, x, BASE + H * 0.88, z, k);
      } else {
        block(w, H, d, x, BASE, z, k);
      }
    }
    for (let i = 0; i < 130; i++) {
      const th = rnd() * Math.PI * 2, r = 10 + Math.pow(rnd(), 1.15) * 42;
      const x = Math.cos(th) * r, z = Math.sin(th) * r;
      const facing = (x + z) / (r * Math.SQRT2);          // -1 behind … +1 in front
      const u = (x + z) / Math.SQRT2;
      const backTop = (1.5 + rnd() * 5 + 0.5 * u) / 0.866; // screen-height based, like a skyline
      const frontTop = -3 - rnd() * 9;                     // stays under the floor
      const t = smooth(-0.25, 0.55, facing);
      tower(x, z, backTop * (1 - t) + frontTop * t);
    }
    parts.forEach((list, k) => {
      if (!list.length) return;
      scene.add(new THREE.Mesh(mergeGeometries(list.map((g) => g.toNonIndexed())),
        new THREE.MeshStandardMaterial({ color: BLD[k], roughness: 1, envMapIntensity: 0.4, emissive: BLD[k], emissiveIntensity: 0.5, transparent: true, opacity: 0.82 })));
    });
  }

  /* ---------- Furniture ---------- */
  function roundedRect(w, d, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 12 });
    g.rotateX(-Math.PI / 2);
    return g;
  }
  const tableGeo = roundedRect(1.7, 1.25, 0.34);

  function table(parent) {
    add(parent, tableGeo, mat.tableTop, 0, 0.72, 0);
    for (const [x, z] of [[-0.66, -0.42], [0.66, -0.42], [-0.66, 0.42], [0.66, 0.42]]) {
      add(parent, cyl, mat.leg, x, 0.36, z).scale.set(0.02, 0.72, 0.02);
    }
  }

  function monitor(parent, x, z, faceAway) {
    const g = new THREE.Group();
    g.position.set(x, 0.765, z);
    if (faceAway) g.rotation.y = Math.PI;
    add(g, new THREE.CylinderGeometry(0.08, 0.09, 0.012, 24), mat.monitor, 0, 0.006, -0.02);
    add(g, RB(0.035, 0.22, 0.025, 0.008), mat.monitor, 0, 0.12, -0.035);
    add(g, RB(0.56, 0.36, 0.025, 0.014), mat.monitor, 0, 0.33, 0);
    const ts = taskScreen();
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.53, 0.33), new THREE.MeshBasicMaterial({ map: ts.tex, toneMapped: false }));
    screen.position.set(0, 0.335, 0.0135);
    g.add(screen);
    parent.add(g);
    return ts;
  }

  function keyboard(parent, x, z) {
    add(parent, RB(0.42, 0.016, 0.13, 0.005), mat.keyboard, x, 0.773, z);
  }

  // A tall stack of paper. On flow it blows away in a puff of air; on stress it comes back.
  const puffGeo = new THREE.SphereGeometry(1, 10, 8);
  function paperStack(parent, x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0.765, z);
    parent.add(g);
    const sheets = [];
    const n = 10 + Math.floor(rnd() * 10);
    for (let k = 0; k < n; k++) {
      const m = add(g, RB(0.21, 0.008, 0.15, 0.002), mat.paper, (rnd() - 0.5) * 0.035, 0.005 + k * 0.0095, (rnd() - 0.5) * 0.035);
      m.rotation.y = (rnd() - 0.5) * 0.5;
      sheets.push(m);
    }
    if (rnd() < 0.6) sheets.push(add(g, RB(0.045, 0.2, 0.16, 0.006), M(pick(BINDERS)), 0.15, 0.1, 0));
    sheets.forEach((m) => (m.userData = {
      p: m.position.clone(), r: m.rotation.y,
      v: V((rnd() - 0.5) * 1.1, 0.5 + rnd() * 0.8, (rnd() - 0.5) * 1.1), spin: (rnd() - 0.5) * 9,
    }));
    const puffMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
    const puffs = Array.from({ length: 8 }, (_, k) => {
      const s = new THREE.Mesh(puffGeo, puffMat);
      const a = (k / 8) * Math.PI * 2;
      s.userData.dir = V(Math.cos(a), 0.2 + rnd() * 0.5, Math.sin(a));
      s.visible = false;
      g.add(s);
      return s;
    });
    let state = "stacked", f = 0;
    return (calm, dt) => {
      if (calm && state === "stacked") { state = "flying"; f = 0; }
      if (!calm && (state === "flying" || state === "gone")) { state = "returning"; f = 0; }
      if (state === "flying") {
        f = Math.min(1, f + dt / 0.9);
        const e = 1 - (1 - f) ** 2;
        for (const m of sheets) {
          const u = m.userData;
          m.position.copy(u.p).addScaledVector(u.v, e * 0.55);
          m.rotation.set(u.spin * 0.25 * e, u.r + u.spin * e, 0);
          m.scale.setScalar(Math.max(0.0001, 1 - f));
        }
        puffMat.opacity = 0.8 * (1 - f) * Math.min(1, f * 6);
        puffs.forEach((p) => {
          p.visible = f < 1;
          p.position.copy(p.userData.dir).multiplyScalar(0.04 + e * 0.3);
          p.position.y += 0.08;
          p.scale.setScalar(0.03 + e * 0.1);
        });
        if (f >= 1) state = "gone";
      } else if (state === "returning") {
        f = Math.min(1, f + dt / 0.4);
        for (const m of sheets) {
          m.position.copy(m.userData.p);
          m.rotation.set(0, m.userData.r, 0);
          m.scale.setScalar(Math.max(0.0001, f));
        }
        puffs.forEach((p) => (p.visible = false));
        if (f >= 1) state = "stacked";
      }
    };
  }

  function plant(parent, x, y, z, leafMat, size = 1) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.scale.setScalar(size);
    add(g, new THREE.CylinderGeometry(0.065, 0.05, 0.13, 20), mat.pot, 0, 0.065, 0);
    for (let k = 0; k < 9; k++) {
      const l = add(g, sph, leafMat, (rnd() - 0.5) * 0.12, 0.17 + rnd() * 0.14, (rnd() - 0.5) * 0.12);
      l.scale.set(0.05 + rnd() * 0.03, 0.035 + rnd() * 0.02, 0.05 + rnd() * 0.03);
      l.rotation.set(rnd(), rnd() * 3, rnd());
    }
    parent.add(g);
    return g;
  }

  /* ---------- Lounge in the middle ---------- */
  const sway = [];
  {
    const lounge = new THREE.Group();
    lounge.scale.setScalar(0.68);
    scene.add(lounge);
    add(lounge, new THREE.CylinderGeometry(1.75, 1.75, 0.012, 64), mat.rug, 0, 0.006, 0);
    const span = Math.PI * 1.15, start = Math.PI * 0.95;
    for (let k = 0; k < 6; k++) {
      const a = start + (k / 5) * span;
      const seat = add(lounge, RB(0.62, 0.36, 0.62, 0.12), mat.sofa, Math.cos(a) * 1.15, 0.18, Math.sin(a) * 1.15);
      seat.rotation.y = -a;
      const back = add(lounge, RB(0.62, 0.42, 0.2, 0.09), mat.sofa, Math.cos(a) * 1.5, 0.4, Math.sin(a) * 1.5);
      back.rotation.y = -a + Math.PI / 2;
    }
    add(lounge, new THREE.CylinderGeometry(0.34, 0.34, 0.04, 40), mat.tableTop, 0.25, 0.4, 0.2);
    add(lounge, cyl, mat.leg, 0.25, 0.2, 0.2).scale.set(0.03, 0.4, 0.03);
    // tree
    add(lounge, new THREE.CylinderGeometry(0.32, 0.26, 0.42, 32), mat.pot, -0.5, 0.21, -0.45);
    add(lounge, cyl, mat.trunk, -0.5, 1.0, -0.45).scale.set(0.06, 1.6, 0.06);
    const crown = new THREE.Group();
    crown.position.set(-0.5, 1.8, -0.45);
    const leaf = M("#cfe2cc", { roughness: 0.85 });
    for (let k = 0; k < 7; k++) {
      const s = add(crown, sph, leaf, (rnd() - 0.5) * 0.9, rnd() * 0.7, (rnd() - 0.5) * 0.9);
      s.scale.setScalar(0.35 + rnd() * 0.25);
    }
    lounge.add(crown);
    sway.push(crown);
  }

  /* ---------- People ---------- */
  const ARM = {
    type:    (s) => ({ elbow: V(s * 0.24, 0.27, 0.16), hand: V(s * 0.13, 0.3, 0.62) }),
    head:    (s) => ({ elbow: V(s * 0.32, 0.5, 0.24), hand: V(s * 0.13, 0.76, 0.12) }),
    chin:    (s) => ({ elbow: V(s * 0.16, 0.36, 0.34), hand: V(s * 0.03, 0.66, 0.15) }),
    point:   (s) => ({ elbow: V(s * 0.3, 0.42, 0.3), hand: V(s * 0.18, 0.6, 0.66) }),
    explain: (s) => ({ elbow: V(s * 0.32, 0.38, 0.26), hand: V(s * 0.3, 0.55, 0.52) }),
  };
  // Calm = focused, creative work
  const MOODS = {
    analyse:     { right: "point",   left: "type", screen: "analytics" },
    manage:      { right: "type",    left: "type", screen: "kanban" },
    communicate: { right: "explain", left: "type", screen: "call", talk: true },
    innovate:    { right: "chin",    left: "type", screen: "design" },
    strategy:    { right: "point",   left: "type", screen: "roadmap" },
  };
  const MOOD_ORDER = ["analyse", "innovate", "communicate", "manage", "strategy"];

  function person(parent, x, z, facing, mood, chairMat) {
    const look = {
      skin: M(pick(SKIN), { roughness: 0.6 }),
      hair: M(pick(HAIR), { roughness: 0.75 }),
      shirt: M(pick(SHIRT), { roughness: 0.8 }),
      long: rnd() < 0.4, bun: rnd() < 0.2,
    };
    const stressPose = rnd() < 0.4 ? "head" : "type";
    const md = MOODS[mood];

    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = facing;
    parent.add(g);

    // simple chair: shell seat + back on one stem
    add(g, RB(0.46, 0.07, 0.44, 0.03), chairMat, 0, 0.43, -0.02);
    add(g, RB(0.44, 0.46, 0.06, 0.03), chairMat, 0, 0.78, -0.27).rotation.x = -0.1;
    add(g, cyl, mat.stem, 0, 0.21, -0.02).scale.set(0.025, 0.4, 0.025);
    add(g, new THREE.CylinderGeometry(0.2, 0.22, 0.025, 32), mat.stem, 0, 0.0125, -0.02);

    for (const s of [-1, 1]) {
      placeLimb(limb(g, mat.pants, mat.pants, 0.068), V(s * 0.09, 0.52, 0), V(s * 0.1, 0.52, 0.38));
      placeLimb(limb(g, mat.pants, mat.pants, 0.055), V(s * 0.1, 0.52, 0.38), V(s * 0.1, 0.1, 0.44));
      add(g, RB(0.09, 0.06, 0.21, 0.025), mat.shoe, s * 0.1, 0.035, 0.49);
    }

    const torso = new THREE.Group();
    torso.position.set(0, 0.52, -0.05);
    g.add(torso);
    add(torso, new THREE.CapsuleGeometry(0.15, 0.27, 6, 18), look.shirt, 0, 0.3, 0).scale.set(1.08, 1, 0.72);
    add(torso, cyl, look.skin, 0, 0.6, 0).scale.set(0.045, 0.12, 0.045);

    const head = new THREE.Group();
    head.position.set(0, 0.63, 0);
    torso.add(head);
    add(head, sph, look.skin, 0, 0.12, 0).scale.set(0.1, 0.112, 0.105);
    add(head, new THREE.SphereGeometry(0.112, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.56), look.hair, 0, 0.13, -0.008).rotation.x = -0.45;
    if (look.long) add(head, new THREE.CapsuleGeometry(0.095, 0.12, 4, 14), look.hair, 0, 0.05, -0.05).scale.set(1.05, 1, 0.6);
    if (look.bun) add(head, sph, look.hair, 0, 0.25, -0.05).scale.setScalar(0.05);
    for (const s of [-1, 1]) add(head, sph, M("#3a3a3e"), s * 0.034, 0.125, 0.098).scale.setScalar(0.011);

    const arms = [-1, 1].map((s) => ({
      s,
      upper: limb(torso, look.shirt, look.shirt, 0.048),
      fore: limb(torso, look.shirt, look.skin, 0.042, 0.045),
      stress: ARM[s === 1 ? stressPose : "type"](s),
      calm: ARM[s === 1 ? md.right : md.left](s),
      shoulder: V(s * 0.19, 0.47, 0),
    }));

    const phase = rnd() * 10;
    const e = V(0, 0, 0), h = V(0, 0, 0);
    return (t, time) => {
      const bob = (1 - t) * Math.sin(time * 7 + phase) * 0.012;
      torso.rotation.x = THREE.MathUtils.lerp(0.22, -0.02, t) + bob;
      head.rotation.x = THREE.MathUtils.lerp(0.34, -0.04, t);
      head.rotation.y = md.talk ? t * 0.5 : 0;
      head.rotation.z = (1 - t) * Math.sin(time * 1.3 + phase) * 0.05;
      for (const a of arms) {
        e.lerpVectors(a.stress.elbow, a.calm.elbow, t);
        h.lerpVectors(a.stress.hand, a.calm.hand, t);
        h.y += Math.sin(time * (t > 0.5 ? 3 : 14) + phase + a.s) * (t > 0.5 ? 0.012 : 0.006);
        placeLimb(a.upper, a.shoulder, e);
        placeLimb(a.fore, e, h);
      }
    };
  }

  /* ---------- Desk pods: an inner ring around the lounge, an outer ring along the glass ---------- */
  const people = [];
  let moodIdx = 0;
  const nextMood = () => MOOD_ORDER[moodIdx++ % MOOD_ORDER.length];
  const POD_SCALE = 0.72;
  const layout = [];
  for (let k = 0; k < 6; k++) {                       // inner ring, pointing at the lounge
    const th = (k / 6) * Math.PI * 2 + 0.4;
    layout.push({ x: Math.cos(th) * 2.45, z: Math.sin(th) * 2.45, rot: Math.PI / 2 - th });
  }
  const OUTER = 11;
  for (let k = 0; k < OUTER; k++) {                   // outer ring, following the glass
    const th = (k / OUTER) * Math.PI * 2 + 0.1, r = radius(th) * 0.8;
    layout.push({ x: Math.cos(th) * r, z: Math.sin(th) * r, rot: Math.PI - th });
  }

  const pods = layout.map(({ x, z, rot }, k) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot + (rnd() - 0.5) * 0.2;
    g.scale.setScalar(POD_SCALE);
    scene.add(g);
    g.updateMatrixWorld(true);

    const glowMat = new THREE.MeshBasicMaterial({ map: radialTex, color: 0xf3c9c0, transparent: true, opacity: 0.22, depthWrite: false });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.8), glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.004;
    g.add(glow);

    table(g);
    const screens = [monitor(g, 0.35, -0.15, true), monitor(g, -0.35, 0.15, false)];
    keyboard(g, 0.35, -0.45);
    keyboard(g, -0.35, 0.45);
    const leafMat = new THREE.MeshStandardMaterial({ color: "#b7c3b3", roughness: 0.7, envMapIntensity: 0.6 });
    const pl = plant(g, 0.72, 0.765, 0.05, leafMat);
    // lots of paper on every other table: two stacks in front of each person
    const papers = k % 2 === 0;
    const stacks = papers
      ? [[paperStack(g, -0.5, -0.33), paperStack(g, -0.12, -0.48)], [paperStack(g, 0.5, 0.33), paperStack(g, 0.12, 0.48)]]
      : [[], []];

    const moods = [nextMood(), nextMood()];
    const chairMat = M(CHAIRS[k % CHAIRS.length], { roughness: 0.75 });
    const seats = [{ x: 0.35, z: -1.12, f: 0 }, { x: -0.35, z: 1.12, f: Math.PI }].map((st, i) => {
      const pose = person(g, st.x, st.z, st.f, moods[i], chairMat);
      let ticked = 0;
      const p = {
        t: 0, target: 0, mood: moods[i], side: i === 0 ? 1 : -1,
        anchor: g.localToWorld(V(st.x, 1.75, st.z)),
        apply(time, dt) {
          pose(this.t, time);
          // tick the to-do list off one by one; reset at once when stress returns
          ticked = this.target ? Math.min(1, ticked + dt / 1.4) : 0;
          screens[i].draw(Math.floor(ticked * (screens[i].rows + 1)));
          stacks[i].forEach((st) => st(this.target === 1, dt));
        },
      };
      people.push(p);
      return p;
    });

    return {
      apply(time, dt) {
        seats.forEach((p) => p.apply(time, dt));
        const avg = (seats[0].t + seats[1].t) / 2;
        pl.scale.setScalar(1 + 0.12 * avg);
        leafMat.color.set("#b7c3b3").lerp(new THREE.Color("#93cfa8"), avg);
        glowMat.color.set(0xf3c9c0).lerp(new THREE.Color(0xc4e6f0), avg);
        glowMat.opacity = 0.22 + 0.1 * avg;
      },
    };
  });

  // A few tall plants along the glass, in the gaps between the outer desks
  for (const k of [0, 3, 6, 8]) {
    const t = ((k + 0.5) / OUTER) * Math.PI * 2 + 0.1, r = radius(t) * 0.82;
    sway.push(plant(scene, Math.cos(t) * r, 0, Math.sin(t) * r, M("#c9dcc6", { roughness: 0.85 }), 2.6));
  }

  /* ---------- Thought bubbles & focus badges (HTML overlay) ---------- */
  const ICONS = [
    () => { const a = []; for (let k = 0; k < 14; k++) a.push(`${((rnd() - 0.5) * 16).toFixed(1)},${((rnd() - 0.5) * 11).toFixed(1)}`);
      return `<polyline points="${a.join(" ")}" fill="none" stroke="#dc9f96" stroke-width="1.2" stroke-linejoin="round"/>`; },
    () => `<rect x="-7" y="-5" width="14" height="10" rx="1.2" fill="#fff" stroke="#a2a2a8"/><path d="M-7,-5 l7,5.5 l7,-5.5" fill="none" stroke="#a2a2a8"/>
      <circle cx="7" cy="-5" r="5" fill="#e8aaa0"/><text x="7" y="-3" font-size="5.6" font-weight="700" text-anchor="middle" fill="#fff" font-family="Helvetica, Arial, sans-serif">${30 + Math.floor(rnd() * 69)}</text>`,
    () => `<circle r="7" fill="#fff" stroke="#a2a2a8" stroke-width="1.1"/><path d="M0,0 V-4.6 M0,0 L3.6,1.6" stroke="#dc9f96" stroke-width="1.3" stroke-linecap="round"/>`,
    () => `<text y="5" font-size="14" font-weight="700" text-anchor="middle" fill="#dc9f96" font-family="Helvetica, Arial, sans-serif">!!</text>`,
    () => `<rect x="-7" y="-6" width="10" height="12" fill="#fff" stroke="#b0b0b6" stroke-width=".9" transform="rotate(-14)"/>
      <rect x="-4" y="-6" width="10" height="12" fill="#fff" stroke="#b0b0b6" stroke-width=".9" transform="rotate(10)"/>`,
    () => `<text y="5" font-size="13" font-weight="700" text-anchor="middle" fill="#a2a2a8" font-family="Helvetica, Arial, sans-serif">?!</text>`,
  ];
  // One pastel badge per kind of focused work
  const BADGES = {
    analyse: `<circle r="12" fill="#e2edfb"/><path d="M-6,5 V0 M-2,5 V-3 M2,5 V-1 M6,5 V-6" stroke="#8fb0e0" stroke-width="2.2" stroke-linecap="round"/>`,
    manage: `<circle r="12" fill="#f3f6ef"/><rect x="-7.5" y="-6" width="4.5" height="12" rx="1" fill="#f5d7dc"/><rect x="-2.25" y="-6" width="4.5" height="8" rx="1" fill="#f7ebc4"/><rect x="3" y="-6" width="4.5" height="5" rx="1" fill="#cfeadb"/>`,
    communicate: `<circle r="12" fill="#ece7fb"/><path d="M-7,-6 h9 a2,2 0 0 1 2,2 v4 a2,2 0 0 1 -2,2 h-5 l-3,3 v-3 h-1 a2,2 0 0 1 -2,-2 v-4 a2,2 0 0 1 2,-2z" fill="#fff" stroke="#a495e0" stroke-width="1.1"/>
      <path d="M3,-1 h4 a2,2 0 0 1 2,2 v4 a2,2 0 0 1 -2,2 h-1 v3 l-3,-3 h-3 a2,2 0 0 1 -2,-2" fill="#a495e0"/>`,
    innovate: `<circle r="12" fill="#fbf1cf"/><circle cy="-2.5" r="5.5" fill="none" stroke="#dcbb58" stroke-width="1.5"/>
      <path d="M-2.5,4.5 h5 M-1.8,7 h3.6" stroke="#dcbb58" stroke-width="1.4" stroke-linecap="round"/>`,
    strategy: `<circle r="12" fill="#dff3e8"/><circle r="6.5" fill="none" stroke="#6fbf93" stroke-width="1.3"/><circle r="3" fill="none" stroke="#6fbf93" stroke-width="1.3"/><circle r="1" fill="#6fbf93"/>
      <path d="M1,-1 L8,-8 M8,-8 h-3 M8,-8 v3" stroke="#6fbf93" stroke-width="1.3" stroke-linecap="round"/>`,
  };

  const bubbles = people.map((p) => {
    const side = p.side;
    const el = document.createElement("div");
    el.className = "bub";
    el.style.setProperty("--side", side);
    const delay = (-rnd() * 2).toFixed(2);
    el.innerHTML = `
      <div class="bub-stress"><div class="jitter" style="animation-delay:${delay}s">
        <svg viewBox="-22 -18 44 40" aria-hidden="true">
          <circle cx="${-side * 9}" cy="17" r="1.8" fill="#fff" stroke="#d8d8dd" stroke-width=".7"/>
          <circle cx="${-side * 5}" cy="12.5" r="2.6" fill="#fff" stroke="#d8d8dd" stroke-width=".7"/>
          <g fill="#dedee2"><circle cx="-9" cy="2" r="9.8"/><circle cy="-4" r="11.8"/><circle cx="10" cy="1" r="9.8"/><circle cx="2" cy="6" r="9.8"/></g>
          <g fill="#fff"><circle cx="-9" cy="2" r="9"/><circle cy="-4" r="11"/><circle cx="10" cy="1" r="9"/><circle cx="2" cy="6" r="9"/></g>
          ${pick(ICONS)()}
        </svg></div></div>
      <div class="bub-calm"><div class="float" style="animation-delay:${delay}s">
        <svg viewBox="-22 -18 44 40" aria-hidden="true">${BADGES[p.mood]}</svg></div></div>`;
    overlay.appendChild(el);
    return { el, anchor: p.anchor };
  });

  /* ---------- Framing: fit the office into .office-target ---------- */
  const boundsPts = [];
  rim.forEach(([x, z], i) => { if (i % 4 === 0) boundsPts.push(V(x, wallH[i], z), V(x, -0.55, z)); });
  people.forEach((p) => boundsPts.push(p.anchor.clone().setY(p.anchor.y + 0.7)));

  let W = 1, H = 1, centers = [];
  const _v = new THREE.Vector3();
  function resize() {
    W = host.clientWidth; H = host.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H, false);
    const hr = host.getBoundingClientRect(), tr = target.getBoundingClientRect();
    const tx = tr.left - hr.left, ty = tr.top - hr.top, tw = tr.width, th = tr.height;
    camera.updateMatrixWorld();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of boundsPts) {
      _v.copy(p).applyMatrix4(camera.matrixWorldInverse);
      x0 = Math.min(x0, _v.x); x1 = Math.max(x1, _v.x); y0 = Math.min(y0, _v.y); y1 = Math.max(y1, _v.y);
    }
    const s = Math.max((x1 - x0) / tw, (y1 - y0) / th) * 1.02; // world units per pixel
    const cxv = (x0 + x1) / 2, cyv = (y0 + y1) / 2;
    camera.left = cxv - (tx + tw / 2) * s;
    camera.right = camera.left + W * s;
    const bh = (y1 - y0) / s;                                   // platform height in px
    camera.top = cyv + (ty + th - bh / 2) * s;                   // sit it at the bottom of the target
    camera.bottom = camera.top - H * s;
    camera.updateProjectionMatrix();

    host.style.setProperty("--bub", `${Math.max(18, Math.min(36, tw * 0.03)).toFixed(1)}px`);
    const toPx = (v) => [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H];
    bubbles.forEach((b) => {
      const [x, y] = toPx(_v.copy(b.anchor).project(camera));
      b.el.style.left = `${x}px`;
      b.el.style.top = `${y}px`;
    });
    centers = people.map((p) => toPx(_v.copy(p.anchor).setY(0.9).project(camera)));
    kick();
  }
  new ResizeObserver(resize).observe(host);
  new ResizeObserver(resize).observe(target);

  /* ---------- Render loop ---------- */
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let running = false, visible = true, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = reduced ? 0 : now / 1000;
    for (const p of people) {
      p.t += (p.target - p.t) * (1 - Math.exp(-dt * (p.target ? 4 : 9)));
      if (Math.abs(p.target - p.t) < 0.001) p.t = p.target;
    }
    pods.forEach((pod) => pod.apply(time, dt));
    sway.forEach((s, i) => (s.rotation.z = Math.sin(time * 0.8 + i) * 0.02));
    if (!reduced) clouds.forEach((c) => { c.position.x += c.userData.speed * dt; c.position.z -= c.userData.speed * dt; });
    renderer.render(scene, camera);
    if (visible && !(reduced && people.every((p) => p.t === p.target))) requestAnimationFrame(frame);
    else running = false;
  }
  function kick() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(host);

  /* ---------- Interaction: calm only while the cursor is near ---------- */
  const total = people.length;
  const countEl = document.getElementById("flowCount");
  const hintEl = document.getElementById("flowHint");
  const totalEl = document.getElementById("flowTotal");
  const touchy = matchMedia("(hover: none)").matches;
  if (totalEl) totalEl.textContent = total;
  let releaseTimer;

  function update() {
    const n = people.filter((p) => p.target === 1).length;
    if (countEl) countEl.textContent = n;
    if (hintEl) hintEl.textContent = touchy ? "touch the people" : "hover over the people";
  }
  function set(i, on) {
    const p = people[i];
    if ((p.target === 1) === on) return;
    p.target = on ? 1 : 0;
    bubbles[i].el.classList.toggle("calm", on);
  }
  const local = (e) => { const r = host.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function hover(pt, touch) {
    clearTimeout(releaseTimer);
    const [x, y] = local(pt);
    const rad = target.clientWidth * (touch ? 0.07 : 0.045);
    centers.forEach(([cx, cy], i) => set(i, Math.hypot(x - cx, y - cy) < rad));
    update();
    kick();
  }
  function releaseAll() {
    people.forEach((_, i) => set(i, false));
    update();
    kick();
  }
  host.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") hover(e); });
  host.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") releaseAll(); });
  // Touch: touching or dragging a finger over the image works like hovering.
  // Listeners are passive, so the page still scrolls normally.
  const onTouch = (e) => { if (e.touches[0]) hover(e.touches[0], true); };
  host.addEventListener("touchstart", onTouch, { passive: true });
  host.addEventListener("touchmove", onTouch, { passive: true });
  host.addEventListener("touchend", () => { releaseTimer = setTimeout(releaseAll, 1500); }, { passive: true });

  update();
  resize();
})();
