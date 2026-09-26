// ============================================================
// STICKFALL CPU Opponent & Training Dummy AI
// ============================================================

class BotController {
  constructor(stickman, mode = 'training') {
    this.bot = stickman;
    this.mode = mode; // 'training' or 'fighter'
    this.decisionTimer = 0;
    this.attackCooldown = 0;
    this.respawnTimer = 0;
  }

  setMode(mode) {
    this.mode = mode;
  }

  update(dt, target, arena) {
    if (this.bot.isDead) {
      this.respawnTimer += dt;
      if (this.respawnTimer >= 2.0) {
        this.respawnTimer = 0;
        this.bot.reset(1050, 678);
      }
      return {};
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    if (this.mode === 'training') {
      // Training mode: Face player, don't move or attack
      return {
        left: false,
        right: false,
        jump: false,
        down: false,
        aimX: target.x,
        aimY: target.y - 35,
      };
    }

    // Fighter AI Mode
    const dx = target.x - this.bot.x;
    const dy = target.y - this.bot.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let left = false;
    let right = false;
    let jump = false;
    let down = false;

    // Spacing
    if (dist > 90) {
      if (dx > 0) right = true;
      else left = true;
    } else if (dist < 40) {
      // Too close, slight step back
      if (dx > 0) left = true;
      else right = true;
    }

    // Platform traversal: target is above, jump
    if (dy < -60 && this.bot.onFloor && Math.random() < 0.05) {
      jump = true;
    }

    // Target is below, drop through platform
    if (dy > 80 && this.bot.onFloor && Math.random() < 0.04) {
      down = true;
    }

    // Off-stage recovery (rescue jump if falling off)
    if (this.bot.y > 700 && this.bot.vy > 0) {
      if (this.bot.canDoubleJump) {
        jump = true;
      }
      // Steer back to center
      if (this.bot.x < 400) right = true;
      else if (this.bot.x > 1200) left = true;
    }

    // Acrobatic Wall Jump for CPU Bot
    if (this.bot.isWallSliding) {
      const kickDir = -this.bot.wallDir;
      if ((kickDir > 0 && target.x > this.bot.x) || (kickDir < 0 && target.x < this.bot.x) || Math.random() < 0.3) {
        jump = true;
      }
    }

    // Defensive Parry (deflect player's incoming strikes)
    if (target.isAttacking && dist < 90 && !this.bot.isParrying && Math.random() < 0.16) {
      this.bot.parry();
    }

    // Attack when in range
    if (dist < 85 && this.attackCooldown <= 0 && Math.abs(dy) < 50 && !this.bot.isParrying) {
      this.bot.attack();
      this.attackCooldown = 0.55 + Math.random() * 0.4;
    }

    return {
      left,
      right,
      jump,
      down,
      aimX: target.x,
      aimY: target.y - 35,
    };
  }
}
