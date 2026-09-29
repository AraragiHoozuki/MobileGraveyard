/* 氛围：星空、流星、闪电、蝙蝠，以及前景粒子（浮尘、鬼火、落叶、魂火、碎石） */
(function () {
  const GY = window.GY;
  const rand = (a, b) => a + Math.random() * (b - a);
  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

  function fitCanvas(c) {
    const w = innerWidth, h = innerHeight;
    c.width = Math.round(w * DPR);
    c.height = Math.round(h * DPR);
    const ctx = c.getContext("2d");
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { ctx, w, h };
  }

  // 预渲染发光贴图
  function glowSprite(r, stops) {
    const c = document.createElement("canvas");
    c.width = c.height = r * 2;
    const g = c.getContext("2d").createRadialGradient(r, r, 0, r, r, r);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    const ctx = c.getContext("2d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, r * 2, r * 2);
    return c;
  }

  // 实心圆点（星星）
  function dotSprite(col) {
    const c = document.createElement("canvas");
    c.width = c.height = 8;
    const ctx = c.getContext("2d");
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(4, 4, 4, 0, Math.PI * 2);
    ctx.fill();
    return c;
  }

  // 落叶：放大绘制一次，之后按大小缩放
  const LEAF_COLORS = ["#4a1c14", "#5b2a15", "#3b2a18", "#62341c", "#2e2a1a"];
  function leafSprite(col) {
    const S = 8, k = 4, c = document.createElement("canvas");
    c.width = Math.ceil(2.3 * S * k);
    c.height = Math.ceil(0.7 * S * k);
    const ctx = c.getContext("2d");
    ctx.scale(k, k);
    ctx.translate(1.3 * S, 0.35 * S);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-S, 0);
    ctx.quadraticCurveTo(0, -S * 0.6, S, 0);
    ctx.quadraticCurveTo(0, S * 0.6, -S, 0);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.35)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-S * 1.3, 0);
    ctx.lineTo(S, 0);
    ctx.stroke();
    return c;
  }

  // 所有粒子都用预渲染贴图绘制：避免逐帧解析颜色字符串和构造路径
  const SPRITES = {
    wisp: glowSprite(64, [[0, "rgba(230,255,250,1)"], [0.12, "rgba(160,245,225,.9)"], [0.35, "rgba(100,220,200,.28)"], [1, "rgba(80,200,190,0)"]]),
    soul: glowSprite(64, [[0, "rgba(235,240,255,.9)"], [0.25, "rgba(180,200,255,.35)"], [1, "rgba(150,170,255,0)"]]),
    dust: glowSprite(8, [[0, "rgba(230,225,210,1)"], [1, "rgba(230,225,210,0)"]]),
    star: dotSprite("#dfe6ff"),
    starWarm: dotSprite("#ffe9c8"),
    leaves: LEAF_COLORS.map(leafSprite),
    chips: ["#8a8780", "#5d5b57", "#b5b0a4", "#3f3d3a"].map((col) => {
      const c = document.createElement("canvas");
      c.width = c.height = 4;
      const ctx = c.getContext("2d");
      ctx.fillStyle = col;
      ctx.fillRect(0, 0, 4, 4);
      return c;
    })
  };

  /* ================= 天幕 ================= */
  // 星空闪烁缓慢（周期 3.5~15 秒），以 20fps 重绘即可，逐帧差异不足 3%，肉眼无法分辨；
  // 流星与闪电需要流畅运动，放在单独一层，仅在出现时逐帧绘制
  const STAR_INTERVAL = 50;
  const sky = { stars: [], bolt: null, nextShoot: 0, shoot: null, lastStars: -Infinity, fxDirty: false };

  function initSky() {
    const c = document.getElementById("sky-canvas");
    const fc = document.getElementById("sky-fx");
    const setup = () => {
      Object.assign(sky, fitCanvas(c));
      sky.fctx = fitCanvas(fc).ctx;
      sky.fcanvas = fc;
      fc.style.visibility = "hidden";
      sky.lastStars = -Infinity;
      const n = Math.round((sky.w * sky.h) / 5200);
      sky.stars = Array.from({ length: n }, () => {
        const r = Math.random() < 0.93 ? rand(0.3, 0.9) : rand(1, 1.6);
        return {
          x: Math.random() * sky.w - r,
          y: Math.pow(Math.random(), 1.4) * sky.h * 0.75 - r,
          d: r * 2,
          p: Math.random() * Math.PI * 2,
          s: rand(0.4, 1.8) * 0.001,
          img: Math.random() < 0.15 ? SPRITES.starWarm : SPRITES.star
        };
      });
      sky.hidden = false;
      // 银河：一条淡淡的斜带
      const band = document.createElement("canvas");
      band.width = sky.w;
      band.height = sky.h;
      const b = band.getContext("2d");
      b.translate(sky.w * 0.3, 0);
      b.rotate(0.45);
      for (let i = 0; i < 260; i++) {
        const x = rand(-sky.w * 0.2, sky.w * 1.4), y = rand(-60, 60) * (1 + Math.random());
        const r = rand(20, 90);
        const g = b.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(170,170,220,${rand(0.012, 0.035)})`);
        g.addColorStop(1, "rgba(170,170,220,0)");
        b.fillStyle = g;
        b.fillRect(x - r, y - r, r * 2, r * 2);
      }
      sky.band = band;
    };
    setup();
    addEventListener("resize", debounce(setup, 200));
    sky.nextShoot = performance.now() + rand(4000, 9000);
  }

  function drawSky(t) {
    const { ctx, fctx, w, h } = sky;
    // 墓园深处看不到天空：清空一次后停止绘制
    if (scrollY > innerHeight * 1.3) {
      if (!sky.hidden) {
        ctx.clearRect(0, 0, w, h);
        fctx.clearRect(0, 0, w, h);
      }
      sky.hidden = true;
      sky.lastStars = -Infinity;
      return;
    }
    sky.hidden = false;

    if (t - sky.lastStars >= STAR_INTERVAL) {
      sky.lastStars = t;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(sky.band, 0, 0);
      for (const s of sky.stars) {
        ctx.globalAlpha = 0.675 + 0.325 * Math.sin(t * s.s + s.p);
        ctx.drawImage(s.img, s.x, s.y, s.d, s.d);
      }
      ctx.globalAlpha = 1;
    }

    const bolt = sky.bolt && t < sky.bolt.until;
    if (!sky.shoot && t > sky.nextShoot) {
      const x = rand(w * 0.1, w * 0.7), y = rand(h * 0.03, h * 0.25);
      sky.shoot = { x, y, vx: rand(7, 11), vy: rand(2.5, 4), life: 0, max: rand(40, 60) };
    }
    if (!sky.shoot && !bolt && !sky.fxDirty) return;
    fctx.clearRect(0, 0, w, h);
    sky.fxDirty = !!(sky.shoot || bolt);
    // 空闲时隐藏这一层，免得合成器每帧混合一张全屏透明画布
    sky.fcanvas.style.visibility = sky.fxDirty ? "visible" : "hidden";
    drawSkyFx(fctx, t, bolt);
  }

  function drawSkyFx(ctx, t, bolt) {
    // 流星
    if (sky.shoot) {
      const s = sky.shoot;
      s.life++;
      s.x += s.vx;
      s.y += s.vy;
      const fade = Math.sin((s.life / s.max) * Math.PI);
      const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 14, s.y - s.vy * 14);
      g.addColorStop(0, `rgba(255,255,255,${0.9 * fade})`);
      g.addColorStop(1, "rgba(200,210,255,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 14, s.y - s.vy * 14);
      ctx.stroke();
      if (s.life > s.max) {
        sky.shoot = null;
        sky.nextShoot = t + rand(9000, 22000);
      }
    }

    // 闪电
    if (bolt) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowColor = "rgba(190,200,255,.9)";
      ctx.shadowBlur = 18;
      for (const [lw, col] of [[4, "rgba(150,170,255,.35)"], [1.4, "rgba(240,245,255,.95)"]]) {
        ctx.lineWidth = lw;
        ctx.strokeStyle = col;
        ctx.stroke(sky.bolt.path);
      }
      ctx.restore();
    }
  }

  function makeBolt() {
    const p = new Path2D();
    let x = rand(sky.w * 0.08, sky.w * 0.6), y = -10;
    p.moveTo(x, y);
    const end = sky.h * rand(0.42, 0.6);
    while (y < end) {
      x += rand(-28, 28);
      y += rand(12, 34);
      p.lineTo(x, y);
      if (Math.random() < 0.18) { // 分叉
        let bx = x, by = y;
        const sub = new Path2D();
        sub.moveTo(bx, by);
        for (let i = 0; i < 4; i++) {
          bx += rand(-30, 30);
          by += rand(10, 26);
          sub.lineTo(bx, by);
        }
        p.addPath(sub);
        p.moveTo(x, y);
      }
    }
    return p;
  }

  /* 远雷：闪光 + 天幕上的电光 */
  function lightning() {
    if (GY.reducedMotion || document.hidden || document.body.classList.contains("crypt-open")) return;
    const flash = document.querySelector(".flash");
    flash.classList.add("on");
    flash.animate(
      [{ opacity: 0 }, { opacity: 0.9, offset: 0.05 }, { opacity: 0.1, offset: 0.12 }, { opacity: 0.6, offset: 0.2 }, { opacity: 0, offset: 1 }],
      { duration: 1400, easing: "ease-out" }
    ).onfinish = () => flash.classList.remove("on");
    if (scrollY < innerHeight) {
      sky.bolt = { path: makeBolt(), until: performance.now() + 220 };
    }
  }

  /* ================= 蝙蝠 ================= */
  const BAT = `<svg viewBox="0 0 64 30" fill="currentColor"><path d="M32 9c-1-2-1.6-4-2.2-5.6L28.6 7C26 6 22 6.4 19 8.6 15 5.6 8.4 4.6 1.5 6.4c5.6 2 8.6 6.4 8.8 11.6 3-2.2 7.2-2.2 9.8.4 2.4-1.8 5.6-1.6 7.4.4.9 2.4 2.6 4.4 4.5 6.6 1.9-2.2 3.6-4.2 4.5-6.6 1.8-2 5-2.2 7.4-.4 2.6-2.6 6.8-2.6 9.8-.4.2-5.2 3.2-9.6 8.8-11.6C55.6 4.6 49 5.6 45 8.6 42 6.4 38 6 35.4 7l-1.2-3.6C33.6 5 33 7 32 9z"/></svg>`;

  function releaseBats() {
    const host = document.querySelector(".bats");
    if (!host || document.hidden || scrollY > innerHeight * 0.8) return;
    const n = 1 + Math.floor(Math.random() * 3);
    const W = host.clientWidth, H = host.clientHeight;
    const fromRight = Math.random() < 0.6;
    for (let i = 0; i < n; i++) {
      const bat = document.createElement("div");
      bat.className = "bat";
      bat.innerHTML = BAT;
      const scale = rand(0.5, 1.1);
      bat.style.width = 34 * scale + "px";
      host.appendChild(bat);
      const y0 = rand(H * 0.08, H * 0.35), dir = fromRight ? -1 : 1;
      const x0 = fromRight ? W + 60 : -60, x1 = fromRight ? -80 : W + 80;
      const frames = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        frames.push({
          transform: `translate(${x0 + (x1 - x0) * t + i * 30 * dir}px, ${y0 + Math.sin(t * Math.PI * 3 + i) * 40 - t * rand(0, 60) + i * 18}px) scaleX(${dir})`
        });
      }
      bat.animate(frames, { duration: rand(5500, 8500), delay: i * rand(150, 500), easing: "linear" }).onfinish = () => bat.remove();
    }
  }

  /* ================= 前景粒子 ================= */
  const fx = { parts: [], cfg: {} };

  function spawnDust() {
    return { t: "dust", x: Math.random() * fx.w, y: Math.random() * fx.h, vx: rand(-0.08, 0.12), vy: rand(-0.12, 0.05), r: rand(0.6, 1.8), p: Math.random() * 6.28, a: rand(0.15, 0.55) };
  }
  function spawnWisp() {
    return { t: "wisp", x: Math.random() * fx.w, y: rand(fx.h * 0.35, fx.h * 0.95), ang: Math.random() * 6.28, sp: rand(0.15, 0.45), r: rand(6, 14), p: Math.random() * 6.28, trail: [] };
  }
  function spawnLeaf(top = false) {
    return {
      t: "leaf", x: Math.random() * fx.w, y: top ? -20 : Math.random() * fx.h, vy: rand(0.35, 0.9), sw: rand(0.6, 1.6), p: Math.random() * 6.28,
      rot: Math.random() * 6.28, vr: rand(-0.03, 0.03), s: rand(4, 8), img: SPRITES.leaves[Math.floor(Math.random() * SPRITES.leaves.length)]
    };
  }

  function initFx(cfg) {
    fx.cfg = cfg;
    const c = document.getElementById("fx-canvas");
    const setup = () => Object.assign(fx, fitCanvas(c));
    setup();
    addEventListener("resize", debounce(setup, 200));
    const k = GY.reducedMotion ? 0.3 : innerWidth < 640 ? 0.6 : 1;
    for (let i = 0; i < Math.round((cfg.dust ?? 60) * k); i++) fx.parts.push(spawnDust());
    for (let i = 0; i < Math.round((cfg.wisps ?? 10) * k); i++) fx.parts.push(spawnWisp());
    if (cfg.leaves !== false) for (let i = 0; i < Math.round(9 * k); i++) fx.parts.push(spawnLeaf());
  }

  function drawFx(t, dt) {
    const { ctx, w, h } = fx;
    ctx.clearRect(0, 0, w, h);
    const wind = Math.sin(t * 0.00013) * 0.6 + Math.sin(t * 0.00041) * 0.3;
    const alive = [];

    for (const p of fx.parts) {
      switch (p.t) {
        case "dust": {
          p.x += (p.vx + wind * 0.15) * dt;
          p.y += p.vy * dt;
          if (p.x < -5) p.x = w + 5; else if (p.x > w + 5) p.x = -5;
          if (p.y < -5) p.y = h + 5; else if (p.y > h + 5) p.y = -5;
          ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(t * 0.002 + p.p));
          ctx.drawImage(SPRITES.dust, p.x - p.r * 2, p.y - p.r * 2, p.r * 4, p.r * 4);
          alive.push(p);
          break;
        }
        case "wisp": {
          p.ang += (Math.sin(t * 0.0007 + p.p) * 0.03 + (Math.random() - 0.5) * 0.06) * dt;
          p.x += Math.cos(p.ang) * p.sp * dt;
          p.y += Math.sin(p.ang) * p.sp * 0.6 * dt + Math.sin(t * 0.002 + p.p) * 0.15;
          if (p.y < h * 0.3) p.ang = Math.abs(p.ang) % Math.PI; // 不飞太高
          if (p.y > h + 20) p.ang = -Math.abs(p.ang);
          if (p.x < -40) p.x = w + 40; else if (p.x > w + 40) p.x = -40;
          p.trail.push(p.x, p.y);
          if (p.trail.length > 24) p.trail.splice(0, 2);
          const flick = 0.55 + 0.45 * Math.sin(t * 0.004 + p.p) * Math.sin(t * 0.0013 + p.p * 2);
          ctx.globalCompositeOperation = "lighter";
          for (let i = 0; i < p.trail.length; i += 2) {
            const k = i / p.trail.length;
            const rr = p.r * (0.3 + k * 0.7);
            ctx.globalAlpha = 0.12 * k * flick;
            ctx.drawImage(SPRITES.wisp, p.trail[i] - rr * 2, p.trail[i + 1] - rr * 2, rr * 4, rr * 4);
          }
          ctx.globalAlpha = 0.75 * flick;
          ctx.drawImage(SPRITES.wisp, p.x - p.r * 3, p.y - p.r * 3, p.r * 6, p.r * 6);
          ctx.globalCompositeOperation = "source-over";
          alive.push(p);
          break;
        }
        case "leaf": {
          p.y += p.vy * dt;
          p.x += (Math.sin(t * 0.0012 * p.sw + p.p) * 0.6 + wind) * dt;
          p.rot += p.vr * dt + Math.sin(t * 0.002 + p.p) * 0.01;
          if (p.y > h + 20) Object.assign(p, spawnLeaf(true));
          if (p.x > w + 20) p.x = -20; else if (p.x < -20) p.x = w + 20;
          // 平移 · 旋转 · 纵向压缩（翻飞）合成一个矩阵
          const cs = Math.cos(p.rot) * DPR, sn = Math.sin(p.rot) * DPR, fl = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.003 + p.p));
          ctx.setTransform(cs, sn, -sn * fl, cs * fl, p.x * DPR, p.y * DPR);
          ctx.globalAlpha = 0.85;
          ctx.drawImage(p.img, -1.3 * p.s, -0.35 * p.s, 2.3 * p.s, 0.7 * p.s);
          ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
          alive.push(p);
          break;
        }
        case "soul": {
          p.life += dt;
          if (p.life > p.max) break;
          const k = p.life / p.max;
          p.y += p.vy * dt;
          p.x += Math.sin(p.life * 0.05 + p.p) * 0.35 * dt;
          const a = Math.sin(k * Math.PI) * p.a;
          const rr = p.r * (0.6 + k * 0.8);
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = a;
          ctx.drawImage(SPRITES.soul, p.x - rr, p.y - rr * 2.2, rr * 2, rr * 4.4);
          ctx.globalCompositeOperation = "source-over";
          alive.push(p);
          break;
        }
        case "chip": {
          p.life += dt;
          if (p.life > p.max) break;
          p.vy += 0.12 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.99;
          ctx.globalAlpha = (1 - p.life / p.max) * p.a;
          ctx.drawImage(p.img, p.x, p.y, p.s, p.s);
          alive.push(p);
          break;
        }
        case "puff": {
          p.life += dt;
          if (p.life > p.max) break;
          const k = p.life / p.max;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.97;
          p.vy *= 0.97;
          const rr = p.r * (0.5 + k * 1.5);
          ctx.globalAlpha = (1 - k) * 0.22;
          ctx.drawImage(SPRITES.dust, p.x - rr, p.y - rr, rr * 2, rr * 2);
          alive.push(p);
          break;
        }
      }
    }
    ctx.globalAlpha = 1;
    fx.parts = alive;
  }

  /* 悬停墓碑时升起的魂火 */
  function souls(rect, n = 2) {
    if (fx.cfg.souls === false) return;
    for (let i = 0; i < n; i++) {
      fx.parts.push({
        t: "soul", x: rect.left + rect.width * rand(0.2, 0.8), y: rect.top + rect.height * rand(0.1, 0.5),
        vy: rand(-0.9, -0.45), r: rand(5, 11), p: Math.random() * 6.28, a: rand(0.35, 0.7), life: 0, max: rand(70, 130)
      });
    }
  }

  /* 碎石与尘埃：墓碑被拿起 / 翻转时 */
  function burst(rect, { chips = 26, puffs = 16, edge = "bottom" } = {}) {
    const y0 = edge === "bottom" ? rect.bottom - 4 : rect.top + rect.height / 2;
    for (let i = 0; i < chips; i++) {
      fx.parts.push({
        t: "chip", x: rect.left + Math.random() * rect.width, y: y0 - Math.random() * 20,
        vx: rand(-1.6, 1.6), vy: rand(-3, -0.5), s: rand(1, 3), life: 0, max: rand(40, 80), a: rand(0.5, 0.9),
        img: SPRITES.chips[Math.floor(Math.random() * SPRITES.chips.length)]
      });
    }
    for (let i = 0; i < puffs; i++) {
      fx.parts.push({
        t: "puff", x: rect.left + Math.random() * rect.width, y: y0 + rand(-10, 10),
        vx: rand(-1.2, 1.2), vy: rand(-0.8, 0.1), r: rand(20, 50), life: 0, max: rand(60, 110)
      });
    }
  }

  /* ================= 主循环 ================= */
  // 高刷屏（120~240Hz）上限制在 60~80fps（90Hz 及以下不受影响）：粒子每帧只移动零点几像素，
  // 更高帧率看不出差别，却成倍占用主线程
  const MIN_FRAME = 10;
  let last = performance.now();
  function loop(t) {
    requestAnimationFrame(loop);
    if (t - last < MIN_FRAME) return;
    const dt = Math.min((t - last) / 16.67, 3);
    last = t;
    if (!document.hidden) {
      drawSky(t);
      drawFx(t, dt);
    }
  }

  function debounce(fn, ms) {
    let id;
    return () => {
      clearTimeout(id);
      id = setTimeout(fn, ms);
    };
  }

  function schedule(fn, min, max) {
    const next = () => setTimeout(() => { fn(); next(); }, rand(min, max));
    next();
  }

  GY.atmosphere = {
    init(cfg = {}) {
      document.documentElement.style.setProperty("--fog-strength", cfg.fog ?? 1);
      initSky();
      initFx(cfg);
      requestAnimationFrame(loop);
      if (!GY.reducedMotion) {
        if (cfg.lightning !== false) schedule(lightning, 16000, 42000);
        if (cfg.bats !== false) {
          setTimeout(releaseBats, 3500);
          schedule(releaseBats, 11000, 24000);
        }
      }
    },
    souls,
    burst,
    lightning
  };
})();
