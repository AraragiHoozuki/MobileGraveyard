/* 放大视图：墓碑（可翻转）与 羊皮卷（MOD 清单），含转场 */
(function () {
  const GY = window.GY;
  const { esc, md } = GY;

  const ICON_FLIP = `<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>`;
  const ICON_CLOSE = `<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  const SHADOW = `<div class="face-shadow" aria-hidden="true"><div class="sh-drop"><i></i></div><div class="sh-edge"><i></i></div></div>`;
  const NODE = `<svg class="node" viewBox="0 0 10 10" fill="currentColor"><path d="M5 0l5 5-5 5-5-5z"/></svg>`;

  const state = { el: null, stage: null, open: false, busy: false, grave: null, source: null, kind: null };
  let L = {};

  /* ---------- 碑面 ---------- */
  function downloads(list) {
    if (!list || !list.length) return "";
    return list.map((d) =>
      `<a class="relic" href="${esc(d.url)}" target="_blank" rel="noopener">${GY.icon(d.icon)}<span class="relic-label">${esc(d.label)}${d.note ? `<span class="relic-note">${esc(d.note)}</span>` : ""}</span></a>`
    ).join("");
  }

  function tabletHtml(g) {
    const look = GY.stoneLook(g);
    const shape = look.shape === "cross" ? "gothic" : look.shape; // 十字碑放大后用尖拱碑承载文字
    const baseCap = GY.shapeCap(shape);
    const W = 100, H = 160;
    // 碑顶够高的碑才把纹章放在碑顶；位置按碑形轮廓计算，正文可能因此略微下移（只影响碑面，不影响碑阴）
    const slot = look.emblem && baseCap >= 0.3 ? GY.emblemSlot(shape, W, H, baseCap) : null;
    const cap = slot ? slot.cap : baseCap;
    const common = `--mask:${GY.shapeMask(shape, W, H)};--tx:${look.tx};--ty:${look.ty}`;
    const frontStyle = `${common};--cap:${cap}`, backStyle = `${common};--cap:${baseCap}`;
    const emblemInCap = !!slot;
    let i = 0;
    const carve = (cls) => `class="${cls} carve" style="--i:${i++}"`; // 递增的刻字延迟

    const meta = [
      g.version && `<div><dt>${esc(L.version)}</dt><dd>${esc(g.version)}</dd></div>`,
      g.platform && `<div><dt>${esc(L.platform)}</dt><dd>${esc(g.platform)}</dd></div>`
    ].filter(Boolean).join("");

    const front = `
      <div class="face front mat-${look.material}" style="${frontStyle}">
        ${SHADOW}
        <div class="stone-face">
          <div class="detail"></div>
          <div class="moss" style="background:${GY.moss(g.id, 1.3)}"></div>
          ${GY.cracks(g.id, W, H, 3)}
          <div class="polish"></div>
          ${emblemInCap && look.emblem ? `<div class="emblem-top engraved carve" style="--i:${i++};top:${slot.top.toFixed(2)}cqw;width:${slot.size}cqw;height:${slot.size}cqw">${GY.emblem(look.emblem)}</div>` : ""}
          <div class="tablet-scroll engraved">
            ${!emblemInCap && look.emblem ? `<div ${carve("t-emblem")}>${GY.emblem(look.emblem)}</div>` : ""}
            ${g.nameLatin ? `<div ${carve("t-latin")}>${esc(g.nameLatin)}</div>` : ""}
            <h2 ${carve("t-name" + (look.gilt ? " gilded" : ""))}>${esc(g.name)}</h2>
            ${GY.rule("t-rule carve").replace("<svg ", `<svg style="--i:${i++}" `)}
            ${g.born || g.died ? `<div ${carve("t-dates")}>${GY.dates(g, L)}</div>` : ""}
            ${g.epitaph ? `<p ${carve("t-epitaph")}>${esc(g.epitaph)}</p>` : ""}
            ${g.portrait ? `<div ${carve("t-portrait")}><img src="${esc(g.portrait)}" alt=""></div>` : ""}
            ${meta ? `<dl ${carve("t-meta")}>${meta}</dl>` : ""}
            ${g.description ? `<p ${carve("t-desc")}>${md(g.description)}</p>` : ""}
            ${g.tags && g.tags.length ? `<div ${carve("t-tags")}>${g.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
            ${g.downloads && g.downloads.length ? `<div ${carve("t-heading")}>${esc(L.downloads)}</div><div ${carve("relics")}>${downloads(g.downloads)}</div>` : ""}
          </div>
          <div class="scroll-cue"></div>
          ${GY.shapeBevel(shape, W, H)}
        </div>
      </div>`;

    i = 0;
    const log = g.changelog || [];
    const back = `
      <div class="face back mat-${look.material}" style="${backStyle}">
        ${SHADOW}
        <div class="stone-face">
          <div class="detail"></div>
          <div class="moss" style="background:${GY.moss(g.id + ":back", 1.6)}"></div>
          ${GY.cracks(g.id + ":back", W, H, 3)}
          <div class="polish"></div>
          <div class="tablet-scroll engraved">
            <div ${carve("back-title")}><span class="t-latin">Chronica</span><h3>${esc(L.changelog)}</h3></div>
            ${GY.rule("t-rule carve").replace("<svg ", `<svg style="--i:${i++}" `)}
            ${log.length
              ? `<ol class="chronicle">${log.map((e) => `
                <li ${carve("")}>${NODE}<span class="ver">${esc(e.version)}</span>${e.date ? `<span class="date">${esc(e.date)}</span>` : ""}
                  <ul>${(e.notes || []).map((n) => `<li>${md(n)}</li>`).join("")}</ul></li>`).join("")}</ol>`
              : `<p class="no-chronicle">${esc(L.noChangelog)}</p>`}
          </div>
          <div class="scroll-cue"></div>
          ${GY.shapeBevel(shape, W, H)}
        </div>
      </div>`;

    return `
      <div class="tablet-wrap">
        <div class="tablet">${front}${back}</div>
      </div>
      <div class="crypt-actions">
        <button class="rite flip" type="button">${ICON_FLIP}<span>${esc(L.flipToBack)}</span><kbd>F</kbd></button>
        <button class="rite close" type="button">${ICON_CLOSE}<span>${esc(L.close)}</span><kbd>Esc</kbd></button>
      </div>`;
  }

  /* ---------- 羊皮卷 ---------- */
  function tornEdge(seed) {
    const r = GY.rng(seed + ":torn");
    const pts = [];
    const j = (m) => (r() * m).toFixed(2);
    for (let x = 0; x <= 100; x += 2.5) pts.push(`${x}% ${j(1.2)}%`);
    for (let y = 2; y <= 98; y += 2) pts.push(`${(100 - +j(1.4)).toFixed(2)}% ${y}%`);
    for (let x = 100; x >= 0; x -= 2.5) pts.push(`${x}% ${(100 - +j(1.2)).toFixed(2)}%`);
    for (let y = 98; y >= 2; y -= 2) pts.push(`${j(1.4)}% ${y}%`);
    return `polygon(${pts.join(",")})`;
  }

  function ledgerHtml(g) {
    const mods = g.mods || [];
    const modHtml = mods.map((m) => `
      <section class="mod">
        <div class="mod-head">
          <h3 class="mod-name">${esc(m.name)}</h3>
          ${m.version ? `<span class="mod-ver">${esc(m.version)}</span>` : ""}
          ${m.author ? `<span class="mod-author">${esc(L.by)} · ${esc(m.author)}</span>` : ""}
        </div>
        ${m.description ? `<p class="mod-desc">${md(m.description)}</p>` : ""}
        ${m.downloads && m.downloads.length ? `<div class="mod-links">${m.downloads.map((d) =>
          `<a class="ink-link" href="${esc(d.url)}" target="_blank" rel="noopener">${GY.icon(d.icon)}${esc(d.label)}${d.note ? ` <small>${esc(d.note)}</small>` : ""}</a>`).join("")}</div>` : ""}
        ${m.changelog && m.changelog.length ? `<details><summary>${esc(L.modChangelog)}</summary><ul>${m.changelog.map((e) =>
          `<li><span class="ver">${esc(e.version)}</span>${e.date ? `<span class="date">${esc(e.date)}</span>` : ""}<br>${(e.notes || []).map(md).join("；")}</li>`).join("")}</ul></details>` : ""}
      </section>`).join("");

    return `
      <div class="ledger-outer">
        <div class="rod top"></div>
        <div class="ledger-wrap">
          <article class="ledger" style="--torn:${tornEdge(g.id)}">
            <div class="seal">${GY.emblem(g.seal || "hourglass")}</div>
            <header class="ledger-head">
              ${g.nameLatin ? `<div class="ledger-latin">${esc(g.nameLatin)}</div>` : ""}
              <h2 class="ledger-name">${esc(g.name)}</h2>
              ${g.status ? `<span class="ledger-status">${esc(g.status)}</span>` : ""}
              <p class="ledger-note">${md(g.note || L.openNote)}</p>
            </header>
            ${GY.rule("ledger-rule")}
            ${mods.length ? `<div class="ledger-section">${esc(L.mods)}</div>${modHtml}` : ""}
          </article>
        </div>
        <div class="rod bottom"></div>
      </div>
      <div class="crypt-actions">
        <button class="rite close" type="button">${ICON_CLOSE}<span>${esc(L.close)}</span><kbd>Esc</kbd></button>
      </div>`;
  }

  /* ---------- 灯龛（长明灯的 MOD 清单） ---------- */
  // 小陶油灯：每个 MOD 一盏
  const OIL_LAMP = `<svg class="oil-lamp" viewBox="0 0 40 34" aria-hidden="true">
    <path class="oil-fire" d="M30 4C32 8 34 10 34 13A4 4 0 0 1 26 13C26 10 28 8 30 4Z"/>
    <path d="M4 22C4 18 10 16 20 16H28L33 18L30 21C27 26 22 28 15 28C8 28 4 26 4 22Z" fill="currentColor"/>
    <path d="M8 21C11 19 18 19 24 20" fill="none" stroke="var(--ink-hi)" stroke-width="1"/>
    <path d="M12 28L10 32H24L22 28" fill="currentColor" opacity=".75"/></svg>`;

  function shrineHtml(g) {
    const look = GY.lampLook(g);
    const mods = g.mods || [];
    let i = 0;
    const carve = (cls) => `class="${cls} carve" style="--i:${i++}"`;
    const oils = mods.map((m) => `
      <section ${carve("oil")}>
        ${OIL_LAMP}
        <div class="oil-body">
          <div class="oil-head">
            <h3 class="oil-name">${esc(m.name)}</h3>
            ${m.version ? `<span class="oil-ver">${esc(m.version)}</span>` : ""}
          </div>
          ${m.author ? `<div class="oil-author">${esc(L.by)} · ${esc(m.author)}</div>` : ""}
          ${m.description ? `<p class="oil-desc">${md(m.description)}</p>` : ""}
          ${m.downloads && m.downloads.length ? `<div class="oil-links">${m.downloads.map((d) =>
            `<a class="wick" href="${esc(d.url)}" target="_blank" rel="noopener">${GY.icon(d.icon)}<span>${esc(d.label)}${d.note ? `<small>${esc(d.note)}</small>` : ""}</span></a>`).join("")}</div>` : ""}
          ${m.changelog && m.changelog.length ? `<details><summary>${esc(L.aliveChangelog || L.modChangelog)}</summary><ol>${m.changelog.map((e) =>
            `<li><span class="ver">${esc(e.version)}</span>${e.date ? `<span class="date">${esc(e.date)}</span>` : ""}<ul>${(e.notes || []).map((n) => `<li>${md(n)}</li>`).join("")}</ul></li>`).join("")}</ol></details>` : ""}
        </div>
      </section>`).join("");

    return `
      <div class="shrine flame-${look.flame}">
        <div class="shrine-halo"></div>
        <div class="niche">
          <div class="niche-stone stone-face mat-${look.material}" style="--tx:${look.tx};--ty:${look.ty}">
            <div class="detail"></div>
            <div class="moss" style="background:${GY.moss(g.id + ":niche", 0.8)}"></div>
            <div class="niche-polish"></div>
            <div class="niche-light"></div>
            <div class="niche-alcove"></div>
            <div class="niche-scroll engraved">
              <header class="niche-head">
                ${g.nameLatin ? `<div ${carve("n-latin")}>${esc(g.nameLatin)}</div>` : ""}
                <h2 ${carve("n-name")}>${esc(g.name)}</h2>
                ${g.status ? `<span ${carve("n-status")}>${esc(g.status)}</span>` : ""}
                <p ${carve("n-note")}>${md(g.note || L.aliveLedgerNote || "")}</p>
              </header>
              ${GY.rule("n-rule carve").replace("<svg ", `<svg style="--i:${i++}" `)}
              ${mods.length ? `<div ${carve("n-heading")}>${esc(L.aliveMods || L.mods)}</div>${oils}` : ""}
            </div>
          </div>
        </div>
        <div class="shrine-flame"><svg viewBox="0 0 40 64" aria-hidden="true">
          <defs><radialGradient id="shrine-fl" cx=".5" cy=".78" r=".75">
            <stop offset="0" style="stop-color:var(--fl-core)"/><stop offset=".4" style="stop-color:var(--fl-mid)"/><stop offset=".85" style="stop-color:var(--fl-out)"/><stop offset="1" style="stop-color:var(--fl-out);stop-opacity:0"/>
          </radialGradient></defs>
          <path d="M20 1C23 13 37 23 37 42A17 17 0 0 1 3 42C3 30 15 21 20 1Z" fill="url(#shrine-fl)"/>
          <path d="M20 28C22 35 28 38 28 46A8 8 0 0 1 12 46C12 40 18 36 20 28Z" style="fill:var(--fl-core)" opacity=".9"/>
        </svg></div>
      </div>
      <div class="crypt-actions">
        <button class="rite close" type="button">${ICON_CLOSE}<span>${esc(L.close)}</span><kbd>Esc</kbd></button>
      </div>`;
  }

  // 灯火从灯室飞到灯龛顶部，灯光随后从火苗处向外铺开，照亮整座灯龛
  function shrineMotion(open) {
    const fl = GY.$(".shrine-flame", state.stage);
    const niche = GY.$(".niche", state.stage);
    const src = GY.$(".lamp-flame", state.source).getBoundingClientRect();
    const dst = fl.getBoundingClientRect(), nr = niche.getBoundingClientRect();
    const s = src.width / dst.width;
    const dx = src.left + src.width / 2 - (dst.left + dst.width / 2);
    const dy = src.top + src.height / 2 - (dst.top + dst.height / 2);
    // 光的圆心（火苗在灯龛坐标系中的位置）与能盖住整座灯龛的半径
    const ox = dst.left + dst.width / 2 - nr.left, oy = dst.top + dst.height / 2 - nr.top;
    const R = Math.hypot(Math.max(ox, nr.width - ox), Math.max(oy, nr.height - oy));
    const shut = `circle(0px at ${ox}px ${oy}px)`, lit = `circle(${R}px at ${ox}px ${oy}px)`;
    const away = `translate(${dx}px, ${dy}px) scale(${s})`;
    const dur = GY.reducedMotion ? 1 : open ? 1700 : 1000;
    const o = { duration: dur, fill: "forwards" };
    if (open) {
      fl.animate([{ transform: away }, { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 40}px) scale(${s + (1 - s) * 0.6})`, offset: 0.25 }, { transform: "none", offset: 0.45 }, { transform: "none" }], { ...o, easing: "cubic-bezier(.4,0,.2,1)" });
      GY.$(".shrine-halo", state.stage).animate([{ opacity: 0 }, { opacity: 0, offset: 0.4 }, { opacity: 1 }], o);
      return niche.animate([{ clipPath: shut }, { clipPath: shut, offset: 0.42 }, { clipPath: lit }], { ...o, easing: "cubic-bezier(.5,0,.25,1)" });
    }
    GY.$(".shrine-halo", state.stage).animate([{ opacity: 1 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }], o);
    niche.animate([{ clipPath: lit }, { clipPath: shut, offset: 0.55 }, { clipPath: shut }], { ...o, easing: "cubic-bezier(.6,0,.4,1)" });
    return fl.animate([{ transform: "none" }, { transform: "none", offset: 0.5 }, { transform: away }], { ...o, easing: "cubic-bezier(.5,0,.3,1)" });
  }

  function openShrine(g, btn) {
    state.stage.innerHTML = shrineHtml(g);
    btn.classList.add("is-out"); // 灯火离开灯室
    const anim = shrineMotion(true);
    requestAnimationFrame(() => state.el.classList.add("open"));
    setTimeout(() => GY.$(".niche", state.stage).classList.add("lit"), GY.reducedMotion ? 0 : 900);
    anim.onfinish = () => { state.busy = false; GY.$(".rite.close", state.stage).focus({ preventScroll: true }); };
  }

  /* ---------- 转场 ---------- */
  // 计算从卡片位置飞到屏幕中央的起始变换（底边对齐，等比缩放）
  function fromRect(target, src) {
    const dst = target.getBoundingClientRect();
    const s = Math.max(0.12, src.width / dst.width);
    const cx = dst.left + dst.width / 2, cy = dst.top + dst.height / 2;
    const dx = src.left + src.width / 2 - cx;
    const dy = src.bottom - cy - (dst.height * s) / 2;
    return { s, dx, dy };
  }

  function markScrollable(root) {
    GY.$$(".face", root).forEach((f) => {
      const sc = GY.$(".tablet-scroll", f);
      const upd = () => f.classList.toggle("can-scroll", sc.scrollHeight - sc.scrollTop - sc.clientHeight > 8);
      sc.addEventListener("scroll", upd, { passive: true });
      setTimeout(upd, 60);
    });
  }

  function openTomb(g, btn) {
    const stone = GY.$(".stone", btn);
    const src = stone.getBoundingClientRect();
    const tilt = parseFloat(getComputedStyle(btn.closest(".grave")).getPropertyValue("--tilt")) || 0;
    state.stage.innerHTML = tabletHtml(g);
    const wrap = GY.$(".tablet-wrap", state.stage);
    const tablet = GY.$(".tablet", state.stage);
    const { s, dx, dy } = fromRect(wrap, src);

    btn.classList.add("is-lifted");
    GY.atmosphere.burst(src);

    const anim = wrap.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(${tilt}deg)`, filter: "brightness(.75)" },
      { transform: `translate(${dx * 0.3}px, ${dy * 0.3 - 50}px) scale(${s + (1 - s) * 0.6}) rotateX(12deg)`, filter: "brightness(.9)", offset: 0.5 },
      { transform: "none", filter: "none" }
    ], { duration: GY.reducedMotion ? 1 : 1200, easing: "cubic-bezier(.3,.6,.15,1)" });

    requestAnimationFrame(() => state.el.classList.add("open"));
    setTimeout(() => tablet.classList.add("carved"), 250);
    markScrollable(state.stage);
    anim.onfinish = () => { state.busy = false; GY.$(".rite.flip", state.stage).focus({ preventScroll: true }); };

    GY.$(".rite.flip", state.stage).addEventListener("click", flip);
  }

  function flip() {
    const tablet = GY.$(".tablet", state.stage);
    if (!tablet) return;
    const wrap = GY.$(".tablet-wrap", state.stage);
    const toBack = !tablet.classList.contains("flipped");
    if (!toBack) tablet.classList.add("revisit");
    tablet.classList.toggle("flipped", toBack);
    wrap.classList.remove("heave");
    void wrap.offsetWidth;
    wrap.classList.add("heave");
    GY.$(".rite.flip span", state.stage).textContent = toBack ? L.flipToFront : L.flipToBack;
    setTimeout(() => GY.atmosphere.burst(wrap.getBoundingClientRect(), { chips: 14, puffs: 10 }), 450);
  }

  function openLedger(g, btn) {
    const src = btn.getBoundingClientRect();
    state.stage.innerHTML = ledgerHtml(g);
    const outer = GY.$(".ledger-outer", state.stage);
    const wrap = GY.$(".ledger-wrap", state.stage);
    const H = wrap.offsetHeight;
    const { s, dx, dy } = fromRect(outer, { left: src.left, width: src.width * 0.8, bottom: src.bottom - src.height * 0.4 });
    const dur = GY.reducedMotion ? 1 : 1700;
    const ease = "cubic-bezier(.55,0,.2,1)";

    outer.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0 },
      { opacity: 1, offset: 0.15 },
      { transform: "none", opacity: 1, offset: 0.4 },
      { transform: "none", opacity: 1 }
    ], { duration: dur, easing: ease });
    wrap.animate([{ clipPath: "inset(49% 0 49% 0)" }, { clipPath: "inset(49% 0 49% 0)", offset: 0.4 }, { clipPath: "inset(0 0 0 0)" }], { duration: dur, easing: ease });
    GY.$(".rod.top", state.stage).animate([{ transform: `translateY(${H / 2}px)` }, { transform: `translateY(${H / 2}px)`, offset: 0.4 }, { transform: "none" }], { duration: dur, easing: ease });
    const last = GY.$(".rod.bottom", state.stage).animate([{ transform: `translateY(${-H / 2}px)` }, { transform: `translateY(${-H / 2}px)`, offset: 0.4 }, { transform: "none" }], { duration: dur, easing: ease });

    GY.atmosphere.souls(src, 6);
    requestAnimationFrame(() => state.el.classList.add("open"));
    last.onfinish = () => { state.busy = false; GY.$(".rite.close", state.stage).focus({ preventScroll: true }); };
  }

  /* ---------- 公共接口 ---------- */
  function open(g, fromHistory = false) {
    if (state.busy || state.open) return;
    const btn = document.querySelector(`.grave [data-id="${CSS.escape(g.id)}"]`);
    if (!btn) return;
    state.busy = true;
    state.open = true;
    state.grave = g;
    state.source = btn;
    state.kind = { open: "ledger", alive: "shrine" }[g.type] || "tomb";
    state.el.hidden = false;
    state.el.classList.remove("closing");
    state.el.setAttribute("aria-label", g.name);
    document.body.classList.add("crypt-open");
    if (!fromHistory) history.pushState({ grave: g.id }, "", "#" + encodeURIComponent(g.id));

    if (state.kind === "tomb") openTomb(g, btn);
    else if (state.kind === "shrine") openShrine(g, btn);
    else openLedger(g, btn);
    GY.$$(".rite.close", state.stage).forEach((b) => b.addEventListener("click", () => close()));
  }

  function close(fromHistory = false) {
    if (!state.open || state.busy) return;
    state.busy = true;
    const btn = state.source;
    state.el.classList.add("closing");
    state.el.classList.remove("open");
    document.body.classList.remove("crypt-open");
    if (!fromHistory && location.hash) history.replaceState(null, "", location.pathname + location.search);

    const finish = () => {
      state.el.hidden = true;
      state.stage.innerHTML = "";
      state.open = state.busy = false;
      if (btn) {
        btn.classList.remove("is-lifted", "is-out");
        btn.focus({ preventScroll: true });
      }
    };
    const dur = GY.reducedMotion ? 1 : 900;

    if (state.kind === "tomb") {
      const wrap = GY.$(".tablet-wrap", state.stage);
      const tablet = GY.$(".tablet", state.stage);
      tablet.classList.remove("flipped");
      const stone = GY.$(".stone", btn);
      const src = stone.getBoundingClientRect();
      const tilt = parseFloat(getComputedStyle(btn.closest(".grave")).getPropertyValue("--tilt")) || 0;
      const { s, dx, dy } = fromRect(wrap, src);
      wrap.animate([
        { transform: "none" },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 30}px) scale(${s + (1 - s) * 0.4}) rotateX(8deg)`, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(${tilt}deg)` }
      ], { duration: dur, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" }).onfinish = () => {
        GY.atmosphere.burst(src, { chips: 10, puffs: 14 });
        finish();
      };
    } else if (state.kind === "shrine") {
      shrineMotion(false).onfinish = finish;
    } else {
      const outer = GY.$(".ledger-outer", state.stage);
      const wrap = GY.$(".ledger-wrap", state.stage);
      const H = wrap.offsetHeight;
      const src = btn.getBoundingClientRect();
      const { s, dx, dy } = fromRect(outer, { left: src.left, width: src.width * 0.8, bottom: src.bottom - src.height * 0.4 });
      const o = { duration: dur, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" };
      wrap.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(49% 0 49% 0)", offset: 0.5 }, { clipPath: "inset(49% 0 49% 0)" }], o);
      GY.$(".rod.top", state.stage).animate([{ transform: "none" }, { transform: `translateY(${H / 2}px)`, offset: 0.5 }, { transform: `translateY(${H / 2}px)` }], o);
      GY.$(".rod.bottom", state.stage).animate([{ transform: "none" }, { transform: `translateY(${-H / 2}px)`, offset: 0.5 }, { transform: `translateY(${-H / 2}px)` }], o);
      outer.animate([{ transform: "none", opacity: 1 }, { transform: "none", opacity: 1, offset: 0.5 }, { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0 }], o).onfinish = finish;
    }
  }

  GY.crypt = {
    init(C) {
      L = C.labels;
      state.el = GY.$("#crypt");
      state.stage = GY.$(".crypt-stage", state.el);
      GY.$(".crypt-veil", state.el).addEventListener("click", () => close());
      addEventListener("keydown", (e) => {
        if (!state.open) return;
        if (e.key === "Escape") close();
        else if ((e.key === "f" || e.key === "F") && state.kind === "tomb" && !e.ctrlKey && !e.metaKey) flip();
      });
    },
    open,
    close,
    get isOpen() { return state.open; }
  };
})();
