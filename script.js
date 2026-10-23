/* ===== EASY SETTINGS: change messages & timing here ===== */
const BOOT_LINES = [
  "Initializing secure interface...",
  "Establishing private channel...",
  "Preparing personal transmission...",
  "Recipient identified."
];
const DIAG_LINES = [
  "Unexpected thoughts detected.",
  "Recipient appears frequently in mental processes.",
  "Emotional response remains unexplained.",
  "Cause identified."
];
const LINE_DELAY = 650;        // ms between terminal lines
const DIAG_DURATION = 4000;    // total ms for the progress bar
const PARAGRAPH_DELAY = 900;   // ms between confession paragraphs
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? Math.min(ms, 50) : ms));

/* --- Switch between stages with a fade --- */
function goTo(n) {
  const current = document.querySelector(".stage.active");
  const next = $("stage" + n);
  current.classList.remove("visible");
  setTimeout(() => {
    current.classList.remove("active");
    next.classList.add("active");
    document.body.className = "stage-" + n;
    window.scrollTo(0, 0);
    requestAnimationFrame(() => requestAnimationFrame(() => next.classList.add("visible")));
    if (n === 3) runDiagnostics();
    if (n === 4) revealLetter();
    const focusTarget = next.querySelector("button:not(.hidden)");
    if (focusTarget && n !== 3) setTimeout(() => focusTarget.focus({ preventScroll: true }), 100);
  }, reduceMotion ? 0 : 450);
}

/* --- Add lines to a terminal box one by one --- */
async function typeLines(box, lines) {
  for (const text of lines) {
    const row = document.createElement("div");
    row.className = "fade-in";
    row.textContent = text;
    box.appendChild(row);
    await wait(LINE_DELAY);
  }
}

/* --- Stage 1 --- */
async function boot() {
  $("stage1").classList.add("visible");
  await typeLines($("terminal"), BOOT_LINES);
  $("btnInit").classList.remove("hidden");
  $("btnInit").classList.add("fade-in");
  $("btnInit").focus({ preventScroll: true });
}

/* --- Stage 3 --- */
let diagStarted = false;
async function runDiagnostics() {
  if (diagStarted) return;
  diagStarted = true;
  const fill = $("barFill"), wrap = $("barWrap");
  const start = performance.now();
  const duration = reduceMotion ? 100 : DIAG_DURATION;
  (function tick(now) {
    const pct = Math.min(100, ((now - start) / duration) * 100);
    fill.style.width = pct + "%";
    wrap.setAttribute("aria-valuenow", Math.round(pct));
    if (pct < 100) requestAnimationFrame(tick);
  })(start);
  const step = duration / (DIAG_LINES.length + 1);
  for (const text of DIAG_LINES) {
    await wait(step);
    const row = document.createElement("div");
    row.className = "fade-in";
    row.textContent = text;
    $("diagLog").appendChild(row);
  }
  await wait(step);
  $("diagResult").classList.remove("hidden");
  $("diagResult").classList.add("fade-in");
  $("btnFinal").focus({ preventScroll: true });
}

/* --- Stage 4: gentle paragraph-by-paragraph reveal --- */
async function revealLetter() {
  const paras = document.querySelectorAll("#letterBody p");
  for (const p of paras) {
    p.classList.add("show");
    await wait(PARAGRAPH_DELAY);
  }
}

/* --- Background stars --- */
function stars() {
  const c = $("stars"), ctx = c.getContext("2d");
  let w, h, pts = [];
  function size() {
    w = c.width = innerWidth; h = c.height = innerHeight;
    pts = Array.from({ length: Math.min(90, Math.floor(w * h / 14000)) }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.4 + 0.3, v: Math.random() * 0.25 + 0.05
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fillStyle = "rgba(120,220,255,0.6)"; ctx.fill();
      if (!reduceMotion) { p.y -= p.v; if (p.y < -2) { p.y = h + 2; p.x = Math.random() * w; } }
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  size(); draw();
  addEventListener("resize", () => { size(); if (reduceMotion) draw(); });
}

/* --- Button actions --- */
$("btnInit").addEventListener("click", () => goTo(2));
$("btnOpen").addEventListener("click", () => goTo(3));
$("btnFinal").addEventListener("click", () => goTo(4));
document.querySelectorAll("[data-reply]").forEach((b) =>
  b.addEventListener("click", () => {
    const out = $("replyOut");
    out.textContent = b.dataset.reply;
    out.classList.remove("fade-in"); void out.offsetWidth; out.classList.add("fade-in");
  })
);

try { stars(); } catch (e) { /* site still works without stars */ }
boot();
