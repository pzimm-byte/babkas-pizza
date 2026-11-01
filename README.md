# Babka's Pizza Co.

One-page marketing and ordering site for Babka's mobile pop-up pizza shop in Chetek and Barron County.

Live site: https://pzimm-byte.github.io/babkas-pizza/

This is a plain static site (HTML, CSS, and JavaScript). There is no build step. GitHub Pages can serve the files as-is.

## Local preview

From this folder:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080

Optional query flags for local review only:

- `?noloader=1` skips the intro video
- `?simulate=live` pretends the first scheduled stop is happening now, so you can check the live Place Order state

The pop-up list includes an "I'm going" visit planner. Taps are stored on this device only until a backend is chosen (`PLANNER_BACKEND` in `js/config.js`). Shared public counts stay hidden in the meantime. Noah's headcount view is the unlinked `owner.html` file; it is not in the nav and has no password yet.

## How to edit the site

All launch-sensitive values live in **`js/config.js`**. Change that file and refresh. You do not need a bundler.

| Value | What to put there |
| --- | --- |
| `TIMEZONE` | Keep `America/Chicago` unless the shop moves. Live/countdown math uses this, not the visitor's clock. |
| `SCHEDULE` | Real pop-up dates, start/end times, names, and addresses. Times are local to `TIMEZONE`. |
| `ORDER_URL` | The real Square online ordering page. |
| `EMAIL`, `PHONE_DISPLAY`, `PHONE_TEL` | Real contact details. |
| `INSTAGRAM_URL`, `FACEBOOK_URL` | Real profile URLs. |
| `REQUEST_FORM_ENDPOINT` | A Formspree or Formsubmit URL when you are ready to collect requests. Leave empty to keep the on-page thank-you only (nothing is sent). |

Menu copy and prices are in `index.html`. Photos used on the page are the compressed files in `assets/photos/`. Brand marks and videos are in `assets/brand/`.

Design notes and the original handoff write-up are in `docs/BUILD-GUIDE.md`.

## Launch checklist

These are still placeholders. Do not ship them as written.

- [ ] **Real schedule.** Replace the sample `SCHEDULE` list in `js/config.js` (eight stops, Nov 6 to Dec 4, 2026, at made-up addresses).
- [ ] **Square ordering link.** `ORDER_URL` is still `https://squareup.com/`. Point it at the real Square page. Cart items do not carry over yet.
- [ ] **Contact details.** Email `hello@babkaspizza.com`, phone `(555) 555-0123`, and the Instagram / Facebook links (`#`) are placeholders.
- [ ] **Request form.** Submissions currently stay on the page. Set `REQUEST_FORM_ENDPOINT` to Formspree or Formsubmit, add spam protection, and decide who reads the requests.
- [x] **Story copy.** About section rewritten from the owner's story (family pop-up, Chetek / Barron County, babka = grandma, ingredient quality).
- [ ] **Menu and prices.** Confirm the six pizzas, prices, and descriptions against the Square catalog.
- [ ] **Live fonts.** Confirm Caveat, Playball, Oswald, and Nunito render on the published site (they load from Google Fonts).
- [ ] **JSON-LD / Open Graph.** Update telephone and email in `index.html` when the real contact details land.

Time zone pinning is already done (`America/Chicago` in `js/config.js`).
