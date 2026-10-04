# Galexa Lab

A minimal one-page website for **Galexa Lab**: simple AI workflows that take repetitive tasks off a business's plate, so teams can keep a clear mind and stay creative.

**Live site:** https://gelarehkb.github.io/Galexa_Lab/

## What's on the page

- **Hero:** a 3D office (three.js) over a pastel skyline. 34 people start overwhelmed; hovering or touching them switches them to focused work, blows their paper away and ticks off their to-do screens
- **Opening:** "Less busywork. More flow." appears line by line while scrolling
- **Solutions:** six areas we automate
- **Value — "Same team. Better hours.":** predicts the repetitive share of a team's week by team type and shows the payroll it costs
- **Contact form**, plus Impressum and privacy pages

## Tech

Plain HTML, CSS and JavaScript. No build step. three.js is bundled in `assets/vendor/three` (MIT licence), so nothing loads from third-party servers.

```
index.html          page content
impressum.html      legal notice (fill in the placeholders)
privacy.html        privacy policy (fill in the placeholders)
assets/style.css    styles
assets/main.js      menu, scroll reveals, value section, contact form
assets/office3d.js  3D office scene
assets/office.js    flat SVG fallback when WebGL is unavailable
assets/vendor/      three.js
```

## Run locally

Browsers block JavaScript modules opened straight from disk, so use a small local server:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. (Opening `index.html` directly shows the flat fallback instead of the 3D scene.)

## Deploy

Any static host works. On **Netlify** the contact form works out of the box (Netlify Forms). On other hosts, set the form's `action` in `index.html` to a form service such as Formspree.

GitHub Pages: **Settings → Pages**, source `main`, folder `/ (root)`.

## To do before launch

- [ ] Replace the placeholder email and LinkedIn link in the footer
- [ ] Fill in the placeholders in `impressum.html` and `privacy.html` and have them checked
- [ ] Deploy on Netlify, or point the contact form at a form service
- [ ] Optional: connect a custom domain
