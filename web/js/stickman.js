// ============================================================
// STICKFALL Sprite-Driven Stickman Fighter Entity
// 128x64 Precision Frame Alignment — ZERO Blinking / Jitter
// ============================================================

class Stickman {
  constructor(options = {}) {
    this.name = options.name || 'Player 1';
    this.isBot = options.isBot || false;
    this.variant = options.variant || 'shadow';
    this.x = options.x || 450;
    this.y = options.y || 678;
    this.vx = 0;
    this.vy = 0;
    this.facing = options.facing || 1; // 1 = right, -1 = left

    // Physics Stats
    this.maxHp = options.maxHp || 100;
    this.hp = this.maxHp;
    this.speed = 460;
    this.accel = 2800;
    this.friction = 2400;
    this.gravity = 1450;
    this.jumpForce = 580;
    this.doubleJumpForce = 520;
    this.canDoubleJump = true;
    this.onFloor = false;
    this.dropThrough = false;

    // Sprite Alignment Constants (128x64 frame grid)
    this.fw = 128;
    this.fh = 64;
    this.drawScale = 1.6;
    this.pivotX = 54 * this.drawScale; // Center of stickman torso
    this.pivotY = 63 * this.drawScale; // Soles of the feet

    // Animation Controller
    this.animName = 'idle';
    this.animFrame = 0;
    this.animTimer = 0;

    // Combat & Moveset
    this.comboStep = 1; // 1 -> 2 -> 3 -> 4
    this.comboBuffer = false;
    this.isAttacking = false;
    this.isDashing = false;
    this.attackLanded = false;
    this.dashCooldown = 0;
    this.hitstunTimer = 0;
    this.isDead = false;
    this.flashTimer = 0;

    // Deflect & Parry Shield Mechanics
    this.isParrying = false;
    this.parryTimer = 0;
    this.parryDuration = 0.38;      // Total guard stance duration
    this.perfectParryWindow = 0.15; // Just guard / perfect deflect threshold (0-0.15s)
    this.parryCooldown = 0;
    this.shieldPulse = 0;

    // Counter-Attack Buff (2x Damage on Next Hit)
    this.hasCounterBuff = false;
    this.counterTimer = 0;
    this.counterFlame = 0;

    // Death & Defeat State (Ground struggle to lift head then dies)
    this.deathTimer = 0;
    this.deathFloorTimer = 0;
    this.deathLanded = false;
    this.headLiftAngle = 0;
    this.struggleDone = false;
    this.eyeExtinguished = false;
    this.slashCooldown = 0;

    // Wall Mechanics & Acrobatics
    this.isWallSliding = false;
    this.wallDir = 0;              // -1 = left wall, 1 = right wall
    this.isWallJumping = false;
    this.wallJumpTimer = 0;
    this.wallJumpDuration = 0.40;  // 0.40s 360-degree somersault flip
    this.flipAngle = 0;
    this.wallSlideSparkTimer = 0;

    // Dash / movement phantom after-images
    this.shadows = [];

    // Weapon/Eye accent
    this.eyeColor = options.eyeColor || (this.variant === 'shadow' ? '#ff3355' : '#ffffff');
    this.weaponColor = options.weaponColor || '#ff2244';
  }

  playAnim(name, forceRestart = false) {
    if (this.animName === name && !forceRestart) return;

    const def = ANIMATION_DEFS[name];
    if (!def) return;

    this.animName = name;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  takeDamage(amount, knockbackX, knockbackY) {
    if (this.isDead || this.isDashing) return;

    this.isParrying = false;
    this.isWallSliding = false;
    this.isWallJumping = false;
    this.flipAngle = 0;
    this.hp = Math.max(0, this.hp - amount);
    this.vx = knockbackX;
    this.vy = knockbackY;
    this.isAttacking = false;
    this.isDashing = false;

    const hitAnims = ['hit', 'hit2', 'hit3'];
    const chosenHit = hitAnims[Math.floor(Math.random() * hitAnims.length)];
    this.playAnim(chosenHit, true);
    this.hitstunTimer = 0.22;
    this.flashTimer = 0.18;

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.isParrying = false;
    this.isWallSliding = false;
    this.isWallJumping = false;
    this.flipAngle = 0;
    this.hasCounterBuff = false;
    this.isAttacking = false;
    this.isDashing = false;
    this.deathTimer = 0;
    this.deathFloorTimer = 0;
    this.deathLanded = false;
    this.headLiftAngle = 0;
    this.struggleDone = false;
    this.eyeExtinguished = false;

    // Dramatic defeat launch into air backwards
    this.vx = -this.facing * 380;
    this.vy = -540;

    this.playAnim('hit3', true);
    Audio.playDeath();

    if (typeof onFighterDefeated === 'function') {
      onFighterDefeated(this);
    }
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp;
    this.isDead = false;
    this.deathTimer = 0;
    this.deathFloorTimer = 0;
    this.deathLanded = false;
    this.headLiftAngle = 0;
    this.struggleDone = false;
    this.eyeExtinguished = false;
    this.slashCooldown = 0;
    this.isAttacking = false;
    this.isDashing = false;
    this.isParrying = false;
    this.parryTimer = 0;
    this.parryCooldown = 0;
    this.hasCounterBuff = false;
    this.counterTimer = 0;
    this.comboStep = 1;
    this.hitstunTimer = 0;
    this.isWallSliding = false;
    this.wallDir = 0;
    this.isWallJumping = false;
    this.wallJumpTimer = 0;
    this.flipAngle = 0;
    this.wallSlideSparkTimer = 0;
    this.shadows = [];
    this.playAnim('idle', true);
  }

  parry() {
    if (this.isDead || this.isDashing || this.hitstunTimer > 0 || this.parryCooldown > 0) return;
    if (this.isParrying) return;

    this.isParrying = true;
    this.parryTimer = 0;
    this.shieldPulse = 0;
    this.isAttacking = false;
    this.comboBuffer = false;
    this.vx *= 0.2; // Root stance on ground

    // Physical martial arts stickman guard pose
    this.playAnim('deflect', true);

    // Subtle defensive whoosh
    Audio.playWhoosh();
  }

  onDeflectSuccess(isPerfect) {
    // Physical stickman martial arts recoil & blade contact flash
    this.flashTimer = 0.12;
    this.vx = -this.facing * (isPerfect ? 140 : 75);
    this.shieldPulse = 0;
  }

  attack() {
    if (this.isDead || this.hitstunTimer > 0) return;

    // Attacking cancels parry stance
    this.isParrying = false;

    if (this.isAttacking) {
      this.comboBuffer = true;
      return;
    }

    this.isAttacking = true;
    this.attackLanded = false;
    const anim = `attack${this.comboStep}`;
    this.playAnim(anim, true);
    Audio.playWhoosh();
  }

  dash() {
    if (this.isDead || this.isDashing || this.hitstunTimer > 0 || this.dashCooldown > 0) return;

    this.isParrying = false;
    this.isWallSliding = false;
    this.isWallJumping = false;
    this.flipAngle = 0;
    this.isDashing = true;
    this.isAttacking = false;
    this.dashCooldown = 0.7;
    this.playAnim('dash', true);
    this.vx = this.facing * 820;
    Audio.playDash();
    VFX.spawnDust(this.x, this.y, -this.facing, 8);
  }

  skill(skillNum = 1) {
    if (this.isDead || this.isAttacking || this.hitstunTimer > 0) return;
    this.isParrying = false;
    this.isWallSliding = false;
    this.isWallJumping = false;
    this.flipAngle = 0;
    this.isAttacking = true;
    this.attackLanded = false;
    this.playAnim(`skill${skillNum}`, true);
    Audio.playWhoosh();
  }

  throwSlash() {
    if (this.isDead || this.hitstunTimer > 0 || this.slashCooldown > 0) return;
    this.slashCooldown = 0.4;
    this.isParrying = false;
    this.isWallSliding = false;
    this.isWallJumping = false;
    this.flipAngle = 0;
    this.isAttacking = true;
    this.attackLanded = false;
    this.playAnim('attack3', true);

    const isCounter = this.hasCounterBuff;
    if (isCounter) {
      this.hasCounterBuff = false; // Consumed on unleashing counter crescent slash!
    }

    Combat.spawnSlash(
      this.x + this.facing * 50,
      this.y - 35,
      this.facing,
      isCounter ? '#ff3344' : this.weaponColor,
      isCounter ? '#ffd700' : this.weaponColor,
      this,
      isCounter
    );
  }

  jump() {
    if (this.isDead || this.hitstunTimer > 0) return;

    // 1. Acrobatic Wall Jump Somersault
    if (!this.onFloor && this.isWallSliding) {
      this.wallJump();
      return;
    }

    // 2. Normal Ground Jump
    if (this.onFloor) {
      this.vy = -this.jumpForce;
      this.onFloor = false;
      this.canDoubleJump = true;
      this.playAnim('jump', true);
      Audio.playJump();
      VFX.spawnDust(this.x, this.y, 0, 6);
    } else if (this.canDoubleJump) {
      // 3. Double Jump (cancels flip if mid-somersault)
      this.isWallJumping = false;
      this.flipAngle = 0;
      this.canDoubleJump = false;
      this.vy = -this.doubleJumpForce;
      this.playAnim('jump_peak', true);
      Audio.playDoubleJump();
      VFX.spawnDust(this.x, this.y, 0, 10);
    }
  }

  wallJump() {
    const kickDir = -this.wallDir; // Kick off away from wall into arena
    const wallX = this.wallDir < 0 ? this.x - 14 : this.x + 14;

    this.isWallSliding = false;
    this.isWallJumping = true;
    this.wallJumpTimer = this.wallJumpDuration;
    this.flipAngle = 0;

    // High velocity: outward horizontal push + high acrobatic lift
    this.vx = kickDir * 660;
    this.vy = -700;
    this.facing = kickDir;

    // Refresh double jump allowing wall jump -> double jump -> aerial attack combos!
    this.canDoubleJump = true;

    this.playAnim('jump_peak', true);
    Audio.playWallJump();

    // High impact kinetic dust puff, shockwave ring & sparks
    VFX.spawnWallKick(wallX, this.y - 25, this.wallDir, this.weaponColor);
  }

  update(dt, arena, input = {}) {
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.parryCooldown > 0) this.parryCooldown -= dt;
    if (this.slashCooldown > 0) this.slashCooldown -= dt;

    // Update Parry Stance
    if (this.isParrying) {
      this.parryTimer += dt;
      this.shieldPulse += dt * 12;
      this.vx *= Math.pow(0.08, dt * 10); // firmly anchored in guard

      // Hold the locked cross-blade guard pose while parrying
      if (this.animName === 'deflect' && this.animFrame >= 2) {
        this.animFrame = 2;
      }

      if (this.parryTimer >= this.parryDuration) {
        this.isParrying = false;
        this.parryCooldown = 0.18; // brief guard recovery
        this.playAnim(this.onFloor ? 'idle' : 'fall');
      }
    }

    // Update Counter-Attack Buff
    if (this.hasCounterBuff) {
      this.counterTimer -= dt;
      this.counterFlame += dt * 8;
      if (this.counterTimer <= 0) {
        this.hasCounterBuff = false;
      }
    }

    // Update Acrobatic Wall Jump Somersault Flip
    if (this.isWallJumping) {
      this.wallJumpTimer -= dt;
      const progress = Math.max(0, 1.0 - (this.wallJumpTimer / this.wallJumpDuration));
      this.flipAngle = progress * Math.PI * 2;

      // Spawn phantom ninja air trail during the somersault flip
      if (Math.random() < 0.45) {
        this.shadows.push({
          x: this.x,
          y: this.y,
          facing: this.facing,
          animName: this.animName,
          animFrame: this.animFrame,
          alpha: 0.45,
        });
      }

      if (this.wallJumpTimer <= 0) {
        this.isWallJumping = false;
        this.flipAngle = 0;
      }
    }

    // Update phantom shadows
    for (let i = this.shadows.length - 1; i >= 0; i--) {
      this.shadows[i].alpha -= dt * 4;
      if (this.shadows[i].alpha <= 0) {
        this.shadows.splice(i, 1);
      }
    }

    if (this.isDashing) {
      // Spawn phantom trail
      this.shadows.push({
        x: this.x,
        y: this.y,
        facing: this.facing,
        animName: this.animName,
        animFrame: this.animFrame,
        alpha: 0.55,
      });
    }

    // Dead / Defeat logic
    if (this.isDead) {
      this.deathTimer += dt;
      this.vy += this.gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.93;

      if (this.x < arena.minX) { this.x = arena.minX; this.vx = 0; }
      else if (this.x > arena.maxX) { this.x = arena.maxX; this.vx = 0; }

      const wasOnFloor = this.onFloor;
      this._collidePlatforms(arena);

      // Floor impact thump when falling dead
      if (!wasOnFloor && this.onFloor && !this.deathLanded) {
        this.deathLanded = true;
        this.deathFloorTimer = 0;
        this.vx = 0;
        VFX.spawnDust(this.x, this.y, 0, 14);
        VFX.spawnShockwave(this.x, this.y - 8, 'rgba(255, 60, 60, 0.7)', 55);
        Combat.screenShake = 12;
      }

      // On-Ground Death Struggle: Fighter tries to lift head up, but energy expires and head drops limp!
      if (this.onFloor) {
        this.deathFloorTimer += dt;
        this.animName = 'hit3';
        this.animFrame = 2; // Flat on ground

        // Phase 1: Stunned pause (0.0s - 0.25s)
        if (this.deathFloorTimer < 0.25) {
          this.headLiftAngle = 0;
        }
        // Phase 2: Desperate struggle to lift head up (0.25s - 1.55s)
        else if (this.deathFloorTimer < 1.55) {
          const struggleProgress = (this.deathFloorTimer - 0.25) / 1.3;
          // Straining muscle tremor
          const tremor = Math.sin(this.deathFloorTimer * 28) * 0.035;
          // Arch upward curve
          const liftCurve = Math.sin(struggleProgress * Math.PI * 0.72);
          this.headLiftAngle = Math.max(0, liftCurve * 0.35 + tremor);

          // Puffs of strained breath
          if (Math.random() < 0.12) {
            VFX.spawnDust(this.x + this.facing * 18, this.y - 12, 0, 1);
          }
        }
        // Phase 3: Strength gives out, head falls straight down limp! (>= 1.55s)
        else {
          if (!this.struggleDone) {
            this.struggleDone = true;
            this.headLiftAngle = 0;
            // Dust puff where head drops limp onto the floor
            VFX.spawnDust(this.x + this.facing * 24, this.y - 2, 0, 6);
            Audio.playHit(false);
          }

          // Rapid eye flicker before extinguishing into darkness
          if (this.deathFloorTimer < 1.95) {
            this.eyeExtinguished = Math.sin(this.deathFloorTimer * 24) < 0;
          } else {
            this.eyeExtinguished = true;
          }
        }
      }

      // Rising defeat embers / spirit energy
      if (Math.random() < 0.35) {
        VFX.spawnHitSparks(
          this.x + (Math.random() - 0.5) * 36,
          this.y - 12 - Math.random() * 25,
          this.weaponColor || '#ff3344',
          1,
          false
        );
      }

      return;
    }

    // Hitstun
    if (this.hitstunTimer > 0) {
      this.hitstunTimer -= dt;
      this.vx *= Math.pow(0.5, dt * 10);
      this.vy += this.gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.x < arena.minX) { this.x = arena.minX; this.vx = 0; }
      else if (this.x > arena.maxX) { this.x = arena.maxX; this.vx = 0; }
      if (this.y < arena.minY) { this.y = arena.minY; this.vy = 0; }
      this._collidePlatforms(arena);
      this._advanceAnimation(dt);
      if (this.hitstunTimer <= 0) {
        this.playAnim(this.onFloor ? 'idle' : 'fall');
      }
      return;
    }

    // Horizontal Movement
    const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    this.dropThrough = !!input.down;

    if (this.isDashing) {
      this.vx = this.facing * 820;
      this.vy = 0;
    } else if (this.isAttacking) {
      // Slight forward momentum during slashes
      this.vx = move_toward(this.vx, moveDir * this.speed * 0.35, this.friction * dt);
    } else if (moveDir !== 0) {
      this.vx = Math.min(Math.max(this.vx + moveDir * this.accel * dt, -this.speed), this.speed);
      this.facing = moveDir;
    } else {
      const frictionStep = this.friction * dt;
      if (Math.abs(this.vx) <= frictionStep) {
        this.vx = 0;
      } else {
        this.vx -= Math.sign(this.vx) * frictionStep;
      }
    }

    // Gravity
    if (!this.isDashing) {
      this.vy = Math.min(this.vy + this.gravity * dt, 950);
    }

    // Apply Velocity
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Hard Arena Boundaries (Walls & Ceiling)
    if (this.x < arena.minX) {
      this.x = arena.minX;
      this.vx = Math.max(0, this.vx);
    } else if (this.x > arena.maxX) {
      this.x = arena.maxX;
      this.vx = Math.min(0, this.vx);
    }
    if (this.y < arena.minY) {
      this.y = arena.minY;
      this.vy = Math.max(0, this.vy);
    }

    // Platform Collisions
    const wasOnFloor = this.onFloor;
    this._collidePlatforms(arena);

    if (!wasOnFloor && this.onFloor) {
      this.isWallSliding = false;
      this.isWallJumping = false;
      this.flipAngle = 0;
      this.canDoubleJump = true;
      VFX.spawnDust(this.x, this.y, 0, 4);
    }

    // Check Killzone
    if (this.y > arena.killY && !this.isDead) {
      this.takeDamage(999, 0, -200);
    }

    // Wall Cling & Slide Mechanics
    const canWallSlide = !this.onFloor && !this.isDead && !this.isDashing && this.hitstunTimer <= 0 && !this.isAttacking && !this.isParrying;
    if (canWallSlide) {
      const nearLeft = this.x <= arena.minX + 8;
      const nearRight = this.x >= arena.maxX - 8;
      const pressingLeft = moveDir < 0 || this.vx <= -5;
      const pressingRight = moveDir > 0 || this.vx >= 5;

      if (nearLeft && (pressingLeft || this.isWallSliding) && moveDir <= 0 && this.vy >= -60) {
        if (!this.isWallSliding) {
          Audio.playWallSlide();
          VFX.spawnWallSlideSparks(arena.minX + 2, this.y - 20, -1);
        }
        this.isWallSliding = true;
        this.wallDir = -1;
        this.facing = -1; // Face the wall
        this.x = arena.minX;
        this.vx = 0;
        this.isWallJumping = false;
        this.flipAngle = 0;
        this.canDoubleJump = true; // Grabbing wall restores jump energy!
      } else if (nearRight && (pressingRight || this.isWallSliding) && moveDir >= 0 && this.vy >= -60) {
        if (!this.isWallSliding) {
          Audio.playWallSlide();
          VFX.spawnWallSlideSparks(arena.maxX - 2, this.y - 20, 1);
        }
        this.isWallSliding = true;
        this.wallDir = 1;
        this.facing = 1; // Face the wall
        this.x = arena.maxX;
        this.vx = 0;
        this.isWallJumping = false;
        this.flipAngle = 0;
        this.canDoubleJump = true;
      } else {
        this.isWallSliding = false;
      }
    } else {
      this.isWallSliding = false;
    }

    // Apply Wall Slide Friction & Sparks
    if (this.isWallSliding) {
      const maxSlideSpeed = input.down ? 420 : 130;
      if (this.vy > maxSlideSpeed) this.vy = maxSlideSpeed;
      this.playAnim('wall_slide');

      // Emit friction sparks & stone dust while sliding down
      this.wallSlideSparkTimer += dt;
      if (this.wallSlideSparkTimer >= 0.08 && this.vy > 25) {
        this.wallSlideSparkTimer = 0;
        VFX.spawnWallSlideSparks(this.wallDir < 0 ? arena.minX + 2 : arena.maxX - 2, this.y - 22, this.wallDir);
      }
    }

    // State Transitions
    if (!this.isAttacking && !this.isDashing && !this.isParrying && !this.isWallSliding && this.hitstunTimer <= 0 && !this.isDead) {
      if (!this.onFloor) {
        if (this.isWallJumping) {
          this.playAnim('jump_peak');
        } else if (this.vy > 80) {
          this.playAnim('fall');
        }
      } else if (Math.abs(this.vx) > 20) {
        this.playAnim('run');
      } else {
        this.playAnim('idle');
      }
    }

    // Advance Animation
    this._advanceAnimation(dt);
  }

  _advanceAnimation(dt) {
    const def = ANIMATION_DEFS[this.animName];
    if (!def) return;

    this.animTimer += dt;
    const frameDuration = 1.0 / def.fps;

    if (this.animTimer >= frameDuration) {
      this.animTimer -= frameDuration;
      this.animFrame++;

      if (this.animFrame >= def.frames) {
        if (def.loop) {
          this.animFrame = 0;
        } else {
          this.animFrame = def.frames - 1;
          this._onAnimationFinished();
        }
      }
    }
  }

  _onAnimationFinished() {
    if (this.isDashing) {
      this.isDashing = false;
      this.playAnim(this.onFloor ? 'idle' : 'fall');
      return;
    }

    if (this.isAttacking) {
      if (this.comboBuffer && this.comboStep < 4) {
        this.comboStep++;
        this.comboBuffer = false;
        this.attackLanded = false;
        this.playAnim(`attack${this.comboStep}`, true);
        Audio.playWhoosh();
        return;
      }

      this.isAttacking = false;
      this.comboBuffer = false;
      this.comboStep = 1;
      this.playAnim(this.onFloor ? 'idle' : 'fall');
      return;
    }

    // Safety fallback: Ensure any non-looping animation smoothly transitions back to idle/fall
    if (!this.isDead && !this.isParrying) {
      this.playAnim(this.onFloor ? 'idle' : 'fall');
    }
  }

  _collidePlatforms(arena) {
    this.onFloor = false;
    const footY = this.y;
    const prevFootY = this.y - this.vy * 0.016;

    for (const p of arena.platforms) {
      const isWithinX = this.x >= p.x - 22 && this.x <= p.x + p.w + 22;
      if (!isWithinX) continue;

      if (p.isSolid) {
        if (footY >= p.y && prevFootY <= p.y + 24 && this.vy >= 0) {
          this.y = p.y;
          this.vy = 0;
          this.onFloor = true;
          return;
        }
      } else if (!this.dropThrough) {
        if (footY >= p.y && prevFootY <= p.y + 14 && this.vy >= 0) {
          this.y = p.y;
          this.vy = 0;
          this.onFloor = true;
          return;
        }
      }
    }
  }

  // Precision Attack Hitbox
  getAttackHitbox() {
    if (!this.isAttacking || this.attackLanded) return null;

    const def = ANIMATION_DEFS[this.animName];
    if (!def || def.hitStart === undefined) return null;

    if (this.animFrame >= def.hitStart && this.animFrame <= def.hitEnd) {
      const isBigAttack = (this.animName === 'attack4' || this.animName === 'skill2' || this.animName === 'skill3');
      const reach = isBigAttack ? 70 : 54;
      const radius = isBigAttack ? 58 : 42;

      return {
        x: this.x + this.facing * reach,
        y: this.y - 35,
        radius: radius,
        damage: def.damage || 15,
        knockback: def.kb || 400,
        attacker: this,
      };
    }

    return null;
  }

  draw(ctx) {
    const img = Sprites.getImage(this.variant, this.animName);
    if (!img) return;

    const def = ANIMATION_DEFS[this.animName];
    const frameIndex = Math.min(this.animFrame, def ? def.frames - 1 : 0);

    const dw = this.fw * this.drawScale;
    const dh = this.fh * this.drawScale;

    // Draw Phantom Shadows
    for (const s of this.shadows) {
      const sImg = Sprites.getImage(this.variant, s.animName);
      if (!sImg) continue;
      ctx.save();
      ctx.globalAlpha = s.alpha * 0.5;
      ctx.translate(s.x, s.y);
      if (s.facing < 0) ctx.scale(-1, 1);
      ctx.drawImage(sImg, s.animFrame * this.fw, 0, this.fw, this.fh, -this.pivotX, -this.pivotY, dw, dh);
      ctx.restore();
    }

    // 1. Draw 2X Counter Buff Aura (around stickman)
    if (this.hasCounterBuff && !this.isDead) {
      this._drawCounterAura(ctx);
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    // Hit flash brightness
    if (this.flashTimer > 0) {
      ctx.filter = 'brightness(3.0) contrast(1.5)';
    }

    // Death fade & defeat silhouette
    if (this.isDead) {
      const deathAlpha = Math.max(0.35, 1.0 - Math.min(0.65, this.deathTimer * 0.15));
      ctx.globalAlpha = deathAlpha;
      ctx.filter = 'grayscale(0.75) contrast(1.2)';
    }

    // Mirror horizontally when facing left
    if (this.facing < 0) {
      ctx.scale(-1, 1);
    }

    // Acrobatic Somersault Flip (Rotate around torso center: x=0, y=-35)
    if (this.isWallJumping && this.flipAngle !== 0) {
      ctx.translate(0, -35);
      ctx.rotate(this.flipAngle);
      ctx.translate(0, 35);
    }

    // Death struggle: lift head & shoulders off ground
    if (this.isDead && this.onFloor && this.headLiftAngle > 0) {
      const waistX = -this.pivotX + 46 * this.drawScale;
      const waistY = -this.pivotY + 54 * this.drawScale;
      ctx.translate(waistX, waistY);
      ctx.rotate(-this.headLiftAngle);
      ctx.translate(-waistX, -waistY);
    }

    const sx = frameIndex * this.fw;

    // Draw 128x64 frame with locked pivot
    ctx.drawImage(img, sx, 0, this.fw, this.fh, -this.pivotX, -this.pivotY, dw, dh);

    // Glowing eye accent (extinguishes when life departs)
    if (!this.eyeExtinguished && (this.variant === 'shadow' || this.variant === 'cyan')) {
      ctx.fillStyle = this.eyeColor;
      ctx.shadowColor = this.eyeColor;
      ctx.shadowBlur = this.isDead ? 4 : 8;
      ctx.beginPath();
      ctx.arc(8, -dh + 22, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 2. Draw Stickman Sword Deflection Arc (in front of stickman)
    if (this.isParrying && !this.isDead) {
      this._drawDeflectGuard(ctx);
    }
  }

  _drawDeflectGuard(ctx) {
    const isPerfect = this.parryTimer <= this.perfectParryWindow;
    const bladeColor = isPerfect ? '#ffd700' : this.weaponColor;
    const bladeGlow = isPerfect ? '#fff275' : this.weaponColor;

    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.facing < 0) {
      ctx.scale(-1, 1);
    }

    ctx.shadowColor = bladeGlow;
    ctx.shadowBlur = isPerfect ? 20 : 10;

    // 1. Martial arts stance ground focus ring (subtle, non-intrusive)
    const ringAlpha = Math.max(0, 1.0 - this.parryTimer / this.parryDuration) * 0.45;
    ctx.strokeStyle = bladeColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = ringAlpha;
    ctx.beginPath();
    ctx.ellipse(0, -2, 26, 7, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2. If in Perfect Parry Window (<0.15s), radiant katana gleam star at the actual weapon tip
    if (isPerfect) {
      const starAlpha = 1.0 - (this.parryTimer / this.perfectParryWindow);
      ctx.globalAlpha = Math.max(0, starAlpha);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 18;

      // Actual tip of the weapon held in start_skill3 guard pose
      const fx = -42;
      const fy = -82;
      const flen = 18 * starAlpha;

      ctx.beginPath();
      ctx.moveTo(fx, fy - flen);
      ctx.quadraticCurveTo(fx, fy, fx + flen * 0.2, fy);
      ctx.quadraticCurveTo(fx, fy, fx, fy + flen);
      ctx.quadraticCurveTo(fx, fy, fx - flen * 0.2, fy);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(fx - flen, fy);
      ctx.quadraticCurveTo(fx, fy, fx, fy + flen * 0.2);
      ctx.quadraticCurveTo(fx, fy, fx + flen, fy);
      ctx.quadraticCurveTo(fx, fy, fx - flen * 0.2, fy);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  _drawCounterAura(ctx) {
    const cx = this.x;
    const cy = this.y - 35;
    const pulse = Math.sin(this.counterFlame * 2) * 0.2 + 0.8;

    ctx.save();

    // Fiery flaming aura around stickman
    ctx.shadowColor = '#ff3344';
    ctx.shadowBlur = 22;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3 * pulse;
    ctx.globalAlpha = 0.65 * pulse;

    // Glowing counter ring
    ctx.beginPath();
    ctx.ellipse(cx, this.y - 2, 28, 8, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Flaming energy wisps
    const flameGrad = ctx.createRadialGradient(cx, cy, 15, cx, cy, 55);
    flameGrad.addColorStop(0, 'rgba(255, 68, 0, 0.25)');
    flameGrad.addColorStop(0.6, 'rgba(255, 215, 0, 0.15)');
    flameGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 52, 0, Math.PI * 2);
    ctx.fill();

    // Overhead "⚡ 2X COUNTER!" Badge
    ctx.font = "bold 13px 'Impact', 'Segoe UI Black', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe066';
    ctx.shadowColor = '#ff2244';
    ctx.shadowBlur = 10;
    ctx.globalAlpha = 0.9 * pulse;
    ctx.fillText("⚡ 2X COUNTER!", cx, this.y - 78);

    ctx.restore();
  }
}

function move_toward(current, target, maxDelta) {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}
