const fs = require('fs');
const vm = require('vm');

const context = {
  console,
  Math,
  Float32Array,
  window: {
    AudioContext: class {
      constructor() { this.currentTime = 0; this.sampleRate = 44100; this.state = 'running'; this.destination = {}; }
      resume() {}
      createOscillator() { return { type: 'sine', frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
      createGain() { return { gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }; }
      createBiquadFilter() { return { type: 'bandpass', frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, Q: { value: 1 }, connect: () => {} }; }
      createBuffer(c, s, r) { return { getChannelData: () => new Float32Array(s) }; }
      createBufferSource() { return { buffer: null, connect: () => {}, start: () => {}, stop: () => {} }; }
    }
  },
  document: {
    addEventListener: () => {},
    getElementById: () => ({ addEventListener: () => {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} } }),
    querySelectorAll: () => [],
  },
  Image: class { constructor() { this.width = 128; this.height = 64; } },
};
vm.createContext(context);

function load(file) {
  const code = fs.readFileSync(file, 'utf8');
  vm.runInContext(code, context);
}

load('web/js/audio.js');
load('web/js/particles.js');
load('web/js/arena.js');
load('web/js/sprite_loader.js');
load('web/js/stickman.js');
load('web/js/combat.js');
load('web/js/ai.js');

const testCode = `
const arena = new Arena();

// Test 1: Left Wall Slide
const p1 = new Stickman({ x: 200, y: 300 });
p1.onFloor = false;
p1.vx = -400;
p1.vy = 200;
for (let i = 0; i < 20; i++) {
  p1.update(0.016, arena, { left: true, right: false, down: false });
}
console.log('Test 1 (Left wall slide):', { x: p1.x, isWallSliding: p1.isWallSliding, wallDir: p1.wallDir, anim: p1.animName, vy: p1.vy });
if (!p1.isWallSliding || p1.wallDir !== -1 || p1.animName !== 'wall_slide') throw new Error('Left wall slide failed');

// Test 2: Wall Jump Somersault
p1.canDoubleJump = false;
p1.jump();
console.log('Test 2 (Wall jump kick):', { isWallJumping: p1.isWallJumping, vx: p1.vx, vy: p1.vy, facing: p1.facing, canDoubleJump: p1.canDoubleJump });
if (!p1.isWallJumping || p1.vx < 500 || p1.vy > -500 || p1.facing !== 1 || !p1.canDoubleJump) throw new Error('Wall jump failed');

let maxAngle = 0;
for (let i = 0; i < 25; i++) {
  p1.update(0.016, arena, {});
  if (p1.flipAngle > maxAngle) maxAngle = p1.flipAngle;
}
console.log('  Max flip angle (rad):', maxAngle.toFixed(2), '(' + (maxAngle * 180 / Math.PI).toFixed(0) + ' deg)');

// Test 3: Right Wall Slide & Jump
const p2 = new Stickman({ x: arena.maxX - 5, y: 350 });
p2.onFloor = false;
p2.vx = 200;
p2.vy = 50;
p2.update(0.016, arena, { right: true, left: false, down: false });
console.log('Test 3 (Right wall slide):', { isWallSliding: p2.isWallSliding, wallDir: p2.wallDir, facing: p2.facing });
p2.jump();
console.log('  Right wall jump kick:', { isWallJumping: p2.isWallJumping, vx: p2.vx, vy: p2.vy, facing: p2.facing });
if (p2.vx > -500 || p2.facing !== -1) throw new Error('Right wall jump failed');

// Test 4: Acrobatic combo (Wall Jump -> Double Jump -> Aerial Crescent Slash)
const p3 = new Stickman({ x: arena.minX, y: 400 });
p3.onFloor = false;
p3.isWallSliding = true;
p3.wallDir = -1;
p3.jump();
for (let i = 0; i < 8; i++) p3.update(0.016, arena, {});
p3.jump(); // Double Jump mid-air
if (p3.isWallJumping || p3.canDoubleJump) throw new Error('Mid-air double jump combo failed');
p3.throwSlash();
if (Combat.projectiles.length === 0) throw new Error('Aerial crescent slash throw failed');
console.log('Test 4 (Acrobatic Combo): Wall Jump -> Double Jump -> Flying Crescent Slash SUCCESSFUL!');

// Test 5: Bot Wall Jump
const botFighter = new Stickman({ x: arena.minX, y: 400 });
botFighter.onFloor = false;
botFighter.isWallSliding = true;
botFighter.wallDir = -1;
const bot = new BotController(botFighter, 'fighter');
const botInput = bot.update(0.016, new Stickman({ x: 800, y: 400 }), arena);
console.log('Test 5 (Bot Wall Jump Input):', botInput.jump);
if (!botInput.jump) throw new Error('Bot wall jump trigger failed');

console.log('\\nALL 5 ACROBATICS VERIFICATION TESTS PASSED PERFECTLY!');
`;

vm.runInContext(testCode, context);
