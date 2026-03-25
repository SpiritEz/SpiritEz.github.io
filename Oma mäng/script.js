const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const levelValue = document.getElementById("levelValue");
const hpValue = document.getElementById("hpValue");
const enemyValue = document.getElementById("enemyValue");
const upgradeValue = document.getElementById("upgradeValue");
const combatHint = document.getElementById("combatHint");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const menuButtons = document.getElementById("menuButtons");
const playButton = document.getElementById("playButton");
const charactersButton = document.getElementById("charactersButton");
const continueButton = document.getElementById("continueButton");
const playerPicker = document.getElementById("playerPicker");
const actionButton = document.getElementById("actionButton");

const WORLD_WIDTH = canvas.width;
const WORLD_HEIGHT = canvas.height;
const ATTACK_RANGE = 150;
const ATTACK_WIDTH = 120;
const HIT_KNOCKBACK = 44;
const HIT_CONTACT_GRACE = 0.2;

const keys = new Set();

const huggerImg = new Image();
huggerImg.src = "Pildid/hugger.png";
const reggerImg = new Image();
reggerImg.src = "Pildid/Regger.png";
const silmImg = new Image();
silmImg.src = "Pildid/silm.png";
const spawnerImg = new Image();
spawnerImg.src = "Pildid/spawner.png";
const reawnerImg = new Image();
reawnerImg.src = "Pildid/reawner.png";
const fireballImg = new Image();
fireballImg.src = "Pildid/tulepall.png";
const burgirImg = new Image();
burgirImg.src = "Pildid/burgir.png";
const playerImg = new Image();
const PLAYER_SKIN_VERSION = "2";
const SAVE_KEY = "dungeon-dash-save-v1";
const playerSkinSources = [
  "Pildid/pall.png",
  "Pildid/pall_g.png",
  "Pildid/pall_n.png",
  "Pildid/pall_r.png",
  "Pildid/pall_t.png",
  "Pildid/pall_v.png",
  "Pildid/pall_w.png",
  "Pildid/pall_y.png"
];
const saveState = {
  hasPlayed: false,
  continueLevel: 0,
  skinIndex: 0
};
let selectedPlayerSkin = 0;

function getSkinSrc(path) {
  return `${path}?v=${PLAYER_SKIN_VERSION}`;
}

function loadSaveState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    saveState.hasPlayed = Boolean(parsed.hasPlayed);
    saveState.continueLevel = clamp(Number(parsed.continueLevel) || 0, 0, levelConfigs.length - 1);
    saveState.skinIndex = clamp(Number(parsed.skinIndex) || 0, 0, playerSkinSources.length - 1);
    selectedPlayerSkin = saveState.skinIndex;
  } catch {
  }
}

function saveProgress() {
  saveState.skinIndex = selectedPlayerSkin;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveState));
  } catch {
  }
}

function updateContinueButton() {
  if (!continueButton) {
    return;
  }
  continueButton.disabled = !saveState.hasPlayed;
}

function showMainMenu(message = "Choose an option.") {
  overlay.classList.add("menu-screen");
  overlayTitle.textContent = "Dungeon Dash";
  overlayText.textContent = message;
  menuButtons?.classList.add("show");
  playerPicker?.classList.remove("show");
  actionButton.classList.add("hidden");
  updateContinueButton();
  overlay.classList.add("show");
}

playerImg.src = getSkinSrc(playerSkinSources[selectedPlayerSkin]);
const bossImg = new Image();
bossImg.src = "Pildid/pea.png";
const level1BgImg = new Image();
level1BgImg.src = "Pildid/sum.png";
const level2BgImg = new Image();
level2BgImg.src = "Pildid/red.png";
const level3BgImg = new Image();
level3BgImg.src = "Pildid/end.png";

const levelConfigs = [
  {
    name: "Crypt Entrance",
    enemies: [
      { type: "grunt", x: 130, y: 120 },
      { type: "grunt", x: 760, y: 150 },
      { type: "grunt", x: 500, y: 420 }
    ]
  },
  {
    name: "Arrow Hall",
    enemies: [
      { type: "archer", x: 160, y: 100 },
      { type: "archer", x: 760, y: 390 }
    ]
  },
  {
    name: "Boss Chamber",
    enemies: [
      { type: "boss", x: 680, y: 260, hidden: true },
      { type: "archer", x: 220, y: 110 },
      { type: "archer", x: 220, y: 140 },
      { type: "archer", x: 220, y: 400 }
    ]
  }
];

const game = {
  running: false,
  paused: false,
  ended: false,
  won: false,
  level: 0,
  enemies: [],
  projectiles: [],
  pickups: [],
  player: null,
  lastTime: 0,
  levelPause: false,
  feedbackTimer: 0,
  floatingTexts: [],
  currentGruntImage: null,
  currentGruntWidth: 64,
  currentGruntHeight: 64,
  currentGruntHp: 2,
  levelStartGrace: 0
};

function setCombatHint(text, type = "") {
  combatHint.textContent = text;
  combatHint.className = `combat-hint${type ? ` ${type}` : ""}`;
  game.feedbackTimer = 1.1;
}

function addFloatingText(text, x, y, color) {
  game.floatingTexts.push({
    text,
    x,
    y,
    color,
    life: 0.6
  });
}

function addHealthPickup(x, y) {
  game.pickups.push({
    x,
    y,
    radius: 18
  });
}

function createPlayer() {
  return {
    x: 120,
    y: WORLD_HEIGHT / 2,
    radius: 18,
    speed: 240,
    hp: 5,
    maxHp: 5,
    damage: 1,
    attackCooldown: 0,
    hitCooldown: 0,
    facingX: 1,
    facingY: 0
  };
}

function setPlayerSkin(index) {
  selectedPlayerSkin = clamp(index, 0, playerSkinSources.length - 1);
  playerImg.src = getSkinSrc(playerSkinSources[selectedPlayerSkin]);
  saveProgress();

  const buttons = playerPicker.querySelectorAll("button");
  buttons.forEach((button, buttonIndex) => {
    button.classList.toggle("selected", buttonIndex === selectedPlayerSkin);
  });
}

function setupPlayerPicker() {
  if (!playerPicker) {
    return;
  }

  playerPicker.innerHTML = "";

  for (let index = 0; index < playerSkinSources.length; index += 1) {
    const button = document.createElement("button");
    button.type = "button";

    const img = document.createElement("img");
    img.src = getSkinSrc(playerSkinSources[index]);
    img.alt = `Player skin ${index + 1}`;
    img.onerror = () => {
      img.src = getSkinSrc("Pildid/pall.png");
    };

    button.appendChild(img);
    button.addEventListener("click", () => setPlayerSkin(index));
    playerPicker.appendChild(button);
  }

  setPlayerSkin(selectedPlayerSkin);
}

function createEnemy(config) {
  const common = {
    x: config.x,
    y: config.y,
    radius: 40,
    hitCooldown: 0,
    contactCooldown: 0,
    shotCooldown: 0,
    dashCooldown: 0,
    dashTime: 0,
    dashVX: 0,
    dashVY: 0
  };

  if (config.type === "grunt") {
    const enemy = {
      ...common,
      type: "grunt",
      hidden: false,
      radius: 30,
      hp: game.currentGruntHp,
      maxHp: game.currentGruntHp,
      speed: 90,
      color: "#ff6f7d",
      image: game.currentGruntImage,
      drawWidth: game.currentGruntWidth,
      drawHeight: game.currentGruntHeight,
      walkFlip: false,
      walkAnimTimer: 0
    };
    return enemy;
  }

  if (config.type === "archer") {
    const archerHp = game.level === 1 ? 4 : 2;
    return {
      ...common,
      type: "archer",
      hidden: false,
      hp: archerHp,
      maxHp: archerHp,
      speed: 75,
      preferredDistance: 180,
      color: "#ffc36f",
      radius: 24,
      image: silmImg,
      drawWidth: 124,
      drawHeight: 100,
      eggPattern: 0
    };
  }

  return {
    ...common,
    type: "boss",
    hidden: Boolean(config.hidden),
    radius: 32,
    hp: 14,
    maxHp: 14,
    speed: 75,
    color: "#bc7fff",
    image: bossImg,
    drawWidth: 220,
    drawHeight: 210,
    shootInterval: 1.1,
    dashInterval: 2.4
  };
}

function createHuggerEnemy(x, y, useRegger = false) {
  const enemyImage = useRegger ? reggerImg : huggerImg;
  return {
    x,
    y,
    radius: 30,
    hitCooldown: 0,
    contactCooldown: 0,
    shotCooldown: 0,
    dashCooldown: 0,
    dashTime: 0,
    dashVX: 0,
    dashVY: 0,
    type: "grunt",
    hidden: false,
    hp: 2,
    maxHp: 2,
    speed: 90,
    color: "#ff6f7d",
    image: enemyImage,
    drawWidth: 170,
    drawHeight: 100,
    walkFlip: false,
    walkAnimTimer: 0
  };
}

function createSilmEnemy(x, y) {
  return {
    x,
    y,
    radius: 24,
    hitCooldown: 0,
    contactCooldown: 0,
    shotCooldown: 0,
    dashCooldown: 0,
    dashTime: 0,
    dashVX: 0,
    dashVY: 0,
    type: "archer",
    hidden: false,
    hp: 2,
    maxHp: 2,
    speed: 75,
    preferredDistance: 180,
    color: "#ffc36f",
    image: silmImg,
    drawWidth: 124,
    drawHeight: 100,
    eggPattern: 0
  };
}

function resetGame() {
  game.running = false;
  game.paused = false;
  game.ended = false;
  game.won = false;
  game.level = 0;
  game.enemies = [];
  game.projectiles = [];
  game.pickups = [];
  game.player = createPlayer();
  game.lastTime = 0;
  game.levelPause = false;
  game.feedbackTimer = 0;
  game.floatingTexts = [];
  game.currentGruntImage = null;
  game.currentGruntWidth = 64;
  game.currentGruntHeight = 64;
  game.currentGruntHp = 2;
  combatHint.className = "combat-hint";
  combatHint.textContent = "Tip: stand close and face the villain before pressing Space.";
  updateHud();
}

function startLevel(levelIndex) {
  const config = levelConfigs[levelIndex];
  game.level = levelIndex;
  if (levelIndex === 0) {
    game.currentGruntImage = huggerImg;
    game.currentGruntWidth = 170;
    game.currentGruntHeight = 100;
    game.currentGruntHp = 2;
  } else if (levelIndex === 1) {
    game.currentGruntImage = reggerImg;
    game.currentGruntWidth = 170;
    game.currentGruntHeight = 100;
    game.currentGruntHp = 3;
  } else {
    game.currentGruntImage = null;
    game.currentGruntWidth = 64;
    game.currentGruntHeight = 64;
    game.currentGruntHp = 2;
  }
  game.levelStartGrace = 1.0;
  game.projectiles = [];
  game.pickups = [];
  game.enemies = config.enemies.map(createEnemy);
  game.player.x = 120;
  game.player.y = WORLD_HEIGHT / 2;
  game.player.attackCooldown = 0;
  game.player.hitCooldown = 0;
  game.levelPause = false;
  game.paused = false;
  game.running = true;
  saveState.hasPlayed = true;
  saveState.continueLevel = clamp(levelIndex, 0, levelConfigs.length - 1);
  saveProgress();
  hideOverlay();
  updateHud();
}

function setOverlay(title, text, buttonText, showPicker = false) {
  overlay.classList.remove("menu-screen");
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  actionButton.textContent = buttonText;
  actionButton.classList.remove("hidden");
  menuButtons?.classList.remove("show");
  if (playerPicker) {
    playerPicker.classList.toggle("show", showPicker);
  }
  overlay.classList.add("show");
}

function hideOverlay() {
  overlay.classList.remove("show");
}

function updateHud() {
  const visibleEnemies = game.enemies.filter((enemy) => !enemy.hidden);
  levelValue.textContent = String(game.level + 1);
  hpValue.textContent = `${game.player.hp}/${game.player.maxHp}`;
  enemyValue.textContent = String(visibleEnemies.length);
  upgradeValue.textContent = `DMG ${game.player.damage}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.hypot(dx, dy);
}

function takePlayerDamage(amount) {
  if (game.player.hitCooldown > 0 || game.levelStartGrace > 0 || game.ended) {
    return;
  }
  game.player.hp = Math.max(0, game.player.hp - amount);
  game.player.hitCooldown = 0.7;
  updateHud();

  if (game.player.hp <= 0) {
    game.running = false;
    game.ended = true;
    setOverlay("You Died", "Villains got you. Try again from level 1.", "Restart");
  }
}

function checkLevelComplete() {
  if (game.enemies.length > 0 || game.levelPause || game.ended) {
    return;
  }

  game.levelPause = true;
  const isLastLevel = game.level >= levelConfigs.length - 1;

  if (isLastLevel) {
    game.running = false;
    game.won = true;
    setOverlay("Victory!", "You cleared all levels. Hit play to run it again.", "Play Again");
    return;
  }

  game.player.damage += 1;
  saveState.hasPlayed = true;
  saveState.continueLevel = clamp(game.level + 1, 0, levelConfigs.length - 1);
  saveProgress();
  updateHud();

  setOverlay(
    "You Passed!",
    "Great job. Get ready for the next level.",
    "Next Level"
  );
}

function attack() {
  if (!game.running || game.player.attackCooldown > 0) {
    return;
  }

  game.player.attackCooldown = 0.35;
  let hitCount = 0;
  let killCount = 0;

  for (const enemy of game.enemies) {
    if (enemy.hidden) {
      continue;
    }

    const dx = enemy.x - game.player.x;
    const dy = enemy.y - game.player.y;

    const forward = dx * game.player.facingX + dy * game.player.facingY;
    const side = Math.abs(dx * -game.player.facingY + dy * game.player.facingX);

    if (forward > 0 && forward < ATTACK_RANGE && side < ATTACK_WIDTH) {
      hitCount += 1;
      enemy.hp -= game.player.damage;
      enemy.hitCooldown = 0.16;
      enemy.contactCooldown = HIT_CONTACT_GRACE;

      const enemyDistance = Math.max(0.001, Math.hypot(dx, dy));
      enemy.x += (dx / enemyDistance) * HIT_KNOCKBACK;
      enemy.y += (dy / enemyDistance) * HIT_KNOCKBACK;
      enemy.x = clamp(enemy.x, enemy.radius, WORLD_WIDTH - enemy.radius);
      enemy.y = clamp(enemy.y, enemy.radius, WORLD_HEIGHT - enemy.radius);

      if (enemy.hp <= 0) {
        killCount += 1;
        addFloatingText("KILL", enemy.x - 16, enemy.y - enemy.radius - 18, "#ff8f9f");
        if (Math.random() < 0.25) {
          addHealthPickup(enemy.x, enemy.y);
        }
      } else {
        addFloatingText(`-${game.player.damage}`, enemy.x - 8, enemy.y - enemy.radius - 16, "#8dffb7");
      }
    }
  }

  if (killCount > 0) {
    setCombatHint(`Kill x${killCount}! Keep going.`, "kill");
  } else if (hitCount > 0) {
    setCombatHint(`Hit x${hitCount}!`, "hit");
  } else {
    const popupX = game.player.x + game.player.facingX * 50;
    const popupY = game.player.y + game.player.facingY * 50;
    addFloatingText("MISS", popupX - 16, popupY - 10, "#ffd470");
    setCombatHint("Miss. Move closer and face the villain.", "miss");
  }

  game.enemies = game.enemies.filter((enemy) => enemy.hp > 0);
  updateHud();
  checkLevelComplete();
}

function spawnEnemyProjectile(fromX, fromY, toX, toY, speed, damage, color, image = null, spinSpeed = 0) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const projectileRadius = image ? 16 : 5;
  game.projectiles.push({
    x: fromX,
    y: fromY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: projectileRadius,
    fromEnemy: true,
    damage,
    color,
    image,
    angle: 0,
    spinSpeed
  });
}

function updatePlayer(dt) {
  let moveX = 0;
  let moveY = 0;

  if (keys.has("w") || keys.has("arrowup")) moveY -= 1;
  if (keys.has("s") || keys.has("arrowdown")) moveY += 1;
  if (keys.has("a") || keys.has("arrowleft")) moveX -= 1;
  if (keys.has("d") || keys.has("arrowright")) moveX += 1;

  const magnitude = Math.hypot(moveX, moveY);
  if (magnitude > 0) {
    moveX /= magnitude;
    moveY /= magnitude;
    game.player.facingX = moveX;
    game.player.facingY = moveY;
  }

  game.player.x += moveX * game.player.speed * dt;
  game.player.y += moveY * game.player.speed * dt;

  game.player.x = clamp(game.player.x, game.player.radius, WORLD_WIDTH - game.player.radius);
  game.player.y = clamp(game.player.y, game.player.radius, WORLD_HEIGHT - game.player.radius);

  game.player.attackCooldown = Math.max(0, game.player.attackCooldown - dt);
  game.player.hitCooldown = Math.max(0, game.player.hitCooldown - dt);
}

function updateEnemies(dt) {
  for (const enemy of game.enemies) {
    if (enemy.hidden) {
      continue;
    }

    enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);
    enemy.contactCooldown = Math.max(0, enemy.contactCooldown - dt);
    const dx = game.player.x - enemy.x;
    const dy = game.player.y - enemy.y;
    const d = Math.max(0.001, Math.hypot(dx, dy));

    if (enemy.type === "grunt") {
      enemy.x += (dx / d) * enemy.speed * dt;
      enemy.y += (dy / d) * enemy.speed * dt;

      if (enemy.image === reggerImg) {
        enemy.shotCooldown -= dt;
        if (enemy.shotCooldown <= 0) {
          enemy.shotCooldown = 2.1;
          spawnEnemyProjectile(enemy.x, enemy.y, game.player.x, game.player.y, 230, 1, "#ff6b35", fireballImg, 0);
        }
      }

      if (enemy.image === huggerImg || enemy.image === reggerImg) {
        enemy.walkAnimTimer += dt;
        if (enemy.walkAnimTimer >= 0.2) {
          enemy.walkAnimTimer = 0;
          enemy.walkFlip = !enemy.walkFlip;
        }
      }
    } else if (enemy.type === "archer") {
      const desired = enemy.preferredDistance;
      if (d > desired + 20) {
        enemy.x += (dx / d) * enemy.speed * dt;
        enemy.y += (dy / d) * enemy.speed * dt;
      } else if (d < desired - 20) {
        enemy.x -= (dx / d) * enemy.speed * dt;
        enemy.y -= (dy / d) * enemy.speed * dt;
      }

      enemy.shotCooldown -= dt;
      if (enemy.shotCooldown <= 0) {
        enemy.shotCooldown = 2;
        if (game.level === 1) {
          if (enemy.eggPattern % 2 === 0) {
            spawnEnemyProjectile(enemy.x, enemy.y, game.player.x, game.player.y, 210, 1, "#ffd885", reawnerImg, 10);
          } else {
            spawnEnemyProjectile(enemy.x, enemy.y, game.player.x, game.player.y, 210, 1, "#ffd885", spawnerImg, 10);
          }
          enemy.eggPattern += 1;
        } else {
          spawnEnemyProjectile(enemy.x, enemy.y, game.player.x, game.player.y, 210, 1, "#ffd885", spawnerImg, 10);
        }
      }
    } else if (enemy.type === "boss") {
      enemy.shotCooldown -= dt;
      enemy.dashCooldown -= dt;

      if (enemy.dashTime > 0) {
        enemy.dashTime -= dt;
        enemy.x += enemy.dashVX * dt;
        enemy.y += enemy.dashVY * dt;
      } else {
        enemy.x += (dx / d) * enemy.speed * dt;
        enemy.y += (dy / d) * enemy.speed * dt;
      }

      if (enemy.shotCooldown <= 0) {
        enemy.shotCooldown = enemy.shootInterval;
        spawnEnemyProjectile(enemy.x, enemy.y, game.player.x, game.player.y, 260, 1, "#ff6b35", fireballImg, 0);
        if (enemy.shotPattern === undefined) {
          enemy.shotPattern = 0;
        }
        if (enemy.shotPattern % 2 === 0) {
          spawnEnemyProjectile(enemy.x, enemy.y, game.player.x, game.player.y, 220, 1, "#ffd885", spawnerImg, 10);
        } else {
          spawnEnemyProjectile(enemy.x, enemy.y, game.player.x, game.player.y, 220, 1, "#ffd885", reawnerImg, 10);
        }
        enemy.shotPattern += 1;
      }

      if (enemy.dashCooldown <= 0) {
        enemy.dashCooldown = enemy.dashInterval;
        const angle = Math.atan2(dy, dx);
        enemy.dashVX = Math.cos(angle) * 420;
        enemy.dashVY = Math.sin(angle) * 420;
        enemy.dashTime = 0.22;
      }
    }

    enemy.x = clamp(enemy.x, enemy.radius, WORLD_WIDTH - enemy.radius);
    enemy.y = clamp(enemy.y, enemy.radius, WORLD_HEIGHT - enemy.radius);

    const touchDistance = enemy.radius + game.player.radius;
    if (enemy.contactCooldown <= 0 && distance(enemy.x, enemy.y, game.player.x, game.player.y) < touchDistance) {
      takePlayerDamage(enemy.type === "boss" ? 2 : 1);
    }
  }
}

function tryRevealFinalBoss() {
  const finalLevelIndex = levelConfigs.length - 1;
  if (game.level !== finalLevelIndex) {
    return;
  }

  const hiddenBoss = game.enemies.find((enemy) => enemy.type === "boss" && enemy.hidden);
  if (!hiddenBoss) {
    return;
  }

  const hasBlockingEnemies = game.enemies.some(
    (enemy) => !enemy.hidden && (enemy.type === "archer" || enemy.type === "grunt")
  );
  const hasSpawnerShots = game.projectiles.some((projectile) => projectile.image === spawnerImg);

  if (!hasBlockingEnemies && !hasSpawnerShots) {
    hiddenBoss.hidden = false;
    setCombatHint("Boss awakened!", "kill");
  }
}

function updateProjectiles(dt) {
  for (const projectile of game.projectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.angle += projectile.spinSpeed * dt;
  }

  game.projectiles = game.projectiles.filter((projectile) => {
    const inBounds =
      projectile.x >= -20 &&
      projectile.x <= WORLD_WIDTH + 20 &&
      projectile.y >= -20 &&
      projectile.y <= WORLD_HEIGHT + 20;

    if (!inBounds) {
      if (projectile.fromEnemy && projectile.image === spawnerImg) {
        const spawnX = clamp(projectile.x, 30, WORLD_WIDTH - 30);
        const spawnY = clamp(projectile.y, 30, WORLD_HEIGHT - 30);
        game.enemies.push(createHuggerEnemy(spawnX, spawnY, false));
      } else if (projectile.fromEnemy && projectile.image === reawnerImg) {
        const spawnX = clamp(projectile.x, 30, WORLD_WIDTH - 30);
        const spawnY = clamp(projectile.y, 30, WORLD_HEIGHT - 30);
        if (Math.random() < 0.5) {
          game.enemies.push(createSilmEnemy(spawnX, spawnY));
        } else {
          game.enemies.push(createHuggerEnemy(spawnX, spawnY, true));
        }
      }
      return false;
    }

    if (projectile.fromEnemy) {
      const hit =
        distance(projectile.x, projectile.y, game.player.x, game.player.y) <
        projectile.radius + game.player.radius;

      if (hit) {
        takePlayerDamage(projectile.damage);
        return false;
      }
    }

    return true;
  });
}

function updateFloatingTexts(dt) {
  for (const text of game.floatingTexts) {
    text.y -= 28 * dt;
    text.life -= dt;
  }

  game.floatingTexts = game.floatingTexts.filter((text) => text.life > 0);
}

function updatePickups() {
  game.pickups = game.pickups.filter((pickup) => {
    const touchingPlayer =
      distance(pickup.x, pickup.y, game.player.x, game.player.y) < pickup.radius + game.player.radius;

    if (touchingPlayer) {
      const healAmount = Math.max(1, Math.ceil(game.player.maxHp * 0.2));
      game.player.hp = clamp(game.player.hp + healAmount, 0, game.player.maxHp);
      addFloatingText(`+${healAmount} HP`, pickup.x - 18, pickup.y - 18, "#8dffb7");
      setCombatHint("Picked up burgir: +20% HP", "hit");
      return false;
    }

    return true;
  });
}

function update(dt) {
  if (!game.running || game.paused) {
    return;
  }

  game.levelStartGrace = Math.max(0, game.levelStartGrace - dt);

  updatePlayer(dt);
  updateEnemies(dt);
  updateProjectiles(dt);
  updatePickups();
  updateFloatingTexts(dt);
  tryRevealFinalBoss();

  if (game.feedbackTimer > 0) {
    game.feedbackTimer = Math.max(0, game.feedbackTimer - dt);
    if (game.feedbackTimer === 0) {
      combatHint.className = "combat-hint";
      combatHint.textContent = "Tip: stand close and face the villain before pressing Space.";
    }
  }

  checkLevelComplete();
  updateHud();
}

function drawAttackSwing() {
  if (game.player.attackCooldown > 0.24) {
    return;
  }

  const px = game.player.x;
  const py = game.player.y;
  const fx = game.player.facingX;
  const fy = game.player.facingY;

  ctx.strokeStyle = "rgba(130, 220, 255, 0.85)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(px + fx * 24 - fy * 22, py + fy * 24 + fx * 22);
  ctx.lineTo(px + fx * 58, py + fy * 58);
  ctx.lineTo(px + fx * 24 + fy * 22, py + fy * 24 - fx * 22);
  ctx.stroke();
}

function drawEdgeVignette() {
  const centerX = WORLD_WIDTH / 2;
  const centerY = WORLD_HEIGHT / 2;
  const innerRadius = Math.min(WORLD_WIDTH, WORLD_HEIGHT) * 0.22;
  const outerRadius = Math.hypot(WORLD_WIDTH, WORLD_HEIGHT) * 0.55;
  const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius);

  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.62, "rgba(0, 0, 0, 0.24)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.56)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}

function draw() {
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  if (game.level === 0 && level1BgImg.complete && level1BgImg.naturalWidth > 0) {
    ctx.drawImage(level1BgImg, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  } else if (game.level === 1 && level2BgImg.complete && level2BgImg.naturalWidth > 0) {
    ctx.drawImage(level2BgImg, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  } else if (game.level === 2 && level3BgImg.complete && level3BgImg.naturalWidth > 0) {
    ctx.drawImage(level3BgImg, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  for (const projectile of game.projectiles) {
    if (projectile.image && projectile.image.complete && projectile.image.naturalWidth > 0) {
      const size = 40;
      const shouldFlipFireball = projectile.image === fireballImg && game.player.x > WORLD_WIDTH / 2;
      ctx.save();
      ctx.translate(projectile.x, projectile.y);
      ctx.rotate(projectile.angle);
      if (shouldFlipFireball) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(projectile.image, -size / 2, -size / 2, size, size);
      ctx.restore();
    } else {
      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const text of game.floatingTexts) {
    ctx.globalAlpha = clamp(text.life / 0.6, 0, 1);
    ctx.fillStyle = text.color;
    ctx.font = "bold 14px Segoe UI";
    ctx.fillText(text.text, text.x, text.y);
    ctx.globalAlpha = 1;
  }

  for (const pickup of game.pickups) {
    if (burgirImg.complete && burgirImg.naturalWidth > 0) {
      const size = 44;
      ctx.drawImage(burgirImg, pickup.x - size / 2, pickup.y - size / 2, size, size);
    } else {
      ctx.fillStyle = "#78ff9e";
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const enemy of game.enemies) {
    if (enemy.hidden) {
      continue;
    }

    const alpha = enemy.hitCooldown > 0 ? 0.55 : 1;
    ctx.globalAlpha = alpha;

    if (enemy.image && enemy.image.complete && enemy.image.naturalWidth > 0) {
      const shouldFlip = (enemy.image === huggerImg || enemy.image === reggerImg)
        ? enemy.walkFlip
        : game.player.x > enemy.x;
      ctx.save();
      if (shouldFlip) {
        ctx.translate(enemy.x, enemy.y);
        ctx.scale(-1, 1);
        ctx.drawImage(
          enemy.image,
          -enemy.drawWidth / 2,
          -enemy.drawHeight / 2,
          enemy.drawWidth,
          enemy.drawHeight
        );
      } else {
        ctx.drawImage(
          enemy.image,
          enemy.x - enemy.drawWidth / 2,
          enemy.y - enemy.drawHeight / 2,
          enemy.drawWidth,
          enemy.drawHeight
        );
      }
      ctx.restore();
    } else {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(enemy.x - 40, enemy.y - enemy.radius - 22, 80, 10);

    const hpRatio = clamp(enemy.hp / enemy.maxHp, 0, 1);
    ctx.fillStyle = "#7cffb3";
    ctx.fillRect(enemy.x - 40, enemy.y - enemy.radius - 22, 80 * hpRatio, 10);
  }

  const playerAlpha = game.player.hitCooldown > 0 ? 0.5 : 1;
  ctx.globalAlpha = playerAlpha;
  if (playerImg.complete && playerImg.naturalWidth > 0) {
    const playerSize = game.player.radius * 3.8;
    ctx.drawImage(
      playerImg,
      game.player.x - playerSize / 2,
      game.player.y - playerSize / 2,
      playerSize,
      playerSize
    );
  } else {
    ctx.fillStyle = "#66d5ff";
    ctx.beginPath();
    ctx.arc(game.player.x, game.player.y, game.player.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawAttackSwing();

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(game.player.x, game.player.y);
  ctx.lineTo(game.player.x + game.player.facingX * 20, game.player.y + game.player.facingY * 20);
  ctx.stroke();

  const hpBarWidth = 260;
  const hpBarHeight = 16;
  const hpBarX = (WORLD_WIDTH - hpBarWidth) / 2;
  const hpBarY = 16;
  const hpRatio = clamp(game.player.hp / game.player.maxHp, 0, 1);

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
  ctx.fillStyle = "#7cffb3";
  ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpRatio, hpBarHeight);
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 2;
  ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "bold 14px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText(`HP ${game.player.hp}/${game.player.maxHp}`, WORLD_WIDTH / 2, hpBarY + hpBarHeight + 16);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "bold 20px Segoe UI";
  ctx.textAlign = "right";
  ctx.fillText(`Level ${game.level + 1}`, WORLD_WIDTH - 16, 34);
  ctx.textAlign = "left";

  drawEdgeVignette();

}

function gameLoop(timestamp) {
  if (!game.lastTime) {
    game.lastTime = timestamp;
  }

  const dt = Math.min(0.03, (timestamp - game.lastTime) / 1000);
  game.lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key === "escape") {
    if (!game.running || game.ended || game.won || game.levelPause) {
      return;
    }

    game.paused = !game.paused;

    if (game.paused) {
      setOverlay("Paused", "Game is paused. You can change skin and continue.", "Resume", true);
    } else {
      hideOverlay();
    }
    return;
  }

  keys.add(key);

  if (key === " " || event.code === "Space") {
    event.preventDefault();
    attack();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

actionButton.addEventListener("click", () => {
  if (game.paused) {
    game.paused = false;
    hideOverlay();
    return;
  }

  if (game.ended || game.won || game.levelPause === false && game.running === false && game.level === 0 && game.enemies.length === 0) {
    if (game.ended || game.won) {
      resetGame();
    }
    startLevel(0);
    return;
  }

  if (game.levelPause && !game.won && !game.ended) {
    startLevel(game.level + 1);
  }
});

playButton?.addEventListener("click", () => {
  resetGame();
  startLevel(0);
});

charactersButton?.addEventListener("click", () => {
  overlay.classList.add("menu-screen");
  overlayTitle.textContent = "Characters";
  overlayText.textContent = "Choose your character skin.";
  menuButtons?.classList.add("show");
  playerPicker?.classList.add("show");
  actionButton.classList.add("hidden");
  overlay.classList.add("show");
});

continueButton?.addEventListener("click", () => {
  if (!saveState.hasPlayed) {
    showMainMenu("You can't continue yet, because you haven't played.");
    return;
  }
  resetGame();
  startLevel(saveState.continueLevel);
});

loadSaveState();
setupPlayerPicker();
resetGame();
showMainMenu();
requestAnimationFrame(gameLoop);
