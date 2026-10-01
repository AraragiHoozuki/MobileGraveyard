/* 入口：读取配置、渲染、开场、交互绑定 */
(function () {
  const GY = window.GY;
  const C = window.GRAVEYARD;
  if (!C) {
    document.body.innerHTML = '<p style="color:#ddd;padding:2em">未找到 config.js</p>';
    return;
  }
  C.labels = C.labels || {};
  C.site = C.site || {};
  C.graves = (C.graves || []).filter((g) => g && g.id);

  const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), C);

  /* ---------- 文本绑定 ---------- */
  function bindText() {
    GY.$$("[data-text]").forEach((el) => {
      const v = get(el.dataset.text);
      if (v == null || v === "") el.hidden = true;
      else el.textContent = v;
    });
    document.title = [C.site.title, C.site.titleLatin].filter(Boolean).join(" · ");

    // 标题逐字
    const title = GY.$(".hero-title");
    title.innerHTML = [...(C.site.title || "")].map((ch, i) => `<span class="ch" style="--c:${i}">${GY.esc(ch)}</span>`).join("");
    const content = GY.$(".hero-content");
    content.classList.add("reveal-seq");
    [...content.children].forEach((el, i) => el.style.setProperty("--i", i));

    GY.$(".footer-links").innerHTML = (C.site.links || [])
      .map((l) => `<a href="${GY.esc(l.url)}" target="_blank" rel="noopener">${GY.esc(l.label)}</a>`).join("");
  }

  function stats(n) {
    const el = GY.$(".hero-stats");
    const tpl = C.labels.stats;
    if (!tpl) return (el.hidden = true);
    el.innerHTML = GY.esc(tpl)
      .replace("{buried}", `<b>${n.buried}</b>`)
      .replace("{open}", `<b>${n.open}</b>`)
      .replace("{alive}", `<b>${n.alive}</b>`)
      .replaceAll("✝", "<i>✝</i>");
    GY.$$(".yard-title").forEach((t, i) => {
      const c = document.createElement("span");
      c.className = "count";
      c.textContent = "— " + toRoman([n.buried, n.open, n.alive][i]) + " —";
      t.appendChild(c);
    });
  }

  function toRoman(n) {
    if (!n) return "0";
    const map = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let s = "";
    for (const [v, r] of map) while (n >= v) { s += r; n -= v; }
    return s;
  }

  /* ---------- 墓碑浮现 ---------- */
  function observeGraves() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.15 });
    GY.$$(".grave.reveal").forEach((g) => io.observe(g));
  }

  /* ---------- 视口外暂停 ---------- */
  function pauseOffscreen() {
    const sky = GY.$(".sky");
    new IntersectionObserver(([e]) => {
      e.target.classList.toggle("off", !e.isIntersecting);
      sky.classList.toggle("off", !e.isIntersecting);
    }).observe(GY.$(".hero"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle("off", !e.isIntersecting));
    }, { rootMargin: "120px 0px" });
    GY.$$(".grave").forEach((g) => io.observe(g));
  }

  /* ---------- 交互 ---------- */
  function bindGraves() {
    const byId = Object.fromEntries(C.graves.map((g) => [g.id, g]));
    let timer = null;

    GY.$("#yard").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-id]");
      if (btn && byId[btn.dataset.id]) GY.crypt.open(byId[btn.dataset.id]);
    });

    // 悬停时魂火升起
    GY.$$("#yard [data-id]").forEach((btn) => {
      const target = btn.querySelector(".stone") || btn.querySelector(".lamp-flame") || btn;
      btn.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse") return;
        clearInterval(timer);
        GY.atmosphere.souls(target.getBoundingClientRect(), 2);
        timer = setInterval(() => GY.atmosphere.souls(target.getBoundingClientRect(), 1), 320);
      });
      btn.addEventListener("pointerleave", () => clearInterval(timer));
    });

    // 深链：#id 直接打开对应墓碑；浏览器后退可关闭
    const fromHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const g = byId[id];
      if (g && !GY.crypt.isOpen) {
        const el = document.getElementById("grave-" + id);
        el.classList.add("in");
        el.scrollIntoView({ block: "center" });
        setTimeout(() => GY.crypt.open(g, true), 400);
      } else if (!g && GY.crypt.isOpen) GY.crypt.close(true);
    };
    addEventListener("popstate", fromHash);
    return fromHash;
  }

  function lanternLight() {
    if (!matchMedia("(hover: hover)").matches) return;
    const c = GY.$(".lantern-light");
    // 光晕极平滑，以 1/4 分辨率绘制、由 GPU 拉伸即可，显存只占全尺寸的 1/16
    const K = 4;
    const draw = () => {
      const W = innerWidth * 2, H = innerHeight * 2, cx = W / 2, cy = H / 2;
      c.width = Math.ceil(W / K);
      c.height = Math.ceil(H / K);
      const ctx = c.getContext("2d");
      ctx.scale(c.width / W, c.height / H);
      // 四周压暗
      let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 900);
      g.addColorStop(0.25, "rgba(2,3,6,0)");
      g.addColorStop(1, "rgba(2,3,6,.38)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // 中心暖光
      g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 240);
      g.addColorStop(0, "rgba(255,176,100,.07)");
      g.addColorStop(0.7, "rgba(255,176,100,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    };
    draw();
    let resizeId;
    addEventListener("resize", () => {
      clearTimeout(resizeId);
      resizeId = setTimeout(draw, 150);
    });

    const light = c.style;
    let x = innerWidth / 2, y = innerHeight / 2, queued = false;
    addEventListener("pointermove", (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!queued) {
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          light.transform = `translate3d(${x}px, ${y}px, 0)`;
        });
      }
    }, { passive: true });
  }

  /* ---------- 背景音（可选） ---------- */
  const BELL = `<svg viewBox="0 0 24 24"><path d="M12 2a1.5 1.5 0 0 1 1.5 1.5v.6A6 6 0 0 1 18 10v5l2 3H4l2-3v-5a6 6 0 0 1 4.5-5.9v-.6A1.5 1.5 0 0 1 12 2Zm-2 18h4a2 2 0 0 1-4 0Z"/></svg>`;
  const audio = {
    el: null, btn: null,
    init() {
      if (!C.site.ambientAudio) return;
      this.el = GY.$("#ambient");
      this.btn = GY.$("#audio-toggle");
      this.el.src = C.site.ambientAudio;
      this.el.volume = 0;
      this.btn.innerHTML = BELL;
      this.btn.hidden = false;
      this.btn.addEventListener("click", () => (this.el.paused ? this.play() : this.pause()));
    },
    fade(to, done) {
      const el = this.el, step = (to - el.volume) / 20;
      let n = 0;
      const id = setInterval(() => {
        el.volume = Math.min(1, Math.max(0, el.volume + step));
        if (++n >= 20) { clearInterval(id); done && done(); }
      }, 60);
    },
    play() {
      if (!this.el) return;
      this.el.play().then(() => { this.btn.classList.add("on"); this.fade(0.6); localStorage.setItem("gy-audio", "1"); }).catch(() => {});
    },
    pause() {
      this.btn.classList.remove("on");
      localStorage.setItem("gy-audio", "0");
      this.fade(0, () => this.el.pause());
    }
  };

  /* ---------- 开场 ---------- */
  function reveal() {
    document.body.classList.remove("is-loading");
    requestAnimationFrame(() => document.body.classList.add("revealed"));
  }

  function intro(done) {
    const gate = GY.$("#gate");
    const skip = C.site.intro === false || sessionStorage.getItem("gy-gate") || location.hash || GY.reducedMotion;
    if (skip) {
      gate.remove();
      reveal();
      return done();
    }
    gate.hidden = false;
    document.body.classList.remove("is-loading");
    document.body.classList.add("gate-active");
    const btn = GY.$(".gate-enter", gate);
    btn.focus({ preventScroll: true });
    btn.addEventListener("click", () => {
      sessionStorage.setItem("gy-gate", "1");
      if (localStorage.getItem("gy-audio") !== "0") audio.play();
      gate.classList.add("opening");
      setTimeout(() => {
        gate.classList.add("swing");
        document.body.classList.remove("gate-active");
        GY.atmosphere.burst({ left: innerWidth * 0.3, width: innerWidth * 0.4, top: innerHeight * 0.7, bottom: innerHeight }, { chips: 0, puffs: 30 });
      }, 450);
      setTimeout(() => document.body.classList.add("revealed"), 1100);
      setTimeout(() => { gate.remove(); done(); }, 3200);
    }, { once: true });
  }

  /* ---------- 启动 ---------- */
  GY.buildTextures();
  bindText();
  stats(GY.graves.render(C));
  GY.scene.build();
  GY.crypt.init(C);
  GY.atmosphere.init(C.effects || {});
  lanternLight();
  audio.init();
  const fromHash = bindGraves();

  intro(() => {});
  observeGraves();
  pauseOffscreen();
  if (location.hash) setTimeout(fromHash, 300);
})();
