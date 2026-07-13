export type FilterKind = "none" | "bw" | "vintage" | "warm" | "cool";

export interface BoothOptions {
  yourPhoto: HTMLImageElement | null;
  partnerPhoto: HTMLImageElement | null;
  yourName: string;
  partnerName: string;
  message: string;
  cityYou: string;
  cityPartner: string;
  daysApart: string;
  filter: FilterKind;
}

export const CANVAS_W = 1080;
export const CANVAS_H = 1350;

export const FILTER_CSS: Record<FilterKind, string> = {
  none: "none",
  bw: "grayscale(1) contrast(1.05)",
  vintage: "sepia(0.35) saturate(1.15) contrast(0.95) brightness(1.02)",
  warm: "saturate(1.2) brightness(1.05) hue-rotate(-6deg)",
  cool: "saturate(1.05) brightness(1.02) hue-rotate(10deg)",
};

/* ---------- generic drawing helpers ---------- */

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const ir = img.width / img.height;
  const r = w / h;
  let sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height;
  if (ir > r) {
    sw = img.height * r;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / r;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function placeholderSlot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  bg = "#3A3A66",
  fg = "#B9B9DE"
) {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fg;
  ctx.font = `500 24px var(--font-manrope), sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2);
}

function fillPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  filter: FilterKind,
  label: string,
  bg?: string
) {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, 0);
  ctx.clip();
  if (img) {
    ctx.filter = FILTER_CSS[filter];
    drawImageCover(ctx, img, x, y, w, h);
    ctx.filter = "none";
  } else {
    placeholderSlot(ctx, x, y, w, h, label, bg);
  }
  ctx.restore();
}

function dottedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dot = 4,
  gap = 10
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.floor(dist / (dot + gap));
  ctx.fillStyle = color;
  for (let i = 0; i <= steps; i++) {
    const t = (i * (dot + gap)) / dist;
    const cx = x1 + dx * t;
    const cy = y1 + dy * t;
    ctx.beginPath();
    ctx.arc(cx, cy, dot / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function stars(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, count: number) {
  for (let i = 0; i < count; i++) {
    const sx = x + Math.random() * w;
    const sy = y + Math.random() * h;
    const r = Math.random() * 1.6 + 0.4;
    ctx.globalAlpha = Math.random() * 0.6 + 0.3;
    ctx.fillStyle = "#FAF3E7";
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: CanvasTextAlign = "center"
) {
  ctx.textAlign = align;
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy;
}

/* ---------- templates ---------- */

export interface TemplateDef {
  id: string;
  name: string;
  tagline: string;
  swatch: string; // css gradient for the picker thumbnail
  draw: (ctx: CanvasRenderingContext2D, opts: BoothOptions) => void;
}

const W = CANVAS_W;
const H = CANVAS_H;

function sameSky(ctx: CanvasRenderingContext2D, o: BoothOptions) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#14142B");
  g.addColorStop(0.55, "#1B1B3D");
  g.addColorStop(1, "#23234A");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  stars(ctx, 0, 0, W, H * 0.62, 140);

  // moon
  ctx.fillStyle = "#F2B85C";
  ctx.beginPath();
  ctx.arc(W - 140, 130, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#14142B";
  ctx.beginPath();
  ctx.arc(W - 122, 118, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FAF3E7";
  ctx.font = "600 28px var(--font-manrope), sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("same sky, different city", 60, 90);

  const slotW = (W - 60 * 2 - 40) / 2;
  const slotY = 190;
  const slotH = 640;
  fillPhoto(ctx, o.yourPhoto, 60, slotY, slotW, slotH, o.filter, "your camera", "#2E2E5C");
  fillPhoto(ctx, o.partnerPhoto, 60 + slotW + 40, slotY, slotW, slotH, o.filter, "their photo", "#2E2E5C");

  // connecting signal line
  const midY = slotY + slotH / 2;
  ctx.strokeStyle = "#57C7B8";
  dottedLine(ctx, 60 + slotW, midY, 60 + slotW + 40, midY, "#57C7B8", 5, 9);
  ctx.fillStyle = "#57C7B8";
  ctx.beginPath();
  ctx.arc(60 + slotW + 20, midY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FAF3E7";
  ctx.font = "700 34px var(--font-fraunces), serif";
  ctx.textAlign = "center";
  ctx.fillText(`${o.yourName || "you"} & ${o.partnerName || "them"}`, W / 2, slotY + slotH + 70);

  ctx.font = "italic 22px var(--font-fraunces), serif";
  ctx.fillStyle = "#B9B9DE";
  wrapText(ctx, o.message || "different timezones, same heartbeat", W / 2, slotY + slotH + 112, W - 160, 30);

  ctx.font = "500 18px var(--font-plex-mono), monospace";
  ctx.fillStyle = "#57C7B8";
  ctx.fillText(
    `${o.cityYou || "here"}  ·  ${o.cityPartner || "there"}${o.daysApart ? "  ·  " + o.daysApart + " DAYS APART" : ""}`,
    W / 2,
    H - 50
  );
}

function polaroidStack(ctx: CanvasRenderingContext2D, o: BoothOptions) {
  ctx.fillStyle = "#FAF3E7";
  ctx.fillRect(0, 0, W, H);

  const cardW = 620;
  const cardH = 740;
  const photoPad = 34;
  const photoH = cardW - photoPad * 2 + 60;

  function polaroid(cx: number, cy: number, rot: number, img: HTMLImageElement | null, caption: string, z: number) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(20,20,43,0.25)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 16;
    roundRectPath(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 10);
    ctx.fill();
    ctx.shadowColor = "transparent";
    const px = -cardW / 2 + photoPad;
    const py = -cardH / 2 + photoPad;
    const pw = cardW - photoPad * 2;
    fillPhoto(ctx, img, px, py, pw, photoH - 60, o.filter, caption, "#EADFCB");
    ctx.fillStyle = "#2A2A2A";
    ctx.font = "italic 30px var(--font-fraunces), serif";
    ctx.textAlign = "center";
    ctx.fillText(caption, 0, cardH / 2 - 46);
    ctx.restore();
  }

  polaroid(W / 2 - 60, H / 2 - 40, -6, o.partnerPhoto, o.partnerName || "them", 1);
  polaroid(W / 2 + 70, H / 2 + 10, 5, o.yourPhoto, o.yourName || "you", 2);

  ctx.fillStyle = "#B5473A";
  ctx.font = "700 40px var(--font-fraunces), serif";
  ctx.textAlign = "center";
  ctx.fillText("love, mailed from afar", W / 2, 110);

  ctx.fillStyle = "#6B6B6B";
  ctx.font = "500 20px var(--font-plex-mono), monospace";
  wrapText(ctx, o.message || "wish you were here", W / 2, H - 90, W - 200, 28);
}

function filmStrip(ctx: CanvasRenderingContext2D, o: BoothOptions) {
  ctx.fillStyle = "#14142B";
  ctx.fillRect(0, 0, W, H);

  const railW = 60;
  ctx.fillStyle = "#0B0B1A";
  ctx.fillRect(0, 0, railW, H);
  ctx.fillRect(W - railW, 0, railW, H);
  ctx.fillStyle = "#14142B";
  for (let y = 30; y < H; y += 60) {
    roundRectPath(ctx, 18, y, 24, 34, 4);
    ctx.fill();
    roundRectPath(ctx, W - 42, y, 24, 34, 4);
    ctx.fill();
  }

  const frameW = W - railW * 2 - 80;
  const frameH = (H - 260) / 2;
  const frameX = railW + 40;

  fillPhoto(ctx, o.yourPhoto, frameX, 90, frameW, frameH, o.filter, o.yourName || "frame one", "#2E2E5C");
  fillPhoto(ctx, o.partnerPhoto, frameX, 90 + frameH + 40, frameW, frameH, o.filter, o.partnerName || "frame two", "#2E2E5C");

  // sprocket-style divider text like a ticket stub
  ctx.fillStyle = "#F2B85C";
  ctx.font = "600 22px var(--font-plex-mono), monospace";
  ctx.textAlign = "center";
  ctx.fillText("★ LOVEFRAME BOOTH ★", W / 2, 90 + frameH + 26);

  ctx.fillStyle = "#FAF3E7";
  ctx.font = "700 36px var(--font-fraunces), serif";
  ctx.fillText(`${o.yourName || "you"} + ${o.partnerName || "them"}`, W / 2, H - 130);

  ctx.font = "500 18px var(--font-plex-mono), monospace";
  ctx.fillStyle = "#B9B9DE";
  ctx.fillText(
    `NO. ${(o.daysApart || "000").toString().padStart(3, "0")}  ·  ${o.cityYou || "CITY A"} → ${o.cityPartner || "CITY B"}`,
    W / 2,
    H - 90
  );
}

function callWindow(ctx: CanvasRenderingContext2D, o: BoothOptions) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#1B1B3D");
  g.addColorStop(1, "#23234A");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // top call bar
  ctx.fillStyle = "rgba(250,243,231,0.08)";
  roundRectPath(ctx, 40, 40, W - 80, 70, 20);
  ctx.fill();
  ctx.fillStyle = "#57C7B8";
  ctx.beginPath();
  ctx.arc(80, 75, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FAF3E7";
  ctx.font = "600 24px var(--font-manrope), sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`calling ${o.partnerName || "them"}...`, 100, 84);
  ctx.textAlign = "right";
  ctx.font = "500 20px var(--font-plex-mono), monospace";
  ctx.fillStyle = "#B9B9DE";
  ctx.fillText(o.daysApart ? `${o.daysApart} DAYS` : "CONNECTED", W - 60, 84);

  // main tile
  const mainX = 40,
    mainY = 140,
    mainW = W - 80,
    mainH = 820;
  fillPhoto(ctx, o.partnerPhoto, mainX, mainY, mainW, mainH, o.filter, "their camera", "#2E2E5C");

  // PIP tile
  const pipW = 300,
    pipH = 400;
  const pipX = W - 40 - pipW - 20;
  const pipY = mainY + mainH - pipH - 20;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 24;
  fillPhoto(ctx, o.yourPhoto, pipX, pipY, pipW, pipH, o.filter, "your camera", "#3A3A66");
  ctx.restore();
  ctx.strokeStyle = "#FAF3E7";
  ctx.lineWidth = 3;
  roundRectPath(ctx, pipX, pipY, pipW, pipH, 0);
  ctx.stroke();

  // caption bar
  ctx.fillStyle = "#FAF3E7";
  ctx.font = "italic 26px var(--font-fraunces), serif";
  ctx.textAlign = "center";
  wrapText(ctx, o.message || "goodnight from my side of the world", W / 2, mainY + mainH + 70, W - 160, 32);

  ctx.font = "500 18px var(--font-plex-mono), monospace";
  ctx.fillStyle = "#57C7B8";
  ctx.fillText(`${o.cityYou || "your city"}  ●  ${o.cityPartner || "their city"}`, W / 2, H - 50);
}

function postcard(ctx: CanvasRenderingContext2D, o: BoothOptions) {
  ctx.fillStyle = "#F3E9D6";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#B5473A";
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  const photoW = 620;
  fillPhoto(ctx, o.yourPhoto, 70, 70, photoW, H - 140, o.filter, "your photo", "#EADFCB");

  const rightX = 70 + photoW + 40;
  const rightW = W - rightX - 70;

  // stamp (drawn heart)
  const stampX = rightX + rightW - 170;
  const stampY = 80;
  ctx.strokeStyle = "#B5473A";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(stampX, stampY, 150, 180);
  ctx.setLineDash([]);
  ctx.save();
  ctx.translate(stampX + 75, stampY + 80);
  ctx.fillStyle = "#B5473A";
  ctx.beginPath();
  const heartR = 26;
  ctx.moveTo(0, heartR * 0.5);
  ctx.bezierCurveTo(-heartR, -heartR * 0.5, -heartR * 1.6, heartR * 0.7, 0, heartR * 1.6);
  ctx.bezierCurveTo(heartR * 1.6, heartR * 0.7, heartR, -heartR * 0.5, 0, heartR * 0.5);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#B5473A";
  ctx.font = "600 14px var(--font-plex-mono), monospace";
  ctx.textAlign = "center";
  ctx.fillText("AIR MAIL", stampX + 75, stampY + 150);

  // postmark
  ctx.strokeStyle = "#6B6B6B";
  ctx.beginPath();
  ctx.arc(stampX + 40, stampY + 230, 42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#6B6B6B";
  ctx.font = "600 13px var(--font-plex-mono), monospace";
  ctx.fillText(o.cityYou || "SENT FROM", stampX + 40, stampY + 224);
  ctx.fillText(new Date().toLocaleDateString(), stampX + 40, stampY + 242);

  // ruled lines for the "message"
  ctx.strokeStyle = "rgba(107,107,107,0.4)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const ly = 380 + i * 46;
    ctx.beginPath();
    ctx.moveTo(rightX, ly);
    ctx.lineTo(rightX + rightW, ly);
    ctx.stroke();
  }
  ctx.fillStyle = "#2A2A2A";
  ctx.font = "italic 28px var(--font-fraunces), serif";
  ctx.textAlign = "left";
  wrapText(ctx, o.message || "wish you were here with me", rightX, 410, rightW, 44, "left");

  ctx.font = "600 22px var(--font-fraunces), serif";
  ctx.fillStyle = "#B5473A";
  ctx.fillText(`to: ${o.partnerName || "you"}`, rightX, H - 130);
  ctx.font = "500 16px var(--font-plex-mono), monospace";
  ctx.fillStyle = "#6B6B6B";
  ctx.fillText(`from: ${o.yourName || "me"}, ${o.cityYou || "somewhere"}`, rightX, H - 100);
}

function heartConnection(ctx: CanvasRenderingContext2D, o: BoothOptions) {
  ctx.fillStyle = "#1B1B3D";
  ctx.fillRect(0, 0, W, H);
  stars(ctx, 0, 0, W, H, 90);

  function heartPath(cx: number, cy: number, s: number) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.3);
    ctx.bezierCurveTo(cx - s, cy - s * 0.6, cx - s * 1.7, cy + s * 0.5, cx, cy + s * 1.5);
    ctx.bezierCurveTo(cx + s * 1.7, cy + s * 0.5, cx + s, cy - s * 0.6, cx, cy + s * 0.3);
    ctx.closePath();
  }

  const cx = W / 2,
    cy = H / 2 - 40,
    s = 300;

  ctx.save();
  heartPath(cx, cy, s);
  ctx.clip();
  // left half = you, right half = partner
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - s * 2, cy - s * 2, s * 2, s * 4);
  ctx.clip();
  if (o.yourPhoto) {
    ctx.filter = FILTER_CSS[o.filter];
    drawImageCover(ctx, o.yourPhoto, cx - s * 1.8, cy - s * 1.6, s * 1.9, s * 3.2);
    ctx.filter = "none";
  } else {
    placeholderSlot(ctx, cx - s * 1.8, cy - s * 1.6, s * 1.9, s * 3.2, "you", "#3A3A66");
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(cx, cy - s * 2, s * 2, s * 4);
  ctx.clip();
  if (o.partnerPhoto) {
    ctx.filter = FILTER_CSS[o.filter];
    drawImageCover(ctx, o.partnerPhoto, cx - s * 0.1, cy - s * 1.6, s * 1.9, s * 3.2);
    ctx.filter = "none";
  } else {
    placeholderSlot(ctx, cx - s * 0.1, cy - s * 1.6, s * 1.9, s * 3.2, "them", "#2E2E5C");
  }
  ctx.restore();
  ctx.restore();

  // stitched dotted seam down the middle
  dottedLine(ctx, cx, cy - s * 0.7, cx, cy + s * 1.55, "#F2B85C", 5, 9);

  ctx.strokeStyle = "rgba(250,243,231,0.9)";
  ctx.lineWidth = 4;
  heartPath(cx, cy, s);
  ctx.stroke();

  ctx.fillStyle = "#FAF3E7";
  ctx.font = "700 42px var(--font-fraunces), serif";
  ctx.textAlign = "center";
  ctx.fillText(`${o.yourName || "you"} ♡ ${o.partnerName || "them"}`, W / 2, 110);

  ctx.font = "italic 22px var(--font-fraunces), serif";
  ctx.fillStyle = "#B9B9DE";
  wrapText(ctx, o.message || "one heart, two cities", W / 2, H - 70, W - 200, 30);
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "same-sky",
    name: "Same Sky",
    tagline: "Two windows, one moon, a signal line between",
    swatch: "linear-gradient(160deg,#14142B,#1B1B3D 55%,#57C7B8)",
    draw: sameSky,
  },
  {
    id: "polaroid",
    name: "Polaroid Stack",
    tagline: "Two mailed polaroids, tilted and layered",
    swatch: "linear-gradient(160deg,#FAF3E7,#E99A9A)",
    draw: polaroidStack,
  },
  {
    id: "film-strip",
    name: "Film Strip",
    tagline: "A cinematic two-frame reel with sprocket holes",
    swatch: "linear-gradient(160deg,#0B0B1A,#F2B85C)",
    draw: filmStrip,
  },
  {
    id: "call-window",
    name: "Video Call",
    tagline: "A late-night call frozen into a keepsake",
    swatch: "linear-gradient(160deg,#1B1B3D,#57C7B8)",
    draw: callWindow,
  },
  {
    id: "postcard",
    name: "Air Mail Postcard",
    tagline: "A stamped, postmarked letter from your city",
    swatch: "linear-gradient(160deg,#F3E9D6,#B5473A)",
    draw: postcard,
  },
  {
    id: "heart",
    name: "Heart, Split in Two",
    tagline: "One heart stitched together from both sides",
    swatch: "linear-gradient(160deg,#1B1B3D,#E99A9A)",
    draw: heartConnection,
  },
];
