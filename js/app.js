(() => {
  const cfg = window.BABKAS_CONFIG || {};
  const TZ = cfg.TIMEZONE || "America/Chicago";
  const SCHEDULE = Array.isArray(cfg.SCHEDULE) ? cfg.SCHEDULE : [];
  const ORDER_URL = cfg.ORDER_URL || "https://squareup.com/";
  const params = new URLSearchParams(window.location.search);
  const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const skipLoader = params.has("noloader");

  function safe(label, fn) {
    try {
      return fn();
    } catch (err) {
      if (typeof console !== "undefined" && console.warn) console.warn("Babka's init:", label, err);
      return undefined;
    }
  }

  function fromEntries(list) {
    if (Object.fromEntries) return Object.fromEntries(list);
    const out = {};
    for (let i = 0; i < list.length; i += 1) out[list[i][0]] = list[i][1];
    return out;
  }

  const pad2 = (n) => String(n).padStart(2, "0");

  function zoneFormatter(options) {
    const opts = options || {};
    try {
      return new Intl.DateTimeFormat("en-US", Object.assign({ timeZone: TZ, hourCycle: "h23" }, opts));
    } catch (err1) {
      try {
        return new Intl.DateTimeFormat("en-US", Object.assign({ timeZone: TZ, hour12: false }, opts));
      } catch (err2) {
        return new Intl.DateTimeFormat("en-US", opts);
      }
    }
  }

  function wallTimeToMs(dateStr, timeStr) {
    try {
      const iso = `${dateStr}T${timeStr}:00`;
      const asUtc = new Date(`${iso}Z`);
      const fmt = zoneFormatter({
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const parts = fromEntries(fmt.formatToParts(asUtc).map((p) => [p.type, p.value]));
      const shownAsUtc = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second)
      );
      return asUtc.getTime() - (shownAsUtc - asUtc.getTime());
    } catch (err) {
      return new Date(`${dateStr}T${timeStr}:00`).getTime();
    }
  }

  function formatInZone(ms, options) {
    try {
      return new Date(ms).toLocaleString("en-US", Object.assign({ timeZone: TZ }, options || {}));
    } catch (err) {
      try {
        return new Date(ms).toLocaleString("en-US", options);
      } catch (err2) {
        return new Date(ms).toString();
      }
    }
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

  const forcedNow = safe("simulate", simulateNow) || null;

  function nowMs() {
    return forcedNow != null ? forcedNow : Date.now();
  }

  /* ---------- contact from config ---------- */
  safe("contact", () => {
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
  });

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

  function primeVideo(video) {
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("autoplay", "");
    if (!video.hasAttribute("loop")) video.setAttribute("loop", "");
    video.loop = true;
  }

  function playVideo(video) {
    if (!video) return Promise.resolve(false);
    primeVideo(video);
    const play = video.play();
    if (!play || typeof play.then !== "function") return Promise.resolve(!video.paused);
    return play.then(() => true).catch(() => false);
  }

  function bindPlayRetry(video, onStillBlocked) {
    if (!video) return;
    let settled = false;
    let blocked = false;
    const tryPlay = () => {
      if (settled) return;
      playVideo(video).then((ok) => {
        if (ok) settled = true;
        else blocked = true;
      });
    };
    const onGesture = () => tryPlay();
    const onVis = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    document.addEventListener("touchstart", onGesture, { passive: true });
    document.addEventListener("pointerdown", onGesture, { passive: true });
    document.addEventListener("click", onGesture);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", onVis);
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    tryPlay();
    if (onStillBlocked) {
      window.setTimeout(() => {
        if (settled || !video.paused) return;
        if (blocked || video.error) onStillBlocked();
      }, 3000);
    }
  }

  function showHeroFallback() {
    if (heroVideo) heroVideo.setAttribute("hidden", "");
    if (heroFallback) heroFallback.removeAttribute("hidden");
  }

  safe("videos", () => {
    if (skipLoader) {
      hideLoader();
      if (loader) {
        loader.classList.add("is-gone");
        loader.setAttribute("hidden", "");
      }
    } else {
      document.body.classList.add("loader-open");
      if (loaderVideo) loaderVideo.addEventListener("ended", hideLoader);
      window.setTimeout(hideLoader, 2000);
      bindPlayRetry(loaderVideo);
    }

    if (heroVideo) {
      bindPlayRetry(heroVideo, showHeroFallback);
      heroVideo.addEventListener("error", showHeroFallback);
    }
  });

  /* ---------- mobile nav ---------- */
  const hamburger = document.getElementById("hamburger");
  const mobilePanel = document.getElementById("mobile-panel");

  function closeNav() {
    mobilePanel?.classList.remove("is-open");
    hamburger?.setAttribute("aria-expanded", "false");
    hamburger?.setAttribute("aria-label", "Open menu");
  }

  safe("nav", () => {
    if (hamburger) {
      hamburger.addEventListener("click", () => {
        const open = mobilePanel.classList.toggle("is-open");
        hamburger.setAttribute("aria-expanded", String(open));
        hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      });
    }
    if (mobilePanel) {
      mobilePanel.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeNav);
      });
    }
  });

  /* ---------- scroll spy + stretch underline ---------- */
  const navLinks = Array.from(document.querySelectorAll(".bp-nav a[data-id]"));
  const indicator = document.getElementById("nav-indicator");
  const sectionIds = ["home", "popup", "about", "menu", "gallery", "request"];
  let activeNav = "home";
  let navInd = null;
  let spyRaf = 0;

  function spy(force) {
    return safe("spy", () => {
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
    });
  }

  const onScroll = () => {
    if (spyRaf) return;
    spyRaf = requestAnimationFrame(() => {
      spyRaf = 0;
      spy();
    });
  };

  safe("spy-bind", () => {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.setTimeout(() => spy(true), 300);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => spy(true));
  });

  /* ---------- schedule + pizza timer ---------- */
  const nextCard = document.getElementById("next-card");
  const emptyCard = document.getElementById("empty-card");
  const scheduleList = document.getElementById("schedule-list");
  const scheduleWrap = document.getElementById("schedule-wrap");
  const scheduleSoon = document.getElementById("schedule-soon");
  const ownerDash = document.getElementById("owner-dash");
  let isLive = false;
  let paintedKey = "";
  let listKey = "";

  const plannerAdapter = window.createBabkasPlannerAdapter
    ? window.createBabkasPlannerAdapter(cfg)
    : { kind: "local", sharedCounts: false, getTaps() { return {}; }, getTap() { return null; }, saveTap() {}, deleteTap() {} };
  const plannerWindows = cfg.PLANNER_WINDOWS || {};
  const plannerCity = cfg.PLANNER_CITY || "Chetek";
  const plannerRegion = cfg.PLANNER_REGION || "WI";
  const plannerMaxParty = Number(cfg.PLANNER_MAX_PARTY) || 20;
  const piesPerPerson = Number(cfg.PLANNER_PIES_PER_PERSON) || 1.1;
  const showPublicCounts = !!(plannerAdapter && plannerAdapter.sharedCounts);
  const plannerUi = { openId: null, calId: null, calFrom: null, drafts: {} };

  function parsedSchedule() {
    return SCHEDULE.map((e) => {
      const startMs = wallTimeToMs(e.date, e.start);
      const endMs = wallTimeToMs(e.date, e.end);
      return { ...e, startMs, endMs };
    }).sort((a, b) => a.startMs - b.startMs);
  }

  function timeToMin(hhmm) {
    const parts = String(hhmm || "0:0").split(":");
    return Number(parts[0]) * 60 + Number(parts[1] || 0);
  }

  function rangesOverlap(a0, a1, b0, b1) {
    return a0 < b1 && b0 < a1;
  }

  function eventId(e) {
    return `${e.date}|${e.start}|${e.name}`;
  }

  function eventCity(e) {
    return e.city || plannerCity;
  }

  function destination(e) {
    return [e.name, e.address, eventCity(e), plannerRegion].filter(Boolean).join(", ");
  }

  function eventWindows(e) {
    if (Array.isArray(e.windows) && e.windows.length) {
      return e.windows.filter((id) => plannerWindows[id]);
    }
    const start = timeToMin(e.start);
    const end = timeToMin(e.end);
    return Object.keys(plannerWindows).filter((id) => {
      const w = plannerWindows[id];
      return rangesOverlap(start, end, timeToMin(w.start), timeToMin(w.end));
    });
  }

  function localStamp(dateStr, timeStr) {
    return `${dateStr.replace(/-/g, "")}T${timeStr.replace(":", "")}00`;
  }

  function googleCalUrl(e) {
    const start = localStamp(e.date, e.start);
    const end = localStamp(e.date, e.end);
    const text = `Babka's Pizza Pop-Up: ${e.name}`;
    const details = `Fresh fired pizza from Babka's Pizza Co. ${cfg.SITE_URL || ""}`.trim();
    return (
      "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      `&text=${encodeURIComponent(text)}` +
      `&dates=${start}/${end}` +
      `&ctz=${encodeURIComponent(TZ)}` +
      `&location=${encodeURIComponent(destination(e))}` +
      `&details=${encodeURIComponent(details)}`
    );
  }

  function icsEscape(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  }

  function icsText(e) {
    const start = localStamp(e.date, e.start);
    const end = localStamp(e.date, e.end);
    const uid = `babkas-${start}@babkaspizza`;
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Babkas Pizza//Visit Planner//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VTIMEZONE",
      "TZID:America/Chicago",
      "BEGIN:DAYLIGHT",
      "TZOFFSETFROM:-0600",
      "TZOFFSETTO:-0500",
      "TZNAME:CDT",
      "DTSTART:19700308T020000",
      "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
      "END:DAYLIGHT",
      "BEGIN:STANDARD",
      "TZOFFSETFROM:-0500",
      "TZOFFSETTO:-0600",
      "TZNAME:CST",
      "DTSTART:19701101T020000",
      "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
      "END:STANDARD",
      "END:VTIMEZONE",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=America/Chicago:${start}`,
      `DTEND;TZID=America/Chicago:${end}`,
      `SUMMARY:${icsEscape(`Babka's Pizza Pop-Up: ${e.name}`)}`,
      `LOCATION:${icsEscape(destination(e))}`,
      `DESCRIPTION:${icsEscape(cfg.SITE_URL || "")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
  }

  function icsFilename(e) {
    return `babkas-${e.date.replace(/-/g, "")}.ics`;
  }

  function directionsUrl(e) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination(e))}`;
  }

  function goingLabel(n, mode) {
    const many = Number(n) > 1;
    if (mode === "done") return many ? "✓ We're going" : "✓ I'm going";
    if (mode === "submit") return many ? "We're going 🍕" : "I'm going 🍕";
    return "I'm going";
  }

  function pinSvg(size) {
    const s = size || 18;
    return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"></path></svg>`;
  }

  function directionsLink(ev) {
    return `<a class="planner-dir" target="_blank" rel="noopener noreferrer" aria-label="Get directions to ${escapeAttr(ev.name)} in Google Maps" title="Directions" href="${directionsUrl(ev)}">${pinSvg(18)}<span>Directions</span></a>`;
  }

  function clockSvg() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3.5 2"></path></svg>`;
  }

  function draftFor(ev) {
    const tap = plannerAdapter.getTap(ev.id);
    const saved = plannerUi.drafts[ev.id] || {};
    return {
      window: saved.window != null ? saved.window : tap && tap.window != null ? tap.window : "",
      party: Math.max(1, Math.min(plannerMaxParty, Number(saved.party || (tap && tap.partySize) || 1))),
      name: saved.name != null ? saved.name : (tap && tap.name) || "",
    };
  }

  function setDraft(id, patch) {
    plannerUi.drafts[id] = Object.assign({}, draftFor({ id }), plannerUi.drafts[id], patch);
  }

  function closeCalMenu() {
    plannerUi.calId = null;
    plannerUi.calFrom = null;
    document.body.classList.remove("cal-sheet-open");
    if (scheduleList) {
      scheduleList.querySelectorAll(".planner-cal.is-open").forEach((el) => el.classList.remove("is-open"));
    }
  }

  function downloadIcsFor(ev) {
    const blob = new Blob([icsText(ev)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = icsFilename(ev);
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function calBlock(ev, startAlign) {
    const open = plannerUi.calId === ev.id;
    return `
      <div class="planner-cal${startAlign ? " is-start" : ""}${open ? " is-open" : ""}" data-cal-for="${ev.id}">
        ${calLinkButton(ev)}
        <div class="planner-cal-menu" role="menu" aria-label="Add to calendar">
          <div class="planner-cal-ttl">Add to calendar</div>
          <a href="${googleCalUrl(ev)}" target="_blank" rel="noopener noreferrer" data-cal="google">
            <span class="planner-cal-ic is-flame">G</span>Google Calendar
          </a>
          <button type="button" class="planner-cal-opt" data-cal="apple">
            <span class="planner-cal-ic is-black">A</span>Apple / iCloud
          </button>
          <button type="button" class="planner-cal-opt" data-cal="ics">
            <span class="planner-cal-ic is-brick">O</span>Outlook / Other (.ics)
          </button>
        </div>
      </div>`;
  }

  window.__babkasPlanner = {
    adapter: plannerAdapter,
    eventId,
    destination,
    eventWindows,
    googleCalUrl,
    icsText,
    icsFilename,
    directionsUrl,
    localStamp,
    goingLabel,
  };

  function pizzaSlices(now) {
    const phase = Math.floor(now / 1000) % 11;
    const reloading = phase === 0;
    const removed = phase <= 2 ? 0 : phase - 2;
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
      const ms = reduceMotion ? 700 : 260;
      return `animation:${dropName} ${ms}ms ease-in ${p.delay}ms both;transform-box:fill-box;transform-origin:center;--dx:${p.dx.toFixed(1)}px;--rot:${p.rot.toFixed(0)}deg`;
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
        style: `opacity:${gone ? 0 : 1};transform:${reduceMotion && gone ? "none" : transform};transform-origin:50px 50px;transition:${reduceMotion ? "opacity 400ms ease" : transition}`,
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
    const events = future.slice(0, 3).map((e, i) => {
        const live = i === 0 && isLive;
        const upNext = i === 0 && !isLive;
        return {
          id: eventId(e),
          date: e.date,
          start: e.start,
          end: e.end,
          startMs: e.startMs,
          endMs: e.endMs,
          weekday: formatInZone(e.startMs, { weekday: "short" }),
          day: formatInZone(e.startMs, { day: "numeric" }),
          month: formatInZone(e.startMs, { month: "short" }),
          name: e.name,
          address: e.address,
          city: eventCity(e),
          time: `${fmtTime(e.startMs)} to ${fmtTime(e.endMs)}`,
          windows: eventWindows(e),
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

  let lastPlannerEvents = [];

  function renderScheduleList(events) {
    if (!scheduleList) return;
    lastPlannerEvents = events;
    const phone = window.matchMedia && window.matchMedia("(max-width: 640px)").matches;
    scheduleList.innerHTML = events.map((ev) => plannerCardMarkup(ev)).join("");
    bindPlannerCards(events);
    if (plannerUi.calId && phone) document.body.classList.add("cal-sheet-open");
    else if (!plannerUi.calId) document.body.classList.remove("cal-sheet-open");
  }

  function plannerCardMarkup(ev) {
    const tap = plannerAdapter.getTap(ev.id);
    const draft = draftFor(ev);
    const open = plannerUi.openId === ev.id;
    const confirmed = !!tap && !open;
    const count = tap ? Number(tap.partySize) || 0 : 0;
    const countLine = showPublicCounts && count > 0
      ? `<div class="planner-going">${count} planning to go</div>
         <div class="planner-bar" aria-hidden="true"><span style="width:${Math.min(100, (count / 20) * 100)}%"></span></div>`
      : "";
    const closeBtn = open
      ? `<button class="planner-x" type="button" data-planner-go aria-label="Close">✕</button>`
      : "";
    const goBtn = confirmed
      ? `<button class="planner-go is-done" type="button" data-planner-go>${goingLabel(tap.partySize, "done")}</button>`
      : `<button class="planner-go" type="button" data-planner-go>I'm going</button>`;
    const acts = open ? "" : `<div class="planner-acts">${goBtn}${directionsLink(ev)}</div>`;

    let extra = "";
    if (open) extra = plannerFormMarkup(ev, draft, tap);
    else if (confirmed) extra = plannerConfirmMarkup(ev);

    return `
      <div class="event-card${open ? " is-open" : ""}${confirmed ? " is-confirmed" : ""}" data-event-id="${ev.id}">
        ${closeBtn}
        <div class="event-date">
          <span class="dow">${ev.weekday}</span>
          <span class="day">${ev.day}</span>
          <span class="month">${ev.month}</span>
        </div>
        <div class="event-copy">
          ${ev.showChip ? `<span class="chip${ev.live ? " chip-live" : ""}">${ev.chip}</span>` : ""}
          <span class="name">${ev.name}</span>
          <span class="addr">${ev.address}</span>
          <span class="event-time">${clockSvg()} ${ev.time}</span>
          ${countLine}
        </div>
        ${acts}
        ${extra}
      </div>`;
  }

  function calLinkButton(ev) {
    return `<button type="button" class="planner-cal-big" data-cal-toggle="${ev.id}">📅 Add to calendar ▾</button>`;
  }

  function plannerFormMarkup(ev, draft, tap) {
    const pills = ev.windows.map((id) => {
      const w = plannerWindows[id];
      const on = draft.window === id ? " is-on" : "";
      return `<button type="button" data-window="${id}" class="${on.trim()}">${w.label}</button>`;
    }).join("");
    const unsureOn = draft.window === "unsure" ? " is-on" : "";
    return `
      <div class="planner-panel">
        <div class="planner-row">
          <div>
            <label class="planner-field-label">When are you coming? (optional)</label>
            <div class="planner-seg">
              ${pills}
              <button type="button" data-window="unsure" class="${unsureOn.trim()}">Not sure</button>
            </div>
          </div>
          <div>
            <label class="planner-field-label">How many in your group?</label>
            <div class="planner-step">
              <button type="button" data-step="-1" aria-label="Fewer people">−</button>
              <em data-party>${draft.party}</em>
              <button type="button" data-step="1" aria-label="More people">+</button>
            </div>
          </div>
        </div>
        <div>
          <label class="planner-field-label" for="planner-name-${cssId(ev.id)}">First name (optional)</label>
          <input class="planner-name" id="planner-name-${cssId(ev.id)}" type="text" autocomplete="given-name" maxlength="40" value="${escapeAttr(draft.name)}">
        </div>
        <button class="planner-submit" type="button" data-planner-submit>${goingLabel(draft.party, "submit")}</button>
        ${tap ? `<button class="planner-cancel" type="button" data-planner-cancel>Cancel my tap</button>` : ""}
        <div class="planner-fine">No sign-in needed. This is just a heads-up, not an order or reservation.</div>
      </div>`;
  }

  function plannerConfirmMarkup(ev) {
    return `
      <div class="planner-conf">
        <div class="planner-conf-thanks">Thanks for letting us know.</div>
        <p><b>We look forward to seeing you!</b></p>
        ${calBlock(ev, false)}
      </div>`;
  }

  function cssId(id) {
    return String(id).replace(/[^a-zA-Z0-9_-]/g, "-");
  }

  function escapeAttr(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  function bindPlannerCards(events) {
    const byId = {};
    events.forEach((ev) => { byId[ev.id] = ev; });

    scheduleList.querySelectorAll(".event-card").forEach((card) => {
      const ev = byId[card.dataset.eventId];
      if (!ev) return;

      const go = card.querySelector("[data-planner-go]");
      if (go) {
        go.addEventListener("click", () => {
          if (plannerUi.openId === ev.id) plannerUi.openId = null;
          else plannerUi.openId = ev.id;
          closeCalMenu();
          renderScheduleList(events);
        });
      }

      card.querySelectorAll("[data-window]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const next = btn.getAttribute("data-window");
          const cur = draftFor(ev).window;
          setDraft(ev.id, { window: cur === next ? "" : next });
          renderScheduleList(events);
        });
      });

      card.querySelectorAll("[data-step]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const delta = Number(btn.getAttribute("data-step"));
          const party = Math.max(1, Math.min(plannerMaxParty, draftFor(ev).party + delta));
          setDraft(ev.id, { party });
          const em = card.querySelector("[data-party]");
          const submit = card.querySelector("[data-planner-submit]");
          if (em) em.textContent = String(party);
          if (submit) submit.textContent = goingLabel(party, "submit");
        });
      });

      const nameInput = card.querySelector(".planner-name");
      if (nameInput) {
        nameInput.addEventListener("input", () => setDraft(ev.id, { name: nameInput.value }));
      }

      const submit = card.querySelector("[data-planner-submit]");
      if (submit) {
        submit.addEventListener("click", () => {
          const draft = draftFor(ev);
          plannerAdapter.saveTap(ev.id, {
            partySize: draft.party,
            window: draft.window || "unsure",
            name: String(draft.name || "").trim(),
            updatedAt: new Date().toISOString(),
          });
          plannerUi.openId = null;
          closeCalMenu();
          renderScheduleList(events);
          if (ownerDash) renderOwnerDashboard();
        });
      }

      const cancel = card.querySelector("[data-planner-cancel]");
      if (cancel) {
        cancel.addEventListener("click", () => {
          plannerAdapter.deleteTap(ev.id);
          setDraft(ev.id, { window: "", party: 1, name: "" });
          plannerUi.openId = null;
          closeCalMenu();
          renderScheduleList(events);
          if (ownerDash) renderOwnerDashboard();
        });
      }

      card.querySelectorAll("[data-cal-toggle]").forEach((btn) => {
        btn.addEventListener("click", (event) => {
          event.stopPropagation();
          const id = btn.getAttribute("data-cal-toggle");
          if (plannerUi.calId === id) closeCalMenu();
          else {
            plannerUi.calId = id;
            if (window.matchMedia && window.matchMedia("(max-width: 640px)").matches) {
              document.body.classList.add("cal-sheet-open");
            }
          }
          renderScheduleList(events);
        });
      });

      card.querySelectorAll("[data-cal]").forEach((el) => {
        el.addEventListener("click", (event) => {
          const kind = el.getAttribute("data-cal");
          if (kind === "google") return;
          event.preventDefault();
          downloadIcsFor(ev);
          closeCalMenu();
          renderScheduleList(events);
        });
      });
    });
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
      if (scheduleWrap) scheduleWrap.hidden = true;
      paintedKey = "empty";
      listKey = "";
      renderCartFoot();
      return;
    }

    emptyCard.hidden = true;
    nextCard.hidden = false;
    if (scheduleWrap) scheduleWrap.hidden = false;
    if (scheduleSoon) scheduleSoon.hidden = false;
    const key = `${state.nextRaw.date}|${state.nextRaw.start}|${state.isLive ? "live" : "soon"}`;
    const nextListKey = state.events.map((e) => e.id).join("||");
    if (paintedKey !== key) {
      paintNextCard(state, now);
      paintedKey = key;
      lastPizzaCycle = Math.floor(now / 11000);
    } else {
      const nums = nextCard.querySelectorAll(".countdown-part strong");
      state.parts.forEach((p, i) => {
        if (nums[i]) nums[i].textContent = p.value;
      });
      updatePizza(now);
    }
    if (listKey !== nextListKey) {
      renderScheduleList(state.events);
      listKey = nextListKey;
    }

    renderCartFoot();
  }

  function upcomingForOwner() {
    const now = nowMs();
    return parsedSchedule().filter((e) => e.endMs > now).slice(0, 3).map((e) => ({
      ...e,
      id: eventId(e),
      weekday: formatInZone(e.startMs, { weekday: "short" }),
      weekdayLong: formatInZone(e.startMs, { weekday: "long" }),
      day: formatInZone(e.startMs, { day: "numeric" }),
      month: formatInZone(e.startMs, { month: "short" }),
    }));
  }

  function ownerCounts(events) {
    const taps = plannerAdapter.getTaps() || {};
    return events.map((e) => {
      const tap = taps[e.id];
      const n = tap ? Number(tap.partySize) || 0 : 0;
      const win = tap ? tap.window : "";
      return {
        event: e,
        lunch: win === "lunch" ? n : 0,
        dinner: win === "dinner" ? n : 0,
        unsure: win && win !== "lunch" && win !== "dinner" ? n : 0,
        total: n,
      };
    });
  }

  function renderOwnerDashboard() {
    if (!ownerDash) return;
    if (cfg.PLANNER_OWNER_PAGE === false) {
      ownerDash.innerHTML = `<div class="section-intro"><h2 class="section-heading">Who's coming</h2><p>This page is not available.</p></div>`;
      return;
    }
    const events = upcomingForOwner();
    const rows = ownerCounts(events);
    const people = rows.reduce((n, r) => n + r.total, 0);
    const lunch = rows.reduce((n, r) => n + r.lunch, 0);
    const dinner = rows.reduce((n, r) => n + r.dinner, 0);
    const busiest = rows.reduce((best, r) => (!best || r.total > best.total ? r : best), null);
    const dinnerShare = people ? Math.round((dinner / people) * 100) : 0;
    const pies = busiest && busiest.total ? Math.round(busiest.total / piesPerPerson) : 0;
    const busiestLabel = busiest && busiest.total
      ? `${busiest.event.weekday} ${busiest.event.day}`
      : "None";
    const max = Math.max.apply(null, rows.map((r) => r.total).concat([1]));

    const bars = rows.map((r) => {
      const top = busiest && r.event.id === busiest.event.id && r.total > 0;
      const dH = Math.round((r.dinner / max) * 190);
      const lH = Math.round((r.lunch / max) * 190);
      return `<div class="owner-col${top ? " is-top" : ""}">
        ${top ? `<span class="owner-crown">Busiest</span>` : ""}
        <span class="owner-total">${r.total}</span>
        <div class="owner-stk">
          <div class="owner-din" style="height:${dH}px"></div>
          <div class="owner-lun" style="height:${lH}px"></div>
        </div>
      </div>`;
    }).join("");

    const xl = rows.map((r) => `<div>${r.event.weekday} ${r.event.day}</div>`).join("");
    const table = rows.map((r) => {
      const e = r.event;
      return `<tr>
        <td>${e.weekday} ${e.month} ${e.day}</td>
        <td class="owner-hide-m">${e.name}</td>
        <td>${r.lunch}</td>
        <td>${r.dinner}</td>
        <td><b>${r.total}</b></td>
      </tr>`;
    }).join("");

    let tip;
    if (!people) {
      tip = `No taps on this device yet. These numbers are local only until a shared backend is chosen.`;
    } else if (busiest && busiest.total) {
      const e = busiest.event;
      tip = `${e.weekdayLong} at ${e.name} is your <b>busiest day</b>: ${busiest.total} people (${busiest.lunch} lunch, ${busiest.dinner} dinner). At about 1 pie per ${piesPerPerson} people, plan for <b>~${pies} pies</b>.`;
    } else {
      tip = `Headcount from this device only.`;
    }

    ownerDash.innerHTML = `
      <div class="section-intro">
        <span class="eyebrow">For Noah · Owner view</span>
        <h2 class="section-heading">Who's coming</h2>
        <p>Expected headcount from "I'm going" taps on the schedule.</p>
      </div>
      <div class="owner-kpis">
        <div class="owner-kpi"><b>${people}</b><span>People, next 3 pop-ups</span></div>
        <div class="owner-kpi"><b>${busiestLabel}</b><span>Busiest day</span></div>
        <div class="owner-kpi"><b>${dinnerShare}%</b><span>Dinner share</span></div>
        <div class="owner-kpi"><b>~${pies}</b><span>Pies to prep${busiest && busiest.total ? ` ${busiest.event.weekday}` : ""}</span></div>
      </div>
      <div class="owner-chart">
        <h3>Expected people by pop-up</h3>
        <div class="owner-bars">${bars || `<p class="owner-note">No upcoming pop-ups.</p>`}</div>
        <div class="owner-xl">${xl}</div>
        <div class="owner-leg">
          <span><i style="background:#e3ab6f"></i>Lunch</span>
          <span><i style="background:#d8431a"></i>Dinner</span>
        </div>
      </div>
      <div class="owner-tip">${tip}</div>
      <table class="owner-table">
        <tr><th>Date</th><th class="owner-hide-m">Stop</th><th>Lunch</th><th>Dinner</th><th>Total</th></tr>
        ${table || `<tr><td colspan="5">No upcoming pop-ups.</td></tr>`}
      </table>`;
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

  safe("cart-bind", () => {
    if (cartButton) cartButton.addEventListener("click", openCart);
    if (cartBackdrop) cartBackdrop.addEventListener("click", closeCart);
    if (cartClose) cartClose.addEventListener("click", closeCart);
  });

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

  safe("gallery", () => {
    galleryImages.forEach((img, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-cell" + (img.tall ? " tall" : "");
      button.setAttribute("aria-label", `View ${img.alt}`);
      button.innerHTML = `<img src="${img.src}" alt="${img.alt}" loading="lazy" decoding="async">`;
      button.addEventListener("click", () => openLightbox(index));
      if (galleryGrid) galleryGrid.appendChild(button);
    });
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

  safe("lightbox-bind", () => {
    if (lightbox) lightbox.addEventListener("click", closeLightbox);
    if (lightboxImage) lightboxImage.addEventListener("click", (event) => event.stopPropagation());
    const closeBtn = lightbox && lightbox.querySelector(".lightbox-close");
    const prevBtn = lightbox && lightbox.querySelector(".lightbox-prev");
    const nextBtn = lightbox && lightbox.querySelector(".lightbox-next");
    if (closeBtn) {
      closeBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        closeLightbox();
      });
    }
    if (prevBtn) prevBtn.addEventListener("click", (event) => showLightbox(-1, event));
    if (nextBtn) nextBtn.addEventListener("click", (event) => showLightbox(1, event));
  });

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

  if (form) form.addEventListener("submit", async (event) => {
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
  safe("keyboard", () => document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (plannerUi.calId) {
        closeCalMenu();
        if (lastPlannerEvents.length) renderScheduleList(lastPlannerEvents);
      } else if (lightbox?.classList.contains("is-open")) closeLightbox();
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
  }));

  safe("menu", renderMenuActions);
  safe("cart", renderCart);
  safe("popup", renderPopup);
  safe("owner", renderOwnerDashboard);
  window.setInterval(() => safe("popup", renderPopup), 1000);

  safe("planner-dismiss", () => {
    document.addEventListener("click", (event) => {
      if (!plannerUi.calId) return;
      if (event.target.closest(".planner-cal-menu") || event.target.closest("[data-cal-toggle]")) return;
      closeCalMenu();
      if (lastPlannerEvents.length) renderScheduleList(lastPlannerEvents);
    });
    window.addEventListener("resize", () => {
      if (!plannerUi.calId) return;
      if (window.matchMedia && window.matchMedia("(max-width: 640px)").matches) {
        document.body.classList.add("cal-sheet-open");
      } else {
        document.body.classList.remove("cal-sheet-open");
      }
    });
  });
})();
