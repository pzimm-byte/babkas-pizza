/* =============================================================================
   Babka's Pizza Co. — site config
   -----------------------------------------------------------------------------
   Edit THIS file to update the schedule, Square link, contact details, and
   request-form endpoint. The rest of the site reads these values at runtime.

   Items marked PLACEHOLDER must be replaced before launch. They are sample
   data from the handoff prototype and should not go live as written.
   ============================================================================= */

window.BABKAS_CONFIG = {
  /* Shop clock. Live / countdown math is pinned here, not to the visitor's
     device timezone. Chetek / Barron County is Central Time. */
  TIMEZONE: "America/Chicago",

  /* Public site URL (used if you later add share links). */
  SITE_URL: "https://pzimm-byte.github.io/babkas-pizza/",

  /* -------------------------------------------------------------------------
     PLACEHOLDER — sample schedule
     Eight made-up stops, Nov 6 to Dec 4, 2026. Replace with Babka's real
     pop-ups. Times are local to TIMEZONE above (America/Chicago).
     ------------------------------------------------------------------------- */
  SCHEDULE: [
    { date: "2026-11-06", start: "16:00", end: "20:00", name: "Maple Street Brewery Patio", address: "123 Maple St" },
    { date: "2026-11-07", start: "11:00", end: "15:00", name: "Downtown Farmers Market Lot", address: "45 Market Ave" },
    { date: "2026-11-13", start: "16:00", end: "20:00", name: "Riverside Park Pavilion", address: "800 River Rd" },
    { date: "2026-11-14", start: "11:00", end: "15:00", name: "Eastside Community Center", address: "210 Elm St" },
    { date: "2026-11-20", start: "16:00", end: "20:00", name: "Maple Street Brewery Patio", address: "123 Maple St" },
    { date: "2026-11-21", start: "11:00", end: "15:00", name: "Downtown Farmers Market Lot", address: "45 Market Ave" },
    { date: "2026-11-28", start: "11:00", end: "15:00", name: "Riverside Park Pavilion", address: "800 River Rd" },
    { date: "2026-12-04", start: "16:00", end: "20:00", name: "Eastside Community Center", address: "210 Elm St" },
  ],

  /* PLACEHOLDER — Square online ordering page. Point this at the real
     Square order link. Cart items do not carry over yet. */
  ORDER_URL: "https://squareup.com/",

  /* PLACEHOLDER — contact and social. Replace before launch. */
  EMAIL: "hello@babkaspizza.com",
  PHONE_DISPLAY: "(555) 555-0123",
  PHONE_TEL: "+15555550123",
  INSTAGRAM_URL: "#",
  FACEBOOK_URL: "#",

  /* PLACEHOLDER — request form does not send anywhere yet.
     Drop a Formspree or Formsubmit URL here when ready, for example:
       "https://formspree.io/f/xxxxxxxx"
       "https://formsubmit.co/hello@babkaspizza.com"
     Leave empty to keep the on-page thank-you only. */
  REQUEST_FORM_ENDPOINT: "",

  /* -------------------------------------------------------------------------
     Visit planner (I'm going)
     Open decisions live in the PR. Do not treat these placeholders as final.
     ------------------------------------------------------------------------- */

  /* Storage backend. null uses the local-only adapter below (this device).
     To plug in a real backend later, set this to an object with:
       getTaps(), getTap(id), saveTap(id, tap), deleteTap(id)
     and set sharedCounts: true once counts are actually shared. */
  PLANNER_BACKEND: null,

  PLANNER_STORAGE_KEY: "babkas-planner-taps",

  /* PLACEHOLDER — city/region appended to Maps and calendar locations.
     Confirm real addresses per stop. A stop may also set its own `city`. */
  PLANNER_CITY: "Chetek",
  PLANNER_REGION: "WI",

  /* PLACEHOLDER — lunch/dinner windows. Confirm with Noah.
     A stop may set `windows: ["lunch", "dinner"]` to override auto-detect
     (auto-detect uses whether the stop hours overlap these windows). */
  PLANNER_WINDOWS: {
    lunch: { id: "lunch", label: "Lunch 11 to 2", start: "11:00", end: "14:00" },
    dinner: { id: "dinner", label: "Dinner 4 to 7", start: "16:00", end: "19:00" },
  },

  /* PLACEHOLDER — pies to prep = people / this number. Confirm with Noah. */
  PLANNER_PIES_PER_PERSON: 1.1,

  PLANNER_MAX_PARTY: 20,

  /* Owner dashboard is owner.html (unlinked, noindex). Protection is pending.
     Set false to show a not-available message on that file. */
  PLANNER_OWNER_PAGE: true,
};

/* Local-only adapter: taps stay in localStorage on this device. No shared counts. */
window.BABKAS_LOCAL_PLANNER_ADAPTER = function createLocalPlannerAdapter(cfg) {
  const key = (cfg && cfg.PLANNER_STORAGE_KEY) || "babkas-planner-taps";
  let memory = {};

  function read() {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
      return memory;
    }
  }

  function write(all) {
    memory = all;
    try {
      window.localStorage.setItem(key, JSON.stringify(all));
    } catch (err) {
      /* private mode or quota: keep memory only */
    }
  }

  return {
    kind: "local",
    sharedCounts: false,
    getTaps: function () {
      return read();
    },
    getTap: function (id) {
      const all = read();
      return all[id] || null;
    },
    saveTap: function (id, tap) {
      const all = read();
      all[id] = tap;
      write(all);
    },
    deleteTap: function (id) {
      const all = read();
      delete all[id];
      write(all);
    },
  };
};

window.createBabkasPlannerAdapter = function (cfg) {
  const config = cfg || window.BABKAS_CONFIG || {};
  const backend = config.PLANNER_BACKEND;
  if (backend && typeof backend === "object" && typeof backend.getTaps === "function") {
    return backend;
  }
  return window.BABKAS_LOCAL_PLANNER_ADAPTER(config);
};
