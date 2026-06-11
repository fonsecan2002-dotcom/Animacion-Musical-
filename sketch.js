// ════════════════════════════════════════════════
//  GALAXIA ESPIRAL — Visualizador Musical
// ════════════════════════════════════════════════

const audioFile   = document.getElementById("audioFile");
const audio       = document.getElementById("audio");
const canvas      = document.getElementById("canvas");
const ctx         = canvas.getContext("2d");
const btnPlay     = document.getElementById("btnPlay");
const seekBar     = document.getElementById("seekBar");
const volBar      = document.getElementById("volBar");
const volIcon     = document.getElementById("volIcon");
const timeDisplay = document.getElementById("timeDisplay");

// ── Canvas HiDPI ──
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();
window.addEventListener("resize", () => { resizeCanvas(); initParticles(); });

function W() { return window.innerWidth; }
function H() { return window.innerHeight; }
function baseUnit() { return Math.min(W(), H()); }

// ── Mouse ──
let mouseX = W() / 2, mouseY = H() / 2;
window.addEventListener("mousemove", e => { mouseX = e.clientX; mouseY = e.clientY; });

// ── Audio state ──
let audioContext = null, analyser = null, dataArray = null, bufferLength = null;

audioFile.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!audioContext) audioContext = new AudioContext();
    audioContext.resume();
    audio.pause();
    audio.src = URL.createObjectURL(file);
    const source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.80;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    audio.play().catch(err => console.error("Error play:", err));
});

// ══════════════════════════════════════
//  PARTICLE SYSTEMS
// ══════════════════════════════════════

// --- Background Stars ---
const STAR_COUNT = 900;
let bgStars = [];

// --- Spiral Arm Particles ---
const SPIRAL_PARTICLE_COUNT = 1800;
let spiralParticles = [];

// --- Nebula Clouds ---
const NEBULA_COUNT = 90;
let nebulaClouds = [];

// --- Sparkle Stars (bright 4-point stars) ---
const SPARKLE_COUNT = 45;
let sparkleStars = [];

// --- Dust Lanes ---
const DUST_COUNT = 50;
let dustLanes = [];

function initParticles() {
    const w = W(), h = H(), bu = baseUnit();

    // Background stars — spread across entire screen
    bgStars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        bgStars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            baseX: 0, baseY: 0,  // offset from mouse
            ox: 0, oy: 0,        // current smooth offset
            size: Math.random() * 1.8 + 0.3,
            brightness: Math.random() * 0.6 + 0.2,
            twinkleSpeed: Math.random() * 0.03 + 0.005,
            twinklePhase: Math.random() * Math.PI * 2,
        });
    }

    // Spiral arm particles — much wider spread across the screen
    spiralParticles = [];
    const armCount = 3;  // 3 arms for fuller coverage
    for (let i = 0; i < SPIRAL_PARTICLE_COUNT; i++) {
        const arm = i % armCount;
        const t = Math.random();
        const r = t * t * bu * 0.70;  // much wider reach
        const armOffset = (arm / armCount) * Math.PI * 2;
        const spiralAngle = armOffset + t * 5.0;  // tighter spiral
        const spread = 0.4 + t * 0.8;  // more spread at edges
        const scatter = (Math.random() - 0.5) * bu * 0.14 * spread;
        const scatterY = (Math.random() - 0.5) * bu * 0.08 * spread;

        spiralParticles.push({
            baseR: r,
            baseAngle: spiralAngle,
            scatterX: scatter,
            scatterY: scatterY,
            ox: 0, oy: 0,  // mouse offset (smoothed)
            size: Math.random() * 2.8 + 0.4,
            brightness: Math.random() * 0.7 + 0.2,
            t: t,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.01 + 0.003,
        });
    }

    // Nebula clouds — more of them, larger, wider spread
    nebulaClouds = [];
    for (let i = 0; i < NEBULA_COUNT; i++) {
        const arm = i % 3;
        const t = Math.random() * 0.9 + 0.05;
        const r = t * bu * 0.60;  // wider
        const armOffset = (arm / 3) * Math.PI * 2;
        const spiralAngle = armOffset + t * 4.5;
        const scatter = (Math.random() - 0.5) * bu * 0.20;  // more scatter

        nebulaClouds.push({
            baseR: r + scatter,
            baseAngle: spiralAngle + (Math.random() - 0.5) * 0.7,
            size: bu * (Math.random() * 0.12 + 0.06),  // bigger clouds
            brightness: Math.random() * 0.05 + 0.02,
            t: t,
            phase: Math.random() * Math.PI * 2,
        });
    }

    // Sparkle stars — more, spread everywhere
    sparkleStars = [];
    for (let i = 0; i < SPARKLE_COUNT; i++) {
        sparkleStars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            size: Math.random() * 15 + 6,
            brightness: Math.random() * 0.5 + 0.5,
            twinkleSpeed: Math.random() * 0.05 + 0.012,
            twinklePhase: Math.random() * Math.PI * 2,
            rotation: Math.random() * Math.PI * 0.25,
        });
    }

    // Dust lanes — wider spread
    dustLanes = [];
    for (let i = 0; i < DUST_COUNT; i++) {
        const arm = i % 3;
        const t = Math.random() * 0.75 + 0.1;
        const r = t * bu * 0.55;
        const armOffset = (arm / 3) * Math.PI * 2 + Math.PI / 3;
        const spiralAngle = armOffset + t * 4.5;

        dustLanes.push({
            baseR: r + (Math.random() - 0.5) * bu * 0.10,
            baseAngle: spiralAngle + (Math.random() - 0.5) * 0.5,
            size: bu * (Math.random() * 0.08 + 0.04),
            t: t,
        });
    }
}
initParticles();

// ══════════════════════════════════════
//  DRAWING FUNCTIONS
// ══════════════════════════════════════

function drawCore(cx, cy, energy, timeS) {
    const bu = baseUnit();
    const pulse = Math.sin(timeS * 3.0) * 0.5 + 0.5;
    const baseBright = 200 + energy * 55;
    const coreSize = bu * (0.06 + energy * 0.03 + pulse * 0.01);

    // Inner white-hot core
    const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize);
    const a1 = 0.9 + energy * 0.1;
    g1.addColorStop(0,   `rgba(${Math.min(255, baseBright + 40)},${Math.min(255, baseBright + 35)},${Math.min(255, baseBright + 20)},${a1})`);
    g1.addColorStop(0.15, `rgba(${Math.min(255, baseBright)},${Math.min(255, baseBright - 10)},${Math.min(255, baseBright - 25)},${a1 * 0.7})`);
    g1.addColorStop(0.4,  `rgba(${Math.floor(baseBright * 0.6)},${Math.floor(baseBright * 0.58)},${Math.floor(baseBright * 0.55)},${a1 * 0.3})`);
    g1.addColorStop(0.7,  `rgba(${Math.floor(baseBright * 0.3)},${Math.floor(baseBright * 0.28)},${Math.floor(baseBright * 0.25)},${a1 * 0.1})`);
    g1.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(cx - coreSize, cy - coreSize, coreSize * 2, coreSize * 2);

    // Outer glow halo
    const haloSize = coreSize * 3.5;
    const g2 = ctx.createRadialGradient(cx, cy, coreSize * 0.3, cx, cy, haloSize);
    const haloAlpha = 0.06 + energy * 0.08 + pulse * 0.03;
    g2.addColorStop(0,   `rgba(220,218,210,${haloAlpha})`);
    g2.addColorStop(0.3, `rgba(160,158,150,${haloAlpha * 0.5})`);
    g2.addColorStop(0.6, `rgba(80,78,75,${haloAlpha * 0.2})`);
    g2.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(cx - haloSize, cy - haloSize, haloSize * 2, haloSize * 2);
}

function drawSpiralArms(cx, cy, energy, timeS, rotation, dt) {
    const bu = baseUnit();
    const mouseRadius = bu * 0.25;  // attraction radius

    for (const p of spiralParticles) {
        p.phase += p.speed;
        const angle = p.baseAngle + rotation;
        const r = p.baseR + Math.sin(p.phase) * 4;

        const baseX = cx + Math.cos(angle) * r + p.scatterX;
        const baseY = cy + Math.sin(angle) * r + p.scatterY;

        // Mouse attraction — smooth follow
        const dmx = mouseX - baseX;
        const dmy = mouseY - baseY;
        const distMouse = Math.hypot(dmx, dmy);
        if (distMouse < mouseRadius) {
            const strength = (1 - distMouse / mouseRadius) * 0.35;  // max 35% pull
            const targetOx = dmx * strength;
            const targetOy = dmy * strength;
            p.ox += (targetOx - p.ox) * 0.06 * dt;
            p.oy += (targetOy - p.oy) * 0.06 * dt;
        } else {
            p.ox *= 0.95;  // spring back
            p.oy *= 0.95;
        }

        const x = baseX + p.ox;
        const y = baseY + p.oy;

        // Skip if off-screen
        if (x < -20 || x > W() + 20 || y < -20 || y > H() + 20) continue;

        // Brightness reacts to music
        const distFactor = 1 - p.t * 0.5;
        const musicGlow = energy * 2.5 * distFactor;
        const twinkle = Math.sin(p.phase * 3) * 0.2;
        const alpha = Math.min(1, (p.brightness + musicGlow + twinkle) * (0.4 + energy * 0.7));

        const grey = Math.min(255, Math.floor(130 + energy * 110 * distFactor + p.brightness * 50));

        // Soft glow for larger particles
        const sz = p.size * (1 + energy * 0.6);
        if (sz > 1.8) {
            ctx.shadowBlur = 4 + energy * 6;
            ctx.shadowColor = `rgba(${grey},${grey},${grey},0.4)`;
        }
        ctx.beginPath();
        ctx.arc(x, y, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${grey},${grey},${Math.min(255, grey + 5)},${alpha})`;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function drawNebulae(cx, cy, energy, timeS, rotation) {
    for (const n of nebulaClouds) {
        const angle = n.baseAngle + rotation;
        const x = cx + Math.cos(angle) * n.baseR;
        const y = cy + Math.sin(angle) * n.baseR;

        const size = n.size * (1 + energy * 0.4);
        const pulse = Math.sin(timeS * 1.5 + n.phase) * 0.5 + 0.5;
        const alpha = (n.brightness + energy * 0.04 + pulse * 0.015);
        const grey = Math.min(255, Math.floor(150 + energy * 90 + pulse * 30));

        const g = ctx.createRadialGradient(x, y, 0, x, y, size);
        g.addColorStop(0,   `rgba(${grey},${grey},${Math.min(255, grey + 8)},${alpha})`);
        g.addColorStop(0.4, `rgba(${Math.floor(grey * 0.7)},${Math.floor(grey * 0.68)},${Math.floor(grey * 0.72)},${alpha * 0.5})`);
        g.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }
}

function drawDustLanes(cx, cy, energy, rotation) {
    for (const d of dustLanes) {
        const angle = d.baseAngle + rotation;
        const x = cx + Math.cos(angle) * d.baseR;
        const y = cy + Math.sin(angle) * d.baseR;

        const size = d.size * (1 + energy * 0.2);
        const alpha = 0.25 - energy * 0.08;  // less visible when loud

        if (alpha <= 0) continue;

        const g = ctx.createRadialGradient(x, y, 0, x, y, size);
        g.addColorStop(0,   `rgba(0,0,0,${alpha})`);
        g.addColorStop(0.5, `rgba(2,1,4,${alpha * 0.6})`);
        g.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }
}

function drawBackgroundStars(energy, timeS, dt) {
    const w = W(), h = H();
    const mouseRadius = baseUnit() * 0.18;

    for (const s of bgStars) {
        s.twinklePhase += s.twinkleSpeed;

        // Mouse attraction for bg stars (very gentle)
        const dmx = mouseX - s.x;
        const dmy = mouseY - s.y;
        const distM = Math.hypot(dmx, dmy);
        if (distM < mouseRadius) {
            const pull = (1 - distM / mouseRadius) * 0.15;
            s.ox += (dmx * pull - s.ox) * 0.04 * dt;
            s.oy += (dmy * pull - s.oy) * 0.04 * dt;
        } else {
            s.ox *= 0.96;
            s.oy *= 0.96;
        }

        const drawX = s.x + s.ox;
        const drawY = s.y + s.oy;

        const twinkle = Math.sin(s.twinklePhase) * 0.35 + 0.65;
        const alpha = s.brightness * twinkle * (0.6 + energy * 0.8);
        const grey = Math.min(255, Math.floor(170 + energy * 70));
        const sz = s.size * (1 + energy * 0.4);

        ctx.beginPath();
        ctx.arc(drawX, drawY, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${grey},${grey},${Math.min(255, grey + 10)},${alpha})`;
        ctx.fill();

        // Occasional bright flash on big stars with music
        if (sz > 1.5 && energy > 0.3 && twinkle > 0.85) {
            ctx.shadowBlur = 8 + energy * 10;
            ctx.shadowColor = `rgba(${grey},${grey},${grey},0.6)`;
            ctx.beginPath();
            ctx.arc(drawX, drawY, sz * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

function drawSparkles(energy, timeS) {
    for (const s of sparkleStars) {
        s.twinklePhase += s.twinkleSpeed;
        const twinkle = Math.pow(Math.abs(Math.sin(s.twinklePhase)), 3);  // sharp peaks
        const intensity = twinkle * s.brightness * (0.5 + energy * 1.5);

        if (intensity < 0.05) continue;

        const size = s.size * intensity * (1 + energy * 0.8);
        const grey = Math.min(255, Math.floor(200 + energy * 55));
        const alpha = Math.min(1, intensity);

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation + timeS * 0.1);

        // Glow circle
        const glowR = size * 1.5;
        const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
        gg.addColorStop(0,   `rgba(${grey},${grey},${Math.min(255, grey + 10)},${alpha * 0.6})`);
        gg.addColorStop(0.4, `rgba(${grey},${grey},${grey},${alpha * 0.15})`);
        gg.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = gg;
        ctx.fillRect(-glowR, -glowR, glowR * 2, glowR * 2);

        // 4-point cross rays
        ctx.strokeStyle = `rgba(${grey},${grey},${Math.min(255, grey + 10)},${alpha * 0.9})`;
        ctx.lineWidth = 1 + intensity;
        ctx.shadowBlur = 8 + energy * 15;
        ctx.shadowColor = `rgba(${grey},${grey},${grey},${alpha})`;

        // Vertical ray
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(0, size);
        ctx.stroke();

        // Horizontal ray
        ctx.beginPath();
        ctx.moveTo(-size, 0);
        ctx.lineTo(size, 0);
        ctx.stroke();

        // Diagonal rays (shorter)
        const diagSize = size * 0.45;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-diagSize, -diagSize);
        ctx.lineTo(diagSize, diagSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(diagSize, -diagSize);
        ctx.lineTo(-diagSize, diagSize);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// ── Outer nebula / volumetric clouds — large diffused glow across screen ──
function drawOuterNebula(cx, cy, energy, timeS) {
    const bu = baseUnit();
    const nebulaPositions = [
        { angle: timeS * 0.05 + 0.8,  dist: 0.42, size: 0.28, bright: 0.03 },
        { angle: timeS * 0.04 + 2.5,  dist: 0.50, size: 0.24, bright: 0.025 },
        { angle: timeS * 0.03 + 4.2,  dist: 0.38, size: 0.30, bright: 0.022 },
        { angle: timeS * 0.06 + 5.5,  dist: 0.35, size: 0.20, bright: 0.035 },
        { angle: timeS * 0.035 + 1.2, dist: 0.55, size: 0.22, bright: 0.018 },
        { angle: timeS * 0.045 + 3.8, dist: 0.48, size: 0.26, bright: 0.02 },
        { angle: timeS * 0.025 + 0.3, dist: 0.58, size: 0.18, bright: 0.028 },
        { angle: timeS * 0.055 + 5.0, dist: 0.32, size: 0.25, bright: 0.024 },
    ];

    for (const nb of nebulaPositions) {
        const x = cx + Math.cos(nb.angle) * bu * nb.dist;
        const y = cy + Math.sin(nb.angle) * bu * nb.dist;
        const size = bu * nb.size * (1 + energy * 0.4);
        const alpha = nb.bright + energy * 0.04;
        const pulse = Math.sin(timeS * 2.2 + nb.angle * 3) * 0.5 + 0.5;
        const grey = Math.min(255, Math.floor(90 + energy * 100 + pulse * 45));

        const g = ctx.createRadialGradient(x, y, 0, x, y, size);
        g.addColorStop(0,   `rgba(${grey},${Math.floor(grey * 0.95)},${Math.floor(grey * 0.9)},${alpha})`);
        g.addColorStop(0.25, `rgba(${Math.floor(grey * 0.65)},${Math.floor(grey * 0.62)},${Math.floor(grey * 0.68)},${alpha * 0.55})`);
        g.addColorStop(0.6, `rgba(${Math.floor(grey * 0.3)},${Math.floor(grey * 0.28)},${Math.floor(grey * 0.32)},${alpha * 0.18})`);
        g.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }
}

// ══════════════════════════════════════
//  MAIN ANIMATION LOOP
// ══════════════════════════════════════

let lastTime = performance.now();
let galaxyRotation = 0;
let smoothEnergy = 0;

// Banda de frecuencia helpers
function getBassEnergy() {
    if (!dataArray) return 0;
    let sum = 0;
    const bassEnd = Math.floor(bufferLength * 0.05);
    for (let i = 0; i < bassEnd; i++) sum += dataArray[i];
    return sum / (bassEnd * 255);
}

function getMidEnergy() {
    if (!dataArray) return 0;
    let sum = 0;
    const start = Math.floor(bufferLength * 0.05);
    const end = Math.floor(bufferLength * 0.3);
    for (let i = start; i < end; i++) sum += dataArray[i];
    return sum / ((end - start) * 255);
}

function getHighEnergy() {
    if (!dataArray) return 0;
    let sum = 0;
    const start = Math.floor(bufferLength * 0.3);
    const end = Math.floor(bufferLength * 0.7);
    for (let i = start; i < end; i++) sum += dataArray[i];
    return sum / ((end - start) * 255);
}

function animate(timestamp) {
    requestAnimationFrame(animate);

    const now = timestamp || performance.now();
    const dt  = Math.min((now - lastTime) / 16.667, 3);
    lastTime  = now;

    const w  = W(), h = H();
    const cx = w / 2, cy = h / 2;
    const timeS = now * 0.001;

    // ── No audio: serene galaxy ──
    let energy = 0, bass = 0, mid = 0, high = 0;

    if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        energy = average / 255;
        bass = getBassEnergy();
        mid = getMidEnergy();
        high = getHighEnergy();
    }

    // Smooth energy for rotation (avoid jitter)
    smoothEnergy += (energy - smoothEnergy) * 0.08 * dt;

    // Galaxy rotation — base speed + strong music acceleration
    const rotSpeed = 0.0004 + smoothEnergy * 0.004 + bass * 0.006;
    galaxyRotation += rotSpeed * dt;

    // ── Clear with deep space background ──
    // Subtle background shift with energy
    const bgR = Math.floor(2 + energy * 6);
    const bgG = Math.floor(0 + energy * 3);
    const bgB = Math.floor(8 + energy * 10);
    ctx.fillStyle = `rgba(${bgR},${bgG},${bgB},0.28)`;
    ctx.fillRect(0, 0, w, h);

    // ── Layer 1: Background stars (with mouse follow) ──
    drawBackgroundStars(energy, timeS, dt);

    // ── Layer 2: Outer nebula / volumetric clouds ──
    drawOuterNebula(cx, cy, energy, timeS);

    // ── Layer 3: Nebula clouds along arms ──
    drawNebulae(cx, cy, energy, timeS, galaxyRotation);

    // ── Layer 4: Dust lanes (dark areas) ──
    drawDustLanes(cx, cy, energy, galaxyRotation);

    // ── Layer 5: Spiral arm particles (with mouse follow) ──
    drawSpiralArms(cx, cy, energy, timeS, galaxyRotation, dt);

    // ── Layer 6: Bright core ──
    drawCore(cx, cy, energy, timeS);

    // ── Layer 7: Sparkle stars on top ──
    drawSparkles(energy, timeS);

    // ── Layer 8: Softer vignette — don't cut the edges too dark ──
    const vigSize = Math.max(w, h) * 0.9;
    const vig = ctx.createRadialGradient(cx, cy, vigSize * 0.4, cx, cy, vigSize);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(0.75, "rgba(0,0,0,0.08)");
    vig.addColorStop(1, `rgba(0,0,0,${0.3 - energy * 0.1})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
}

animate(performance.now());

// ══════════════════════════════════════
//  AUDIO CONTROLS
// ══════════════════════════════════════

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
}

btnPlay.addEventListener("click", () => {
    if (audio.paused) { audio.play(); btnPlay.textContent = "⏸"; }
    else { audio.pause(); btnPlay.textContent = "▶"; }
});

audio.addEventListener("timeupdate", () => {
    if (!isNaN(audio.duration)) {
        seekBar.max = audio.duration;
        seekBar.value = audio.currentTime;
        timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    }
});

seekBar.addEventListener("input", () => { audio.currentTime = seekBar.value; });
volBar.addEventListener("input", () => {
    audio.volume = volBar.value;
    volIcon.textContent = volBar.value == 0 ? "🔇" : "🔊";
});
volIcon.addEventListener("click", () => {
    audio.muted = !audio.muted;
    volIcon.textContent = audio.muted ? "🔇" : "🔊";
});

audio.addEventListener("play",  () => btnPlay.textContent = "⏸");
audio.addEventListener("pause", () => btnPlay.textContent = "▶");
audio.addEventListener("ended", () => {
    btnPlay.textContent = "▶";
    seekBar.value = 0;
    timeDisplay.textContent = "0:00 / 0:00";
});