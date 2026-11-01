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
};
