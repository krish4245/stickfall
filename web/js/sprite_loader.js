// ============================================================
// STICKFALL Sprite Sheet Animation Manager
// Verified 128x64 Grid — 100% Non-Empty Continuous Frames
// ============================================================

const ANIMATION_DEFS = {
  idle:       { file: 'idle.png',       frames: 4,  fps: 8,  loop: true },
  run:        { file: 'run.png',        frames: 10, fps: 18, loop: true },
  jump:       { file: 'jump.png',       frames: 3,  fps: 12, loop: false },
  jump_peak:  { file: 'jump_peak.png',  frames: 3,  fps: 12, loop: false },
  fall:       { file: 'fall.png',       frames: 4,  fps: 12, loop: true },
  attack1:    { file: 'attack1.png',    frames: 10, fps: 24, loop: false, hitStart: 2, hitEnd: 6,  damage: 15, kb: 380 },
  attack2:    { file: 'attack2.png',    frames: 8,  fps: 24, loop: false, hitStart: 2, hitEnd: 5,  damage: 20, kb: 440 },
  attack3:    { file: 'attack3.png',    frames: 10, fps: 24, loop: false, hitStart: 2, hitEnd: 7,  damage: 26, kb: 500 },
  attack4:    { file: 'attack4.png',    frames: 16, fps: 26, loop: false, hitStart: 3, hitEnd: 12, damage: 38, kb: 680 },
  dash:       { file: 'dash.png',       frames: 11, fps: 32, loop: false, isInvincible: true },
  hit:        { file: 'hit1.png',       frames: 3,  fps: 14, loop: false },
  hit2:       { file: 'hit2.png',       frames: 3,  fps: 14, loop: false },
  hit3:       { file: 'hit3.png',       frames: 3,  fps: 14, loop: false },
  deflect:    { file: 'start_skill3.png', frames: 3,  fps: 16, loop: false },
  wall_slide: { file: 'start_jump.png',   frames: 3,  fps: 8,  loop: false },
  skill1:     { file: 'skill1.png',     frames: 9,  fps: 22, loop: false, hitStart: 2, hitEnd: 7,  damage: 42, kb: 600 },
  skill2:     { file: 'skill2.png',     frames: 19, fps: 26, loop: false, hitStart: 3, hitEnd: 14, damage: 58, kb: 740 },
  skill3:     { file: 'skill3.png',     frames: 25, fps: 28, loop: false, hitStart: 4, hitEnd: 19, damage: 80, kb: 900 },
};

class SpriteAtlas {
  constructor() {
    this.sheets = {};
    this.loaded = false;
  }

  preloadAll(onComplete) {
    const variants = {
      shadow:  'assets/stickman_shadow/',
      yellow:  'assets/stickman/',
      cyan:    'assets/stickman_cyan/',
      crimson: 'assets/stickman_crimson/',
      toxic:   'assets/stickman_toxic/',
    };

    let totalImages = Object.keys(variants).length * Object.keys(ANIMATION_DEFS).length;
    let loadedImages = 0;

    for (const [varKey, basePath] of Object.entries(variants)) {
      this.sheets[varKey] = {};
      for (const [animKey, def] of Object.entries(ANIMATION_DEFS)) {
        const img = new Image();
        img.src = `${basePath}${def.file}`;
        img.onload = () => {
          loadedImages++;
          if (loadedImages >= totalImages) {
            this.loaded = true;
            if (onComplete) onComplete();
          }
        };
        img.onerror = () => {
          loadedImages++;
          if (loadedImages >= totalImages) {
            this.loaded = true;
            if (onComplete) onComplete();
          }
        };
        this.sheets[varKey][animKey] = img;
      }
    }
  }

  getImage(variant, animKey) {
    if (this.sheets[variant] && this.sheets[variant][animKey]) {
      return this.sheets[variant][animKey];
    }
    return this.sheets['yellow'] ? this.sheets['yellow'][animKey] : null;
  }
}

const Sprites = new SpriteAtlas();
