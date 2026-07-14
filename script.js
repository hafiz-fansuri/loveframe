/* ============================================================
   LoveFrame — photobooth logic
   Everything runs client-side. No photo ever leaves the device.
============================================================ */

// ---------- state ----------
const state = {
  stream: null,
  selectedFilter: 'none',
  selectedTemplate: 'polaroid',
  shotsNeeded: 1,
  shots: [],           // array of HTMLImageElement (already filtered + mirrored)
  busy: false,
};

const FILTER_CSS = {
  none:   'none',
  warm:   'sepia(0.35) saturate(1.4) brightness(1.05) contrast(1.05)',
  mono:   'grayscale(1) contrast(1.15) brightness(0.95)',
  fade:   'saturate(0.55) brightness(1.12) contrast(0.9) sepia(0.15)',
  dreamy: 'saturate(1.2) brightness(1.1) contrast(0.92) blur(0.6px)',
};

const TEMPLATE_SHOTS = {
  polaroid: 1, neon: 1, filmstrip: 3, letter: 1, starry: 1, y2k: 1,
};

// ---------- element refs ----------
const video = document.getElementById('video');
const captureCanvas = document.getElementById('captureCanvas');
const screenOverlay = document.getElementById('screenOverlay');
const startCameraBtn = document.getElementById('startCameraBtn');
const shutterBtn = document.getElementById('shutterBtn');
const countdownEl = document.getElementById('countdown');
const flashEl = document.getElementById('flash');
const liveBadge = document.getElementById('liveBadge');
const filterRow = document.getElementById('filterRow');
const shotsHint = document.getElementById('shotsHint');
const templateGrid = document.getElementById('templateGrid');
const renderBtn = document.getElementById('renderBtn');
const resultSection = document.getElementById('resultSection');
const finalCanvas = document.getElementById('finalCanvas');
const retakeBtn = document.getElementById('retakeBtn');
const downloadBtn = document.getElementById('downloadBtn');

document.getElementById('year').textContent = new Date().getFullYear();
updateShotsHint();

// ---------- camera ----------
startCameraBtn.addEventListener('click', async () => {
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false,
    });
    video.srcObject = state.stream;
    screenOverlay.style.display = 'none';
    liveBadge.classList.add('show');
    shutterBtn.disabled = false;
  } catch (err) {
    screenOverlay.querySelector('.screen-hint').textContent =
      "couldn't reach your camera — check permissions and try again";
  }
});

// ---------- filters ----------
filterRow.addEventListener('click', (e) => {
  const chip = e.target.closest('.filter-chip');
  if (!chip) return;
  filterRow.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  state.selectedFilter = chip.dataset.filter;
  video.className = '';
  if (state.selectedFilter !== 'none') video.classList.add('f-' + state.selectedFilter);
});

// ---------- template selection ----------
templateGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.template-card');
  if (!card) return;
  templateGrid.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  state.selectedTemplate = card.dataset.template;
  state.shotsNeeded = TEMPLATE_SHOTS[state.selectedTemplate] || 1;
  state.shots = [];
  updateShotsHint();
});
// default select first card visually
templateGrid.querySelector('.template-card').classList.add('selected');

function updateShotsHint(){
  const have = state.shots.length;
  shotsHint.textContent = state.shotsNeeded > 1
    ? `shot ${Math.min(have + 1, state.shotsNeeded)} of ${state.shotsNeeded}`
    : (have ? 'got it — pick a new frame to retake' : 'shot 1 of 1');
}

// ---------- shutter / countdown / capture ----------
shutterBtn.addEventListener('click', async () => {
  if (state.busy || !state.stream) return;
  state.busy = true;
  shutterBtn.disabled = true;

  await runCountdown();
  captureFrame();
  flashEl.classList.remove('go'); void flashEl.offsetWidth; flashEl.classList.add('go');

  updateShotsHint();
  state.busy = false;
  shutterBtn.disabled = false;

  if (state.shots.length >= state.shotsNeeded) {
    // gentle nudge toward next step
    document.getElementById('templateSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

function runCountdown(){
  return new Promise((resolve) => {
    let n = 3;
    countdownEl.textContent = n;
    countdownEl.classList.add('show');
    const tick = setInterval(() => {
      n -= 1;
      if (n === 0) {
        clearInterval(tick);
        countdownEl.classList.remove('show');
        resolve();
      } else {
        countdownEl.textContent = n;
        countdownEl.classList.remove('show'); void countdownEl.offsetWidth; countdownEl.classList.add('show');
      }
    }, 700);
  });
}

function captureFrame(){
  const vw = video.videoWidth || 1280;
  const vh = video.videoHeight || 960;
  captureCanvas.width = vw;
  captureCanvas.height = vh;
  const ctx = captureCanvas.getContext('2d');

  ctx.save();
  ctx.filter = FILTER_CSS[state.selectedFilter];
  // mirror so the saved photo matches the selfie preview
  ctx.translate(vw, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, vw, vh);
  ctx.restore();

  const img = new Image();
  img.src = captureCanvas.toDataURL('image/png');
  if (state.shots.length >= state.shotsNeeded) state.shots = [];
  state.shots.push(img);
}

// ---------- render frame ----------
renderBtn.addEventListener('click', () => {
  if (state.shots.length < state.shotsNeeded) {
    document.getElementById('booth').scrollIntoView({ behavior: 'smooth' });
    shotsHint.style.color = '#FF8FA8';
    shotsHint.textContent = state.shotsNeeded > 1
      ? `take ${state.shotsNeeded - state.shots.length} more shot(s) first`
      : 'take a photo first';
    return;
  }

  const details = {
    names: document.getElementById('namesInput').value.trim() || 'you & me',
    caption: document.getElementById('captionInput').value.trim() || 'wherever you are, that\u2019s home',
    cityA: document.getElementById('cityAInput').value.trim(),
    cityB: document.getElementById('cityBInput').value.trim(),
    days: computeDays(document.getElementById('startDateInput').value),
  };

  const drawFn = TEMPLATE_DRAWERS[state.selectedTemplate];
  drawFn(finalCanvas, state.shots, details);

  resultSection.classList.remove('hidden');
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function computeDays(dateStr){
  if (!dateStr) return null;
  const start = new Date(dateStr + 'T00:00:00');
  if (isNaN(start.getTime())) return null;
  const diff = Date.now() - start.getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

retakeBtn.addEventListener('click', () => {
  state.shots = [];
  updateShotsHint();
  resultSection.classList.add('hidden');
  document.getElementById('booth').scrollIntoView({ behavior: 'smooth' });
});

downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = `loveframe-${state.selectedTemplate}-${Date.now()}.png`;
  link.href = finalCanvas.toDataURL('image/png');
  link.click();
});

/* ============================================================
   TEMPLATE DRAWERS
   Each takes (canvas, shots[], details) and paints the final image.
============================================================ */
const TEMPLATE_DRAWERS = {

  // ---------------- 1. POLAROID STACK ----------------
  polaroid(canvas, shots, d){
    const W = 900, H = 1120;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#3A2B63';
    ctx.fillRect(0, 0, W, H);

    // back tilted card (depth)
    drawRoundedCard(ctx, W/2 - 300, 70, 600, 900, 14, '#F3E9D6', -4);
    drawRoundedCard(ctx, W/2 - 300, 60, 600, 900, 14, '#FDF6E9', 3);

    // main polaroid
    const px = W/2 - 300, py = 50, pw = 600, ph = 900;
    ctx.save();
    ctx.translate(px + pw/2, py + ph/2);
    ctx.rotate(-0.01);
    ctx.translate(-(px + pw/2), -(py + ph/2));
    ctx.fillStyle = '#FFFFFF';
    roundRectPath(ctx, px, py, pw, ph, 6);
    ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 14;
    roundRectPath(ctx, px, py, pw, ph, 6);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    const photoPad = 34;
    drawCoverImage(ctx, shots[0], px + photoPad, py + photoPad, pw - photoPad*2, ph - 260);

    // tape corner
    ctx.save();
    ctx.translate(px + 60, py - 6);
    ctx.rotate(-0.5);
    ctx.fillStyle = 'rgba(255, 216, 115, 0.65)';
    ctx.fillRect(-45, -14, 90, 34);
    ctx.restore();

    // caption
    ctx.fillStyle = '#241A3D';
    ctx.textAlign = 'center';
    ctx.font = '600 46px Caveat, cursive';
    wrapText(ctx, d.caption, px + pw/2, py + ph - 170, pw - 90, 44);

    ctx.font = '700 30px "Fraunces", serif';
    ctx.fillStyle = '#5C4A87';
    ctx.fillText(d.names, px + pw/2, py + ph - 70);

    ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#9885B8';
    const meta = metaLine(d);
    if (meta) ctx.fillText(meta, px + pw/2, py + ph - 34);

    ctx.restore();
  },

  // ---------------- 2. NEON HEART ----------------
  neon(canvas, shots, d){
    const W = 900, H = 1120;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    const bg = ctx.createRadialGradient(W/2, H*0.42, 40, W/2, H*0.42, 700);
    bg.addColorStop(0, '#2D2150');
    bg.addColorStop(1, '#0F0A1C');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    scatterStars(ctx, W, H, 70);

    // heart clip for photo
    const cx = W/2, cy = H*0.42, scale = 12.4;
    ctx.save();
    heartPath(ctx, cx, cy, scale);
    ctx.clip();
    drawCoverImage(ctx, shots[0], cx - 25*scale, cy - 25*scale, 50*scale, 50*scale);
    ctx.restore();

    // glow outline (draw multiple times for glow)
    for (let i = 3; i >= 1; i--) {
      ctx.save();
      heartPath(ctx, cx, cy, scale);
      ctx.lineWidth = 6 * i;
      ctx.strokeStyle = 'rgba(255,94,134,' + (0.18 * (4-i)) + ')';
      ctx.shadowColor = '#FF5E86';
      ctx.shadowBlur = 25 * i;
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    heartPath(ctx, cx, cy, scale);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#FFD8E2';
    ctx.stroke();
    ctx.restore();

    // text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD873';
    ctx.font = '600 40px "Fraunces", serif';
    ctx.shadowColor = 'rgba(255,216,115,0.7)';
    ctx.shadowBlur = 18;
    ctx.fillText(d.names, W/2, H - 200);
    ctx.shadowBlur = 0;

    ctx.font = '500 30px Caveat, cursive';
    ctx.fillStyle = '#EFE7F8';
    wrapText(ctx, d.caption, W/2, H - 145, W - 160, 34);

    ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#C9B8EC';
    const meta = metaLine(d);
    if (meta) ctx.fillText(meta, W/2, H - 60);
  },

  // ---------------- 3. FILM STRIP ----------------
  filmstrip(canvas, shots, d){
    const W = 1400, H = 620;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0F0A1C';
    ctx.fillRect(0, 0, W, H);

    const stripY = 40, stripH = H - 130;
    const holeR = 9, holeGap = 46;
    ctx.fillStyle = '#F3E9D6';
    for (let x = 30; x < holeGap * 2; x += 0) {} // noop guard
    for (let x = 26; x < W - 20; x += holeGap) {
      circle(ctx, x, stripY - 18, holeR);
      circle(ctx, x, stripY + stripH + 18, holeR);
    }

    const n = shots.length;
    const margin = 34, gap = 22;
    const frameW = (W - margin*2 - gap*(n-1)) / n;
    for (let i = 0; i < n; i++) {
      const fx = margin + i * (frameW + gap);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(fx, stripY, frameW, stripH);
      drawCoverImage(ctx, shots[i], fx + 8, stripY + 8, frameW - 16, stripH - 16);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FDF6E9';
    ctx.font = '600 34px "Fraunces", serif';
    ctx.fillText(d.names, W/2, H - 58);

    ctx.font = '500 24px Caveat, cursive';
    ctx.fillStyle = '#C9B8EC';
    const line2 = [d.caption, metaLine(d)].filter(Boolean).join('   \u2022   ');
    ctx.fillText(line2, W/2, H - 24);
  },

  // ---------------- 4. LOVE LETTER ----------------
  letter(canvas, shots, d){
    const W = 900, H = 1160;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#EFE1BE');
    bg.addColorStop(1, '#E3D2A6');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    paperGrain(ctx, W, H);

    // dashed stitch border
    ctx.strokeStyle = 'rgba(90,60,30,0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(30, 30, W - 60, H - 60);
    ctx.setLineDash([]);

    // photo, slightly rotated, taped
    const pw = 560, ph = 620, px = W/2 - pw/2, py = 110;
    ctx.save();
    ctx.translate(px + pw/2, py + ph/2);
    ctx.rotate(-0.035);
    ctx.translate(-(px + pw/2), -(py + ph/2));
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(60,30,10,0.35)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.fillRect(px, py, pw, ph);
    ctx.shadowColor = 'transparent';
    drawCoverImage(ctx, shots[0], px + 14, py + 14, pw - 28, ph - 28);
    ctx.restore();

    // little tape strips
    drawTape(ctx, px + 40, py - 4, -0.5);
    drawTape(ctx, px + pw - 40, py - 4, 0.5);

    // handwritten letter lines
    ctx.fillStyle = '#4A3722';
    ctx.textAlign = 'center';
    ctx.font = '600 44px Caveat, cursive';
    wrapText(ctx, '"' + d.caption + '"', W/2, py + ph + 90, W - 150, 42);

    ctx.font = '700 34px "Fraunces", serif';
    ctx.fillStyle = '#3A2A16';
    ctx.fillText(d.names, W/2, py + ph + 175);

    ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#7A6440';
    const meta = metaLine(d);
    if (meta) ctx.fillText(meta, W/2, py + ph + 212);

    // wax seal
    const sx = W - 120, sy = H - 110;
    ctx.beginPath();
    ctx.arc(sx, sy, 46, 0, Math.PI*2);
    const sealGrad = ctx.createRadialGradient(sx-14, sy-14, 4, sx, sy, 50);
    sealGrad.addColorStop(0, '#E4677F');
    sealGrad.addColorStop(1, '#9B2C42');
    ctx.fillStyle = sealGrad;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '600 30px "Fraunces", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = (d.names.match(/[A-Za-z]/g) || ['L']).slice(0,1)[0].toUpperCase();
    ctx.fillText(initials, sx, sy + 2);
    ctx.textBaseline = 'alphabetic';
  },

  // ---------------- 5. STARRY NIGHT ----------------
  starry(canvas, shots, d){
    const W = 900, H = 1160;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1B1330');
    bg.addColorStop(0.6, '#241A3D');
    bg.addColorStop(1, '#120B22');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    scatterStars(ctx, W, H, 130);

    // moon-photo
    const cx = W/2, cy = 420, r = 250;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.closePath();
    ctx.clip();
    drawCoverImage(ctx, shots[0], cx - r, cy - r, r*2, r*2);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFD873';
    ctx.shadowColor = 'rgba(255,216,115,0.7)';
    ctx.shadowBlur = 30;
    ctx.stroke();
    ctx.restore();

    // constellation connecting two cities
    const y = 760;
    const leftX = 160, rightX = W - 160;
    ctx.save();
    ctx.strokeStyle = 'rgba(201,184,236,0.55)';
    ctx.setLineDash([2, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftX, y);
    ctx.quadraticCurveTo(W/2, y - 60, rightX, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.fillStyle = '#FF8FA8';
    ctx.font = '26px "Fraunces", serif';
    circle(ctx, leftX, y, 6);
    circle(ctx, rightX, y, 6);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#EFE7F8';
    ctx.font = '500 26px "Plus Jakarta Sans", sans-serif';
    if (d.cityA) ctx.fillText(d.cityA, leftX, y + 40);
    if (d.cityB) ctx.fillText(d.cityB, rightX, y + 40);

    ctx.fillStyle = '#FFD873';
    ctx.font = '600 46px "Fraunces", serif';
    ctx.fillText(d.names, W/2, y + 140);

    ctx.font = '500 30px Caveat, cursive';
    ctx.fillStyle = '#C9B8EC';
    wrapText(ctx, d.caption, W/2, y + 195, W - 160, 34);

    const meta = metaLine(d, true);
    if (meta) {
      ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#9885B8';
      ctx.fillText(meta, W/2, H - 50);
    }
  },

  // ---------------- 6. RETRO POP (Y2K) ----------------
  y2k(canvas, shots, d){
    const W = 900, H = 1120;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#FF8FA8');
    bg.addColorStop(0.5, '#FFD873');
    bg.addColorStop(1, '#C9B8EC');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // photo, big white border, slight rotation
    const pw = 620, ph = 700, px = W/2 - pw/2, py = 90;
    ctx.save();
    ctx.translate(px + pw/2, py + ph/2);
    ctx.rotate(0.03);
    ctx.translate(-(px + pw/2), -(py + ph/2));
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    ctx.fillRect(px - 16, py - 16, pw + 32, ph + 32);
    ctx.shadowColor = 'transparent';
    drawCoverImage(ctx, shots[0], px, py, pw, ph);
    ctx.restore();

    // washi tape
    drawTape(ctx, px + 70, py - 20, -0.6, '#7BD3C9');
    drawTape(ctx, px + pw - 70, py - 20, 0.6, '#7BD3C9');

    // stickers
    ctx.font = '54px sans-serif';
    ctx.fillText('\u2728', px - 60, py + 60);
    ctx.fillText('\uD83D\uDC96', px + pw + 10, py + ph - 40);
    ctx.fillText('\u2661', px - 50, py + ph - 20);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#2A0E1D';
    ctx.font = '800 52px "Fraunces", serif';
    ctx.fillText(d.names, W/2, py + ph + 90);

    ctx.font = '600 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#5A2E3A';
    wrapText(ctx, d.caption, W/2, py + ph + 135, W - 140, 34);

    const meta = metaLine(d);
    if (meta) {
      ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#7A4A56';
      ctx.fillText(meta, W/2, py + ph + 175);
    }
  },
};

/* ============================================================
   canvas drawing helpers
============================================================ */
function metaLine(d, longForm){
  const parts = [];
  if (d.cityA && d.cityB) parts.push(`${d.cityA} \u2726 ${d.cityB}`);
  if (d.days !== null && d.days !== undefined) parts.push(`day ${d.days}${longForm ? ' together' : ''}`);
  return parts.join('   \u2022   ');
}

function roundRectPath(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawRoundedCard(ctx, x, y, w, h, r, color, rotateDeg){
  ctx.save();
  ctx.translate(x + w/2, y + h/2);
  ctx.rotate(rotateDeg * Math.PI / 180);
  ctx.translate(-(x + w/2), -(y + h/2));
  ctx.fillStyle = color;
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();
}

// draws an image covering the target box (like CSS background-size: cover)
function drawCoverImage(ctx, img, x, y, w, h){
  if (!img || !img.width) return;
  const ir = img.width / img.height;
  const tr = w / h;
  let sx, sy, sw, sh;
  if (ir > tr) {
    sh = img.height;
    sw = sh * tr;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / tr;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight){
  const words = text.split(' ');
  let line = '';
  const lines = [];
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const startY = y - (lines.length - 1) * lineHeight / 2;
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineHeight));
}

function circle(ctx, x, y, r){
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function heartPath(ctx, cx, cy, s){
  ctx.beginPath();
  ctx.moveTo(cx, cy + 8*s);
  ctx.bezierCurveTo(cx - 22*s, cy - 12*s, cx - 12*s, cy - 24*s, cx, cy - 10*s);
  ctx.bezierCurveTo(cx + 12*s, cy - 24*s, cx + 22*s, cy - 12*s, cx, cy + 8*s);
  ctx.closePath();
}

function scatterStars(ctx, W, H, count){
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = pseudoRand(i, 1) * W;
    const y = pseudoRand(i, 2) * H;
    const r = 0.6 + pseudoRand(i, 3) * 1.6;
    ctx.globalAlpha = 0.35 + pseudoRand(i, 4) * 0.6;
    ctx.fillStyle = '#FDF6E9';
    circle(ctx, x, y, r);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

// deterministic pseudo-random so re-renders look stable
function pseudoRand(i, salt){
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function paperGrain(ctx, W, H){
  ctx.save();
  for (let i = 0; i < 400; i++) {
    const x = pseudoRand(i, 11) * W;
    const y = pseudoRand(i, 22) * H;
    ctx.globalAlpha = 0.03 + pseudoRand(i, 33) * 0.04;
    ctx.fillStyle = '#000';
    circle(ctx, x, y, 1.2);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawTape(ctx, x, y, rotate, color){
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotate);
  ctx.fillStyle = color ? hexToRgba(color, 0.7) : 'rgba(255,216,115,0.65)';
  ctx.fillRect(-42, -13, 84, 30);
  ctx.restore();
}

function hexToRgba(hex, alpha){
  const v = hex.replace('#','');
  const r = parseInt(v.substring(0,2),16);
  const g = parseInt(v.substring(2,4),16);
  const b = parseInt(v.substring(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
