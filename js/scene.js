/* 场景：远景剪影（教堂、枯树、山丘、铁栅）、铁门、装饰线、视差 */
(function () {
  const GY = window.GY;
  const VW = 1600, VH = 600; // 远景统一坐标系

  /* ---------- 枯树：递归分枝 ---------- */
  function tree(r, x, y, len, ang, width, depth, out) {
    if (depth === 0 || width < 0.35) return;
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    const bend = (r() - 0.5) * len * 0.3;
    const mx = (x + x2) / 2 + Math.cos(ang + Math.PI / 2) * bend, my = (y + y2) / 2 + Math.sin(ang + Math.PI / 2) * bend;
    out.push(`<path d="M${x.toFixed(1)} ${y.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke-width="${width.toFixed(2)}"/>`);
    const n = r() < 0.3 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const spread = 0.35 + r() * 0.5;
      const a = ang + (i - (n - 1) / 2) * spread + (r() - 0.5) * 0.4;
      tree(r, x2, y2, len * (0.62 + r() * 0.2), a, width * 0.68, depth - 1, out);
    }
  }
  function treeSvg(seed, x, groundY, h) {
    const r = GY.rng(seed), out = [];
    tree(r, x, groundY + 4, h * 0.34, -Math.PI / 2 + (r() - 0.5) * 0.2, h * 0.055, 7, out);
    return `<g fill="none" stroke="currentColor" stroke-linecap="round">${out.join("")}</g>`;
  }

  /* ---------- 远景：山丘 + 哥特教堂 ---------- */
  function cathedral(cx, gy, s) {
    const R = (x, y, w, h) => `<rect x="${cx + x * s}" y="${gy - (y + h) * s}" width="${w * s}" height="${h * s}"/>`;
    const T = (x, y, w, h) => `<polygon points="${cx + x * s},${gy - y * s} ${cx + (x + w / 2) * s},${gy - (y + h) * s} ${cx + (x + w) * s},${gy - y * s}"/>`;
    let g = "";
    g += R(-120, 0, 240, 110) + T(-124, 110, 248, 60); // 中殿
    g += R(-170, 0, 50, 70) + R(120, 0, 50, 70); // 侧廊
    g += R(-150, 0, 44, 230) + T(-156, 230, 56, 130) + T(-152, 358, 4, 16); // 左塔
    g += R(106, 0, 44, 250) + T(100, 250, 56, 150) + T(126, 398, 4, 16); // 右塔
    g += R(-8, 170, 16, 40) + T(-12, 208, 24, 90); // 交叉塔尖
    for (let i = -3; i <= 3; i++) g += T(i * 34 - 5, 110, 10, 26); // 小尖顶
    g += R(-4, 296, 2, 22) + R(-9, 308, 12, 2); // 十字架
    return `<g fill="currentColor">${g}</g>`;
  }

  // 窗光各占一层与远景同尺寸的 SVG，闪烁只改整层透明度，不触发重绘
  function cathedralWindows(cx, gy, s) {
    const layer = (inner, delay) =>
      `<svg class="window-glow" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMax slice" style="animation-delay:${delay}">${inner}</svg>`;
    return layer(`<defs><filter id="wglow" x="-2" y="-2" width="5" height="5"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle cx="${cx}" cy="${gy - 92 * s}" r="${8 * s}" fill="#ffb86a" opacity=".7" filter="url(#wglow)"/>`, "0s") +
      layer(`<rect x="${cx - 132 * s}" y="${gy - 170 * s}" width="${6 * s}" height="${16 * s}" rx="${3 * s}" fill="#ffae5a" opacity=".45"/>`, "-2s");
  }

  function farLayer() {
    const gy = 470;
    return `<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMax slice">
      <path fill="currentColor" d="M0 ${VH}V420Q140 360 300 400T620 380Q760 350 900 ${gy}T1250 400Q1420 350 1600 410V${VH}Z"/>
      ${cathedral(1080, gy, 0.9)}
    </svg>${cathedralWindows(1080, gy, 0.9)}`;
  }

  /* ---------- 中景：山坡、枯树、墓碑剪影 ---------- */
  function midLayer() {
    const r = GY.rng("mid");
    let stones = "";
    for (let i = 0; i < 26; i++) {
      const x = 60 + i * 60 + r() * 30, y = 505 + Math.sin(x / 260) * 22 + r() * 10, s = 0.6 + r() * 0.6;
      stones += r() < 0.4
        ? `<path d="M${x - 2.5 * s} ${y}v${-30 * s}h${-8 * s}v${-5 * s}h${8 * s}v${-8 * s}h${5 * s}v${8 * s}h${8 * s}v${5 * s}h${-8 * s}v${30 * s}Z" transform="rotate(${(r() - 0.5) * 14} ${x} ${y})"/>`
        : `<path d="M${x - 9 * s} ${y}v${-22 * s}a${9 * s} ${9 * s} 0 0 1 ${18 * s} 0v${22 * s}Z" transform="rotate(${(r() - 0.5) * 12} ${x} ${y})"/>`;
    }
    return `<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMax slice">
      <g fill="currentColor">
        <path d="M0 ${VH}V500Q200 460 420 490T860 500Q1100 470 1300 505T1600 480V${VH}Z"/>
        ${stones}
      </g>
      <g color="currentColor">
        ${treeSvg("t1", 180, 488, 300)}
        ${treeSvg("t2", 1460, 490, 360)}
        ${treeSvg("t3", 760, 500, 160)}
      </g>
    </svg>`;
  }

  /* ---------- 近景：铁栅栏与门柱 ---------- */
  function fence(y, h, x0 = 0, x1 = VW, gap = null) {
    let s = "";
    for (let x = x0; x <= x1; x += 22) {
      if (gap && x > gap[0] && x < gap[1]) continue;
      const tall = Math.round(x / 22) % 4 === 0 ? 18 : 0;
      s += `<rect x="${x - 1.6}" y="${y - h - tall}" width="3.2" height="${h + tall}"/>`;
      s += `<path d="M${x} ${y - h - tall - 14}l5 10l-5 4l-5-4Z"/>`;
      if (tall) s += `<circle cx="${x}" cy="${y - h - tall + 8}" r="4" fill="none" stroke="currentColor" stroke-width="2"/>`;
    }
    const seg = (a, b) => `<rect x="${a}" y="${y - h + 10}" width="${b - a}" height="4"/><rect x="${a}" y="${y - 22}" width="${b - a}" height="4"/>`;
    s += gap ? seg(x0, gap[0]) + seg(gap[1], x1) : seg(x0, x1);
    return s;
  }
  function pillar(x, y) {
    return `<rect x="${x - 22}" y="${y - 190}" width="44" height="190"/><rect x="${x - 28}" y="${y - 200}" width="56" height="14"/>
      <path d="M${x - 16} ${y - 200}h32l-6-20h-20Z"/><circle cx="${x}" cy="${y - 232}" r="13"/>`;
  }
  function nearLayer() {
    const y = 590;
    return `<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMax slice">
      <g fill="currentColor">
        <path d="M0 ${VH}V560Q400 540 800 552T1600 556V${VH}Z"/>
        ${fence(y, 110, 0, VW, [650, 950])}
        ${pillar(650, y)}${pillar(950, y)}
      </g>
    </svg>`;
  }

  /* ---------- 页脚栅栏 ---------- */
  function footerFence() {
    return `<svg viewBox="0 0 ${VW} 110" preserveAspectRatio="xMidYMax slice"><g fill="currentColor">${fence(110, 70)}<rect x="0" y="100" width="${VW}" height="10"/></g></svg>`;
  }

  /* ---------- 装饰线 ---------- */
  GY.ornament = (w = 420, h = 24) =>
    `<svg viewBox="0 0 ${w} ${h}" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M0 ${h / 2}H${w / 2 - 40}M${w / 2 + 40} ${h / 2}H${w}" stroke-width="1"/>
      <path d="M${w / 2 - 40} ${h / 2}q10 -8 20 0t20 0M${w / 2 + 40} ${h / 2}q-10 -8 -20 0t-20 0" stroke-width="1"/>
      <path d="M${w / 2} 1v${h - 2}M${w / 2 - 6} ${h * 0.35}h12" stroke-width="1.6"/>
      <circle cx="${w / 2 - 60}" cy="${h / 2}" r="2" fill="currentColor"/><circle cx="${w / 2 + 60}" cy="${h / 2}" r="2" fill="currentColor"/>
    </svg>`;

  // 碑上的短分隔线
  GY.rule = (cls = "rule") =>
    `<svg class="${cls}" viewBox="0 0 100 10" preserveAspectRatio="none" fill="currentColor" aria-hidden="true">
      <path d="M0 5.4h40v-.8H0zM60 5.4h40v-.8H60z" opacity=".7"/><path d="M50 1l4 4-4 4-4-4z"/>
    </svg>`;

  /* ---------- 铁门 ---------- */
  function gateHalf() {
    const W = 500, H = 1000;
    const top = (x) => 250 - 150 * Math.pow(x / W, 2);
    let s = "";
    // 立柱
    for (let x = 30; x < W - 10; x += 36) {
      const t = top(x);
      s += `<rect x="${x - 3.5}" y="${t}" width="7" height="${H - t}"/>`;
      s += `<path d="M${x} ${t - 30}l8 18-4 14h-8l-4-14Z"/>`;
      s += `<circle cx="${x}" cy="${t + 6}" r="6"/>`;
    }
    // 边框
    s += `<rect x="0" y="120" width="26" height="${H - 120}"/><rect x="${W - 14}" y="${top(W) - 6}" width="14" height="${H}"/>`;
    s += `<path d="M0 ${top(0) + 40}` + Array.from({ length: 21 }, (_, i) => `L${(i * W) / 20} ${top((i * W) / 20) + 40}`).join("") + `V${top(W) + 54}` +
      Array.from({ length: 21 }, (_, i) => `L${W - (i * W) / 20} ${top(W - (i * W) / 20) + 54}`).join("") + "Z\"/>";
    for (const y of [470, 492, 880, 902]) s += `<rect x="0" y="${y}" width="${W}" height="10"/>`;
    // 卷草纹
    let scroll = "";
    for (let x = 48; x < W - 30; x += 72) {
      scroll += `<path d="M${x} 490c0-40 40-40 40-10c0 18-22 18-22 4c0-8 10-8 10-2"/>`;
      scroll += `<path d="M${x + 36} 492c0 40-40 40-40 10c0-18 22-18 22-4c0 8-10 8-10 2"/>`;
      scroll += `<circle cx="${x + 18}" cy="890" r="11"/>`;
    }
    // 中央纹章（与另一半镜像拼成完整圆环）
    const crest = `<path d="M${W} 560a130 130 0 0 0 0 260" stroke-width="12"/><path d="M${W} 590a100 100 0 0 0 0 200" stroke-width="4"/>
      <path d="M${W} 690h-64M${W - 64} 690l-12-9M${W - 64} 690l-12 9M${W} 600v180" stroke-width="7"/><circle cx="${W}" cy="690" r="22" stroke-width="5"/>`;
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMaxYMid slice">
      <g fill="url(#iron)">${s}</g>
      <g fill="none" stroke="url(#iron)" stroke-width="6" stroke-linecap="round">${scroll}${crest}</g>
      <g fill="none" stroke="rgba(170,180,210,.13)" stroke-width="1.5">${scroll}</g>
    </svg>`;
  }

  function gateLock() {
    return `<svg viewBox="0 0 100 150">
      <g fill="none" stroke="#2c2d33" stroke-width="7">
        <ellipse cx="20" cy="20" rx="14" ry="8" transform="rotate(-35 20 20)"/><ellipse cx="80" cy="20" rx="14" ry="8" transform="rotate(35 80 20)"/>
        <ellipse cx="34" cy="36" rx="8" ry="14" transform="rotate(-35 34 36)"/><ellipse cx="66" cy="36" rx="8" ry="14" transform="rotate(35 66 36)"/>
      </g>
      <path d="M32 72V52a18 18 0 0 1 36 0v20" fill="none" stroke="#3a3b42" stroke-width="8"/>
      <rect x="18" y="68" width="64" height="62" rx="8" fill="#1c1d22" stroke="#3d3f47" stroke-width="2"/>
      <rect x="18" y="68" width="64" height="62" rx="8" fill="url(#iron)" opacity=".6"/>
      <circle cx="50" cy="92" r="7" fill="#050507"/><path d="M47 96h6l2 18h-10Z" fill="#050507"/>
      <path d="M24 74h52" stroke="rgba(255,255,255,.12)" stroke-width="2"/>
    </svg>`;
  }

  /* ---------- 视差 ---------- */
  function parallax() {
    const layers = GY.$$(".landscape .layer");
    const moon = GY.$(".moon-wrap");
    const clouds = GY.$(".clouds");
    let mx = 0, my = 0, ticking = false;
    const update = () => {
      ticking = false;
      const sy = scrollY;
      if (sy > innerHeight * 1.5 || document.body.classList.contains("crypt-open")) return;
      layers.forEach((l) => {
        const d = +l.dataset.depth;
        l.style.transform = `translate3d(${mx * d * -30}px, ${sy * d}px, 0)`;
      });
      moon.style.transform = `translate3d(${mx * -8}px, ${sy * 0.55 + my * -6}px, 0)`;
      clouds.style.transform = `translate3d(0, ${sy * 0.5}px, 0)`;
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener("scroll", req, { passive: true });
    if (!GY.reducedMotion) {
      addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse") return;
        mx = e.clientX / innerWidth - 0.5;
        my = e.clientY / innerHeight - 0.5;
        req();
      }, { passive: true });
    }
    update();
  }

  GY.scene = {
    build() {
      GY.$(".landscape .far").innerHTML = farLayer();
      GY.$(".landscape .mid").innerHTML = midLayer();
      GY.$(".landscape .near").innerHTML = nearLayer();
      GY.$(".fence").innerHTML = footerFence();
      GY.$(".hero-ornament").innerHTML = GY.ornament();
      GY.$(".gate-door.left").innerHTML = gateHalf();
      GY.$(".gate-door.right").innerHTML = gateHalf();
      GY.$(".gate-lock").innerHTML = gateLock();
      parallax();
    }
  };
})();
