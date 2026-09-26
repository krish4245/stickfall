// Verification test for all 12 Cropped Arenas & Collision Alignment
const fs = require('fs');
const path = require('path');

// Mock browser globals
global.Image = class {
  constructor() {
    this.complete = true;
    this.onload = null;
  }
  set src(val) {
    this._src = val;
  }
  get src() {
    return this._src;
  }
};

const vm = require('vm');
const arenaCode = fs.readFileSync(path.join(__dirname, '../web/js/arena.js'), 'utf8');
vm.runInThisContext(arenaCode);

console.log("=== Testing 12 Arenas ===");
const arenaKeys = Object.keys(ARENA_DATABASE);
console.log(`Found ${arenaKeys.length} arenas in database.`);

if (arenaKeys.length !== 12) {
  console.error("FAIL: Expected 12 arenas, got " + arenaKeys.length);
  process.exit(1);
}

const arena = new Arena();

for (const id of arenaKeys) {
  arena.loadArena(id);
  const def = ARENA_DATABASE[id];

  // Verify image file exists on disk
  const filePath = path.join(__dirname, '../web', def.file);
  if (!fs.existsSync(filePath)) {
    console.error(`FAIL: Arena image file not found: ${filePath}`);
    process.exit(1);
  }

  // Check platforms
  if (!def.platforms || def.platforms.length < 3) {
    console.error(`FAIL: Arena ${id} has insufficient platforms.`);
    process.exit(1);
  }

  // Check solid ground floor
  const ground = def.platforms.find(p => p.isSolid);
  if (!ground || ground.y < 600 || ground.y > 750) {
    console.error(`FAIL: Arena ${id} does not have a valid ground floor:`, ground);
    process.exit(1);
  }

  console.log(`[PASS] ${id}: "${def.name}" (${def.platforms.length} platforms, ground y=${ground.y}, particles=${def.particleType})`);
}

// Test Random Arena Selection
console.log("\n=== Testing Random Selection ===");
const picked = new Set();
for (let i = 0; i < 50; i++) {
  const chosen = arena.setRandomArena();
  picked.add(chosen);
}
console.log(`Random selection chose ${picked.size} unique arenas out of 12 across 50 rolls.`);
if (picked.size < 8) {
  console.error("FAIL: Random arena selection distribution is too narrow!");
  process.exit(1);
}

console.log("\nALL 12 ARENAS VERIFIED SUCCESSFULLY!");
