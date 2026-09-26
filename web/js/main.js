// ============================================================
// STICKFALL Web Edition — Main Game Loop & Controller
// Real Frame-by-Frame Stickman Animation Integration
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  let savedVariant = null;
  let savedBodyColor = null;
  try {
    savedVariant = localStorage.getItem('stickfall-warrior');
    const storedColor = localStorage.getItem('stickfall-body-color');
    if (/^#[\da-f]{6}$/i.test(storedColor || '')) savedBodyColor = storedColor;
  } catch (_) {}

  const arena = new Arena();

  // Create Players with authentic asset pack sprites
  const p1 = new Stickman({
    name: 'Player 1',
    variant: savedVariant || 'shadow',
    x: 450,
    y: 678,
    facing: 1,
    customBodyColor: savedBodyColor,
  });

  const p2 = new Stickman({
    name: 'Dummy',
    variant: 'yellow',
    x: 1050,
    y: 678,
    facing: -1,
  });

  const bot = new BotController(p2, 'training');

  // Input states
  const keys = {};
  let mouseWorld = { x: 800, y: 500 };
  let gameMode = 'training'; // 'training', 'cpu', '2p'

  // Preload all spritesheets
  Sprites.preloadAll(() => {
    console.log("All stickman sprite sheets loaded!");
  });

  // Camera
  const camera = {
    x: 800,
    y: 500,
    zoom: 1.25,
    targetX: 800,
    targetY: 500,
  };

  // Resize canvas to match window / container with high-DPI scaling
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  let gameState = 'menu'; // 'menu' or 'playing'

  // Input Listeners
  window.addEventListener('keydown', (e) => {
    Audio.init();
    if (gameState !== 'playing') return;
    keys[e.code] = true;

    // Player 1 Jump
    if (e.code === 'KeyW' || e.code === 'Space') {
      p1.jump();
    }

    // Player 1 Flash Dash
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      p1.dash();
    }

    // Player 1 Special Skills (Q: Heavy Strike, E: Flurry, R: Throw Crescent Slash!)
    if (e.code === 'KeyQ') {
      p1.skill(1);
    }
    if (e.code === 'KeyE') {
      p1.skill(2);
    }
    if (e.code === 'KeyR') {
      p1.throwSlash();
    }

    // Player 1 Deflect / Parry (F Key)
    if (e.code === 'KeyF') {
      p1.parry();
    }

    // Player 2 Jump (2P Mode)
    if (gameMode === '2p' && (e.code === 'ArrowUp' || e.code === 'Numpad0')) {
      p2.jump();
    }

    // Player 2 Attack (2P Mode)
    if (gameMode === '2p' && (e.code === 'Enter' || e.code === 'Numpad1' || e.code === 'KeyL')) {
      p2.attack();
    }

    // Player 2 Dash (2P Mode)
    if (gameMode === '2p' && (e.code === 'Numpad2' || e.code === 'KeyK')) {
      p2.dash();
    }

    // Player 2 Deflect (2P Mode)
    if (gameMode === '2p' && (e.code === 'Numpad3' || e.code === 'KeyJ')) {
      p2.parry();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Prevent right-click context menu for smooth in-game deflect shield
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Transform screen coords to world coords via camera
    const vpW = rect.width;
    const vpH = rect.height;
    mouseWorld.x = (screenX - vpW * 0.5) / camera.zoom + camera.x;
    mouseWorld.y = (screenY - vpH * 0.5) / camera.zoom + camera.y;

    if (!p1.isAttacking && !p1.isDashing && !p1.isParrying && !p1.isWallSliding && !p1.isWallJumping && gameState === 'playing') {
      p1.facing = mouseWorld.x >= p1.x ? 1 : -1;
    }
  });

  canvas.addEventListener('mousedown', (e) => {
    Audio.init();
    if (gameState !== 'playing') return;
    if (e.button === 0) {
      p1.attack();
    } else if (e.button === 2) {
      // Right Click Deflect Shield Aura
      p1.parry();
    }
  });

  // Mode Selection Buttons
  const btnTraining = document.getElementById('btnModeTraining');
  const btnCpu = document.getElementById('btnModeCpu');
  const btn2P = document.getElementById('btnMode2P');
  const menuModeCards = document.querySelectorAll('.menu-mode-card');

  function setMode(mode) {
    gameMode = mode;
    [btnTraining, btnCpu, btn2P].forEach(b => b.classList.remove('active'));
    menuModeCards.forEach(c => c.classList.toggle('active', c.dataset.mode === mode));

    const groundY = arena.platforms && arena.platforms[0] ? arena.platforms[0].y : 678;
    if (mode === 'training') {
      btnTraining.classList.add('active');
      bot.setMode('training');
      p2.name = 'Dummy';
      p2.variant = 'yellow';
      p2.maxHp = 100;
      p2.reset(1050, 678);
    } else if (mode === 'cpu') {
      btnCpu.classList.add('active');
      bot.setMode('fighter');
      p2.name = 'CPU Bot';
      p2.variant = 'crimson';
      p2.maxHp = 100;
      p2.reset(1050, 678);
    } else if (mode === '2p') {
      btn2P.classList.add('active');
      p2.name = 'Player 2';
      p2.variant = 'cyan';
      p2.maxHp = 100;
      p2.reset(1050, 678);
    }
    p1.reset(450, 678);
  }

  btnTraining.addEventListener('click', () => setMode('training'));
  btnCpu.addEventListener('click', () => setMode('cpu'));
  btn2P.addEventListener('click', () => setMode('2p'));

  // Reset Button
  document.getElementById('btnReset').addEventListener('click', () => {
    if (koCountdownInterval) {
      clearInterval(koCountdownInterval);
      koCountdownInterval = null;
    }
    koBanner.classList.remove('visible');
    p1.reset(450, 678);
    p2.reset(1050, 678);
    Combat.combo = 0;
  });

  // Sound Toggle
  const btnMute = document.getElementById('btnMute');
  btnMute.addEventListener('click', () => {
    Audio.init();
    Audio.muted = !Audio.muted;
    btnMute.textContent = Audio.muted ? '🔇 Unmute' : '🔊 Sound';
  });

  // Fullscreen Button
  document.getElementById('btnFullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Modals Controller (Controls Guide & Skins Menu)
  const controlsModal = document.getElementById('controlsModal');
  const skinsModal = document.getElementById('skinsModal');

  const btnOpenControls = document.getElementById('btnOpenControls');
  const btnCloseControls = document.getElementById('btnCloseControls');
  const btnOpenSkins = document.getElementById('btnOpenSkins');
  const btnCloseSkins = document.getElementById('btnCloseSkins');

  function openModal(modal) {
    if (modal) modal.classList.add('active');
  }

  function closeModal(modal) {
    if (modal) modal.classList.remove('active');
  }

  btnOpenControls.addEventListener('click', () => openModal(controlsModal));
  btnCloseControls.addEventListener('click', () => closeModal(controlsModal));

  btnOpenSkins.addEventListener('click', () => openModal(skinsModal));
  btnCloseSkins.addEventListener('click', () => closeModal(skinsModal));

  // Close modals on clicking overlay backdrop
  [controlsModal, skinsModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      closeModal(controlsModal);
      closeModal(skinsModal);
    }
  });

  // Main Menu Controller
  const mainMenuScreen = document.getElementById('mainMenuScreen');
  const btnStartGame = document.getElementById('btnStartGame');
  const btnMainMenu = document.getElementById('btnMainMenu');
  const btnMenuSkins = document.getElementById('btnMenuSkins');
  const btnMenuControls = document.getElementById('btnMenuControls');

  // Mode Selection inside Menu
  menuModeCards.forEach(card => {
    card.addEventListener('click', () => {
      const mode = card.dataset.mode;
      setMode(mode);
      Audio.init();
      Audio.playWhoosh();
    });
  });

  // Start Game CTA
  btnStartGame.addEventListener('click', () => {
    Audio.init();
    Audio.playWhoosh();
    mainMenuScreen.classList.remove('active');
    gameState = 'playing';
    p1.reset(450, 678);
    p2.reset(1050, 678);
    Combat.combo = 0;
    VFX.spawnFloatingText(800, 360, '⚡ ROUND 1 — FIGHT!', '#ff3355', 2.0);
  });

  // Return to Menu from game
  btnMainMenu.addEventListener('click', () => {
    mainMenuScreen.classList.add('active');
    gameState = 'menu';
    if (koCountdownInterval) {
      clearInterval(koCountdownInterval);
      koCountdownInterval = null;
    }
    koBanner.classList.remove('visible');
  });

  btnMenuSkins.addEventListener('click', () => openModal(skinsModal));
  btnMenuControls.addEventListener('click', () => openModal(controlsModal));

  // Warrior Skin Selection Menu
  const skinCards = document.querySelectorAll('.skin-card');
  const skinThemes = {
    shadow:  { weapon: '#ff3355', eye: '#ff3355' },
    yellow:  { weapon: '#fbf236', eye: '#ffffff' },
    cyan:    { weapon: '#00e5ff', eye: '#00e5ff' },
    crimson: { weapon: '#ff2244', eye: '#ffdd00' },
    toxic:   { weapon: '#41ff2d', eye: '#41ff2d' },
  };

  const warriorNames = { shadow: 'SHADOW NINJA', yellow: 'GOLDEN GOD', cyan: 'CYBER CYAN', crimson: 'CRIMSON FURY', toxic: 'TOXIC EMERALD' };
  const previewCanvas = document.getElementById('menuFighterPreview');
  const previewCtx = previewCanvas.getContext('2d');
  const menuSkinButtons = document.querySelectorAll('.menu-skin');
  function selectWarrior(variant, playSound = true) {
    p1.variant = variant;
    p1.customBodyColor = null;
    Sprites.clearTintCache();
    try { localStorage.removeItem('stickfall-body-color'); } catch (_) {}
    if (skinThemes[variant]) {
      p1.weaponColor = skinThemes[variant].weapon;
      p1.eyeColor = skinThemes[variant].eye;
    }
    try { localStorage.setItem('stickfall-warrior', variant); } catch (_) {}
    document.getElementById('menuFighterName').textContent = warriorNames[variant] || 'SHADOW NINJA';
    document.getElementById('customColorValue').textContent = 'PRESET';
    document.querySelectorAll('.texture-swatch').forEach(button => button.classList.remove('selected'));
    skinCards.forEach(c => c.classList.toggle('selected', c.dataset.variant === variant));
    menuSkinButtons.forEach(c => {
      const selected = c.dataset.variant === variant;
      c.classList.toggle('selected', selected);
      c.setAttribute('aria-pressed', String(selected));
    });
    if (playSound) Audio.playWhoosh();
  }

  menuSkinButtons.forEach(button => button.addEventListener('click', () => selectWarrior(button.dataset.variant)));
  const paletteCanvas = document.getElementById('customColorPalette');
  const paletteCtx = paletteCanvas.getContext('2d', { willReadFrequently: true });
  const paletteImage = new Image();
  paletteImage.src = 'assets/customizer/Color%20Palette.png';
  paletteImage.onload = () => paletteCtx.drawImage(paletteImage, 0, 0, paletteCanvas.width, paletteCanvas.height);

  function applyBodyColor(color, sourceButton = null) {
    p1.customBodyColor = color;
    p1.weaponColor = color;
    p1.eyeColor = color;
    Sprites.clearTintCache();
    try { localStorage.setItem('stickfall-body-color', color); } catch (_) {}
    document.getElementById('customColorValue').textContent = color.toUpperCase();
    document.querySelectorAll('.texture-swatch').forEach(button => button.classList.toggle('selected', button === sourceButton));
    Audio.playWhoosh();
  }

  document.querySelectorAll('.texture-swatch').forEach(button => {
    button.addEventListener('click', () => applyBodyColor(button.dataset.color, button));
  });
  paletteCanvas.addEventListener('click', event => {
    const rect = paletteCanvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1023, Math.floor((event.clientX - rect.left) * paletteCanvas.width / rect.width)));
    const y = Math.max(0, Math.min(1023, Math.floor((event.clientY - rect.top) * paletteCanvas.height / rect.height)));
    const [r, g, b] = paletteCtx.getImageData(x, y, 1, 1).data;
    applyBodyColor(`#${[r, g, b].map(value => value.toString(16).padStart(2, '0')).join('')}`);
  });

  selectWarrior(p1.variant, false);
  if (savedBodyColor) {
    p1.customBodyColor = savedBodyColor;
    p1.weaponColor = savedBodyColor;
    p1.eyeColor = savedBodyColor;
    document.getElementById('customColorValue').textContent = savedBodyColor.toUpperCase();
  }
  function drawMenuFighter() {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    const source = Sprites.getImage(p1.variant, 'idle');
    // Keep the selected preview on a single idle frame; cycling alternate
    // palette sheets here causes visible flicker while the player browses.
    const frame = 0;
    const image = p1.customBodyColor
      ? Sprites.getTintedImage(p1.variant, 'idle', frame, p1.customBodyColor)
      : source;
    const imageReady = image && (image instanceof HTMLCanvasElement || (image.complete && image.naturalWidth));
    if (imageReady) {
      previewCtx.drawImage(image, p1.customBodyColor ? 0 : frame * 128, 0, 128, 64, 0, 8, 256, 128);
    }
  }

  skinCards.forEach(card => {
    card.addEventListener('click', () => {
      selectWarrior(card.dataset.variant || 'shadow');
    });
  });

  // K.O. Announcement & Round Manager
  const koBanner = document.getElementById('koBanner');
  const koWinnerSub = document.getElementById('koWinnerSub');
  const koRestartTimer = document.getElementById('koRestartTimer');
  let koCountdownInterval = null;

  window.onFighterDefeated = function(loser) {
    let winnerName = 'PLAYER 1';
    if (loser === p1) {
      winnerName = gameMode === '2p' ? 'PLAYER 2' : 'CPU BOT';
    }

    koWinnerSub.textContent = `🏆 ${winnerName} WINS!`;
    koBanner.classList.add('visible');
    Combat.hitstopTimer = 0.25;

    let secondsLeft = 3;
    koRestartTimer.textContent = `Next round starting in ${secondsLeft}s...`;

    if (koCountdownInterval) clearInterval(koCountdownInterval);
    koCountdownInterval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft > 0) {
        koRestartTimer.textContent = `Next round starting in ${secondsLeft}s...`;
      } else {
        clearInterval(koCountdownInterval);
        koCountdownInterval = null;
        koBanner.classList.remove('visible');
        p1.reset(450, 678);
        p2.reset(1050, 678);
        Combat.combo = 0;
      }
    }, 1000);
  };

  // FPS calculation
  let lastTime = performance.now();
  let frameCount = 0;
  let fpsTimer = 0;
  let currentFps = 60;
  const fpsDisplay = document.getElementById('fpsDisplay');

  // UI Elements
  const p1HpBar = document.getElementById('p1HpBar');
  const p1HpText = document.getElementById('p1HpText');
  const p2HpBar = document.getElementById('p2HpBar');
  const p2HpText = document.getElementById('p2HpText');
  const p2NameLabel = document.getElementById('p2NameLabel');
  const comboDisplay = document.getElementById('comboDisplay');

  // Main Loop
  function gameLoop(time) {
    requestAnimationFrame(gameLoop);

    let dt = (time - lastTime) / 1000;
    lastTime = time;

    // Cap delta time to prevent physics anomalies
    dt = Math.min(dt, 0.05);

    // FPS Meter
    frameCount++;
    fpsTimer += dt;
    if (fpsTimer >= 0.5) {
      currentFps = Math.round(frameCount / fpsTimer);
      fpsDisplay.textContent = `${currentFps} FPS`;
      frameCount = 0;
      fpsTimer = 0;
    }

    // Main Menu State: Animate ambient arena atmosphere and render background
    if (gameState === 'menu') {
      arena.update(dt);
      drawMenuFighter(time);
      render();
      return;
    }

    // Hitstop freeze frame handling
    if (Combat.hitstopTimer > 0) {
      Combat.hitstopTimer -= dt;
      if (Combat.screenShake > 0) {
        Combat.screenShake = Math.max(0, Combat.screenShake - dt * 35);
      }
      render();
      return;
    }

    // Update combat engine timers & flying slashes
    Combat.update(dt, arena);

    // Update Arena
    arena.update(dt);

    // Update Player 1 Input
    const p1Input = {
      left: keys['KeyA'] || (gameMode !== '2p' && keys['ArrowLeft']),
      right: keys['KeyD'] || (gameMode !== '2p' && keys['ArrowRight']),
      down: keys['KeyS'] || (gameMode !== '2p' && keys['ArrowDown']),
      aimX: mouseWorld.x,
      aimY: mouseWorld.y,
    };
    p1.update(dt, arena, p1Input);

    // Update Player 2 / Bot Input
    let p2Input = {};
    if (gameMode === '2p') {
      p2Input = {
        left: keys['ArrowLeft'],
        right: keys['ArrowRight'],
        down: keys['ArrowDown'],
        aimX: p1.x,
        aimY: p1.y - 35,
      };
    } else {
      p2Input = bot.update(dt, p1, arena);
      if (p2Input.jump) p2.jump();
    }
    p2.update(dt, arena, p2Input);

    // Collision & Combat Checks
    Combat.checkHits(p1, p2);
    if (gameMode !== 'training') {
      Combat.checkHits(p2, p1);
    }

    // Update Particles
    VFX.update(dt);

    // Update Camera (Smooth Midpoint Tracking with bounds)
    const midX = (p1.x + p2.x) * 0.5;
    const midY = Math.min(p1.y, p2.y) - 60;
    camera.targetX = Math.max(300, Math.min(1300, midX));
    camera.targetY = Math.max(250, Math.min(650, midY));

    // Distance-based dynamic zoom
    const dist = Math.abs(p1.x - p2.x);
    const targetZoom = Math.min(1.4, Math.max(1.1, 1300 / (dist + 550)));
    camera.zoom += (targetZoom - camera.zoom) * 4 * dt;

    camera.x += (camera.targetX - camera.x) * 6 * dt;
    camera.y += (camera.targetY - camera.y) * 6 * dt;

    // Render Frame
    render();

    // Update HUD
    updateHUD();
  }

  function render() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // 1. Guaranteed full physical buffer clear: wipes entire back-buffer to prevent image-on-image trails
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Set crisp DPR transform and save base frame state
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();

    // Pixelated crisp scaling for sprites
    ctx.imageSmoothingEnabled = false;

    // Apply Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (Combat.screenShake > 0) {
      shakeX = (Math.random() - 0.5) * Combat.screenShake * 2;
      shakeY = (Math.random() - 0.5) * Combat.screenShake * 2;
    }

    // Camera transform
    ctx.translate(w * 0.5 + shakeX, h * 0.5 + shakeY);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // 1. Draw Cathedral Background
    arena.drawBackground(ctx, camera);

    // 2. Draw Stickman Fighters (P2 behind P1)
    p2.draw(ctx);
    p1.draw(ctx);

    // 3. Draw Flying Crescent Slashes
    Combat.drawProjectiles(ctx);

    // 4. Draw VFX & Combat Numbers
    VFX.draw(ctx);

    ctx.restore();
  }

  function updateHUD() {
    // P1 Health
    p1HpBar.style.width = `${(p1.hp / p1.maxHp) * 100}%`;
    p1HpText.textContent = `${Math.round(p1.hp)} / ${p1.maxHp}`;

    // P2 Health
    p2NameLabel.textContent = p2.name.toUpperCase();
    p2HpBar.style.width = `${(p2.hp / p2.maxHp) * 100}%`;
    p2HpText.textContent = `${Math.round(p2.hp)} / ${p2.maxHp}`;

    // Combo Counter
    if (Combat.combo > 1) {
      comboDisplay.style.display = 'block';
      comboDisplay.textContent = `🔥 COMBO x${Combat.combo}!`;
    } else {
      comboDisplay.style.display = 'none';
    }
  }

  // Start Loop
  requestAnimationFrame(gameLoop);
});
