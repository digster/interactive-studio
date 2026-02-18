// Particle System — Interactive Studio Example
// Canvas-based animation with mouse attraction and dynamic controls

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// --- State ---
let particles = [];
let paused = false;
let mouse = { x: -1000, y: -1000 };
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

// --- Settings ---
const settings = {
  get particleCount() { return parseInt(document.getElementById('particleCount').value); },
  get speed() { return parseInt(document.getElementById('speed').value) / 10; },
  get connectRange() { return parseInt(document.getElementById('connectRange').value); },
  get mouseForce() { return parseInt(document.getElementById('mouseForce').value) / 10; },
};

// --- Particle class ---
class Particle {
  constructor(x, y) {
    this.x = x ?? Math.random() * canvas.width;
    this.y = y ?? Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.radius = Math.random() * 2 + 1;
    this.hue = Math.random() * 60 + 220; // blue-purple range
    this.saturation = 70 + Math.random() * 30;
    this.lightness = 55 + Math.random() * 20;
  }

  update(speed, mouseForce) {
    // Mouse attraction
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 200 && dist > 1) {
      const force = mouseForce * (1 - dist / 200);
      this.vx += (dx / dist) * force * 0.3;
      this.vy += (dy / dist) * force * 0.3;
    }

    // Apply velocity with damping
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.x += this.vx * speed;
    this.y += this.vy * speed;

    // Edge wrapping
    if (this.x < 0) this.x = canvas.width;
    if (this.x > canvas.width) this.x = 0;
    if (this.y < 0) this.y = canvas.height;
    if (this.y > canvas.height) this.y = 0;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, 0.9)`;
    ctx.fill();
  }
}

// --- Drawing ---
function drawConnections(range) {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < range) {
        const alpha = (1 - dist / range) * 0.35;
        const hue = (particles[i].hue + particles[j].hue) / 2;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// --- Particle management ---
function syncParticleCount(target) {
  while (particles.length < target) {
    particles.push(new Particle());
  }
  if (particles.length > target) {
    particles.length = target;
  }
}

function resetParticles() {
  particles = [];
  syncParticleCount(settings.particleCount);
  console.log(`[Particles] Reset — created ${particles.length} particles`);
}

// --- Animation loop ---
function animate(now) {
  requestAnimationFrame(animate);
  if (paused) return;

  // FPS counter
  frameCount++;
  if (now - lastTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastTime = now;
    document.getElementById('stats').textContent =
      `FPS: ${fps} | Particles: ${particles.length}`;
  }

  // Sync particle count from slider
  syncParticleCount(settings.particleCount);

  // Clear with fade trail
  ctx.fillStyle = 'rgba(10, 10, 26, 0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Update and draw
  const speed = settings.speed;
  const mouseForce = settings.mouseForce;
  const range = settings.connectRange;

  for (const p of particles) {
    p.update(speed, mouseForce);
    p.draw();
  }

  drawConnections(range);
}

// --- Controls ---
function setupControls() {
  const sliders = ['particleCount', 'speed', 'connectRange', 'mouseForce'];

  for (const id of sliders) {
    const input = document.getElementById(id);
    const display = document.getElementById(id + 'Value');
    input.addEventListener('input', () => {
      let val = input.value;
      if (id === 'speed') val = (parseInt(val) / 10).toFixed(1);
      if (id === 'mouseForce') val = (parseInt(val) / 10).toFixed(1);
      display.textContent = val;
    });
  }

  document.getElementById('pauseBtn').addEventListener('click', () => {
    paused = !paused;
    const btn = document.getElementById('pauseBtn');
    btn.textContent = paused ? 'Play' : 'Pause';
    btn.classList.toggle('active', paused);
    console.log(`[Particles] ${paused ? 'Paused' : 'Resumed'}`);
  });

  document.getElementById('resetBtn').addEventListener('click', resetParticles);
}

// --- Events ---
canvas.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

canvas.addEventListener('mouseleave', () => {
  mouse.x = -1000;
  mouse.y = -1000;
});

window.addEventListener('resize', resizeCanvas);

// --- Init ---
resizeCanvas();
setupControls();
resetParticles();
requestAnimationFrame(animate);

console.log('[Particles] Particle system initialized');
console.log('[Particles] Move your mouse over the canvas to attract particles');
