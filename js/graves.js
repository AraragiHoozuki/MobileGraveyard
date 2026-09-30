/* 墓地渲染：已安息的墓碑 与 待入土的墓穴 */
(function () {
  const GY = window.GY;
  const { esc } = GY;

  const SHAPES = ["gothic", "arch", "shoulder", "slab", "cross", "pillar", "blade", "crystal", "obelisk", "ogee"];
  const MATERIALS = ["granite", "marble", "slate", "sandstone", "basalt", "obsidian", "sakura", "bronze", "wood", "crystal"];
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

  // 由 id 推导的外观参数：未在配置中指定的部分随机但稳定
  GY.stoneLook = (g) => {
    const r = GY.rng(g.id);
    const st = g.stone || {};
    return {
      shape: SHAPES.includes(st.shape) ? st.shape : pick(r, SHAPES.slice(0, 4)),
      material: MATERIALS.includes(st.material) ? st.material : pick(r, MATERIALS.slice(0, 5)),
      emblem: st.emblem ?? pick(r, ["cross", "moon", "rose", "star", "hourglass"]),
      gilt: !!st.gilt,
      tilt: ((r() - 0.5) * 5).toFixed(2),
      lift: Math.round((r() - 0.5) * 36),
      tx: Math.round(r() * 300) + "px",
      ty: Math.round(r() * 300) + "px",
      offering: g.offering ?? pick(r, ["candle", "candle", "flowers", "none"]),
      side: r() < 0.5 ? "left" : "right"
    };
  };

  // 苔藓：若干团贴着碑脚与边缘的绿斑
  GY.moss = (seed, amount = 1) => {
    const r = GY.rng(seed + ":moss");
    const spots = [];
    const n = Math.round((3 + r() * 3) * amount);
    for (let i = 0; i < n; i++) {
      const edge = r();
      const x = edge < 0.6 ? r() * 100 : edge < 0.8 ? r() * 12 : 88 + r() * 12;
      const y = edge < 0.6 ? 92 + r() * 12 : 30 + r() * 70;
      const w = 12 + r() * 30, h = 6 + r() * 16;
      const hue = 70 + r() * 30, a = (0.35 + r() * 0.4).toFixed(2);
      spots.push(`radial-gradient(ellipse ${w.toFixed(0)}% ${h.toFixed(0)}% at ${x.toFixed(0)}% ${y.toFixed(0)}%, hsla(${hue.toFixed(0)},35%,30%,${a}), transparent 70%)`);
    }
    return spots.join(",");
  };

  GY.dates = (g, L) => {
    if (!g.born && !g.died) return "";
    return `<small>${esc(L.born)}</small>${esc(g.born || "?")}<span class="sep">✝</span><small>${esc(L.died)}</small>${esc(g.died || "?")}`;
  };

  const FLOWERS = `<svg viewBox="0 0 34 30"><g stroke="#1c2415" stroke-width="1.2" fill="none"><path d="M17 30Q15 20 9 12M17 30Q17 18 18 9M17 30Q20 20 26 13"/></g>
    <g fill="#4d0f16"><circle cx="9" cy="11" r="3.4"/><circle cx="18" cy="8" r="3.8"/><circle cx="26" cy="12" r="3.2"/></g>
    <g fill="#6b1a22" opacity=".8"><circle cx="8" cy="10" r="1.6"/><circle cx="17" cy="7" r="1.8"/><circle cx="25.4" cy="11" r="1.4"/></g>
    <path d="M12 22q-5-1-6 2q4 1 6-2Zm9 1q5-2 6 1q-4 2-6-1Z" fill="#1f2a18"/></svg>`;

  function offering(look) {
    if (look.offering === "candle")
      return `<div class="offering candle ${look.side}"><div class="wax"></div><div class="flame"></div></div>`;
    if (look.offering === "flowers") return `<div class="offering flowers ${look.side}">${FLOWERS}</div>`;
    return "";
  }

  function buriedCard(g, i, L) {
    const look = GY.stoneLook(g);
    const W = 100, H = 140;
    const style = `--mask:${GY.shapeMask(look.shape, W, H)};--cap:${GY.shapeCap(look.shape)};--tx:${look.tx};--ty:${look.ty}`;
    const glow = look.offering === "candle" ? `<div class="candle-glow" style="--gx:${look.side === "left" ? "18%" : "82%"}"></div>` : "";
    const dates = g.born || g.died ? `<div class="dates">${esc(g.born || "?")} — ${esc(g.died || "?")}</div>` : "";
    return `
    <article class="grave buried reveal" id="grave-${esc(g.id)}" style="--tilt:${look.tilt}deg;--lift:${look.lift}px;--d:${(i % 4) * 0.14}s">
      <button class="tomb shape-${look.shape}" type="button" data-id="${esc(g.id)}" aria-label="${esc(g.name)}">
        <div class="stone mat-${look.material}" style="${style}">
          <div class="stone-shadow" aria-hidden="true"><div class="sh-drop"><i></i><u></u></div><div class="sh-edge"><i></i></div><div class="sh-glow"><i></i></div></div>
          <div class="stone-plinth"></div>
          <div class="stone-face">
            <div class="detail"></div>
            <div class="moss" style="background:${GY.moss(g.id)}"></div>
            ${GY.cracks(g.id, W, H, 2)}
            <div class="card-text engraved">
              ${GY.emblem(look.emblem)}
              ${g.nameLatin ? `<div class="latin">${esc(g.nameLatin)}</div>` : ""}
              <div class="name${look.gilt ? " gilded" : ""}">${esc(g.name)}</div>
              ${GY.rule()}
              ${dates}
              ${g.epitaph ? `<div class="epitaph">${esc(g.epitaph)}</div>` : ""}
            </div>
            ${glow}
            ${GY.shapeBevel(look.shape, W, H)}
            <div class="sheen"></div>
          </div>
          ${g.version ? `<span class="bronze-tag">${esc(g.version)}</span>` : ""}
        </div>
      </button>
      <div class="mound">${GY.grass(g.id, 240, 36, 60)}${offering(look)}</div>
    </article>`;
  }

  // 掘开的墓穴：松土、坑壁、坑底幽光、土堆与铲子、近侧土埂
  function pitArt(id) {
    const r = GY.rng(id + ":pit");
    const u = "p" + Math.floor(r() * 1e8).toString(36);
    let clods = "";
    for (let i = 0; i < 26; i++) {
      const onPile = i < 16;
      const x = onPile ? 152 + r() * 84 : 44 + r() * 152;
      const y = onPile ? 134 + r() * 44 : (r() < 0.5 ? 158 + r() * 6 : 222 + r() * 10);
      const rx = 1.2 + r() * 3, ry = rx * (0.5 + r() * 0.3);
      clods += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${r() < 0.5 ? "#4f3e2c" : "#2a2017"}"/>`;
      if (r() < 0.4) clods += `<ellipse cx="${(x - rx * 0.3).toFixed(1)}" cy="${(y - ry * 0.4).toFixed(1)}" rx="${(rx * 0.5).toFixed(1)}" ry="${(ry * 0.4).toFixed(1)}" fill="rgba(190,185,200,.18)"/>`;
    }
    return `<svg class="pit-art" viewBox="0 0 240 250" aria-hidden="true">
      <defs>
        <radialGradient id="${u}s"><stop offset="0" stop-color="#2c2319"/><stop offset=".6" stop-color="#1d170f"/><stop offset="1" stop-color="#0c0a07" stop-opacity="0"/></radialGradient>
        <linearGradient id="${u}w" x2="0" y2="1"><stop offset="0" stop-color="#4d3c2b"/><stop offset=".35" stop-color="#2a1f15"/><stop offset="1" stop-color="#070504"/></linearGradient>
        <linearGradient id="${u}l" x2="0" y2="1"><stop offset="0" stop-color="#3a2d20"/><stop offset="1" stop-color="#080605"/></linearGradient>
        <radialGradient id="${u}d" cx=".38" cy=".2" r=".85"><stop offset="0" stop-color="#6b5641"/><stop offset=".45" stop-color="#403124"/><stop offset="1" stop-color="#1b140d"/></radialGradient>
        <linearGradient id="${u}h" x2="1"><stop offset="0" stop-color="#4b3420"/><stop offset=".5" stop-color="#7a5533"/><stop offset="1" stop-color="#3a2614"/></linearGradient>
      </defs>
      <ellipse cx="120" cy="200" rx="128" ry="48" fill="url(#${u}s)"/>
      <path d="M62 163H178L200 222H40Z" fill="#020101"/>
      <path d="M62 163H178L173 190H67Z" fill="url(#${u}w)"/>
      <path d="M62 163L67 190L54 222H40Z" fill="url(#${u}l)"/>
      <path d="M178 163L173 190L186 222H200Z" fill="#0d0a07"/>
      <path d="M67 190H173L186 222H54Z" fill="#030202"/>
      <path d="M60 163.4H180" stroke="rgba(190,170,140,.35)" stroke-width="1.2"/>
      <path d="M216 44L197 146" stroke="url(#${u}h)" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M208 41L224 46" stroke="#3a2614" stroke-width="5" stroke-linecap="round"/>
      <path d="M146 177C146 161 156 151 168 149C172 135 184 125 198 127C206 115 222 117 228 131C238 137 242 153 238 167C236 177 226 181 214 181H158C150 181 146 180 146 177Z" fill="url(#${u}d)"/>
      ${clods}
      <path d="M34 224Q120 214 206 224Q208 234 196 236Q120 244 44 236Q32 234 34 224Z" fill="#281e15"/>
      <path d="M36 224Q120 215 204 224" stroke="rgba(200,180,150,.2)" stroke-width="1.2" fill="none"/>
    </svg>`;
  }

  function openCard(g, i, L) {
    const r = GY.rng(g.id);
    const n = (g.mods || []).length;
    return `
    <article class="grave open reveal" id="grave-${esc(g.id)}" style="--lift:${Math.round((r() - 0.5) * 30)}px;--d:${(i % 4) * 0.14}s">
      <button class="pit-wrap" type="button" data-id="${esc(g.id)}" aria-label="${esc(g.name)}">
        ${pitArt(g.id)}
        <div class="pit-glow"></div>
        <div class="stake">
          <div class="stake-post"></div>
          <div class="plank">
            <i class="nail l"></i><i class="nail r"></i>
            <div class="plank-name">${esc(g.name)}</div>
            ${g.status ? `<div class="plank-status">${esc(g.status)}</div>` : ""}
          </div>
          <div class="lantern-halo"></div>
          <div class="lantern"><div class="lantern-body"></div></div>
        </div>
        <div class="grass-front">${GY.grass(g.id, 240, 30, 44)}</div>
        ${n ? `<span class="mod-count">${n} ${esc(L.modUnit)}</span>` : ""}
      </button>
    </article>`;
  }

  GY.graves = {
    render(C) {
      const L = C.labels;
      const buried = C.graves.filter((g) => g.type !== "open");
      const open = C.graves.filter((g) => g.type === "open");
      GY.$("#graves-buried").innerHTML = buried.map((g, i) => buriedCard(g, i, L)).join("");
      GY.$("#graves-open").innerHTML = open.map((g, i) => openCard(g, i, L)).join("");
      GY.$("#section-buried").hidden = !buried.length;
      GY.$("#section-open").hidden = !open.length;
      return { buried: buried.length, open: open.length };
    }
  };
})();
