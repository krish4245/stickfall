// ============================================================
// STICKFALL Arena Engine — Moonlit Cathedral
// Authentic hand-crafted fighting arena with invisible organic platforms
// ============================================================

class Arena {
  constructor() {
    this.width = 1600;
    this.height = 900;
    this.minX = 70;
    this.maxX = 1530;
    this.minY = 60;
    this.killY = 880;

    this.name = 'Moonlit Cathedral';
    this.color = '#00d5ff';

    // Pixel-perfect platform geometry calibrated directly against cathedral_arena.jpg (1600x900)
    this.platforms = [
      { name: 'Cathedral Bridge Floor', x: 0, y: 678, w: 1600, h: 28, isSolid: true },
      { name: 'Left Balcony', x: 148, y: 330, w: 318, h: 18, isSolid: false },
      { name: 'Mid-Left Island', x: 335, y: 448, w: 172, h: 18, isSolid: false },
      { name: 'Center Waterfall Island', x: 586, y: 516, w: 296, h: 18, isSolid: false },
      { name: 'Moon Castle Island', x: 890, y: 224, w: 125, h: 18, isSolid: false },
      { name: 'Upper Waterfall Plateau', x: 950, y: 204, w: 390, h: 18, isSolid: false },
      { name: 'Right Colonnade Balcony', x: 1325, y: 411, w: 205, h: 18, isSolid: false },
    ];

    // Load background image
    this.bgImage = new Image();
    this.bgImage.src = 'assets/cathedral_arena.jpg';
    this.bgLoaded = false;
    this.bgImage.onload = () => {
      this.bgLoaded = true;
    };

    // Atmospheric glowing lunar moths
    this.moths = [];
    for (let i = 0; i < 24; i++) {
      this.moths.push({
        x: Math.random() * this.width,
        y: 120 + Math.random() * 600,
        vx: (Math.random() - 0.5) * 25,
        vy: (Math.random() - 0.5) * 18,
        size: 1.8 + Math.random() * 2.8,
        alpha: 0.35 + Math.random() * 0.55,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }

  update(dt) {
    for (const m of this.moths) {
      m.pulse += dt * 3;
      m.x += (m.vx + Math.sin(m.pulse) * 12) * dt;
      m.y += (m.vy + Math.cos(m.pulse * 0.8) * 8) * dt;

      if (m.x < -20) m.x = this.width + 20;
      if (m.x > this.width + 20) m.x = -20;
      if (m.y < 80) m.y = 750;
      if (m.y > 750) m.y = 80;
    }
  }

  drawBackground(ctx, _camera) {
    const w = this.width;
    const h = this.height;

    if (this.bgLoaded && this.bgImage) {
      ctx.drawImage(this.bgImage, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#0b0f1a';
      ctx.fillRect(0, 0, w, h);
    }

    // Atmospheric glowing blue moths
    for (const m of this.moths) {
      const glow = Math.sin(m.pulse) * 0.25 + 0.75;
      ctx.save();
      ctx.fillStyle = 'rgba(180, 230, 255, 0.75)';
      ctx.globalAlpha = m.alpha * glow;
      ctx.shadowColor = '#a8e6ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawPlatforms(_ctx) {
    // Kept invisible for full organic artwork alignment
  }
}
