# LoveFrame 💌

A photobooth built for long distance couples. No backend, no accounts, no photo ever leaves the browser — just a camera, six frames, and a download button.

## Features

- **Live booth** with a 3-2-1 countdown and shutter flash
- **5 live filters** — true, golden hour, midnight, faded polaroid, dreamy
- **6 creative templates**, each drawn on `<canvas>`:
  - **Polaroid Stack** — classic instant photo with handwritten caption
  - **Neon Heart** — your photo clipped into a glowing heart
  - **Film Strip** — 3 shots in a row, sprocket holes and all
  - **Love Letter** — parchment background, wax seal, dashed stitching
  - **Starry Night** — moon-shaped photo with a constellation linking two cities
  - **Retro Pop** — bright gradients, stickers, washi tape
- **Your story, baked into the photo**: names, a caption, "together since" date (auto-computed into a day count), and both of your cities
- Everything renders and downloads client-side as a PNG

## Running locally

No build step, no dependencies. Just serve the folder statically:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed local URL. Camera access requires either `localhost` or HTTPS.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project**, import the repo.
3. Framework preset: **Other** (it's a static site — no build command, no output directory needed).
4. Deploy. Camera access will work automatically since Vercel serves over HTTPS.

## File structure

```
loveframe/
├── index.html   → booth, template picker, details form, result
├── style.css    → design system (night-sky palette, Fraunces/Caveat/Plus Jakarta Sans)
├── script.js    → camera capture, filters, canvas frame renderers
└── README.md
```

## Notes

- Photos are mirrored on capture so they match what you see in the preview (selfie-style).
- The film strip template needs 3 shots; every other template needs 1 — the shutter button tracks this automatically.
- Nothing is uploaded anywhere; `getUserMedia` and `<canvas>` stay entirely in-browser.
