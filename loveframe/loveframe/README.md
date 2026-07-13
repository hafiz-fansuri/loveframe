# LoveFrame — a photobooth for long-distance couples

Take your photo with your camera, drop in the photo your partner sent you,
and LoveFrame lays both into one of six frames — all rendered on a
`<canvas>` in the browser. Nothing is uploaded anywhere; there's no backend.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com/new, import the repo.
3. Framework preset: **Next.js** (auto-detected). No environment variables
   needed. Click Deploy.

Camera capture requires HTTPS, which Vercel provides automatically — it will
not work over plain `http://` on a phone, only on `localhost` or a deployed
`https://` URL.

## Structure

- `app/page.tsx` — landing page
- `app/booth/page.tsx` — the photobooth screen
- `components/Photobooth.tsx` — camera, uploads, controls, canvas render/export
- `lib/templates.ts` — the six frame designs (all drawn with Canvas 2D, no image assets)

## Adding a new frame

Add a new draw function in `lib/templates.ts` following the existing pattern
(`sameSky`, `polaroidStack`, etc.) and register it in the `TEMPLATES` array
with an `id`, `name`, `tagline`, and a CSS `swatch` gradient for its picker
thumbnail.
