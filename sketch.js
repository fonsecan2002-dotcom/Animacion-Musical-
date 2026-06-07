const audioFile   = document.getElementById("audioFile");
const audio       = document.getElementById("audio");
const canvas      = document.getElementById("canvas");
const ctx         = canvas.getContext("2d");
const btnPlay     = document.getElementById("btnPlay");
const seekBar     = document.getElementById("seekBar");
const volBar      = document.getElementById("volBar");
const volIcon     = document.getElementById("volIcon");
const timeDisplay = document.getElementById("timeDisplay");

// ── Canvas ──
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
});

// ── Mouse ──
let mouseX = window.innerWidth  / 2;
let mouseY = window.innerHeight / 2;

window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// ── Estrellas ──
const starColors = [
    "255,255,255",
    "220,225,235",
    "200,200,210",
    "240,240,255",
    "180,190,205",
];

const stars = [];
for (let i = 0; i < 600; i++) {
    stars.push({
        x:       Math.random() * canvas.width,
        y:       Math.random() * canvas.height,
        size:    Math.random() * 2.2 + 0.3,
        color:   starColors[Math.floor(Math.random() * starColors.length)],
        twinkle: Math.random() * Math.PI * 2,
        speed:   Math.random() * 0.02 + 0.008,
    });
}

// ── Partículas ──
const particles = [];
const PARTICLE_COUNT = 120;

for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
        x:      Math.random() * canvas.width,
        y:      Math.random() * canvas.height,
        baseX:  Math.random() * canvas.width,
        baseY:  Math.random() * canvas.height,
        size:   Math.random() * 3 + 1,
        color:  starColors[Math.floor(Math.random() * starColors.length)],
        phase:  Math.random() * Math.PI * 2,
        speed:  Math.random() * 0.04 + 0.02,
        orbitR: Math.random() * 40 + 10,
    });
}

// ── Estado global del audio ──
let audioContext = null;
let analyser     = null;
let dataArray    = null;
let bufferLength = null;
let animating    = false;

// ── Cargar archivo ──
audioFile.addEventListener("change", function (e) {

    const file = e.target.files[0];
    if (!file) return;

    if (!audioContext) {
        audioContext = new AudioContext();
    }
    audioContext.resume();

    audio.pause();
    audio.src = URL.createObjectURL(file);

    const source  = audioContext.createMediaElementSource(audio);
    analyser      = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    bufferLength = analyser.frequencyBinCount;
    dataArray    = new Uint8Array(bufferLength);

    audio.play().catch(err => console.error("Error play:", err));
});

// ── Anillo ──
function drawGalaxyRing(baseRadius, multiplier, average) {

    const points     = 1000;
    const usableBins = Math.floor(bufferLength * 0.5);

    ctx.beginPath();

    for (let i = 0; i <= points; i++) {

        const angle =
            (i / points) * Math.PI * 2 +
            Date.now() * 0.0002;

        const half   = points / 2;
        const binPos = i < half
            ? (i / half) * usableBins
            : ((points - i) / half) * usableBins;

        const idx0 = Math.floor(binPos) % bufferLength;
        const idx1 = (idx0 + 1) % bufferLength;
        const idx2 = (idx0 + 2) % bufferLength;
        const frac  = binPos - Math.floor(binPos);

        const frequency =
            (
                dataArray[idx0] * (1 - frac) +
                dataArray[idx1] * frac +
                dataArray[idx2] * 0.15
            ) / 1.15
            + 35 * Math.sin(Date.now() * 0.006 + i * 0.25);

        const waveX = canvas.width  / 2 + Math.cos(angle) * baseRadius;
        const waveY = canvas.height / 2 + Math.sin(angle) * baseRadius;

        const distanceToMouse = Math.sqrt(
            (mouseX - waveX) ** 2 +
            (mouseY - waveY) ** 2
        );

        const mouseEffect = Math.max(0, 40 - distanceToMouse * 0.2);

        const wave1 = 30 * Math.sin(i * 0.12 + Date.now() * 0.004);
        const wave2 = 15 * Math.cos(i * 0.25 + Date.now() * 0.003);

        const radius =
            baseRadius +
            wave1 +
            wave2 +
            frequency * multiplier * 0.6 +
            mouseEffect;

        const x = canvas.width  / 2 + Math.cos(angle) * radius;
        const y = canvas.height / 2 + Math.sin(angle) * radius;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.closePath();

    const pulse      = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
    const lightness  = 75 + pulse * 18;
    const saturation = 15 + pulse * 20;
    const hue        = 200 + (average * 0.3) % 40;

    ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    ctx.shadowBlur  = 35;
    ctx.shadowColor = `hsl(${hue}, 30%, 88%)`;
    ctx.stroke();
}

// ── Loop principal ──
function animate() {

    requestAnimationFrame(animate);

    // Sin audio: solo fondo, estrellas y partículas suaves
    if (!analyser || !dataArray) {

        ctx.fillStyle = "rgba(5,0,18,0.18)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (const star of stars) {
            star.twinkle += star.speed;
            const alpha = 0.35 + 0.55 * Math.abs(Math.sin(star.twinkle));
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle   = `rgba(${star.color}, ${alpha})`;
            ctx.shadowBlur  = star.size > 1.5 ? 6 : 0;
            ctx.shadowColor = `rgba(${star.color}, 0.8)`;
            ctx.fill();
        }

        for (const p of particles) {
            p.phase += p.speed;
            const dx   = mouseX - p.x;
            const dy   = mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 160) {
                p.x += dx * 0.04;
                p.y += dy * 0.04;
            } else {
                p.x += (p.baseX + Math.cos(p.phase) * p.orbitR - p.x) * 0.03;
                p.y += (p.baseY + Math.sin(p.phase) * p.orbitR - p.y) * 0.03;
            }
            const alpha = 0.2 + 0.3 * Math.abs(Math.sin(p.phase));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle   = `rgba(${p.color}, ${alpha})`;
            ctx.shadowBlur  = 4;
            ctx.shadowColor = `rgba(${p.color}, 0.6)`;
            ctx.fill();
        }

        ctx.shadowBlur = 0;
        return;
    }

    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = "rgba(5,0,18,0.18)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Nebulosa
    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;
    const t  = Date.now() * 0.0004;

    const nebulaColors = [
        [180, 190, 210],
        [160, 170, 200],
        [200, 200, 220],
        [140, 155, 185],
    ];

    for (let n = 0; n < nebulaColors.length; n++) {
        const [r, g, b] = nebulaColors[n];
        const offsetX   = Math.cos(t + n * 1.57) * 80;
        const offsetY   = Math.sin(t + n * 1.57) * 60;
        const grad      = ctx.createRadialGradient(
            cx + offsetX, cy + offsetY, 0,
            cx + offsetX, cy + offsetY, 320
        );
        grad.addColorStop(0,   `rgba(${r},${g},${b},0.07)`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},0.03)`);
        grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Estrellas
    for (const star of stars) {
        star.twinkle += star.speed;
        const alpha = 0.35 + 0.55 * Math.abs(Math.sin(star.twinkle));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle   = `rgba(${star.color}, ${alpha})`;
        ctx.shadowBlur  = star.size > 1.5 ? 6 : 0;
        ctx.shadowColor = `rgba(${star.color}, 0.8)`;
        ctx.fill();
    }
    ctx.shadowBlur = 0;

    const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
    const energy  = average / 255;

    // Partículas con música
    for (const p of particles) {
        p.phase += p.speed;
        const dx   = mouseX - p.x;
        const dy   = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160) {
            p.x += dx * 0.04;
            p.y += dy * 0.04;
        } else {
            const pulse = 1 + energy * 3;
            p.x += (p.baseX + Math.cos(p.phase) * p.orbitR * pulse - p.x) * 0.03;
            p.y += (p.baseY + Math.sin(p.phase) * p.orbitR * pulse - p.y) * 0.03;
        }
        const brightness = 0.3 + energy * 2.5 * Math.abs(Math.sin(p.phase * 2));
        const alpha      = Math.min(1, brightness);
        const glow       = 4 + energy * 20;
        const size       = p.size + energy * 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle   = `rgba(${p.color}, ${alpha})`;
        ctx.shadowBlur  = glow;
        ctx.shadowColor = `rgba(${p.color}, 0.9)`;
        ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Anillos
    ctx.globalAlpha = 1;
    ctx.lineWidth   = 4;
    drawGalaxyRing(260, 2, average);

    ctx.globalAlpha = 0.5;
    ctx.lineWidth   = 8;
    drawGalaxyRing(220, 1.6, average);

    ctx.globalAlpha = 0.25;
    ctx.lineWidth   = 14;
    drawGalaxyRing(180, 1.2, average);

    ctx.globalAlpha = 1;
}

// Arrancar loop desde el inicio
animating = true;
animate();

// ── Controles ──
function formatTime(s) {
    const m   = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
}

btnPlay.addEventListener("click", () => {
    if (audio.paused) {
        audio.play();
        btnPlay.textContent = "⏸";
    } else {
        audio.pause();
        btnPlay.textContent = "▶";
    }
});

audio.addEventListener("timeupdate", () => {
    if (!isNaN(audio.duration)) {
        seekBar.max   = audio.duration;
        seekBar.value = audio.currentTime;
        timeDisplay.textContent =
            `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    }
});

seekBar.addEventListener("input", () => {
    audio.currentTime = seekBar.value;
});

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
    btnPlay.textContent     = "▶";
    seekBar.value           = 0;
    timeDisplay.textContent = "0:00 / 0:00";
});