/* 通用工具：随机数、纹理生成、墓碑形状、纹章与图标 */
(function () {
  const GY = (window.GY = window.GY || {});

  /* ---------- 基础工具 ---------- */
  GY.$ = (sel, root = document) => root.querySelector(sel);
  GY.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  GY.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  GY.esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // 极简标记：**粗体** *斜体* [文字](链接) 换行
  GY.md = (s) =>
    GY.esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, "<br>");

  // 以字符串为种子的确定性随机数（同一座墓每次打开外观一致）
  GY.rng = (seed) => {
    let h = 1779033703 ^ String(seed).length;
    for (let i = 0; i < String(seed).length; i++) {
      h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    let a = h >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // 单引号包裹，便于写进 style="..." 属性
  const svgUrl = (svg) => `url('data:image/svg+xml,${encodeURIComponent(svg)}')`;

  /* ---------- 程序化纹理（一次生成，写入 CSS 变量） ---------- */
  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"), w, h);
    return c;
  }

  // 可横向/纵向平铺的柔光团
  function blobs(ctx, w, h, n, rMin, rMax, colorFn, rand) {
    for (let i = 0; i < n; i++) {
      const x = rand() * w, y = rand() * h, r = rMin + rand() * (rMax - rMin);
      const col = colorFn(rand);
      for (const dx of [-w, 0, w])
        for (const dy of [-h, 0, h]) {
          const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
          g.addColorStop(0, col);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
        }
    }
  }

  GY.buildTextures = () => {
    const r = GY.rng("textures");
    const root = document.documentElement.style;

    const noise = canvasTex(160, 160, (ctx, w, h) => {
      const img = ctx.createImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 128 + (r() - 0.5) * 64;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    });

    const grain = canvasTex(180, 180, (ctx, w, h) => {
      const img = ctx.createImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = r() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = r() * 60;
      }
      ctx.putImageData(img, 0, 0);
    });

    const blotch = canvasTex(360, 360, (ctx, w, h) => {
      ctx.fillStyle = "rgb(128,128,128)";
      ctx.fillRect(0, 0, w, h);
      blobs(ctx, w, h, 70, 10, 70, (rd) => (rd() < 0.55 ? `rgba(0,0,0,${0.12 + rd() * 0.2})` : `rgba(255,255,255,${0.08 + rd() * 0.15})`), r);
    });

    const speckle = canvasTex(200, 200, (ctx, w, h) => {
      for (let i = 0; i < 650; i++) {
        const d = r() < 0.6;
        ctx.fillStyle = d ? `rgba(0,0,0,${0.15 + r() * 0.35})` : `rgba(255,255,255,${0.1 + r() * 0.3})`;
        const s = 0.4 + r() * 1.6;
        ctx.fillRect(r() * w, r() * h, s, s);
      }
    });

    const veins = canvasTex(420, 600, (ctx, w, h) => {
      ctx.lineCap = "round";
      for (let i = 0; i < 9; i++) {
        let x = r() * w, y = -20, a = Math.PI / 2 + (r() - 0.5) * 1.2;
        ctx.strokeStyle = `rgba(60,55,70,${0.18 + r() * 0.3})`;
        ctx.lineWidth = 0.4 + r() * 1.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        while (y < h + 20 && x > -20 && x < w + 20) {
          a += (r() - 0.5) * 0.7;
          x += Math.cos(a) * 9;
          y += Math.abs(Math.sin(a)) * 9 + 1;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });

    // 雾与云共用同一组雾团。原先加在动画层上的 CSS 滤镜 / 遮罩会让 GPU 每帧重算，
    // 这里一次性烘焙进贴图：rgb 为调色后的颜色，blur 为预模糊，ramp 为顶部渐隐
    const fogTex = (rgb, { blur = 0, ramp = null } = {}) => canvasTex(1024, 300, (ctx, w, h) => {
      const fr = GY.rng("fog");
      // 模糊时左右各多画一段（雾团本身带环绕副本），模糊后裁掉，保证横向平铺无接缝
      const pad = blur * 4;
      const src = blur ? canvasTex(w + pad * 2, h, () => {}) : null;
      const sctx = src ? src.getContext("2d") : ctx;
      if (src) sctx.translate(pad, 0);
      for (let i = 0; i < 90; i++) {
        const x = fr() * w, y = h * 0.25 + fr() * h * 0.6, rad = 40 + fr() * 120;
        // 环绕副本与本体同一透明度（否则平铺处有接缝）；仍取 3 个随机数，保持雾团布局不变
        const a = [fr(), fr(), fr()][1];
        for (const dx of [-w, 0, w]) {
          const g = sctx.createRadialGradient(x + dx, y, 0, x + dx, y, rad);
          g.addColorStop(0, `rgba(${rgb},${0.05 + a * 0.09})`);
          g.addColorStop(1, `rgba(${rgb},0)`);
          sctx.fillStyle = g;
          sctx.fillRect(x + dx - rad, y - rad, rad * 2, rad * 2);
        }
      }
      if (src) {
        ctx.filter = `blur(${blur}px)`;
        ctx.drawImage(src, -pad, 0);
        ctx.filter = "none";
      }
      if (ramp) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        ramp.forEach(([o, a]) => g.addColorStop(o, `rgba(0,0,0,${a})`));
        ctx.globalCompositeOperation = "destination-in";
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
    });
    const FOG = "210,215,230";
    // 前景雾容器的遮罩：从顶部透明渐变到 55% 处不透明。f1 贴图铺满容器高度；
    // f2 贴图只占底部 70%（容器 30%~100%），渐变按比例换算
    const fogF1 = fogTex(FOG, { ramp: [[0, 0], [0.55, 1], [1, 1]] });
    const fogF2 = fogTex(FOG, { blur: 2, ramp: [[0, 0.3 / 0.55], [0.25 / 0.7, 1], [1, 1]] });
    // 云：等价于 filter: brightness(.55) sepia(.2) hue-rotate(190deg) 作用于雾色
    const cloud = fogTex("122,124,124");

    // 用 blob: 短地址代替 base64 长串：CSS 变量会被所有元素继承，长串会让每次样式计算都重新解析
    const url = (c) => {
      const bin = atob(c.toDataURL("image/png").split(",")[1]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return `url(${URL.createObjectURL(new Blob([bytes], { type: "image/png" }))})`;
    };
    root.setProperty("--tex-noise", url(noise));
    root.setProperty("--tex-grain", url(grain));
    root.setProperty("--tex-blotch", url(blotch));
    root.setProperty("--tex-speckle", url(speckle));
    root.setProperty("--tex-veins", url(veins));
    root.setProperty("--tex-fog-f1", url(fogF1));
    root.setProperty("--tex-fog-f2", url(fogF2));
    root.setProperty("--tex-cloud", url(cloud));
  };

  /* ---------- 墓碑外形 ---------- */
  // 返回 SVG path，坐标系为 w × h
  GY.shapePath = (shape, w, h, ox = 0, oy = 0) => {
    const X = (v) => (ox + v).toFixed(2), Y = (v) => (oy + v).toFixed(2);
    const poly = (pts) => `M${pts.map(([x, y]) => `${X(x)} ${Y(y)}`).join("L")}Z`;
    switch (shape) {
      case "arch": {
        const ry = w * 0.36;
        return `M${X(0)} ${Y(h)}L${X(0)} ${Y(ry)}A${w / 2} ${ry} 0 0 1 ${X(w)} ${Y(ry)}L${X(w)} ${Y(h)}Z`;
      }
      case "shoulder":
        return `M${X(0)} ${Y(h)}L${X(0)} ${Y(w * 0.3)}C${X(0)} ${Y(w * 0.19)} ${X(w * 0.1)} ${Y(w * 0.16)} ${X(w * 0.2)} ${Y(w * 0.16)}` +
          `C${X(w * 0.28)} ${Y(w * 0.16)} ${X(w * 0.3)} ${Y(w * 0.02)} ${X(w * 0.5)} ${Y(0)}` +
          `C${X(w * 0.7)} ${Y(w * 0.02)} ${X(w * 0.72)} ${Y(w * 0.16)} ${X(w * 0.8)} ${Y(w * 0.16)}` +
          `C${X(w * 0.9)} ${Y(w * 0.16)} ${X(w)} ${Y(w * 0.19)} ${X(w)} ${Y(w * 0.3)}L${X(w)} ${Y(h)}Z`;
      case "slab": {
        const c = w * 0.09;
        return `M${X(0)} ${Y(h)}L${X(0)} ${Y(c)}L${X(c)} ${Y(0)}L${X(w - c)} ${Y(0)}L${X(w)} ${Y(c)}L${X(w)} ${Y(h)}Z`;
      }
      case "cross": {
        const bx = w * 0.29, by = h * 0.15, bh = h * 0.2;
        return `M${X(bx)} ${Y(h)}L${X(bx)} ${Y(by + bh)}L${X(0)} ${Y(by + bh)}L${X(0)} ${Y(by)}L${X(bx)} ${Y(by)}L${X(bx)} ${Y(0)}` +
          `L${X(w - bx)} ${Y(0)}L${X(w - bx)} ${Y(by)}L${X(w)} ${Y(by)}L${X(w)} ${Y(by + bh)}L${X(w - bx)} ${Y(by + bh)}L${X(w - bx)} ${Y(h)}Z`;
      }
      case "pillar": { // 日式角柱：台石 + 低四角锥顶
        const b = h * 0.88, s = w * 0.06;
        return poly([[0, h], [0, b], [s, b], [s, w * 0.1], [w / 2, 0], [w - s, w * 0.1], [w - s, b], [w, b], [w, h]]);
      }
      case "blade": // 刀锋：背脊直上，斜切成锋尖，刃侧凹弧收向尖端
        return `M${X(0)} ${Y(h)}L${X(0)} ${Y(w * 0.6)}L${X(w * 0.3)} ${Y(0)}` +
          `C${X(w * 0.5)} ${Y(w * 0.16)} ${X(w * 0.98)} ${Y(w * 0.24)} ${X(w)} ${Y(w * 0.56)}L${X(w)} ${Y(h)}Z`;
      case "crystal": // 晶簇：不对称的刻面顶
        return poly([[0, h], [0, w * 0.46], [w * 0.17, w * 0.2], [w * 0.4, 0], [w * 0.78, w * 0.12], [w, w * 0.4], [w, h]]);
      case "obelisk": // 方尖碑：略收的碑身 + 尖顶 + 基座
        return poly([[0, h], [0, h * 0.9], [w * 0.05, h * 0.9], [w * 0.09, w * 0.46], [w / 2, 0], [w * 0.91, w * 0.46], [w * 0.95, h * 0.9], [w, h * 0.9], [w, h]]);
      case "ogee": // 洋葱拱：S 形曲线收于尖顶
        return `M${X(0)} ${Y(h)}L${X(0)} ${Y(w * 0.42)}C${X(0)} ${Y(w * 0.2)} ${X(w * 0.4)} ${Y(w * 0.3)} ${X(w / 2)} ${Y(0)}` +
          `C${X(w * 0.6)} ${Y(w * 0.3)} ${X(w)} ${Y(w * 0.2)} ${X(w)} ${Y(w * 0.42)}L${X(w)} ${Y(h)}Z`;
      case "gothic":
      default: {
        // 尖拱：两段圆弧交于顶点
        const rad = w * 0.62, ay = Math.sqrt(rad * rad - (rad - w / 2) ** 2);
        return `M${X(0)} ${Y(h)}L${X(0)} ${Y(ay)}A${rad} ${rad} 0 0 1 ${X(w / 2)} ${Y(0)}A${rad} ${rad} 0 0 1 ${X(w)} ${Y(ay)}L${X(w)} ${Y(h)}Z`;
      }
    }
  };

  // 碑面顶部被弧形占用的高度比例（用于排版留白）
  GY.shapeCap = (shape) => ({
    arch: 0.36, shoulder: 0.2, slab: 0.06, cross: 0, gothic: 0.52,
    pillar: 0.08, blade: 0.4, crystal: 0.46, obelisk: 0.46, ogee: 0.5
  }[shape] ?? 0.4);

  GY.shapeMask = (shape, w, h) =>
    svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${GY.shapePath(shape, w, h)}"/></svg>`);

  // 放大碑面顶部纹章的位置（单位 cqw，碑宽 = 100）。按内圈刻线的真实轮廓采样纹章外接圆，
  // 找出离碑顶最近且距刻线留足 pad 的位置；正文起点放不下时整体压低，压得太多就缩小纹章
  GY.emblemSlot = (shape, W, H, cap, { pad = 3.5, gap = 3, sizes = [13, 11.5, 10], maxPush = 8 } = {}) => {
    const m = W * 0.075, ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("style", "position:absolute;width:0;height:0;visibility:hidden");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", GY.shapePath(shape, W - m * 2, H - m * 2, m, m));
    svg.appendChild(path);
    document.body.appendChild(svg);
    const inside = (x, y) => path.isPointInFill(new DOMPoint(x, y));
    const fits = (cy, r) => {
      for (let k = 0; k < 16; k++) {
        const a = (k * Math.PI) / 8;
        if (!inside(W / 2 + Math.cos(a) * r, cy + Math.sin(a) * r)) return false;
      }
      return true;
    };

    const natural = cap * 50 + 5; // 不压低时正文的起点
    let slot = null;
    for (const size of sizes) {
      const r = size / 2 + pad;
      let cy = m + r;
      while (cy < H / 2 && !fits(cy, r)) cy += 0.5;
      if (cy >= H / 2) continue;
      const room = natural - 2 - size / 2 - cy; // 纹章下沿与正文之间的富余
      const centre = room > 0 ? cy + room / 2 : cy;
      const textTop = Math.max(natural, centre + size / 2 + gap);
      slot = { size, top: centre - size / 2, cap: (textTop - 5) / 50 };
      if (textTop - natural <= maxPush) break;
    }
    svg.remove();
    return slot;
  };

  // 碑身描边：外缘倒角高光 + 内圈刻线
  GY.shapeBevel = (shape, w, h, inset = true) => {
    const m = w * 0.075;
    const inner = inset && shape !== "cross"
      ? `<path d="${GY.shapePath(shape, w - m * 2, h - m * 2, m, m)}" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="1.4" vector-effect="non-scaling-stroke"/>
         <path d="${GY.shapePath(shape, w - m * 2, h - m * 2, m + 0.6, m + 0.6)}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1" vector-effect="non-scaling-stroke"/>`
      : "";
    // 渐变 #bv 定义在 index.html 的全局 <defs> 中
    return `<svg class="bevel" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <path d="${GY.shapePath(shape, w, h)}" fill="none" stroke="url(#bv)" stroke-width="7" vector-effect="non-scaling-stroke"/>
      ${inner}</svg>`;
  };

  // 随机裂纹
  GY.cracks = (seed, w, h, count = 2) => {
    const r = GY.rng(seed + ":crack");
    let d = "";
    const n = Math.floor(r() * (count + 1));
    for (let k = 0; k < n; k++) {
      let x = r() < 0.5 ? r() * w * 0.2 : w - r() * w * 0.2, y = h * (0.15 + r() * 0.6);
      let a = x < w / 2 ? 0.3 + r() * 0.5 : Math.PI - 0.3 - r() * 0.5;
      d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
      const steps = 4 + Math.floor(r() * 5);
      for (let i = 0; i < steps; i++) {
        a += (r() - 0.5) * 1.1;
        x += Math.cos(a) * (3 + r() * 6);
        y += Math.sin(a) * (3 + r() * 6);
        d += `L${x.toFixed(1)} ${y.toFixed(1)}`;
        if (r() < 0.25) {
          const bx = x + Math.cos(a + 1) * 5, by = y + Math.sin(a + 1) * 5;
          d += `M${bx.toFixed(1)} ${by.toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}`;
        }
      }
    }
    if (!d) return "";
    return `<svg class="cracks" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <path d="${d}" fill="none" stroke="rgba(255,255,255,.13)" stroke-width="1.2" transform="translate(.5 .5)" vector-effect="non-scaling-stroke"/>
      <path d="${d}" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`;
  };

  // 草丛
  GY.grass = (seed, w = 200, h = 40, n = 46) => {
    const r = GY.rng(seed + ":grass");
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = r() * w, gh = h * (0.3 + r() * 0.7), bend = (r() - 0.5) * 16, bw = 0.8 + r() * 1.4;
      const dry = r() < 0.18;
      const col = dry ? `hsl(${40 + r() * 10},${18 + r() * 10}%,${18 + r() * 10}%)` : `hsl(${110 + r() * 40},${10 + r() * 14}%,${8 + r() * 12}%)`;
      s += `<path d="M${(x - bw).toFixed(1)} ${h}Q${(x + bend * 0.3).toFixed(1)} ${(h - gh * 0.6).toFixed(1)} ${(x + bend).toFixed(1)} ${(h - gh).toFixed(1)}Q${(x + bend * 0.3 + bw).toFixed(1)} ${(h - gh * 0.55).toFixed(1)} ${(x + bw).toFixed(1)} ${h}Z" fill="${col}"/>`;
    }
    return `<svg class="grass" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`;
  };

  /* ---------- 纹章 ---------- */
  const circ = (cx, cy, r, cw = 1) =>
    `M${cx - r} ${cy}A${r} ${r} 0 1 ${cw} ${cx + r} ${cy}A${r} ${r} 0 1 ${cw} ${cx - r} ${cy}Z`;
  const rect = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}Z`;

  function gearPath() {
    const n = 10, step = (Math.PI * 2) / n, cx = 32, cy = 32, ro = 27, ri = 21.5;
    const pt = (r, a) => `${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`;
    let d = "";
    for (let i = 0; i < n; i++) {
      const b = i * step;
      d += `${i ? "L" : "M"}${pt(ri, b - step * 0.28)}L${pt(ro, b - step * 0.14)}L${pt(ro, b + step * 0.14)}L${pt(ri, b + step * 0.28)}`;
    }
    return d + "Z" + circ(32, 32, 15) + circ(32, 32, 11.5) + circ(32, 32, 5);
  }

  function starPath() {
    let d = "";
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * ((Math.PI * 4) / 5);
      d += `${i ? "L" : "M"}${(32 + Math.cos(a) * 24).toFixed(2)} ${(32 + Math.sin(a) * 24).toFixed(2)}`;
    }
    return d + "Z";
  }

  // 樱花：五片带缺口的花瓣，绕中心旋转拼成
  function sakuraPath() {
    const petal = [[0, -5], [-8, -10], [-14, -19], [-7, -26], [0, -21], [7, -26], [14, -19], [8, -10], [0, -5]];
    let d = "";
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5, c = Math.cos(a), s = Math.sin(a);
      const p = ([x, y]) => `${(32 + x * c - y * s).toFixed(2)} ${(32 + x * s + y * c).toFixed(2)}`;
      const [m, c1, c2, e1, n, e2, c3, c4, z] = petal.map(p);
      d += `M${m}C${c1} ${c2} ${e1}L${n}L${e2}C${c3} ${c4} ${z}Z`;
    }
    return d + circ(32, 32, 2.2);
  }

  // 炼成阵：双环 + 六芒星 + 内环，六角各缀一点
  function alchemyCircle() {
    const pt = (deg, r) => [(32 + Math.cos((deg * Math.PI) / 180) * r).toFixed(2), (32 + Math.sin((deg * Math.PI) / 180) * r).toFixed(2)];
    const tri = (a0) => `M${[0, 120, 240].map((k) => pt(a0 + k, 24).join(" ")).join("L")}Z`;
    const dots = [0, 60, 120, 180, 240, 300].map((k) => { const [x, y] = pt(k - 90, 24); return `<circle cx="${x}" cy="${y}" r="2.6" fill="currentColor" stroke="none"/>`; }).join("");
    return `<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><circle cx="32" cy="32" r="29"/><circle cx="32" cy="32" r="26.4" stroke-width="1"/>` +
      `<path d="${tri(-90)}"/><path d="${tri(90)}"/><circle cx="32" cy="32" r="11"/></g>${dots}<path d="M32 26l6 6-6 6-6-6Z"/>`;
  }

  const EMBLEMS = {
    sakura: () => `<path d="${sakuraPath()}" fill-rule="evenodd"/>`,
    blades: () => {
      const blade = `<path d="M32 2L35.6 10V43H28.4V10Z${rect(17, 43, 30, 4.2)}${rect(30, 47, 4, 9)}${circ(32, 59, 3.2)}"/>`;
      return [45, -45].map((a) => `<g transform="translate(32 32) rotate(${a}) scale(.98) translate(-32 -32)">${blade}</g>`).join("");
    },
    circle: alchemyCircle,
    flask: () => `<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6h16M27 6v18L13.5 49c-2 4 .6 9 5 9h27c4.4 0 7-5 5-9L37 24V6"/></g>` +
      `<path d="M20.5 40h23l6 11.5c1 2-.3 4.5-2.6 4.5H17.1c-2.3 0-3.6-2.5-2.6-4.5Z"/><circle cx="30" cy="30" r="2"/><circle cx="36" cy="22" r="1.6"/>`,
    crystal: () => `<g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M19 6H45L58 22L32 58L6 22Z"/><path d="M6 22H58M19 6L25 22L32 6L39 22L45 6M25 22L32 58L39 22"/></g><path d="M25 22H39L32 58Z"/>`,
    gear: () => `<path fill-rule="evenodd" d="${gearPath()}"/>`,
    moon: () => `<path d="M40.2 9.45A24 24 0 1 0 50.4 47.4A20 20 0 0 1 40.2 9.45Z"/><path d="M52 14l1.6 4.8 4.8 1.6-4.8 1.6L52 26.8l-1.6-4.8-4.8-1.6 4.8-1.6Z"/>`,
    cross: () => `<path d="${rect(28.5, 4, 7, 56)}${rect(12, 17.5, 40, 7)}${circ(32, 21, 13)}${circ(32, 21, 10, 0)}"/>`,
    sword: () => `<path d="M32 4L35 11V43H29V11Z${rect(19, 43, 26, 4)}${rect(30, 47, 4, 9)}${circ(32, 58.5, 3)}"/>`,
    rose: () => `<g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M29 26a3 3 0 1 1 6 0a5 5 0 1 1-10 0a7.5 7.5 0 1 1 15 0a10 10 0 1 1-20 0"/><path d="M31 36q-3 12 2 24"/></g><path d="M31 48q-8-5-11 0q6 4 11 0Zm1.5 5q7-5 10.5-.5q-5.5 4-10.5.5Z"/>`,
    skull: () => `<path fill-rule="evenodd" d="M32 6C19 6 11 15 11 27c0 7 3 11 9 13v7h24v-7c6-2 9-6 9-13C53 15 45 6 32 6Z${circ(24, 27, 5.5)}${circ(40, 27, 5.5)}M32 32l3 6h-6Z${rect(26.5, 42, 1.6, 5)}${rect(31.2, 42, 1.6, 5)}${rect(35.9, 42, 1.6, 5)}"/><path fill-rule="evenodd" d="M21 49h22v5c0 3-4 5-11 5s-11-2-11-5Z${rect(27, 49, 1.5, 6)}${rect(35.5, 49, 1.5, 6)}"/>`,
    star: () => `<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="${circ(32, 32, 27)}"/><path d="${starPath()}"/></g>`,
    hourglass: () => `<path d="M18 6h28v4h-3c0 11-8 16-8 22s8 11 8 22h3v4H18v-4h3c0-11 8-16 8-22s-8-11-8-22h-3Z"/>`
  };

  GY.emblem = (name) => {
    if (!name) return "";
    if (EMBLEMS[name]) return `<svg class="emblem" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">${EMBLEMS[name]()}</svg>`;
    return `<img class="emblem" src="${GY.esc(name)}" alt="">`; // 也可填图片路径
  };

  /* ---------- 下载图标 ---------- */
  const ICONS = {
    android: [24, "M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"],
    windows: [24, "M3 5.5l7.5-1v7H3v-6zm0 13l7.5 1v-7H3v6zm8.5 1.2L21 21v-8.5h-9.5v7.2zm0-15.4v7.2H21V3l-9.5 1.3z"],
    github: [16, "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"],
    cloud: [24, "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"],
    link: [24, "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"],
    download: [24, "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"]
  };

  GY.icon = (name) => {
    const [vb, d] = ICONS[name] || ICONS.download;
    return `<svg class="icon" viewBox="0 0 ${vb} ${vb}" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
  };
})();
