// ============================================================
// STICKFALL VFX, Particles & Combat Text Engine
// ============================================================

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.damageNumbers = [];
    this.shockwaves = [];
    this.trails = [];
    this.clashFlashes = [];
  }

  // Spawn anime sword clash flash & directional sparks for parry/deflect
  spawnDeflectClash(x, y, facing, isPerfect = false) {
    const sparkColor = isPerfect ? '#ffd700' : '#ffffff';
    const coreColor = isPerfect ? '#ffffff' : '#00e5ff';
    const streakCount = isPerfect ? 32 : 20;

    // 1. Directional shower of high-speed steel sparks spraying away from defender
    for (let i = 0; i < streakCount; i++) {
      const baseAngle = facing > 0 ? 0 : Math.PI;
      const angle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.75;
      const speed = (isPerfect ? 560 : 400) * (0.35 + Math.random() * 0.85);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        gravity: 340,
        drag: 0.94,
        size: isPerfect ? 3.5 + Math.random() * 2.5 : 2.2 + Math.random() * 2.0,
        color: Math.random() > 0.35 ? sparkColor : coreColor,
        life: 1.0,
        maxLife: 0.22 + Math.random() * 0.2,
      });
    }

    // 2. Anime Cross-Clash Flash Star (sharp X cross blades)
    this.clashFlashes.push({
      x,
      y,
      size: isPerfect ? 80 : 54,
      color: isPerfect ? '#ffd700' : '#ffffff',
      coreColor: '#ffffff',
      life: 1.0,
      maxLife: isPerfect ? 0.26 : 0.18,
      rotation: (Math.random() - 0.5) * 0.4,
    });

    // 3. Shockwave
    this.spawnShockwave(x, y, isPerfect ? '#ffd700' : '#ffffff', isPerfect ? 115 : 75);
  }

  // Spawn spark burst when blade strikes
  spawnHitSparks(x, y, color = '#ffdd44', count = 16, isCrit = false) {
    const burstCount = isCrit ? count * 1.8 : count;
    for (let i = 0; i < burstCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (isCrit ? 350 : 220) * (0.3 + Math.random() * 0.9);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        gravity: 450,
        drag: 0.96,
        size: isCrit ? 3.5 + Math.random() * 3 : 2 + Math.random() * 2.5,
        color: isCrit ? (Math.random() > 0.5 ? '#ff3344' : '#ffaa00') : color,
        life: 1.0,
        maxLife: 0.25 + Math.random() * 0.25,
      });
    }
  }

  // Spawn dust puff on landing/jump
  spawnDust(x, y, dir = 0, count = 6) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y,
        vx: (dir * 40) + (Math.random() - 0.5) * 50,
        vy: -20 - Math.random() * 40,
        gravity: 60,
        drag: 0.92,
        size: 3 + Math.random() * 3,
        color: 'rgba(160, 160, 180, 0.4)',
        life: 1.0,
        maxLife: 0.3 + Math.random() * 0.2,
      });
    }
  }

  // Spawn friction sparks & dust while sliding down vertical walls
  spawnWallSlideSparks(x, y, wallDir) {
    // 1. Friction spark scraping against stone
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 8,
        vx: -wallDir * (40 + Math.random() * 80),
        vy: -20 + Math.random() * 60,
        gravity: 300,
        drag: 0.92,
        size: 1.8 + Math.random() * 1.5,
        color: Math.random() > 0.4 ? '#ffdd55' : '#ffffff',
        life: 1.0,
        maxLife: 0.15 + Math.random() * 0.15,
      });
    }
    // 2. Grinding stone dust
    if (Math.random() < 0.6) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + Math.random() * 6,
        vx: -wallDir * (20 + Math.random() * 40),
        vy: -10 - Math.random() * 20,
        gravity: 80,
        drag: 0.9,
        size: 2.5 + Math.random() * 2,
        color: 'rgba(180, 190, 210, 0.45)',
        life: 1.0,
        maxLife: 0.25 + Math.random() * 0.15,
      });
    }
  }

  // Spawn explosive kinetic burst on acrobatic wall kick-off
  spawnWallKick(x, y, wallDir, color = '#00e5ff') {
    // 1. Strong directional dust puff blasting off wall
    this.spawnDust(x, y, -wallDir, 10);

    // 2. High-speed kinetic sparks radiating away from wall plant
    for (let i = 0; i < 14; i++) {
      const angle = (wallDir > 0 ? Math.PI : 0) + (Math.random() - 0.5) * Math.PI * 0.85;
      const speed = 220 + Math.random() * 320;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        gravity: 380,
        drag: 0.93,
        size: 2.2 + Math.random() * 2.4,
        color: Math.random() > 0.35 ? color : '#ffffff',
        life: 1.0,
        maxLife: 0.22 + Math.random() * 0.18,
      });
    }

    // 3. Kinetic shockwave ring
    this.spawnShockwave(x, y, color, 65);
  }

  // Spawn expanding shockwave ring (for perfect deflect & heavy impacts)
  spawnShockwave(x, y, color = '#ffd700', maxRadius = 90) {
    this.shockwaves.push({
      x,
      y,
      radius: 12,
      maxRadius,
      color,
      life: 1.0,
      maxLife: 0.38,
      lineWidth: 5.5,
    });
  }

  // Spawn floating combat text (e.g. PERFECT DEFLECT!, COUNTER READY!)
  spawnFloatingText(x, y, text, color = '#00e5ff', scale = 1.35) {
    this.damageNumbers.push({
      x,
      y: y - 16,
      vy: -150,
      text,
      color,
      scale,
      life: 1.0,
      maxLife: 0.85,
    });
  }

  // Spawn floating damage numbers
  spawnDamageNumber(x, y, amount, isCrit = false, isCounter = false) {
    let displayText = `${Math.round(amount)}`;
    let textColor = '#ffdd33';
    let textScale = 1.1;

    if (isCounter) {
      displayText = `💥 COUNTER 2X! ${Math.round(amount)}`;
      textColor = '#ff3344';
      textScale = 1.85;
    } else if (isCrit) {
      displayText = `CRIT ${Math.round(amount)}!`;
      textColor = '#ff4444';
      textScale = 1.55;
    }

    this.damageNumbers.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y - 10,
      vy: isCounter ? -190 : -140,
      text: displayText,
      color: textColor,
      scale: textScale,
      life: 1.0,
      maxLife: isCounter ? 1.0 : 0.75,
    });
  }

  update(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt / p.maxLife;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vx *= p.drag;
      p.vy = (p.vy + p.gravity * dt) * p.drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt / sw.maxLife;
      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      const progress = 1.0 - sw.life;
      sw.radius = 12 + (sw.maxRadius - 12) * Math.sin(progress * Math.PI * 0.5);
    }

    // Update anime clash stars
    for (let i = this.clashFlashes.length - 1; i >= 0; i--) {
      const cf = this.clashFlashes[i];
      cf.life -= dt / cf.maxLife;
      if (cf.life <= 0) {
        this.clashFlashes.splice(i, 1);
      }
    }

    // Update damage numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.life -= dt / dn.maxLife;
      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
        continue;
      }
      dn.vy *= 0.93;
      dn.y += dn.vy * dt;
    }
  }

  draw(ctx) {
    // Draw shockwaves
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, sw.life);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.lineWidth * sw.life;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Anime Cross-Clash Stars (Sharp 4-point razor diamond flares)
    for (const cf of this.clashFlashes) {
      ctx.save();
      ctx.translate(cf.x, cf.y);
      ctx.rotate(cf.rotation);
      const alpha = Math.max(0, cf.life);
      ctx.globalAlpha = alpha;

      const rad = cf.size * (0.3 + 0.7 * Math.sin((1 - cf.life) * Math.PI * 0.5));
      ctx.shadowColor = cf.color;
      ctx.shadowBlur = 20;

      // Vertical tapered blade
      ctx.fillStyle = cf.color;
      ctx.beginPath();
      ctx.moveTo(0, -rad);
      ctx.quadraticCurveTo(0, 0, rad * 0.2, 0);
      ctx.quadraticCurveTo(0, 0, 0, rad);
      ctx.quadraticCurveTo(0, 0, -rad * 0.2, 0);
      ctx.quadraticCurveTo(0, 0, 0, -rad);
      ctx.fill();

      // Horizontal tapered blade
      ctx.beginPath();
      ctx.moveTo(-rad * 1.3, 0);
      ctx.quadraticCurveTo(0, 0, 0, rad * 0.18);
      ctx.quadraticCurveTo(0, 0, rad * 1.3, 0);
      ctx.quadraticCurveTo(0, 0, 0, -rad * 0.18);
      ctx.quadraticCurveTo(0, 0, -rad * 1.3, 0);
      ctx.fill();

      // Pure white central clash glint
      ctx.fillStyle = cf.coreColor;
      ctx.beginPath();
      ctx.arc(0, 0, rad * 0.24, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw damage numbers
    for (const dn of this.damageNumbers) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, dn.life);
      ctx.font = `bold ${Math.round(18 * dn.scale)}px 'Impact', 'Segoe UI Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = dn.color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(dn.text, dn.x, dn.y);
      ctx.restore();
    }
  }
}

const VFX = new ParticleSystem();
