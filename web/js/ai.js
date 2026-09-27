// ============================================================
// STICKFALL ELITE CPU AI — Brutal Adaptive Fighting Intelligence
// State-Machine Architecture with Combo Chains, Ability Mastery,
// Frame-Perfect Parries, Edge-Guarding & Pattern Adaptation
// ============================================================

class BotController {
  constructor(stickman, mode = 'training') {
    this.bot = stickman;
    this.mode = mode;
    this.respawnTimer = 0;

    // ── Core Decision Timers ──
    this.thinkTimer = 0;
    this.thinkInterval = 0.033; // ~30Hz decision rate (near frame-perfect)

    // ── AI State Machine ──
    this.state = 'neutral';  // neutral, aggressive, defensive, punish, zoning, juggle, recovery, edgeguard
    this.stateTimer = 0;
    this.stateLockedUntil = 0;

    // ── Combat Timers ──
    this.attackCooldown = 0;
    this.skillCooldown = 0;
    this.slashCooldown = 0;
    this.dashCooldown = 0;
    this.parryCooldown = 0;
    this.comboStep = 0;        // Track which combo hit we're chaining
    this.comboChainTimer = 0;  // Time window to chain next hit
    this.wantCombo = false;    // Whether to buffer next combo hit

    // ── Spatial Awareness ──
    this.lastTargetX = 0;
    this.lastTargetY = 0;
    this.targetVelX = 0;
    this.targetVelY = 0;
    this.lastDist = 0;

    // ── Pattern Tracking (reads the player) ──
    this.playerAttackCount = 0;
    this.playerParryCount = 0;
    this.playerDashCount = 0;
    this.playerJumpCount = 0;
    this.playerIdleTime = 0;
    this.patternResetTimer = 0;
    this.playerAggression = 0.5;    // 0 = passive player, 1 = hyper aggressive
    this.playerTendency = 'mixed';  // 'rushdown', 'defensive', 'mixed', 'jumpy'

    // ── Tactical Memory ──
    this.lastHitTime = 0;
    this.lastDamageTaken = 0;
    this.lastDamageDealt = 0;
    this.consecutiveHits = 0;
    this.consecutiveMisses = 0;
    this.wasHitRecently = false;
    this.hitRecoveryTimer = 0;

    // ── Difficulty Tuning ──
    this.reactionTime = 0.06;     // 60ms reactions — near-human pro level
    this.parryAccuracy = 0.82;    // 82% chance to attempt parry when optimal
    this.comboCompletionRate = 0.90; // 90% chance to continue a combo chain
    this.abilityIQ = 0.85;       // How smartly it picks abilities

    // ── Movement AI ──
    this.strafeDir = 1;
    this.strafeTimer = 0;
    this.preferredRange = 75;    // Ideal fighting distance
    this.isRetreating = false;
    this.retreatTimer = 0;

    // ── Edge Guard Tracking ──
    this.edgeguardActive = false;

    // ── Anti-Cheese: Tracks if player is running away ──
    this.playerFleeingTimer = 0;
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'fighter') {
      this.state = 'neutral';
      this.stateTimer = 0;
    }
  }

  update(dt, target, arena) {
    if (this.bot.isDead) {
      this.respawnTimer += dt;
      if (this.respawnTimer >= 2.0) {
        this.respawnTimer = 0;
        this.bot.reset(1050, 678);
        this.state = 'neutral';
        this.consecutiveHits = 0;
      }
      return {};
    }

    // Decrement cooldowns
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.skillCooldown > 0) this.skillCooldown -= dt;
    if (this.slashCooldown > 0) this.slashCooldown -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.parryCooldown > 0) this.parryCooldown -= dt;
    if (this.comboChainTimer > 0) this.comboChainTimer -= dt;
    if (this.hitRecoveryTimer > 0) this.hitRecoveryTimer -= dt;
    if (this.stateTimer > 0) this.stateTimer -= dt;

    if (this.mode === 'training') {
      return {
        left: false,
        right: false,
        jump: false,
        down: false,
        aimX: target.x,
        aimY: target.y - 35,
      };
    }

    // ════════════════════════════════════════════════════
    // FIGHTER AI — 30Hz Decision Loop
    // ════════════════════════════════════════════════════
    this.thinkTimer += dt;

    // Track target velocity for prediction
    const tvx = (target.x - this.lastTargetX) / Math.max(dt, 0.001);
    const tvy = (target.y - this.lastTargetY) / Math.max(dt, 0.001);
    this.targetVelX = this.targetVelX * 0.7 + tvx * 0.3; // Smoothed
    this.targetVelY = this.targetVelY * 0.7 + tvy * 0.3;
    this.lastTargetX = target.x;
    this.lastTargetY = target.y;

    // Spatial calculations
    const dx = target.x - this.bot.x;
    const dy = target.y - this.bot.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const absDx = Math.abs(dx);
    const facingTarget = (dx > 0 && this.bot.facing === 1) || (dx < 0 && this.bot.facing === -1);

    // ── Pattern Analysis (runs every frame for accuracy) ──
    this._analyzePlayerPatterns(dt, target, dist);

    // ── Detect if we got hit ──
    if (this.bot.hitstunTimer > 0 && this.hitRecoveryTimer <= 0) {
      this.wasHitRecently = true;
      this.hitRecoveryTimer = 0.8;
      this.consecutiveHits = 0;
      this.consecutiveMisses++;
    }

    let left = false;
    let right = false;
    let jump = false;
    let down = false;

    // Only make tactical decisions at decision rate
    if (this.thinkTimer >= this.thinkInterval) {
      this.thinkTimer = 0;

      // ═══════════════════════════════════════════
      // STATE MACHINE — Determine Current AI State
      // ═══════════════════════════════════════════
      this._updateState(target, dist, absDx, dy, arena);

      // ═══════════════════════════════════════════
      // EXECUTE CURRENT STATE BEHAVIOR
      // ═══════════════════════════════════════════
      const actions = this._executeState(target, dist, dx, dy, absDx, arena, dt);
      left = actions.left;
      right = actions.right;
      jump = actions.jump;
      down = actions.down;

      // ═══════════════════════════════════════════
      // REACTIVE SYSTEMS (always active)
      // ═══════════════════════════════════════════

      // 1. FRAME-PERFECT PARRY SYSTEM
      this._reactiveParry(target, dist, dt);

      // 2. COMBO CHAIN SYSTEM
      this._executeComboChain(target, dist, dy);

      // 3. ABILITY USAGE SYSTEM
      this._executeAbilities(target, dist, dx, dy, arena);

      // 4. OFF-STAGE RECOVERY
      const recovery = this._offStageRecovery(arena, target);
      if (recovery) {
        left = recovery.left || left;
        right = recovery.right || right;
        jump = recovery.jump || jump;
      }

    } else {
      // Between decisions, maintain last movement intent
      // but still handle reactive systems
      this._reactiveParry(target, dist, dt);
      this._executeComboChain(target, dist, dy);
    }

    // ── WALL JUMP AI ──
    if (this.bot.isWallSliding) {
      const kickDir = -this.bot.wallDir;
      // Always wall jump toward the target, or randomly to stay mobile
      if ((kickDir > 0 && target.x > this.bot.x) ||
          (kickDir < 0 && target.x < this.bot.x) ||
          Math.random() < 0.6) {
        jump = true;
      }
    }

    this.lastDist = dist;

    return {
      left,
      right,
      jump,
      down,
      aimX: target.x + this.targetVelX * 0.15, // Lead the target
      aimY: target.y - 35,
    };
  }

  // ════════════════════════════════════════════════════════════
  // STATE MACHINE — Decides overarching tactical approach
  // ════════════════════════════════════════════════════════════
  _updateState(target, dist, absDx, dy, arena) {
    const botHpPct = this.bot.hp / this.bot.maxHp;
    const targetHpPct = target.hp / target.maxHp;
    const hasCounterBuff = this.bot.hasCounterBuff;

    // Priority 1: Edge guard when opponent is off-stage
    if (target.y > arena.killY - 200 && target.vy > 0 && !target.onFloor) {
      this.state = 'edgeguard';
      return;
    }

    // Priority 2: Recovery when we're in danger
    if (this.bot.y > 650 && !this.bot.onFloor && this.bot.vy > 0) {
      this.state = 'recovery';
      return;
    }

    // Priority 3: Punish window — target is in hitstun/recovering
    if (target.hitstunTimer > 0 || (target.isAttacking && target.attackLanded)) {
      this.state = 'punish';
      return;
    }

    // Priority 4: Counter buff — go aggro to land the powered hit
    if (hasCounterBuff) {
      this.state = 'aggressive';
      return;
    }

    // Priority 5: Juggle — target is airborne and we can chase
    if (!target.onFloor && target.vy > 0 && dy < -30 && dist < 200) {
      this.state = 'juggle';
      return;
    }

    // Adaptive state based on HP and player tendencies
    if (botHpPct < 0.25) {
      // Low HP: play very carefully, fish for parries and counter-attacks
      this.state = this.playerAggression > 0.6 ? 'defensive' : 'zoning';
    } else if (botHpPct > 0.7 && targetHpPct < 0.4) {
      // Winning big: press the advantage
      this.state = 'aggressive';
    } else if (this.playerAggression > 0.7) {
      // Player is aggressive: bait and punish
      this.state = Math.random() < 0.6 ? 'defensive' : 'aggressive';
    } else if (this.playerAggression < 0.3) {
      // Player is passive: apply pressure
      this.state = Math.random() < 0.7 ? 'aggressive' : 'zoning';
    } else {
      // Mixed: vary approach
      const roll = Math.random();
      if (roll < 0.45) this.state = 'aggressive';
      else if (roll < 0.70) this.state = 'neutral';
      else if (roll < 0.85) this.state = 'defensive';
      else this.state = 'zoning';
    }
  }

  // ════════════════════════════════════════════════════════════
  // STATE EXECUTION — Movement & Attack Patterns
  // ════════════════════════════════════════════════════════════
  _executeState(target, dist, dx, dy, absDx, arena, dt) {
    let left = false;
    let right = false;
    let jump = false;
    let down = false;

    switch (this.state) {
      case 'aggressive':
        ({ left, right, jump, down } = this._stateAggressive(target, dist, dx, dy, absDx, arena));
        break;
      case 'defensive':
        ({ left, right, jump, down } = this._stateDefensive(target, dist, dx, dy, absDx, arena));
        break;
      case 'punish':
        ({ left, right, jump, down } = this._statePunish(target, dist, dx, dy, absDx));
        break;
      case 'zoning':
        ({ left, right, jump, down } = this._stateZoning(target, dist, dx, dy, absDx, arena));
        break;
      case 'juggle':
        ({ left, right, jump, down } = this._stateJuggle(target, dist, dx, dy));
        break;
      case 'edgeguard':
        ({ left, right, jump, down } = this._stateEdgeguard(target, dist, dx, dy, arena));
        break;
      case 'recovery':
        ({ left, right, jump, down } = this._stateRecovery(arena, target));
        break;
      default: // neutral
        ({ left, right, jump, down } = this._stateNeutral(target, dist, dx, dy, absDx, arena));
        break;
    }

    return { left, right, jump, down };
  }

  // ── AGGRESSIVE: Rush down, chain combos, relentless pressure ──
  _stateAggressive(target, dist, dx, dy, absDx, arena) {
    let left = false, right = false, jump = false, down = false;

    // Optimal spacing: close in to melee range
    const idealDist = this.bot.hasCounterBuff ? 60 : 70;

    if (dist > idealDist + 20) {
      // Close the gap
      if (dx > 0) right = true;
      else left = true;

      // Dash in if far away and dash is ready
      if (dist > 200 && this.bot.dashCooldown <= 0 && !this.bot.isDashing &&
          this.bot.hitstunTimer <= 0 && Math.abs(dy) < 80) {
        this.bot.facing = dx > 0 ? 1 : -1;
        this.bot.dash();
        this.dashCooldown = 0.8;
      }

      // Jump to reach elevated targets
      if (dy < -60 && this.bot.onFloor && Math.random() < 0.15) {
        jump = true;
      }
    } else if (dist < 35) {
      // Too close, micro-step back for optimal hit range
      if (dx > 0) left = true;
      else right = true;
    }

    // Drop through platform if target is below
    if (dy > 80 && this.bot.onFloor && Math.random() < 0.12) {
      down = true;
    }

    // Attack when in range
    if (dist < 85 && this.attackCooldown <= 0 && Math.abs(dy) < 55 &&
        !this.bot.isParrying && !this.bot.isDashing && this.bot.hitstunTimer <= 0) {
      this._initiateAttack(target, dist);
    }

    return { left, right, jump, down };
  }

  // ── DEFENSIVE: Bait attacks, parry, then counter ──
  _stateDefensive(target, dist, dx, dy, absDx, arena) {
    let left = false, right = false, jump = false, down = false;

    // Maintain safe spacing just outside melee range
    const safeDist = 100;

    if (dist < safeDist - 15) {
      // Back away
      if (dx > 0) left = true;
      else right = true;

      // Defensive hop back
      if (dist < 50 && this.bot.onFloor && Math.random() < 0.08) {
        jump = true;
        if (dx > 0) left = true;
        else right = true;
      }
    } else if (dist > safeDist + 40) {
      // Don't let them get too far either — stay in parry range
      if (dx > 0) right = true;
      else left = true;
    }

    // Micro-strafe to be unpredictable
    this.strafeTimer -= 0.033;
    if (this.strafeTimer <= 0) {
      this.strafeDir = Math.random() < 0.5 ? 1 : -1;
      this.strafeTimer = 0.3 + Math.random() * 0.5;
    }

    // Parry-bait: stand just inside attack range and wait
    if (target.isAttacking && dist < 100 && !this.bot.isParrying &&
        this.bot.parryCooldown <= 0 && Math.random() < this.parryAccuracy) {
      this.bot.parry();
      this.parryCooldown = 0.4;
    }

    // Counter-attack after successful parry or when opening appears
    if (this.bot.hasCounterBuff && dist < 85 && this.attackCooldown <= 0 &&
        !this.bot.isParrying && this.bot.hitstunTimer <= 0) {
      this._initiateAttack(target, dist);
    }

    // Whiff punish: attack if their attack just ended (missed)
    if (target.isAttacking && target.attackLanded && dist < 80 &&
        this.attackCooldown <= 0 && !this.bot.isParrying && this.bot.hitstunTimer <= 0) {
      this._initiateAttack(target, dist);
    }

    return { left, right, jump, down };
  }

  // ── PUNISH: Target is vulnerable, maximize damage ──
  _statePunish(target, dist, dx, dy, absDx) {
    let left = false, right = false, jump = false, down = false;

    // Rush in for the punish
    if (dist > 65) {
      if (dx > 0) right = true;
      else left = true;

      // Dash for guaranteed punish on distant stagger
      if (dist > 120 && this.bot.dashCooldown <= 0 && !this.bot.isDashing && Math.abs(dy) < 60) {
        this.bot.facing = dx > 0 ? 1 : -1;
        this.bot.dash();
      }
    }

    // Unleash heavy attacks during punish window
    if (dist < 90 && this.attackCooldown <= 0 && !this.bot.isDashing && this.bot.hitstunTimer <= 0) {
      // Use strongest available ability during punish
      if (this.skillCooldown <= 0 && !this.bot.isAttacking && dist < 80) {
        if (Math.random() < 0.5) {
          this.bot.skill(3); // Ultimate — massive damage
          this.skillCooldown = 1.8;
          this.attackCooldown = 0.3;
        } else {
          this.bot.skill(2); // Heavy flurry
          this.skillCooldown = 1.2;
          this.attackCooldown = 0.3;
        }
      } else {
        this._initiateAttack(target, dist);
      }
    }

    return { left, right, jump, down };
  }

  // ── ZONING: Control space with projectiles and pokes ──
  _stateZoning(target, dist, dx, dy, absDx, arena) {
    let left = false, right = false, jump = false, down = false;

    const zoneDist = 180;

    // Maintain zoning distance
    if (dist < zoneDist - 30) {
      if (dx > 0) left = true;
      else right = true;
    } else if (dist > zoneDist + 60) {
      if (dx > 0) right = true;
      else left = true;
    }

    // Throw projectile slashes to control space
    if (this.slashCooldown <= 0 && dist > 100 && dist < 500 &&
        Math.abs(dy) < 80 && !this.bot.isAttacking && this.bot.hitstunTimer <= 0) {
      this.bot.facing = dx > 0 ? 1 : -1;
      this.bot.throwSlash();
      this.slashCooldown = 0.6;
      this.attackCooldown = 0.3;
    }

    // If they close in, either parry or dash away
    if (dist < 80 && target.isAttacking) {
      if (!this.bot.isParrying && this.bot.parryCooldown <= 0 && Math.random() < this.parryAccuracy) {
        this.bot.parry();
      }
    } else if (dist < 60 && this.bot.dashCooldown <= 0 && !this.bot.isDashing) {
      // Dash away to re-establish zone
      this.bot.facing = dx > 0 ? -1 : 1; // Face away
      this.bot.dash();
    }

    // Jump over approaching enemy
    if (dy > -20 && dist < 100 && this.bot.onFloor && Math.random() < 0.08) {
      jump = true;
    }

    // Poke with quick attack if they walk into range
    if (dist < 85 && this.attackCooldown <= 0 && !this.bot.isAttacking &&
        !this.bot.isParrying && this.bot.hitstunTimer <= 0 && Math.random() < 0.4) {
      this._initiateAttack(target, dist);
    }

    return { left, right, jump, down };
  }

  // ── JUGGLE: Chase airborne opponent for aerial combos ──
  _stateJuggle(target, dist, dx, dy) {
    let left = false, right = false, jump = false, down = false;

    // Chase horizontally
    if (Math.abs(dx) > 30) {
      if (dx > 0) right = true;
      else left = true;
    }

    // Jump to meet them in the air
    if (dy < -40 && this.bot.onFloor) {
      jump = true;
    } else if (dy < -80 && !this.bot.onFloor && this.bot.canDoubleJump) {
      jump = true;
    }

    // Air attack
    if (dist < 90 && this.attackCooldown <= 0 && !this.bot.isAttacking && this.bot.hitstunTimer <= 0) {
      this.bot.attack();
      this.attackCooldown = 0.25;
    }

    // Throw slash upward if they're far above
    if (dist > 100 && dist < 300 && this.slashCooldown <= 0 && !this.bot.isAttacking) {
      this.bot.facing = dx > 0 ? 1 : -1;
      this.bot.throwSlash();
      this.slashCooldown = 0.5;
    }

    return { left, right, jump, down };
  }

  // ── EDGEGUARD: Keep opponent from recovering ──
  _stateEdgeguard(target, dist, dx, dy, arena) {
    let left = false, right = false, jump = false, down = false;

    // Position near the ledge closest to the opponent
    const ledgeX = target.x < arena.minX + 200 ? arena.minX + 80 : arena.maxX - 80;

    if (Math.abs(this.bot.x - ledgeX) > 60) {
      if (this.bot.x < ledgeX) right = true;
      else left = true;
    }

    // Throw projectile slashes off-stage to intercept recovery
    if (this.slashCooldown <= 0 && !this.bot.isAttacking && this.bot.hitstunTimer <= 0) {
      this.bot.facing = dx > 0 ? 1 : -1;
      this.bot.throwSlash();
      this.slashCooldown = 0.5;
    }

    // If they get close to the ledge, attack to knock them back off
    if (dist < 90 && this.attackCooldown <= 0 && !this.bot.isAttacking && this.bot.hitstunTimer <= 0) {
      if (this.skillCooldown <= 0) {
        this.bot.skill(1); // Heavy hit for big knockback
        this.skillCooldown = 1.0;
      } else {
        this.bot.attack();
      }
      this.attackCooldown = 0.3;
    }

    return { left, right, jump, down };
  }

  // ── RECOVERY: Get back to stage safely ──
  _stateRecovery(arena, target) {
    let left = false, right = false, jump = false, down = false;

    // Jump toward center stage
    if (this.bot.vy > 0 || this.bot.y > 650) {
      jump = true;
    }

    // Steer toward center
    const centerX = (arena.minX + arena.maxX) / 2;
    if (this.bot.x < centerX - 50) right = true;
    else if (this.bot.x > centerX + 50) left = true;

    // Use dash for horizontal recovery if available
    if (this.bot.dashCooldown <= 0 && !this.bot.isDashing && !this.bot.onFloor) {
      const toCenterDir = this.bot.x < centerX ? 1 : -1;
      this.bot.facing = toCenterDir;
      this.bot.dash();
    }

    return { left, right, jump, down };
  }

  // ── NEUTRAL: Balanced approach, looking for openings ──
  _stateNeutral(target, dist, dx, dy, absDx, arena) {
    let left = false, right = false, jump = false, down = false;

    // Maintain optimal fighting distance
    if (dist > this.preferredRange + 25) {
      if (dx > 0) right = true;
      else left = true;
    } else if (dist < this.preferredRange - 20) {
      if (dx > 0) left = true;
      else right = true;
    }

    // Strafe unpredictably
    this.strafeTimer -= 0.033;
    if (this.strafeTimer <= 0) {
      this.strafeDir *= -1;
      this.strafeTimer = 0.2 + Math.random() * 0.4;
    }

    // Platform traversal
    if (dy < -60 && this.bot.onFloor && Math.random() < 0.10) {
      jump = true;
    }
    if (dy > 80 && this.bot.onFloor && Math.random() < 0.08) {
      down = true;
    }

    // Opportunistic attacks
    if (dist < 85 && this.attackCooldown <= 0 && Math.abs(dy) < 55 &&
        !this.bot.isParrying && !this.bot.isDashing && this.bot.hitstunTimer <= 0) {
      this._initiateAttack(target, dist);
    }

    // Occasional zone with projectiles
    if (dist > 150 && dist < 400 && this.slashCooldown <= 0 &&
        !this.bot.isAttacking && this.bot.hitstunTimer <= 0 && Math.random() < 0.06) {
      this.bot.facing = dx > 0 ? 1 : -1;
      this.bot.throwSlash();
      this.slashCooldown = 0.7;
    }

    return { left, right, jump, down };
  }

  // ════════════════════════════════════════════════════════════
  // COMBAT SYSTEMS
  // ════════════════════════════════════════════════════════════

  // ── Attack Initiation: Choose optimal attack based on context ──
  _initiateAttack(target, dist) {
    if (this.bot.isAttacking || this.bot.isDashing || this.bot.isParrying || this.bot.isDead) return;
    if (this.bot.hitstunTimer > 0) return;

    const dx = target.x - this.bot.x;
    this.bot.facing = dx > 0 ? 1 : -1;

    // Choose attack type based on situation
    const hasCounter = this.bot.hasCounterBuff;
    const targetLowHp = target.hp / target.maxHp < 0.25;
    const rand = Math.random();

    if (hasCounter) {
      // Counter buff active: use strongest available attack for 2x damage
      if (this.skillCooldown <= 0 && dist < 80) {
        if (rand < 0.4) {
          this.bot.skill(3); // Ultimate 2x counter = devastating
          this.skillCooldown = 2.0;
        } else if (rand < 0.7) {
          this.bot.skill(2);
          this.skillCooldown = 1.2;
        } else {
          this.bot.skill(1);
          this.skillCooldown = 0.8;
        }
        this.attackCooldown = 0.3;
        return;
      }
      // Or throw a 2x counter slash projectile
      if (this.slashCooldown <= 0 && dist > 60) {
        this.bot.throwSlash(); // 2x counter projectile
        this.slashCooldown = 0.5;
        this.attackCooldown = 0.3;
        return;
      }
    }

    if (targetLowHp && this.skillCooldown <= 0 && dist < 80) {
      // Going for the kill: heavy finisher
      if (rand < 0.5) {
        this.bot.skill(2);
        this.skillCooldown = 1.2;
      } else {
        this.bot.skill(1);
        this.skillCooldown = 0.8;
      }
      this.attackCooldown = 0.3;
      return;
    }

    // Standard combo initiation
    this.bot.attack();
    this.comboStep = 1;
    this.comboChainTimer = 0.45; // Window to chain next hit
    this.wantCombo = Math.random() < this.comboCompletionRate;
    this.attackCooldown = 0.15; // Tight window between combo attempts
  }

  // ── Combo Chain: Buffer inputs to continue attack strings ──
  _executeComboChain(target, dist, dy) {
    if (!this.wantCombo || this.comboChainTimer <= 0) {
      this.wantCombo = false;
      this.comboStep = 0;
      return;
    }

    if (!this.bot.isAttacking) {
      this.wantCombo = false;
      this.comboStep = 0;
      return;
    }

    // Only chain if still in range
    if (dist > 100 || Math.abs(dy) > 70) {
      this.wantCombo = false;
      return;
    }

    // Buffer the next combo hit
    if (this.comboStep < 4) {
      this.bot.attack(); // Buffers into comboBuffer in Stickman
      this.comboStep++;
      this.comboChainTimer = 0.4;

      // Decide if we continue the chain
      if (this.comboStep >= 3) {
        // After 3 hits, chance to finish the full 4-hit chain or cancel into skill
        if (Math.random() < 0.5 && this.skillCooldown <= 0) {
          // Cancel into heavy skill after 3rd hit for max damage
          this.wantCombo = false;
          setTimeout(() => {
            if (!this.bot.isDead && !this.bot.isDashing && this.bot.hitstunTimer <= 0) {
              this.bot.skill(Math.random() < 0.5 ? 2 : 1);
              this.skillCooldown = 1.5;
            }
          }, 180);
        } else {
          this.wantCombo = Math.random() < this.comboCompletionRate;
        }
      }
    } else {
      // Completed full 4-hit combo, reset
      this.wantCombo = false;
      this.comboStep = 0;
      this.attackCooldown = 0.3; // Brief pause after full combo

      // Finish combo with projectile slash for bonus damage
      if (this.slashCooldown <= 0 && Math.random() < 0.65) {
        setTimeout(() => {
          if (!this.bot.isDead && this.bot.hitstunTimer <= 0) {
            const ddx = target.x - this.bot.x;
            this.bot.facing = ddx > 0 ? 1 : -1;
            this.bot.throwSlash();
            this.slashCooldown = 0.5;
          }
        }, 200);
      }
    }
  }

  // ── Reactive Parry: Frame-tight deflection system ──
  _reactiveParry(target, dist, dt) {
    if (this.bot.isParrying || this.bot.isDashing || this.bot.isDead) return;
    if (this.bot.parryCooldown > 0 || this.bot.hitstunTimer > 0) return;
    if (this.bot.isAttacking) return; // Don't interrupt our own attacks

    // Detect incoming threats
    const inMeleeRange = dist < 95;
    const targetAttacking = target.isAttacking && !target.attackLanded;

    // Check for incoming projectile slashes
    let incomingProjectile = false;
    if (typeof Combat !== 'undefined' && Combat.projectiles) {
      for (const proj of Combat.projectiles) {
        if (proj.owner === this.bot) continue;
        const pdx = proj.x - this.bot.x;
        const pdy = proj.y - (this.bot.y - 35);
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        // Projectile is close and heading toward us
        if (pdist < 150 && Math.sign(proj.facing) === Math.sign(pdx * -1)) {
          incomingProjectile = true;
          break;
        }
      }
    }

    // Parry decision
    if (targetAttacking && inMeleeRange) {
      // Melee parry — tight timing for perfect parry
      if (Math.random() < this.parryAccuracy) {
        this.bot.parry();
        this.parryCooldown = 0.25;
      }
    } else if (incomingProjectile) {
      // Projectile parry
      if (Math.random() < this.parryAccuracy * 0.9) {
        this.bot.parry();
        this.parryCooldown = 0.3;
      }
    }
  }

  // ── Ability System: Strategic skill and dash usage ──
  _executeAbilities(target, dist, dx, dy, arena) {
    if (this.bot.isDead || this.bot.hitstunTimer > 0 || this.bot.isParrying) return;

    // Dash-through mixup: dash through the opponent to cross them up
    if (dist < 90 && dist > 40 && this.bot.dashCooldown <= 0 && !this.bot.isDashing &&
        !this.bot.isAttacking && Math.abs(dy) < 40 && Math.random() < 0.04) {
      this.bot.facing = dx > 0 ? 1 : -1;
      this.bot.dash();
      this.dashCooldown = 0.7;

      // Attack immediately after dash
      setTimeout(() => {
        if (!this.bot.isDead && this.bot.hitstunTimer <= 0) {
          // Reverse facing for cross-up
          this.bot.facing *= -1;
          if (this.skillCooldown <= 0) {
            this.bot.skill(1);
            this.skillCooldown = 0.8;
          } else {
            this.bot.attack();
          }
          this.attackCooldown = 0.3;
        }
      }, 250);
    }

    // Use skills when not currently attacking and in medium range
    if (!this.bot.isAttacking && this.skillCooldown <= 0 && this.attackCooldown <= 0) {
      // Skill 3 (Ultimate) — use only when certain to land (target stunned or very close after combo)
      if (target.hitstunTimer > 0.15 && dist < 75 && Math.random() < 0.3) {
        this.bot.facing = dx > 0 ? 1 : -1;
        this.bot.skill(3);
        this.skillCooldown = 2.5;
        this.attackCooldown = 0.5;
        return;
      }

      // Skill 2 (Flurry) — good range punish
      if (dist < 80 && dist > 40 && target.hitstunTimer > 0 && Math.random() < 0.25) {
        this.bot.facing = dx > 0 ? 1 : -1;
        this.bot.skill(2);
        this.skillCooldown = 1.5;
        this.attackCooldown = 0.3;
        return;
      }

      // Skill 1 (Heavy Strike) — poke tool
      if (dist < 80 && !target.isParrying && Math.random() < 0.08) {
        this.bot.facing = dx > 0 ? 1 : -1;
        this.bot.skill(1);
        this.skillCooldown = 0.9;
        this.attackCooldown = 0.3;
        return;
      }
    }

    // Projectile slash zoning
    if (this.slashCooldown <= 0 && !this.bot.isAttacking && this.bot.hitstunTimer <= 0) {
      // Throw slash at mid-range
      if (dist > 120 && dist < 450 && Math.abs(dy) < 80 && Math.random() < 0.05) {
        this.bot.facing = dx > 0 ? 1 : -1;
        this.bot.throwSlash();
        this.slashCooldown = 0.6;
        this.attackCooldown = 0.2;
      }

      // Throw slash after landing a combo for extra chip
      if (this.consecutiveHits >= 2 && dist > 80 && dist < 300 && Math.random() < 0.3) {
        this.bot.facing = dx > 0 ? 1 : -1;
        this.bot.throwSlash();
        this.slashCooldown = 0.5;
        this.consecutiveHits = 0;
      }
    }
  }

  // ── Off-Stage Recovery: Smart recovery to survive ──
  _offStageRecovery(arena, target) {
    // Only trigger when genuinely off-stage or in danger
    if (this.bot.y <= 680 || this.bot.onFloor) return null;

    let left = false, right = false, jump = false;

    // Falling off — recover!
    if (this.bot.vy > 0 && this.bot.y > 700) {
      jump = true; // Use double jump / wall jump

      // Steer toward nearest platform
      const centerX = (arena.minX + arena.maxX) / 2;
      if (this.bot.x < centerX) right = true;
      else left = true;

      // Dash for horizontal distance if needed
      if (this.bot.dashCooldown <= 0 && !this.bot.isDashing && this.bot.y > 750) {
        const toCenterDir = this.bot.x < centerX ? 1 : -1;
        this.bot.facing = toCenterDir;
        this.bot.dash();
      }
    }

    // Wall jump if sliding
    if (this.bot.isWallSliding) {
      jump = true;
    }

    return (left || right || jump) ? { left, right, jump } : null;
  }

  // ════════════════════════════════════════════════════════════
  // PATTERN ANALYSIS — Reads the player to adapt strategy
  // ════════════════════════════════════════════════════════════
  _analyzePlayerPatterns(dt, target, dist) {
    this.patternResetTimer += dt;

    // Track player actions
    if (target.isAttacking && !target._lastTrackedAttacking) {
      this.playerAttackCount++;
    }
    target._lastTrackedAttacking = target.isAttacking;

    if (target.isParrying && !target._lastTrackedParrying) {
      this.playerParryCount++;
    }
    target._lastTrackedParrying = target.isParrying;

    if (target.isDashing && !target._lastTrackedDashing) {
      this.playerDashCount++;
    }
    target._lastTrackedDashing = target.isDashing;

    if (!target.onFloor && !target._lastTrackedAirborne) {
      this.playerJumpCount++;
    }
    target._lastTrackedAirborne = !target.onFloor;

    // Track idle time
    if (!target.isAttacking && !target.isDashing && !target.isParrying && target.onFloor &&
        Math.abs(target.vx) < 30) {
      this.playerIdleTime += dt;
    } else {
      this.playerIdleTime = Math.max(0, this.playerIdleTime - dt * 2);
    }

    // Reset and recalculate every 5 seconds
    if (this.patternResetTimer >= 5.0) {
      const total = this.playerAttackCount + this.playerParryCount +
                    this.playerDashCount + this.playerJumpCount + 1;

      const attackRate = this.playerAttackCount / total;
      const parryRate = this.playerParryCount / total;
      const jumpRate = this.playerJumpCount / total;

      // Calculate aggression score
      this.playerAggression = Math.min(1, attackRate * 2 + this.playerDashCount / total);

      // Determine tendency
      if (attackRate > 0.4) {
        this.playerTendency = 'rushdown';
        this.preferredRange = 90; // Stay closer to parry their attacks
      } else if (parryRate > 0.3) {
        this.playerTendency = 'defensive';
        this.preferredRange = 65; // Close in to break their guard
      } else if (jumpRate > 0.35) {
        this.playerTendency = 'jumpy';
        this.preferredRange = 100; // Anti-air spacing
      } else {
        this.playerTendency = 'mixed';
        this.preferredRange = 75;
      }

      // Adapt parry accuracy based on how often player attacks
      // (parry more against aggressive players)
      if (this.playerTendency === 'rushdown') {
        this.parryAccuracy = Math.min(0.92, this.parryAccuracy + 0.02);
      }

      // Reset counters
      this.playerAttackCount = 0;
      this.playerParryCount = 0;
      this.playerDashCount = 0;
      this.playerJumpCount = 0;
      this.patternResetTimer = 0;
    }

    // Track consecutive hits for combo tracking
    if (this.bot.isAttacking && this.bot.attackLanded) {
      this.consecutiveHits++;
      this.consecutiveMisses = 0;
    }
  }
}
