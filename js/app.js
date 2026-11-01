(() => {
  const cfg = window.BABKAS_CONFIG || {};
  const TZ = cfg.TIMEZONE || "America/Chicago";
  const SCHEDULE = Array.isArray(cfg.SCHEDULE) ? cfg.SCHEDULE : [];
  const ORDER_URL = cfg.ORDER_URL || "https://squareup.com/";
  const params = new URLSearchParams(window.location.search);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const skipLoader = params.has("noloader") || reduceMotion;

  const pad2 = (n) => String(n).padStart(2, "0");

  function wallTimeToMs(dateStr, timeStr) {
    const iso = `${dateStr}T${timeStr}:00`;
    const asUtc = new Date(`${iso}Z`);
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const parts = Object.fromEntries(fmt.formatToParts(asUtc).map((p) => [p.type, p.value]));
    const shownAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );
    return asUtc.getTime() - (shownAsUtc - asUtc.getTime());
  }

  function formatInZone(ms, options) {
    return new Date(ms).toLocaleString("en-US", { timeZone: TZ, ...options });
  }

  function fmtDate(ms) {
    return formatInZone(ms, { weekday: "long", month: "short", day: "numeric" });
  }

  function fmtTime(ms) {
    return formatInZone(ms, { hour: "numeric", minute: "2-digit" });
  }

  function simulateNow() {
    if (params.get("simulate") !== "live" || !SCHEDULE.length) return null;
    const first = SCHEDULE[0];
    return wallTimeToMs(first.date, first.start) + 30 * 60 * 1000;
  }

  const forcedNow = simulateNow();

  function nowMs() {
    return forcedNow != null ? forcedNow : Date.now();
  }

  /* ---------- contact from config ---------- */
  const emailEl = document.getElementById("contact-email");
  const phoneEl = document.getElementById("contact-phone");
  const igEl = document.getElementById("contact-instagram");
  const fbEl = document.getElementById("contact-facebook");
  if (cfg.EMAIL && emailEl) {
    emailEl.href = `mailto:${cfg.EMAIL}`;
    emailEl.textContent = cfg.EMAIL;
  }
  if (cfg.PHONE_TEL && phoneEl) phoneEl.href = `tel:${cfg.PHONE_TEL}`;
  if (cfg.PHONE_DISPLAY && phoneEl) phoneEl.textContent = cfg.PHONE_DISPLAY;
  if (cfg.INSTAGRAM_URL && igEl) igEl.href = cfg.INSTAGRAM_URL;
  if (cfg.FACEBOOK_URL && fbEl) fbEl.href = cfg.FACEBOOK_URL;

  /* ---------- loader + hero video ---------- */
  const loader = document.getElementById("loader");
  const loaderVideo = document.getElementById("loader-video");
  const heroVideo = document.getElementById("hero-video");
  const heroFallback = document.getElementById("hero-fallback");
  let loaderClosing = false;

  function hideLoader() {
    if (!loader || loaderClosing) return;
    loaderClosing = true;
    loader.classList.add("is-hiding");
    document.body.classList.remove("loader-open");
    window.setTimeout(() => {
      loader.classList.add("is-gone");
      loader.setAttribute("hidden", "");
    }, 400);
  }

  if (skipLoader) {
    hideLoader();
    if (loader) {
      loader.classList.add("is-gone");
      loader.setAttribute("hidden", "");
    }
  } else {
    document.body.classList.add("loader-open");
    loaderVideo?.addEventListener("ended", hideLoader);
    window.setTimeout(hideLoader, 2000);
    loaderVideo?.play?.().catch(() => hideLoader());
  }

  if (reduceMotion) {
    if (heroVideo) heroVideo.setAttribute("hidden", "");
    if (heroFallback) heroFallback.removeAttribute("hidden");
  } else if (heroVideo) {
    const playHero = () => {
      heroVideo.muted = true;
      heroVideo.play().catch(() => {});
    };
    heroVideo.addEventListener("loadeddata", playHero);
    heroVideo.addEventListener("canplay", playHero);
    playHero();
  }

  /* ---------- mobile nav ---------- */
  const hamburger = document.getElementById("hamburger");
  const mobilePanel = document.getElementById("mobile-panel");

  function closeNav() {
    mobilePanel?.classList.remove("is-open");
    hamburger?.setAttribute("aria-expanded", "false");
    hamburger?.setAttribute("aria-label", "Open menu");
  }

  hamburger?.addEventListener("click", () => {
    const open = mobilePanel.classList.toggle("is-open");
    hamburger.setAttribute("aria-expanded", String(open));
    hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  mobilePanel?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  /* ---------- scroll spy + stretch underline ---------- */
  const navLinks = Array.from(document.querySelectorAll(".bp-nav a[data-id]"));
  const indicator = document.getElementById("nav-indicator");
  const sectionIds = ["home", "popup", "about", "menu", "gallery", "request"];
  let activeNav = "home";
  let navInd = null;
  let spyRaf = 0;

  function spy(force) {
    let active = "home";
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.5) active = id;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      active = "request";
    }

    navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("data-id") === active));
    mobilePanel?.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href") || "";
      a.classList.toggle("is-active", href === `#${active}` || (active === "popup" && href === "#popup"));
    });

    const link = navLinks.find((a) => a.getAttribute("data-id") === active);
    if (!link || !link.offsetWidth || !indicator) {
      activeNav = active;
      return;
    }
    const nav = link.parentElement;
    const left = link.offsetLeft;
    const right = nav.clientWidth - (link.offsetLeft + link.offsetWidth);
    if (!force && activeNav === active && navInd && navInd.left === left && navInd.right === right) return;
    const dir = navInd ? (left > navInd.left ? 1 : -1) : 1;
    activeNav = active;
    navInd = { left, right, dir };
    const ease = "cubic-bezier(.65,0,.35,1)";
    indicator.hidden = false;
    indicator.style.left = `${left}px`;
    indicator.style.right = `${right}px`;
    indicator.style.transition =
      dir > 0
        ? `left 520ms ${ease} 110ms, right 520ms ${ease}`
        : `left 520ms ${ease}, right 520ms ${ease} 110ms`;
  }

  const onScroll = () => {
    if (spyRaf) return;
    spyRaf = requestAnimationFrame(() => {
      spyRaf = 0;
      spy();
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.setTimeout(() => spy(true), 300);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => spy(true));

  /* ---------- schedule + pizza timer ---------- */
  const nextCard = document.getElementById("next-card");
  const emptyCard = document.getElementById("empty-card");
  const scheduleList = document.getElementById("schedule-list");
  let isLive = false;
  let paintedKey = "";

  function parsedSchedule() {
    return SCHEDULE.map((e) => {
      const startMs = wallTimeToMs(e.date, e.start);
      const endMs = wallTimeToMs(e.date, e.end);
      return { ...e, startMs, endMs };
    }).sort((a, b) => a.startMs - b.startMs);
  }

  function pizzaSlices(now) {
    const phase = Math.floor(now / 1000) % 11;
    const reloading = phase === 0;
    const removed = reduceMotion ? 0 : phase <= 2 ? 0 : phase - 2;
    const cycle = Math.floor(now / 11000);
    const dropName = cycle % 2 ? "bpDropB" : "bpDropA";
    const pt = (deg, r) => [50 + r * Math.cos((deg * Math.PI) / 180), 50 + r * Math.sin((deg * Math.PI) / 180)];
    const rnd = (n) => {
      const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    const wedgePath = (a0, a1, r) => {
      const q0 = pt(a0, r);
      const q1 = pt(a1, r);
      return `M50 50 L${q0[0].toFixed(2)} ${q0[1].toFixed(2)} A${r} ${r} 0 0 1 ${q1[0].toFixed(2)} ${q1[1].toFixed(2)} Z`;
    };
    const arcPath = (a0, a1, r) => {
      const q0 = pt(a0, r);
      const q1 = pt(a1, r);
      return `M${q0[0].toFixed(2)} ${q0[1].toFixed(2)} A${r} ${r} 0 0 1 ${q1[0].toFixed(2)} ${q1[1].toFixed(2)}`;
    };

    const peps = [];
    for (let i = 0; i < 8; i += 1) {
      const mid = -90 + i * 45 + 22.5;
      const R = (k) => rnd(i * 17 + k * 3.1 + cycle * 101.7);
      const two = R(0) < 0.7;
      const specs = two
        ? [
            [11, 23, 5.0 + R(5) * 0.9],
            [27, 34, 4.4 + R(6) * 0.9],
          ]
        : [[12, 32, 5.2 + R(7) * 0.9]];
      specs.forEach(([rMin, rMax, pr], j) => {
        let p = null;
        for (let a = 0; a < 14; a += 1) {
          const r = rMin + R(1 + j * 2 + a * 7) * (rMax - rMin);
          const lim = Math.max(0, 22.5 - (Math.asin(Math.min(1, (pr + 2) / r)) * 180) / Math.PI);
          p = pt(mid + (R(2 + j * 2 + a * 7) * 2 - 1) * lim, r);
          if (peps.every((o) => Math.hypot(o.x - p[0], o.y - p[1]) >= o.r + pr + 0.8)) break;
        }
        peps.push({ i, j, x: p[0], y: p[1], r: pr, dx: (R(8 + j) * 2 - 1) * 14, rot: (R(10 + j) * 2 - 1) * 45 });
      });
    }

    const order = peps.slice().sort((a, b) => rnd(a.i * 7 + a.j * 3 + cycle * 13.7 + 99) - rnd(b.i * 7 + b.j * 3 + cycle * 13.7 + 99));
    for (let k = 1; k < order.length; k += 1) {
      if (order[k].i === order[k - 1].i) {
        const m = order.findIndex((o, idx) => idx > k && o.i !== order[k - 1].i);
        if (m > k) {
          const t = order[k];
          order[k] = order[m];
          order[m] = t;
        }
      }
    }
    order.forEach((p, k) => {
      p.delay = 400 + k * 110;
    });

    const pepCss = (p) => {
      if (!p) return "display:none";
      if (reduceMotion) return "";
      return `animation:${dropName} 260ms ease-in ${p.delay}ms both;transform-box:fill-box;transform-origin:center;--dx:${p.dx.toFixed(1)}px;--rot:${p.rot.toFixed(0)}deg`;
    };
    const fx = (v) => (v === undefined ? "0" : v.toFixed(2));

    return Array.from({ length: 8 }, (_, i) => {
      const a0 = -90 + i * 45 + 1.2;
      const a1 = -90 + (i + 1) * 45 - 1.2;
      const out = pt(-90 + i * 45 + 22.5, 9);
      const gone = i < removed;
      const p1 = peps.find((p) => p.i === i && p.j === 0);
      const p2 = peps.find((p) => p.i === i && p.j === 1);
      const transform = gone
        ? `rotate(-200deg) translate(${(out[0] - 50).toFixed(2)}px,${(out[1] - 50).toFixed(2)}px) scale(0.85)`
        : "none";
      const transition = reloading
        ? "opacity 120ms ease-out, transform 500ms ease-in-out"
        : "opacity 0ms, transform 100ms ease-out";
      return {
        sauce: wedgePath(a0, a1, 40.6),
        cheese: wedgePath(a0 + 2.6, a1 - 2.6, 37.2),
        crust: arcPath(a0 + 1.4, a1 - 1.4, 42.2),
        crustHi: arcPath(a0 + 2.6, a1 - 2.6, 44.2),
        p1,
        p2,
        p1x: fx(p1 && p1.x),
        p1y: fx(p1 && p1.y),
        p1r: fx(p1 && p1.r),
        p2x: fx(p2 && p2.x),
        p2y: fx(p2 && p2.y),
        p2r: fx(p2 && p2.r),
        p1style: pepCss(p1),
        p2style: pepCss(p2),
        style: `opacity:${gone ? 0 : 1};transform:${transform};transform-origin:50px 50px;transition:${reduceMotion ? "none" : transition}`,
      };
    });
  }

  function pizzaSvgMarkup(now) {
    const slices = pizzaSlices(now);
    const sliceMarkup = slices
      .map(
        (sl) => `
      <g class="pizza-slice" style="${sl.style}">
        <path d="${sl.sauce}" fill="#b8321a"></path>
        <path d="${sl.cheese}" fill="url(#bpCheese)" stroke="#f0c25a" stroke-width="1.8" stroke-linejoin="round"></path>
        <path d="${sl.crust}" fill="none" stroke="#d9993f" stroke-width="6" stroke-linecap="round"></path>
        <path d="${sl.crustHi}" fill="none" stroke="#f0c985" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.65"></path>
        <circle class="pep pep-1" cx="${sl.p1x}" cy="${sl.p1y}" r="${sl.p1r}" fill="url(#bpPep)" stroke="#7a1010" stroke-width="0.6" style="${sl.p1style}"></circle>
        <circle class="pep pep-2" cx="${sl.p2x}" cy="${sl.p2y}" r="${sl.p2r}" fill="url(#bpPep)" stroke="#7a1010" stroke-width="0.6" style="${sl.p2style}"></circle>
      </g>`
      )
      .join("");
    return `<svg class="pizza-svg" viewBox="0 0 100 100" width="96" height="96" aria-hidden="true">
      <defs>
        <radialGradient id="bpCheese" gradientUnits="userSpaceOnUse" cx="50" cy="50" r="40">
          <stop offset="0" stop-color="#fbe08f"></stop>
          <stop offset="0.65" stop-color="#f3c25a"></stop>
          <stop offset="1" stop-color="#e3a23c"></stop>
        </radialGradient>
        <radialGradient id="bpPep" cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stop-color="#dd5a3c"></stop>
          <stop offset="0.6" stop-color="#b8261f"></stop>
          <stop offset="1" stop-color="#8f1717"></stop>
        </radialGradient>
      </defs>
      ${sliceMarkup}
    </svg>`;
  }

  let lastPizzaCycle = -1;

  function applyPep(el, p, css) {
    if (!el) return;
    if (!p) {
      el.setAttribute("style", "display:none");
      return;
    }
    el.setAttribute("cx", p.x.toFixed(2));
    el.setAttribute("cy", p.y.toFixed(2));
    el.setAttribute("r", p.r.toFixed(2));
    el.setAttribute("style", css || "");
  }

  function updatePizza(now) {
    const svg = nextCard?.querySelector(".pizza-svg");
    if (!svg) return;
    const slices = pizzaSlices(now);
    const cycle = Math.floor(now / 11000);
    svg.querySelectorAll(".pizza-slice").forEach((g, i) => {
      const sl = slices[i];
      if (!sl) return;
      g.setAttribute("style", sl.style);
      if (cycle !== lastPizzaCycle) {
        applyPep(g.querySelector(".pep-1"), sl.p1, sl.p1style);
        applyPep(g.querySelector(".pep-2"), sl.p2, sl.p2style);
      }
    });
    lastPizzaCycle = cycle;
  }

  function popupState(now) {
    const all = parsedSchedule();
    const future = all.filter((e) => e.endMs > now);
    const windowEnd = now + 30 * 86400000;
    const nextRaw = future[0] || null;
    isLive = !!(nextRaw && now >= nextRaw.startMs);
    const target = nextRaw ? (isLive ? nextRaw.endMs : nextRaw.startMs) : now;
    let diff = Math.max(0, Math.floor((target - now) / 1000));
    const d = Math.floor(diff / 86400);
    diff -= d * 86400;
    const h = Math.floor(diff / 3600);
    diff -= h * 3600;
    const m = Math.floor(diff / 60);
    const sec = diff - m * 60;
    const events = future
      .filter((e) => e.startMs < windowEnd)
      .map((e, i) => {
        const live = i === 0 && isLive;
        const upNext = i === 0 && !isLive;
        return {
          weekday: formatInZone(e.startMs, { weekday: "short" }),
          day: formatInZone(e.startMs, { day: "numeric" }),
          month: formatInZone(e.startMs, { month: "short" }),
          name: e.name,
          address: e.address,
          time: `${fmtTime(e.startMs)} to ${fmtTime(e.endMs)}`,
          showChip: live || upNext,
          chip: live ? "Live now" : "Next up",
          live,
        };
      });
    return {
      nextRaw,
      isLive,
      parts: [
        { value: pad2(d), label: "Days" },
        { value: pad2(h), label: "Hours" },
        { value: pad2(m), label: "Min" },
        { value: pad2(sec), label: "Sec" },
      ],
      events,
    };
  }

  function renderScheduleList(events) {
    scheduleList.innerHTML = events
      .map(
        (ev) => `
      <div class="event-card">
        <div class="event-date">
          <span class="dow">${ev.weekday}</span>
          <span class="day">${ev.day}</span>
          <span class="month">${ev.month}</span>
        </div>
        <div class="event-copy">
          ${ev.showChip ? `<span class="chip${ev.live ? " chip-live" : ""}">${ev.chip}</span>` : ""}
          <span class="name">${ev.name}</span>
          <span class="addr">${ev.address}</span>
        </div>
        <span class="event-time">${ev.time}</span>
      </div>`
      )
      .join("");
  }

  function paintNextCard(state, now) {
    const next = state.nextRaw;
    const chipClass = state.isLive ? "chip chip-live" : "chip";
    const chipText = state.isLive ? "Live now" : "Next pop-up";
    const when = `${fmtDate(next.startMs)} · ${fmtTime(next.startMs)} to ${fmtTime(next.endMs)}`;
    const blurb = state.isLive
      ? `We are live at ${next.name} right now. Place your mobile order here and we will fire it fresh.`
      : `Our next mobile pop-up will be at ${next.name}. Be there or be square!`;
    const orderBlock = state.isLive
      ? `<a class="order-live" href="${ORDER_URL}" target="_blank" rel="noopener">Place Order</a>
         <span class="order-note">We're live. Place your mobile order here and pick up at the oven.</span>`
      : `<span class="order-wait">Place Order</span>
         <span class="order-note">Order ahead opens when the pop-up goes live.</span>`;
    const parts = state.parts
      .map((p) => `<div class="countdown-part"><strong>${p.value}</strong><span>${p.label}</span></div>`)
      .join("");
    nextCard.innerHTML = `
      <div class="next-copy">
        <span class="${chipClass}">${chipText}</span>
        <h3>${next.name}</h3>
        <span class="next-when">${when}</span>
        <span class="next-address">${next.address}</span>
        <p class="next-blurb">${blurb}</p>
      </div>
      <div class="next-timer">
        ${pizzaSvgMarkup(now)}
        <span class="countdown-label">${state.isLive ? "Pop-up ends in" : "Pop-up starts in"}</span>
        <div class="countdown">${parts}</div>
        ${orderBlock}
      </div>`;
  }

  function renderPopup() {
    const now = nowMs();
    const state = popupState(now);
    if (!nextCard || !emptyCard || !scheduleList) return;

    if (!state.nextRaw) {
      nextCard.hidden = true;
      nextCard.innerHTML = "";
      emptyCard.hidden = false;
      paintedKey = "empty";
      if (!scheduleList.dataset.ready) {
        renderScheduleList(state.events);
        scheduleList.dataset.ready = "1";
      }
      renderCartFoot();
      return;
    }

    emptyCard.hidden = true;
    nextCard.hidden = false;
    const key = `${state.nextRaw.date}|${state.nextRaw.start}|${state.isLive ? "live" : "soon"}`;
    if (paintedKey !== key) {
      paintNextCard(state, now);
      renderScheduleList(state.events);
      paintedKey = key;
      lastPizzaCycle = Math.floor(now / 11000);
    } else {
      const nums = nextCard.querySelectorAll(".countdown-part strong");
      state.parts.forEach((p, i) => {
        if (nums[i]) nums[i].textContent = p.value;
      });
      updatePizza(now);
    }

    renderCartFoot();
  }

  /* ---------- cart ---------- */
  const cart = {};
  const menuCards = Array.from(document.querySelectorAll(".menu-card[data-pizza]"));
  const cartButton = document.getElementById("cart-button");
  const cartOverlay = document.getElementById("cart-overlay");
  const cartBackdrop = document.getElementById("cart-backdrop");
  const cartClose = document.getElementById("cart-close");
  const cartBody = document.getElementById("cart-body");
  const cartFoot = document.getElementById("cart-foot");
  const cartBadge = document.getElementById("cart-badge");
  let lastFocus = null;

  function qtyOf(name) {
    return cart[name] || 0;
  }

  function changeQty(name, delta) {
    const next = Math.max(0, qtyOf(name) + delta);
    if (next === 0) delete cart[name];
    else cart[name] = next;
    renderMenuActions();
    renderCart();
  }

  function cartCount() {
    return menuCards.reduce((n, card) => n + qtyOf(card.dataset.pizza), 0);
  }

  function cartTotal() {
    return menuCards.reduce((n, card) => n + Number(card.dataset.price) * qtyOf(card.dataset.pizza), 0);
  }

  function renderMenuActions() {
    menuCards.forEach((card) => {
      const name = card.dataset.pizza;
      const slot = card.querySelector(".menu-card-action");
      if (!slot) return;
      const q = qtyOf(name);
      if (q === 0) {
        slot.innerHTML = `<button class="add-btn" type="button">Add to Order</button>`;
        slot.querySelector("button").addEventListener("click", () => changeQty(name, 1));
      } else {
        slot.innerHTML = `
          <div class="qty-bar">
            <button type="button" aria-label="Remove one">−</button>
            <span>${q} in your order</span>
            <button type="button" aria-label="Add one">+</button>
          </div>`;
        const [dec, inc] = slot.querySelectorAll("button");
        dec.addEventListener("click", () => changeQty(name, -1));
        inc.addEventListener("click", () => changeQty(name, 1));
      }
    });
  }

  function renderCartFoot() {
    if (!cartFoot) return;
    const count = cartCount();
    if (count === 0) {
      cartFoot.hidden = true;
      cartFoot.innerHTML = "";
      return;
    }
    cartFoot.hidden = false;
    const label = `${count} ${count === 1 ? "item" : "items"}`;
    const order = isLive
      ? `<a class="cart-order" href="${ORDER_URL}" target="_blank" rel="noopener">Place Order</a>`
      : `<span class="cart-order-disabled">Place Order</span>
         <span class="cart-hint">Ordering opens when our next pop-up goes live. Your order is saved here until then.</span>`;
    cartFoot.innerHTML = `
      <div class="cart-summary"><span>${label}</span><span>$${cartTotal()}</span></div>
      ${order}
      <button class="cart-clear" id="cart-clear" type="button">Clear order</button>`;
    document.getElementById("cart-clear")?.addEventListener("click", () => {
      Object.keys(cart).forEach((k) => delete cart[k]);
      renderMenuActions();
      renderCart();
    });
  }

  function renderCart() {
    const count = cartCount();
    if (cartBadge) {
      cartBadge.textContent = String(count);
      cartBadge.hidden = count === 0;
    }
    if (cartButton) {
      cartButton.setAttribute("aria-label", count ? `My Order, ${count} items` : "My Order");
    }
    if (!cartBody) return;
    if (count === 0) {
      cartBody.innerHTML = `<div class="cart-empty">Your order is empty.<br>Tap "Add to Order" on any pizza to start.</div>`;
    } else {
      cartBody.innerHTML = menuCards
        .filter((card) => qtyOf(card.dataset.pizza) > 0)
        .map((card) => {
          const name = card.dataset.pizza;
          const q = qtyOf(name);
          const line = Number(card.dataset.price) * q;
          return `
            <div class="cart-line">
              <div class="cart-line-info">
                <span class="cart-line-name">${name}</span>
                <div class="stepper">
                  <button class="stepper-btn" type="button" data-name="${name}" data-d="-1" aria-label="Remove one">−</button>
                  <span class="stepper-qty">${q}</span>
                  <button class="stepper-btn" type="button" data-name="${name}" data-d="1" aria-label="Add one">+</button>
                </div>
              </div>
              <span class="cart-line-total">$${line}</span>
            </div>`;
        })
        .join("");
      cartBody.querySelectorAll(".stepper-btn").forEach((btn) => {
        btn.addEventListener("click", () => changeQty(btn.dataset.name, Number(btn.dataset.d)));
      });
    }
    renderCartFoot();
  }

  function openCart() {
    if (!cartOverlay) return;
    lastFocus = document.activeElement;
    cartOverlay.hidden = false;
    document.body.classList.add("drawer-open");
    cartButton?.setAttribute("aria-expanded", "true");
    cartClose?.focus();
  }

  function closeCart() {
    if (!cartOverlay) return;
    cartOverlay.hidden = true;
    document.body.classList.remove("drawer-open");
    cartButton?.setAttribute("aria-expanded", "false");
    lastFocus?.focus?.();
  }

  cartButton?.addEventListener("click", openCart);
  cartBackdrop?.addEventListener("click", closeCart);
  cartClose?.addEventListener("click", closeCart);

  function trapFocus(container, event) {
    const focusable = container.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ---------- gallery + lightbox ---------- */
  const galleryImages = [
    { src: "assets/photos/gozney-peel-cut.jpg", alt: "Pizza sliding off the peel into the oven", tall: true },
    { src: "assets/photos/margherita-overhead.jpg", alt: "Overhead shot of a fresh Margherita" },
    { src: "assets/photos/checkerboard-spread.jpg", alt: "Spread of pizzas on checkered napkins" },
    { src: "assets/photos/picnic-slice-pull.jpg", alt: "Pulling a cheesy slice at a picnic table" },
    { src: "assets/photos/assembly-toppings.jpg", alt: "Assembling toppings on fresh dough" },
  ];
  const galleryGrid = document.getElementById("gallery-grid");
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  let lightboxIndex = 0;
  let lightboxLastFocus = null;

  galleryImages.forEach((img, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-cell" + (img.tall ? " tall" : "");
    button.setAttribute("aria-label", `View ${img.alt}`);
    button.innerHTML = `<img src="${img.src}" alt="${img.alt}" loading="lazy" decoding="async">`;
    button.addEventListener("click", () => openLightbox(index));
    galleryGrid?.appendChild(button);
  });

  function openLightbox(index) {
    lightboxIndex = index;
    const item = galleryImages[lightboxIndex];
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    lightbox.classList.add("is-open");
    lightbox.removeAttribute("hidden");
    document.body.classList.add("lightbox-open");
    lightboxLastFocus = document.activeElement;
    lightbox.querySelector(".lightbox-close")?.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("hidden", "");
    document.body.classList.remove("lightbox-open");
    lightboxLastFocus?.focus?.();
  }

  function showLightbox(delta, event) {
    event?.stopPropagation();
    lightboxIndex = (lightboxIndex + delta + galleryImages.length) % galleryImages.length;
    const item = galleryImages[lightboxIndex];
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
  }

  lightbox?.addEventListener("click", closeLightbox);
  lightboxImage?.addEventListener("click", (event) => event.stopPropagation());
  lightbox?.querySelector(".lightbox-close")?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeLightbox();
  });
  lightbox?.querySelector(".lightbox-prev")?.addEventListener("click", (event) => showLightbox(-1, event));
  lightbox?.querySelector(".lightbox-next")?.addEventListener("click", (event) => showLightbox(1, event));

  /* ---------- request form ---------- */
  const form = document.getElementById("request-form");
  const formError = document.getElementById("form-error");
  const submitBtn = document.getElementById("submit-btn");
  const submitLabel = submitBtn?.querySelector(".submit-label");
  const thanks = document.getElementById("thanks");
  const thanksCopy = document.getElementById("thanks-copy");

  function showThanks(area) {
    if (thanksCopy) {
      thanksCopy.textContent = `We logged your request for ${area}. Share it with your neighbors: the more interest we see, the sooner we pop up there.`;
    }
    form?.classList.add("is-hidden");
    thanks?.classList.add("is-visible");
    thanks?.removeAttribute("hidden");
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const area = String(data.get("area") || "").trim();
    const zip = String(data.get("zip") || "").trim();
    if (!name || !email || !area || !zip) {
      formError.hidden = false;
      formError.textContent = "Please fill out your name, email, area, and ZIP code.";
      return;
    }
    formError.hidden = true;
    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");
    submitLabel.textContent = "Sending…";

    const endpoint = (cfg.REQUEST_FORM_ENDPOINT || "").trim();
    try {
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("send failed");
        showThanks(area);
      } else {
        window.setTimeout(() => showThanks(area), 1300);
      }
    } catch (err) {
      formError.hidden = false;
      formError.textContent = "We could not send that just now. Please try again or email us.";
      submitBtn.disabled = false;
      submitBtn.classList.remove("is-loading");
      submitLabel.textContent = "Request a Pop-Up Location";
    }
  });

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (lightbox?.classList.contains("is-open")) closeLightbox();
      else if (cartOverlay && !cartOverlay.hidden) closeCart();
      else closeNav();
    }
    if (event.key === "Tab" && cartOverlay && !cartOverlay.hidden) {
      trapFocus(document.getElementById("cart-drawer"), event);
    }
    if (event.key === "Tab" && lightbox?.classList.contains("is-open")) {
      trapFocus(lightbox, event);
    }
    if (lightbox?.classList.contains("is-open")) {
      if (event.key === "ArrowLeft") showLightbox(-1, event);
      if (event.key === "ArrowRight") showLightbox(1, event);
    }
  });

  renderMenuActions();
  renderCart();
  renderPopup();
  window.setInterval(renderPopup, 1000);
})();
