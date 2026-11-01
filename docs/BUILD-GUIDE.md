# Babka's Pizza Co. Website: Build Guide

Oct 31, 2026 · @Paul Zimmer

## Overview

This is a one-page marketing and ordering site for Babka's Pizza Co., a mobile pop-up pizza shop serving Chetek and Barron County. It works as a design reference and a working prototype, and everything needed to build it out is in the handoff package.

Visitors can see the next pop-up with a live countdown, build an order from the menu, request a pop-up in their area, and find contact details. The goal is simple: get people to the truck while it is live and keep them coming back.

**Handoff package**

- `Babkas Pizza Co - export.html`: the full page (markup, styles, scripts, copy), about 59 KB.
- `assets/`: logo lockups, two short videos (the loading animation and the hero flame loop) and six food photos, about 8 MB.
- `support.js` and `compat.json`: the helper runtime the prototype loads.
- This guide.

## Page structure

The page is a single scroll with six sections, in this order. The header nav and the footer both link to them.

| Section | Purpose | Key content |
| --- | --- | --- |
| Header (sticky) | Navigation and quick actions | Logo, centered nav, "Our Schedule" button, "My Order" cart button, hamburger on mobile |
| Home | First impression | Flame loop video, "Fresh fired pizza" tagline, "Our Schedule" button |
| Pop-Ups (`#popup`) | Tell people where and when | Heading "Where to find us", "Stop by, order ahead, or both!", live countdown, pizza-slice timer, next stop, full schedule list, Place Order button |
| About (`#about`) | Brand story | Eyebrow "Our Story", heading "Mobile pop-up pizza shop", story paragraph and photo |
| Menu (`#menu`) | Browse and build an order | Six pizzas with photos, prices and Add to Order buttons |
| Gallery (`#gallery`) | Social proof and appetite | Photo grid of the truck, team and pies |
| Request (`#request`) | Collect demand from other towns | "Too far from Chetek?", "Let us know where we should go next!", request form |
| Footer | Wrap-up and contact | Logo, Explore links, contact and social icons, "Find us around Chetek and Barron County", copyright, back to top |

**Menu as built**

| Pizza | Price | Toppings |
| --- | --- | --- |
| Classic Pepperoni | $15 | Sauce, pepperoni, mozzarella, oregano |
| Just Say Cheese | $13 | Sauce, mozzarella, parmesan, Asiago |
| The Basil | $13 | Sauce, fresh basil, mozzarella, parmesan, olive oil drizzle |
| The Nigel | $16 | Italian salami, pepperoni, purple onion, pepperoncinis, mozzarella, parmesan, hot honey |
| Sausage, Mushroom, Onion | $16 | Sauce, Italian sausage, mozzarella, mushroom, purple onion |
| Sicilian Pepperoni Ranch | $17 | Thick square crust, sauce, pepperoni, mozzarella, garlic ranch drizzle |

Menu intro copy: "Build your order here, then place it while a pop-up is live, or scan the Square QR code at the truck to pay and pick your toppings."

## Design system

The look is warm and wood-fired: dark charcoal for the header, menu and footer, cream and paper tones for the content sections, and a single flame orange for every action.

| Token | Value | Used for |
| --- | --- | --- |
| Flame 500 | `#ef5424` | Primary buttons, count badge, active nav line |
| Flame 600 / 700 | `#d8431a` / `#b6360f` | Link and button hover states |
| Flame 300 | `#f7864f` | Active nav link, footer headings, hover text |
| Black / Charcoal / Ink | `#0d0b0a` / `#221e1c` / `#171412` | Header, menu section, footer, body text |
| Cream / Paper | `#fdf6ec` / `#fbeee0` | Page background, Pop-Ups and Request sections |
| Gray 100–900 | `#f2ede4` to `#2e2723` | Borders, secondary text |
| Olive / Basil | `#5c6b3f` / `#41562c` | Menu accents |

**Type**

- **Caveat** (semibold 600, Playball fallback): script headings. Readable cursive was a deliberate choice.
- **Playball**: the hero headline only.
- **Oswald**: uppercase labels, nav, footer headings.
- **Nunito**: body copy and buttons (weight 800 on buttons).
- All four load from Google Fonts.

**Shape and spacing**

- Buttons are pills (`border-radius: 999px`). The two header buttons are exactly 152 × 46 px on desktop.
- Sections use 80 px vertical padding and a 1180 px maximum content width.
- Cards use an 18 px radius with a soft shadow.
- Breakpoints: 900 px (hamburger replaces nav, schedule button hides) and 1180 px (nav tightens, "My Order" label hides).

## Interactive features

Each feature below already works in the prototype. The notes say how it behaves, so you can rebuild it faithfully.

**Pop-up schedule and live state**

- The page reads one `SCHEDULE` list (date, start, end, name, address) and finds the next stop from the visitor's clock, using the visitor's own device clock (see the launch list: pin this to the shop's time zone).
- Before a stop it shows a countdown. During a stop it switches to "live" and shows the Place Order button; Place Order is hidden whenever no stop is live.
- The pizza-slice timer is an eight-slice SVG pizza on an 11-second loop: slices rebuild, pepperoni drop in one at a time (about 0.26 s each, 0.11 s apart, random count and spots every loop, no overlaps), then slices disappear one per second and the whole pizza spins back together in about 0.5 s.

**Order cart ("My Order")**

- Each menu card has Add to Order, which becomes a quantity stepper once the item is in the cart.
- The header cart button shows a count badge to the left of the icon and opens a slide-over drawer with line items, quantities, total and a clear button.
- Place Order in the drawer appears only while a pop-up is live. Today the cart lives in page memory only and does not carry items to Square.

**Navigation**

- The nav is centered on the page. Hovering a link lifts it and glows it.
- A scroll-spy highlights the section that crosses the vertical middle of the screen, and an orange line slides between links with a stretch effect. Nav order matches page order so it never jumps backwards.
- On mobile the hamburger opens a panel with the same links in the same order.

**Request a pop-up form**

- Fields: name, email, area, ZIP and a suggested spot. Submitting shows a thank-you state.
- It does not store or send anything yet. See the next section.

## Placeholders to replace before launch

These items are sample data in the prototype. Nothing here should go live as written.

- [ ] **Real schedule.** Replace the sample `SCHEDULE` list (eight stops, Nov 6 to Dec 4, 2026, at made-up addresses) with Babka's actual stops. Better: load it from a spreadsheet or small admin page so it can change without editing code.
- [ ] **Pin the time zone.** Live and countdown logic uses each visitor's device clock. Pin it to the shop's time zone (Central for Chetek) so the live state is right for everyone.
- [ ] **Square ordering link.** `ORDER_URL` is `https://squareup.com/`. Point it at the real Square online ordering page, and decide whether cart items should carry over (needs Square's ordering API) or only open the page.
- [ ] **Contact details.** Email `hello@babkaspizza.com`, phone `(555) 555-0123`, and the Instagram and Facebook links (`#`) are placeholders.
- [ ] **Request form.** Submissions currently go nowhere. Connect it to email, a spreadsheet or a database, add spam protection, and decide who reads the requests.
- [ ] **Story copy.** The About paragraph is draft wording; confirm or rewrite it.
- [ ] **Menu and prices.** Confirm the six pizzas, prices and descriptions against the Square catalog so they match at the truck.
- [ ] **Live fonts.** Confirm Caveat, Playball, Oswald and Nunito render on the published site (they load from Google Fonts).
- [ ] **Other pages in the project.** `Babkas Pizza Co (Standalone).html` and `Babkas Pizza Co.dc.html` still have older catering wording; retire or update them. Babka's has no catering license.

## Build-out notes

The prototype is a design reference, not production code, so plan to rebuild it as a standard static site. Treat the HTML file as the source of truth for copy, layout, colors and behavior.

**Running the files**

- Unzip the package and serve the folder with any static server (for example `npx serve` or `python3 -m http.server`). Opening the file by double-click may block the video and helper script.
- The prototype loads React and Babel from the unpkg CDN at runtime and compiles in the browser. That is fine for review, but it is slow and weak for search engines, so do not ship it as is.

**Recommended build**

1. Rebuild as a static site (Astro, Next.js static export, or plain HTML, CSS and JS) using the design tokens above. One page, six sections.
2. Port the behaviors: schedule logic, pizza timer, scroll-spy nav and cart. Each is small and self-contained in the script block.
3. Optimize media: the videos and photos are about 8 MB. Compress, add poster images and lazy-load the gallery.
4. Add real metadata: page title, description, Open Graph image, local business structured data (name, area, schedule) and a favicon from the flame mark.
5. Wire Square ordering and the request form (see the launch list).
6. Host on Netlify, Vercel or Cloudflare Pages, then point the babkaspizza domain at it.
7. Test on real phones, and re-check keyboard focus, color contrast and reduced-motion handling for the pizza animation.

**Estimated size.** A developer familiar with static sites should need a few days for steps 1 to 4, plus integration time for step 5 that depends on Square.
