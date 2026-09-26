const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock browser environment
global.window = global;
global.performance = { now: () => 1000 };
global.Image = class {
  constructor() {
    this.complete = true;
    this.onload = null;
  }
  set src(val) { this._src = val; }
  get src() { return this._src; }
};

// Mock Audio
global.Audio = {
  init: () => {},
  playWhoosh: () => {},
  playDeflect: () => {},
  playPerfectParry: () => {},
  playHit: () => {},
  playDash: () => {},
  playJump: () => {},
  playDoubleJump: () => {},
};

// Load scripts
const scripts = [
  '../web/js/particles.js',
  '../web/js/arena.js',
  '../web/js/sprite_loader.js',
  '../web/js/stickman.js',
  '../web/js/combat.js',
];

for (const s of scripts) {
  const code = fs.readFileSync(path.join(__dirname, s), 'utf8');
  vm.runInThisContext(code);
}

console.log("=== Testing Deflection Stance & Animation ===");

const arena = new Arena();
const p1 = new Stickman({ name: 'Player 1', variant: 'shadow', x: 450, y: 678, facing: 1 });
const p2 = new Stickman({ name: 'Dummy', variant: 'yellow', x: 500, y: 678, facing: -1 });

// Test 1: Trigger Parry
p1.parry();
console.log("p1.isParrying:", p1.isParrying);
console.log("p1.animName:", p1.animName);
if (!p1.isParrying || p1.animName !== 'deflect') {
  console.error("FAIL: Parry did not set deflect animation!");
  process.exit(1);
}

// Advance frames to check pose hold
p1.update(0.08, arena);
p1.update(0.08, arena);
console.log("p1.animFrame after update:", p1.animFrame);
if (p1.animFrame !== 2) {
  console.error("FAIL: Parry did not hold frame 2 guard pose!");
  process.exit(1);
}

// Test 2: Normal Deflect Impact
p1.parryTimer = 0.20; // past perfect parry window (0.15s)
const hitbox = { x: p1.x + 10, y: p1.y - 30, w: 40, h: 40, damage: 20, knockback: 200 };
Combat.resolveHit(p2, p1, hitbox);

console.log("After normal deflect: p1 HP:", p1.hp, "p1 anim after clash flick:", p1.animName);
if (p1.hp !== 100) {
  console.error("FAIL: Deflect did not block 100% damage!");
  process.exit(1);
}
if (VFX.clashFlashes.length === 0) {
  console.error("FAIL: Clash flash was not spawned!");
  process.exit(1);
}
console.log("Spawned clash flashes:", VFX.clashFlashes.length, "particles:", VFX.particles.length);

// Test 3: Perfect Deflect Impact
p1.reset(450, 678);
p1.parry();
p1.parryTimer = 0.05; // well inside perfect window (<0.15s)
Combat.resolveHit(p2, p1, hitbox);

console.log("After perfect deflect: hasCounterBuff:", p1.hasCounterBuff, "p2 hitstunTimer:", p2.hitstunTimer);
if (!p1.hasCounterBuff || p2.hitstunTimer <= 0) {
  console.error("FAIL: Perfect deflect did not grant counter buff or stagger attacker!");
  process.exit(1);
}

console.log("\nALL DEFLECTION TESTS PASSED PERFECTLY!");
