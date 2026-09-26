// ============================================================
// STICKFALL Combat Engine & Hit Manager
// Handles Melee Collisions, Flying Slashes, and Hit Impacts
// ============================================================

class SlashProjectile {
  constructor(x, y, facing, color, glow, owner, isCounter = false) {
    this.x = x;
    this.y = y;
    this.facing = facing; // 1 or -1
    this.isCounter = isCounter;
    this.speed = isCounter ? 1300 : 1100;
    this.radius = isCounter ? 48 : 42;
    this.color = isCounter ? '#ff2244' : (color || '#ff2244');
    this.glow = isCounter ? '#ffd700' : (glow || '#ff3355');
    this.owner = owner;
    this.damage = isCounter ? 96 : 48; // 2x damage if counter!
    this.knockback = isCounter ? 1050 : 720;
    this.life = 1.8;
  }

  update(dt, arena) {
    this.life -= dt;
    this.x += this.facing * this.speed * dt;

    // Trailing particles
    VFX.spawnHitSparks(this.x, this.y, this.color, this.isCounter ? 4 : 2, this.isCounter);

    // Wall collision
    if (this.x < arena.minX || this.x > arena.maxX) {
      this.life = 0;
      VFX.spawnHitSparks(this.x, this.y, this.color, 14, true);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.facing < 0) {
      ctx.scale(-1, 1);
    }

    // Glowing Flying Crescent Slash Arc
    ctx.shadowColor = this.glow;
    ctx.shadowBlur = this.isCounter ? 32 : 24;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.isCounter ? '#ffe066' : '#ffffff';
    ctx.lineWidth = this.isCounter ? 4.5 : 3.5;

    ctx.beginPath();
    // Razor-sharp crescent wave shape
    ctx.moveTo(18, -50);
    ctx.quadraticCurveTo(45, 0, 18, 50);
    ctx.quadraticCurveTo(-15, 0, 18, -50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner bright laser blade edge
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 44, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();

    ctx.restore();
  }
}

class CombatEngine {
  constructor() {
    this.hitstopTimer = 0;
    this.screenShake = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.comboTimeout = 1.8;
    this.projectiles = [];
  }

  spawnSlash(x, y, facing, color, glow, owner, isCounter = false) {
    this.projectiles.push(new SlashProjectile(x, y, facing, color, glow, owner, isCounter));
    Audio.playWhoosh();
  }

  update(dt, arena) {
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt, arena);
      if (proj.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  checkHits(attacker, victim) {
    // 1. Melee Hitbox
    const hitbox = attacker.getAttackHitbox();
    if (hitbox) {
      const victimCenterY = victim.y - 35;
      const dx = hitbox.x - victim.x;
      const dy = hitbox.y - victimCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < hitbox.radius + 28) {
        attacker.attackLanded = true;
        this.resolveHit(attacker, victim, hitbox);
      }
    }

    // 2. Flying Projectile Slashes
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (proj.owner === victim) continue; // Don't hit yourself

      const victimCenterY = victim.y - 35;
      const dx = proj.x - victim.x;
      const dy = proj.y - victimCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < proj.radius + 26) {
        // Projectile hit landed!
        this.resolveProjectileHit(proj, victim);
        this.projectiles.splice(i, 1);
      }
    }
  }

  resolveHit(attacker, victim, hitbox) {
    const hitX = (hitbox.x + victim.x) * 0.5;
    const hitY = (hitbox.y + (victim.y - 35)) * 0.5;

    // === CHECK DEFLECT / PARRY SHIELD ===
    if (victim.isParrying) {
      const isPerfect = victim.parryTimer <= victim.perfectParryWindow;
      const clashX = victim.x + victim.facing * 28;
      const clashY = victim.y - 38;

      // 1. Trigger anime sword clash flash and directional steel sparks!
      VFX.spawnDeflectClash(clashX, clashY, victim.facing, isPerfect);

      // 2. Stickman physical reaction / sword flick
      victim.onDeflectSuccess(isPerfect);

      if (isPerfect) {
        // === PERFECT DEFLECT (JUST GUARD) ===
        Audio.playPerfectParry();

        // Victim takes 0 damage and receives 2x Counter Buff!
        victim.hasCounterBuff = true;
        victim.counterTimer = 3.5;
        victim.isParrying = false;
        victim.playAnim(victim.onFloor ? 'idle' : 'fall');

        // Attacker gets staggered, current attack consumed
        attacker.isAttacking = false;
        attacker.attackLanded = true;
        attacker.hitstunTimer = 0.45;
        attacker.vx = -attacker.facing * 380;
        attacker.playAnim('hit', true);

        // Crisp tactile hitstop (2 frames) & screen shake
        this.hitstopTimer = 0.04;
        this.screenShake = 6;
        VFX.spawnFloatingText(victim.x, victim.y - 70, '⚡ PERFECT DEFLECT!', '#ffd700', 1.6);
        VFX.spawnFloatingText(victim.x, victim.y - 48, '🔥 2X COUNTER READY!', '#ff4444', 1.3);
        return;
      } else {
        // === NORMAL DEFLECT ===
        Audio.playDeflect();
        attacker.attackLanded = true; // Consumes swing hitbox; prevents 60 fps freeze loop!
        attacker.vx = -attacker.facing * 120; // Blade rebound pushback
        this.hitstopTimer = 0; // Seamless flow: zero freeze on normal deflect!
        this.screenShake = 3;
        VFX.spawnFloatingText(victim.x, victim.y - 65, 'DEFLECTED', '#00e5ff', 1.25);
        return;
      }
    }

    // === NORMAL HIT OR 2X COUNTER ATTACK ===
    this.combo++;
    this.comboTimer = this.comboTimeout;

    const isCounter = attacker.hasCounterBuff;
    if (isCounter) {
      attacker.hasCounterBuff = false; // Consumed on landing the counter blow!
    }

    const isCrit = (this.combo >= 3 && this.combo % 3 === 0);
    const multiplier = isCounter ? 2.0 : (isCrit ? 1.6 : 1.0);
    const finalDamage = hitbox.damage * multiplier;
    const finalKnockback = hitbox.knockback * (isCounter ? 1.85 : (isCrit ? 1.4 : 1.0));

    let dirX = victim.x - attacker.x;
    let dirY = (victim.y - 35) - (attacker.y - 35);
    const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
    dirX /= len;
    dirY /= len;

    const kbX = dirX * finalKnockback;
    const kbY = Math.min(-180, dirY * finalKnockback - 140);

    victim.takeDamage(finalDamage, kbX, kbY);

    this.hitstopTimer = isCounter ? 0.13 : (isCrit ? 0.08 : 0.045);
    this.screenShake = isCounter ? 24 : (isCrit ? 14 : 7);

    if (isCounter) {
      VFX.spawnShockwave(hitX, hitY, '#ff3344', 120);
      VFX.spawnHitSparks(hitX, hitY, '#ff3344', 36, true);
    } else {
      VFX.spawnHitSparks(hitX, hitY, attacker.weaponColor, 18, isCrit);
    }

    VFX.spawnDamageNumber(hitX, hitY, finalDamage, isCrit, isCounter);
    Audio.playHit(isCrit || isCounter);
  }

  resolveProjectileHit(proj, victim) {
    // === CHECK DEFLECT ON PROJECTILE ===
    if (victim.isParrying) {
      const isPerfect = victim.parryTimer <= victim.perfectParryWindow;
      const clashX = victim.x + victim.facing * 28;
      const clashY = victim.y - 38;

      VFX.spawnDeflectClash(clashX, clashY, victim.facing, isPerfect);
      victim.onDeflectSuccess(isPerfect);

      if (isPerfect) {
        Audio.playPerfectParry();
        victim.hasCounterBuff = true;
        victim.counterTimer = 3.5;
        victim.isParrying = false;
        victim.playAnim(victim.onFloor ? 'idle' : 'fall');

        this.hitstopTimer = 0.04;
        this.screenShake = 6;
        VFX.spawnFloatingText(victim.x, victim.y - 70, '⚡ PERFECT DEFLECT!', '#ffd700', 1.6);
        VFX.spawnFloatingText(victim.x, victim.y - 48, '🔥 2X COUNTER READY!', '#ff4444', 1.3);
        return;
      } else {
        Audio.playDeflect();
        this.hitstopTimer = 0;
        this.screenShake = 3;
        VFX.spawnFloatingText(victim.x, victim.y - 65, 'DEFLECTED', '#00e5ff', 1.25);
        return;
      }
    }

    this.combo++;
    this.comboTimer = this.comboTimeout;

    const isCounter = proj.isCounter;
    const finalDamage = proj.damage;
    const kbX = proj.facing * proj.knockback;
    const kbY = isCounter ? -320 : -240;

    victim.takeDamage(finalDamage, kbX, kbY);

    this.hitstopTimer = isCounter ? 0.12 : 0.07;
    this.screenShake = isCounter ? 24 : 16;

    if (isCounter) {
      VFX.spawnShockwave(proj.x, proj.y, '#ff3344', 120);
      VFX.spawnHitSparks(proj.x, proj.y, '#ff3344', 36, true);
    } else {
      VFX.spawnHitSparks(proj.x, proj.y, proj.color, 24, true);
    }

    VFX.spawnDamageNumber(proj.x, proj.y - 20, finalDamage, true, isCounter);
    Audio.playHit(true);
  }

  drawProjectiles(ctx) {
    for (const proj of this.projectiles) {
      proj.draw(ctx);
    }
  }
}

const Combat = new CombatEngine();
