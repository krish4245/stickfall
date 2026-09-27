// ============================================================
// STICKFALL Arena Engine — Cathedral Arena
// Original background with Hollow Knight chains, lanterns & atmosphere
// ============================================================

class Arena {
  constructor() {
    this.width = 1600;
    this.height = 900;
    this.minX = 70;
    this.maxX = 1530;
    this.minY = 60;
    this.killY = 880;

    this.name = 'Cathedral Arena';
    this.color = '#38bdf8';
    this.time = 0;

    // Platform geometry (1600x900 arena)
    this.platforms = [
      { name: 'Colosseum Arena Floor', x: 0, y: 678, w: 1600, h: 32, isSolid: true },
      { name: 'Left Balcony', x: 148, y: 330, w: 318, h: 22, isSolid: false },
      { name: 'Mid-Left Island', x: 335, y: 448, w: 172, h: 20, isSolid: false },
      { name: 'Center Stage Island', x: 586, y: 516, w: 296, h: 22, isSolid: false },
      { name: 'Ancient Stone Perch', x: 890, y: 224, w: 125, h: 20, isSolid: false },
      { name: 'Upper Bastion Plateau', x: 950, y: 204, w: 390, h: 22, isSolid: false },
      { name: 'Right Colonnade Balcony', x: 1325, y: 411, w: 205, h: 20, isSolid: false },
    ];

    // Original cathedral background
    this.bgImage = new Image();
    this.bgImage.src = 'assets/cathedral_arena.jpg';
    this.bgLoaded = false;
    this.bgImage.onload = () => { this.bgLoaded = true; };

    // Hollow Knight environment overlays — chains & lamps only
    this.lampImage = new Image();
    this.lampImage.src = 'assets/arena_lamp.png';
    this.lampLoaded = false;
    this.lampImage.onload = () => { this.lampLoaded = true; };

    this.chainImage = new Image();
    this.chainImage.src = 'assets/arena_chain.png';
    this.chainLoaded = false;
    this.chainImage.onload = () => { this.chainLoaded = true; };

    // Atmospheric drifting soul spores and cavern motes
    this.motes = [];
    for (let i = 0; i < 35; i++) {
      this.motes.push({
        x: Math.random() * this.width,
        y: 80 + Math.random() * 680,
        vx: (Math.random() - 0.5) * 20,
        vy: -8 - Math.random() * 20,
        size: 1.5 + Math.random() * 3.0,
        alpha: 0.35 + Math.random() * 0.55,
        pulse: Math.random() * Math.PI * 2,
        color: Math.random() > 0.4 ? 'rgba(180, 240, 255, 0.85)' : 'rgba(255, 220, 160, 0.75)',
        glow: Math.random() > 0.4 ? '#38bdf8' : '#fbbf24',
      });
    }

    // Hanging ancient chains positions
    this.chains = [
      { x: 230, y: -20, h: 320, swingOffset: 0.0 },
      { x: 520, y: -50, h: 270, swingOffset: 1.2 },
      { x: 1080, y: -40, h: 290, swingOffset: 2.1 },
      { x: 1370, y: -15, h: 340, swingOffset: 3.5 },
    ];

    // Ornate street lamps positions
    this.lamps = [
      { x: 175, y: 135, w: 32, h: 195 },
      { x: 110, y: 485, w: 34, h: 195 },
      { x: 1470, y: 485, w: 34, h: 195 },
      { x: 1385, y: 215, w: 32, h: 195 },
    ];
  }

  update(dt) {
    this.time += dt;

    for (const m of this.motes) {
      m.pulse += dt * 2.5;
      m.x += (m.vx + Math.sin(m.pulse) * 10) * dt;
      m.y += m.vy * dt;

      if (m.x < -20) m.x = this.width + 20;
      if (m.x > this.width + 20) m.x = -20;
      if (m.y < 50) m.y = 740;
      if (m.y > 750) m.y = 60;
    }
  }

  drawBackground(ctx, _camera) {
    const w = this.width;
    const h = this.height;

    // 1. Original Cathedral Background
    if (this.bgLoaded && this.bgImage) {
      ctx.drawImage(this.bgImage, 0, 0, w, h);
    } else {
      // Fallback dark fill while loading
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Hanging Ancient Iron Chains (with subtle pendulum sway)
    if (this.chainLoaded && this.chainImage) {
      for (const ch of this.chains) {
        ctx.save();
        ctx.translate(ch.x, ch.y);
        const swing = Math.sin(this.time * 1.4 + ch.swingOffset) * 0.025;
        ctx.rotate(swing);
        ctx.globalAlpha = 0.85;
        ctx.drawImage(this.chainImage, -10, 0, 20, ch.h);
        ctx.restore();
      }
    }

    // 3. Ornate Street Lamps with Warm Amber Lantern Flame Glow
    if (this.lampLoaded && this.lampImage) {
      for (const lp of this.lamps) {
        ctx.save();

        // Lantern post
        ctx.globalAlpha = 0.95;
        ctx.drawImage(this.lampImage, lp.x, lp.y, lp.w, lp.h);

        // Warm radial light bloom from lantern glass
        const lanternX = lp.x + lp.w / 2;
        const lanternY = lp.y + 24;
        const flicker = 0.85 + 0.15 * Math.sin(this.time * 7 + lp.x);

        const flameGrad = ctx.createRadialGradient(lanternX, lanternY, 5, lanternX, lanternY, 90 * flicker);
        flameGrad.addColorStop(0, 'rgba(255, 230, 150, 0.75)');
        flameGrad.addColorStop(0.35, 'rgba(255, 160, 40, 0.35)');
        flameGrad.addColorStop(0.75, 'rgba(255, 100, 20, 0.12)');
        flameGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.arc(lanternX, lanternY, 90 * flicker, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // 4. Atmospheric Drifting Soul Spores & Cavern Dust
    for (const m of this.motes) {
      const glow = Math.sin(m.pulse) * 0.25 + 0.75;
      ctx.save();
      ctx.fillStyle = m.color;
      ctx.globalAlpha = m.alpha * glow;
      ctx.shadowColor = m.glow;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawPlatforms(ctx) {
    for (const p of this.platforms) {
      this.drawPlatform(ctx, p);
    }
  }

  drawPlatform(ctx, p) {
    const x = p.x;
    const y = p.y;
    const w = p.w;
    const h = p.h || 22;

    ctx.save();

    // Chiseled Ancient Slate Top Slab
    const slabGrad = ctx.createLinearGradient(x, y, x, y + 14);
    slabGrad.addColorStop(0, '#1c2230');
    slabGrad.addColorStop(0.5, '#121622');
    slabGrad.addColorStop(1, '#090c14');

    ctx.fillStyle = slabGrad;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, 14, 2);
    } else {
      ctx.rect(x, y, w, 14);
    }
    ctx.fill();

    // Top Edge Slate Highlight (pale blue cavern rim)
    ctx.strokeStyle = 'rgba(180, 225, 255, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 1);
    ctx.lineTo(x + w - 2, y + 1);
    ctx.stroke();

    // Subtle Cavern Moss / Lichen Accents
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.18, y + 2);
    ctx.lineTo(x + w * 0.42, y + 2);
    ctx.moveTo(x + w * 0.62, y + 2);
    ctx.lineTo(x + w * 0.84, y + 2);
    ctx.stroke();

    // Underside Crevice Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(x, y + 14, w, 4);

    ctx.restore();
  }
}
