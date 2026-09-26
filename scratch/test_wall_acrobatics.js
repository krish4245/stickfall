// ============================================================
// Comprehensive Headless Test Suite for Wall Slide & Somersault Acrobatics
// ============================================================

const fs = require('fs');

// Mock browser globals
global.window = {
  addEventListener: () => {},
  AudioContext: class {
    constructor() {
      this.currentTime = 0;
      this.sampleRate = 44100;
      this.state = 'running';
      this.destination = {};
    }
    resume() {}
    createOscillator() {
      return {
        type: 'sine',
        frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {},
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
      };
    }
    createBiquadFilter() {
      return {
        type: 'bandpass',
        frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        Q: { value: 1 },
        connect: () => {},
      };
    }
    createBuffer(c, s, r) {
      return {
        getChannelData: () => new Float32Array(s),
      };
    }
    createBufferSource() {
      return {
        buffer: null,
        connect: () => {},
        start: () => {},
        stop: () => {},
      };
    }
  },
};
global.document = {
  addEventListener: () => {},
  getElementById: () => ({ addEventListener: () => {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} } }),
  querySelectorAll: () => [],
};
global.Image = class {
  constructor() {
    this.width = 128;
    this.height = 64;
  }
};

// Load game files in order
function loadScript(path) {
  const code = fs.readFileSync(path, 'utf8');
  eval(code);
}

loadScript('web/js/audio.js');
loadScript('web/js/particles.js');
global.VFX = new ParticleSystem();
loadScript('web/js/arena.js');
loadScript('web/js/sprite_loader.js');
loadScript('web/js/stickman.js');
loadScript('web/js/combat.js');
loadScript('web/js/ai.js');

console.log("--- Starting Wall Acrobatics Verification Tests ---");

const arena = new Arena();

// Test 1: Wall Cling & Slide on Left Wall
{
  const p = new Stickman({ x: 200, y: 300 });
  // Move towards left wall in mid air
  p.onFloor = false;
  p.vx = -400;
  p.vy = 200;

  // Simulate falling towards left wall
  for (let i = 0; i < 20; i++) {
    p.update(0.016, arena, { left: true, right: false, down: false });
  }

  console.log(`Test 1 (Left Wall Slide): x=${p.x}, isWallSliding=${p.isWallSliding}, wallDir=${p.wallDir}, animName=${p.animName}`);
  if (!p.isWallSliding || p.wallDir !== -1 || p.animName !== 'wall_slide') {
    throw new Error(`Left wall slide failed: isWallSliding=${p.isWallSliding}, wallDir=${p.wallDir}, animName=${p.animName}`);
  }
  // Verify friction speed clamp
  if (p.vy > 130) {
    throw new Error(`Friction clamp failed: vy=${p.vy} should be <= 130`);
  }
  // Verify sparks spawned
  if (VFX.particles.length === 0) {
    throw new Error(`Expected wall slide friction sparks, found 0`);
  }
  console.log(`  ✓ Left wall cling & slide verified with friction and sparks (particles=${VFX.particles.length})`);
}

// Test 2: Acrobatic Somersault Wall Jump
{
  const p = new Stickman({ x: arena.minX, y: 400 });
  p.onFloor = false;
  p.isWallSliding = true;
  p.wallDir = -1;
  p.canDoubleJump = false; // Intentionally false to verify wall jump restores it

  const initialParticles = VFX.particles.length;
  const initialShockwaves = VFX.shockwaves.length;

  p.jump();

  console.log(`Test 2 (Wall Jump Launch): isWallJumping=${p.isWallJumping}, vx=${p.vx}, vy=${p.vy}, facing=${p.facing}, canDoubleJump=${p.canDoubleJump}`);
  if (!p.isWallJumping) throw new Error("Expected isWallJumping to be true");
  if (p.vx <= 500) throw new Error(`Expected strong forward vx away from wall, got ${p.vx}`);
  if (p.vy >= -500) throw new Error(`Expected strong upward vy, got ${p.vy}`);
  if (p.facing !== 1) throw new Error(`Expected facing to flip outward (1), got ${p.facing}`);
  if (!p.canDoubleJump) throw new Error("Expected wall jump to refresh canDoubleJump");
  if (VFX.shockwaves.length <= initialShockwaves) throw new Error("Expected wall kick shockwave to spawn");
  if (VFX.particles.length <= initialParticles) throw new Error("Expected wall kick kinetic particles to spawn");

  // Track 360-degree somersault flip progression
  let angles = [];
  for (let frame = 0; frame < 25; frame++) {
    p.update(0.016, arena, {});
    angles.push(p.flipAngle);
  }
  const maxAngle = Math.max(...angles);
  console.log(`  Flip progression: start=${angles[0].toFixed(2)} rad, max=${maxAngle.toFixed(2)} rad (${(maxAngle * 180 / Math.PI).toFixed(0)} deg)`);
  if (maxAngle < Math.PI * 1.5) {
    throw new Error(`Expected somersault to rotate near 2PI, got ${maxAngle}`);
  }
  console.log("  ✓ Acrobatic 360-degree somersault flip verified");
}

// Test 3: Wall Cling & Slide on Right Wall
{
  const p = new Stickman({ x: arena.maxX - 5, y: 350 });
  p.onFloor = false;
  p.vx = 200;
  p.vy = 50;

  p.update(0.016, arena, { right: true, left: false, down: false });

  console.log(`Test 3 (Right Wall Slide): isWallSliding=${p.isWallSliding}, wallDir=${p.wallDir}, facing=${p.facing}`);
  if (!p.isWallSliding || p.wallDir !== 1 || p.facing !== 1) {
    throw new Error(`Right wall slide failed: isWallSliding=${p.isWallSliding}, wallDir=${p.wallDir}, facing=${p.facing}`);
  }

  // Jump off right wall
  p.jump();
  console.log(`  Wall Jump off right wall: vx=${p.vx}, vy=${p.vy}, facing=${p.facing}`);
  if (p.vx >= -500) throw new Error(`Expected negative vx launching left into arena, got ${p.vx}`);
  if (p.facing !== -1) throw new Error(`Expected facing left (-1), got ${p.facing}`);
  console.log("  ✓ Right wall slide and jump kick-off verified");
}

// Test 4: Acrobatic Aerial Combo (Wall Jump -> Double Jump -> Aerial Slash)
{
  const p = new Stickman({ x: arena.minX, y: 400 });
  p.onFloor = false;
  p.isWallSliding = true;
  p.wallDir = -1;

  // 1. Wall Jump off wall
  p.jump();
  if (!p.isWallJumping) throw new Error("Wall jump initiation failed");

  // Advance 10 frames into somersault
  for (let i = 0; i < 10; i++) p.update(0.016, arena, {});

  // 2. Acrobatic mid-air double jump cancel
  p.jump();
  if (p.isWallJumping) throw new Error("Double jump should cancel somersault flip state");
  if (p.flipAngle !== 0) throw new Error("Double jump should reset flipAngle to 0");
  if (p.canDoubleJump) throw new Error("canDoubleJump should now be consumed");

  // 3. Aerial Crescent Slash throw
  p.throwSlash();
  if (Combat.slashes.length === 0) throw new Error("Aerial slash throw failed");

  console.log("  ✓ Acrobatic Combo (Wall Jump -> Mid-Air Double Jump -> Crescent Slash) verified!");
}

// Test 5: Bot Wall Jump Intelligence
{
  const p1 = new Stickman({ x: 800, y: 500 });
  const p2 = new Stickman({ x: arena.minX, y: 400 });
  p2.onFloor = false;
  p2.isWallSliding = true;
  p2.wallDir = -1;

  const bot = new BotController(p2, 'fighter');
  const input = bot.update(0.016, p1, arena);

  console.log(`Test 5 (Bot Wall Jump): bot jump input=${input.jump}`);
  if (!input.jump) {
    throw new Error("Expected bot to trigger wall jump when sliding on wall with player in center");
  }
  console.log("  ✓ CPU Bot wall jump intelligence verified");
}

console.log("\nALL 5 WALL ACROBATICS TESTS PASSED PERFECTLY!");
