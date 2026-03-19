// Canvas Apocalypse - a simple survival game

// constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 20;
const PLAYER_COLOR = '#1a4d7a';
const ENEMY_COLOR = '#f00';
const ENEMY_RADIUS = 10;
const BASE_SPAWN_INTERVAL = 4; // seconds
const MIN_SPAWN_INTERVAL = 0.5;
const BASE_ENEMY_SPEED = 50; // pixels per second
const SPEED_INCREASE_RATE = 5; // per second (base)
const SHAKE_DURATION = 0.2; // seconds
const PARTICLE_COUNT = 30;
const WALL_SPAWN_INTERVAL = 40; // seconds between wall spawns on hard
const EXTRA_INTERVAL = 55; // seconds between extra balls
const EXTRA_COLOR = '#ff0'; // another special ball color
const HARD_PLAYER_SPEED = 280;
const WALL_LIFESPAN = 10; // seconds
const RED_BALL_INTERVAL = 90; // guaranteed red ball spawn cadence
const GOBLIN_DRAW_SIZE = 60;
const APPLE_RADIUS = 20;

// state
let state = {
    mode: 'MENU', // MENU, PLAY, GAMEOVER, SKINS
    difficulty: 'Medium',
    player: { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2, size: PLAYER_SIZE },
    playerSpeed: 400,
    keysPressed: {},
    enemies: [],
    particles: [],
    walls: [],
    spawnTimer: 0,
    wallTimer: 0,
    wallNextSpawn: 5,
    redBallTimer: 0,
    extraTimer: 0,
    enemySpeed: BASE_ENEMY_SPEED,
    enemySpeedIncreaseRate: SPEED_INCREASE_RATE,
    spawnInterval: BASE_SPAWN_INTERVAL,
    spawnDecreaseRate: 0.01,
    score: 0,
    timeSurvived: 0,
    speedIncreaseTimer: 0,
    lastTime: 0,
    shakeTime: 0,
    highscoreEasy: 0,
    highscoreMedium: 0,
    highscoreHard: 0,
    hasPlayerMoved: false,
    apples: [],
    selectedSkin: 'pall',
    totalApplesEasy: 0,
    totalApplesMedium: 0,
    totalApplesHard: 0,
    facingRight: true
};

// retrieve highscores per difficulty
if(localStorage.getItem('highscoreEasy')){
    state.highscoreEasy = parseFloat(localStorage.getItem('highscoreEasy')) || 0;
}
if(localStorage.getItem('highscoreMedium')){
    state.highscoreMedium = parseFloat(localStorage.getItem('highscoreMedium')) || 0;
}
if(localStorage.getItem('highscoreHard')){
    state.highscoreHard = parseFloat(localStorage.getItem('highscoreHard')) || 0;
}

// Load skin progress
if(localStorage.getItem('selectedSkin')){
    state.selectedSkin = localStorage.getItem('selectedSkin');
}
if(localStorage.getItem('totalApplesEasy')){
    state.totalApplesEasy = parseInt(localStorage.getItem('totalApplesEasy')) || 0;
}
if(localStorage.getItem('totalApplesMedium')){
    state.totalApplesMedium = parseInt(localStorage.getItem('totalApplesMedium')) || 0;
}
if(localStorage.getItem('totalApplesHard')){
    state.totalApplesHard = parseInt(localStorage.getItem('totalApplesHard')) || 0;
}

function defineMenu(){
    highscoreText.textContent = `Easy: ${Math.floor(state.highscoreEasy)} | Medium: ${Math.floor(state.highscoreMedium)} | Hard: ${Math.floor(state.highscoreHard)}`;
}

function showMenu(){
    highscoreText.textContent = `Easy: ${Math.floor(state.highscoreEasy)} | Medium: ${Math.floor(state.highscoreMedium)} | Hard: ${Math.floor(state.highscoreHard)}`;
    menuEl.classList.remove('hidden');
}

function hideMenu(){
    menuEl.classList.add('hidden');
}

// canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const goblinImage = new Image();
goblinImage.src = 'goblin.png';

const backgroundImage = new Image();
backgroundImage.src = 'back.jpg';

const appleImage = new Image();
appleImage.src = 'apple.png';

const pallSkin = new Image();
pallSkin.src = 'pall.png';
const pouSkin = new Image();
pouSkin.src = 'pou.png';
const notsuSkin = new Image();
notsuSkin.src = 'notsu.png';

const playAgainButtonImage = new Image();
playAgainButtonImage.src = 'back_b.png';
const mainMenuButtonImage = new Image();
mainMenuButtonImage.src = 'main.png';


// input
window.addEventListener('keydown', (e) => {
    if(state.mode === 'GAMEOVER' && (e.key.toLowerCase() === 'r' || e.key === ' ')){
        restart();
    }
    state.keysPressed[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    delete state.keysPressed[e.key];
});

// Click handler for play again button on game over screen
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    if(state.mode === 'GAMEOVER'){
        // Play Again button position and size (same as in drawGameOver)
        const playAgainWidth = 100;
        const playAgainHeight = 100;
        const playAgainX = CANVAS_WIDTH/2 - 120;
        const playAgainY = CANVAS_HEIGHT/2 + 40;
        
        // Main Menu button position and size
        const mainMenuWidth = 100;
        const mainMenuHeight = 100;
        const mainMenuX = CANVAS_WIDTH/2 + 20;
        const mainMenuY = CANVAS_HEIGHT/2 + 40;
        
        if(clickX >= playAgainX && clickX <= playAgainX + playAgainWidth &&
           clickY >= playAgainY && clickY <= playAgainY + playAgainHeight){
                restart();
            } else if(clickX >= mainMenuX && clickX <= mainMenuX + mainMenuWidth &&
                      clickY >= mainMenuY && clickY <= mainMenuY + mainMenuHeight){
                goToMenu();
        }
    } else if(state.mode === 'SKINS'){
        // Back button
        if(clickY < 60){
            goBackToMenu();
            return;
        }
        
        // Skin selection
        const skinY = 150;
        const skinSize = 80;
        const spacing = 120;
        
        const pallX = CANVAS_WIDTH/2 - spacing;
        const pouX = CANVAS_WIDTH/2;
        const notsuX = CANVAS_WIDTH/2 + spacing;
        
        // Check if clicked on Pall
        if(clickX >= pallX - skinSize/2 && clickX <= pallX + skinSize/2 &&
           clickY >= skinY && clickY <= skinY + skinSize){
            state.selectedSkin = 'pall';
            localStorage.setItem('selectedSkin', 'pall');
        }
        
        // Check if clicked on Pou (if unlocked)
        if(state.totalApplesMedium >= 25){
            if(clickX >= pouX - skinSize/2 && clickX <= pouX + skinSize/2 &&
               clickY >= skinY && clickY <= skinY + skinSize){
                state.selectedSkin = 'pou';
                localStorage.setItem('selectedSkin', 'pou');
            }
        }
        
        // Check if clicked on Notsu (if unlocked)
        if(state.totalApplesHard >= 10){
            if(clickX >= notsuX - skinSize/2 && clickX <= notsuX + skinSize/2 &&
               clickY >= skinY && clickY <= skinY + skinSize){
                state.selectedSkin = 'notsu';
                localStorage.setItem('selectedSkin', 'notsu');
            }
        }
    }
});

// menu buttons
const menuEl = document.getElementById('menu');
const highscoreText = document.getElementById('highscoreText');
document.getElementById('easyBtn').addEventListener('click', () => selectDifficulty('Easy'));
document.getElementById('mediumBtn').addEventListener('click', () => selectDifficulty('Medium'));
document.getElementById('hardBtn').addEventListener('click', () => selectDifficulty('Hard'));
document.getElementById('skinsBtn').addEventListener('click', () => showSkins());
document.getElementById('skinsBtn').addEventListener('click', () => showSkins());

// show menu immediately
showMenu();

function selectDifficulty(diff){
    state.difficulty = diff;
    switch(diff){
        case 'Easy':
            state.playerSpeed = 180;
            state.enemySpeed = 100;
            state.spawnInterval = BASE_SPAWN_INTERVAL * 2;
            state.enemySpeedIncreaseRate = SPEED_INCREASE_RATE * 0.3;
            state.spawnDecreaseRate = 0.003;
            state.playerSpeedIncrease = 5;
            break;
        case 'Medium':
            state.playerSpeed =400
            state.enemySpeed = 150;
            state.spawnInterval = BASE_SPAWN_INTERVAL;
            state.enemySpeedIncreaseRate = 0;
            state.spawnDecreaseRate = 0.01;
            state.playerSpeedIncrease = 10;
            break;
        case 'Hard':
            state.playerSpeed = HARD_PLAYER_SPEED;
            state.enemySpeed = state.playerSpeed * 0.9;
            state.spawnInterval = BASE_SPAWN_INTERVAL;
            state.enemySpeedIncreaseRate = 0;
            state.spawnDecreaseRate = 0.01;
            state.playerSpeedIncrease = 10;
            break;
    }
    state.mode = 'PLAY';
    hideMenu();
    resetGame();
}

function showSkins(){
    state.mode = 'SKINS';
    hideMenu();
}

function goBackToMenu(){
    state.mode = 'MENU';
    showMenu();
}

function resetGame(){
    state.player.x = CANVAS_WIDTH/2;
    state.player.y = CANVAS_HEIGHT/2;
    state.enemies = [];
    state.particles = [];
    state.walls = [];
    state.spawnTimer = 0;
    state.wallTimer = 0;
    state.wallNextSpawn = 5;
    state.redBallTimer = 0;
    state.extraTimer = 0;
    // base speed depends on difficulty
    state.playerSpeed = (state.difficulty === 'Hard' ? HARD_PLAYER_SPEED : 200);
    state.speedIncreaseTimer = 0;
    state.score = 0;
    state.timeSurvived = 0;
    state.shakeTime = 0;
    state.hasPlayerMoved = false;
    state.apples = [];
    spawnApple();
    state.lastTime = performance.now();
}

function restart(){
    // Save highscore for current difficulty
    if(state.difficulty === 'Easy' && state.score > state.highscoreEasy){
        state.highscoreEasy = state.score;
        localStorage.setItem('highscoreEasy', state.highscoreEasy);
    } else if(state.difficulty === 'Medium' && state.score > state.highscoreMedium){
        state.highscoreMedium = state.score;
        localStorage.setItem('highscoreMedium', state.highscoreMedium);
    } else if(state.difficulty === 'Hard' && state.score > state.highscoreHard){
        state.highscoreHard = state.score;
        localStorage.setItem('highscoreHard', state.highscoreHard);
    }
    // Restart at the same difficulty level without going to menu
    selectDifficulty(state.difficulty);
}

function goToMenu(){
    // Save highscore for current difficulty
    if(state.difficulty === 'Easy' && state.score > state.highscoreEasy){
        state.highscoreEasy = state.score;
        localStorage.setItem('highscoreEasy', state.highscoreEasy);
    } else if(state.difficulty === 'Medium' && state.score > state.highscoreMedium){
        state.highscoreMedium = state.score;
        localStorage.setItem('highscoreMedium', state.highscoreMedium);
    } else if(state.difficulty === 'Hard' && state.score > state.highscoreHard){
        state.highscoreHard = state.score;
        localStorage.setItem('highscoreHard', state.highscoreHard);
    }
    state.mode = 'MENU';
    showMenu();
}

// game loop
function loop(timestamp){
    const deltaTime = (timestamp - state.lastTime) / 1000;
    state.lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(loop);
}

function update(dt){
    if(state.mode === 'PLAY'){
        handleInput(dt);
        updateEnemies(dt);
        updateAppleCollection();
        updateParticles(dt);
        updateSpawn(dt);
        if(state.difficulty === 'Hard' || state.difficulty === 'Medium') updateWalls(dt);
        updateExtra(dt);
        updateRedBall(dt);
        updateTimer(dt);
        if(state.shakeTime > 0) state.shakeTime -= dt;
    }
}

function handleInput(dt){
    let vx = 0, vy = 0;
    if(state.keysPressed['w'] || state.keysPressed['ArrowUp']) vy -= 1;
    if(state.keysPressed['s'] || state.keysPressed['ArrowDown']) vy += 1;
    if(state.keysPressed['a'] || state.keysPressed['ArrowLeft']) vx -= 1;
    if(state.keysPressed['d'] || state.keysPressed['ArrowRight']) vx += 1;
    
    // Update facing direction
    if(vx < 0) state.facingRight = false;
    if(vx > 0) state.facingRight = true;
    
    // Spawn first goblin as soon as player starts to move
    if((vx !== 0 || vy !== 0) && !state.hasPlayerMoved){
        state.hasPlayerMoved = true;
        spawnEnemy();
    }
    
    // normalize diagonal
    if(vx !== 0 && vy !== 0){
        const inv = 1/Math.sqrt(2);
        vx *= inv;
        vy *= inv;
    }
    const speed = state.playerSpeed;
    const prevX = state.player.x;
    const prevY = state.player.y;

    // move on X, check walls
    state.player.x += vx * speed * dt;
    if(checkPlayerWallCollision()){
        state.player.x = prevX;
    }
    // move on Y, check walls
    state.player.y += vy * speed * dt;
    if(checkPlayerWallCollision()){
        state.player.y = prevY;
    }

    // clamp
    state.player.x = Math.max(state.player.size/2, Math.min(CANVAS_WIDTH - state.player.size/2, state.player.x));
    state.player.y = Math.max(state.player.size/2, Math.min(CANVAS_HEIGHT - state.player.size/2, state.player.y));
}

function updateEnemies(dt){
    for(let i=state.enemies.length-1;i>=0;--i){
        const e = state.enemies[i];
        // move toward player
        const dx = state.player.x - e.x;
        const dy = state.player.y - e.y;
        const dist = Math.hypot(dx, dy);
        if(dist>0){
            const stepX = (dx/dist) * e.speed * dt;
            const stepY = (dy/dist) * e.speed * dt;

            // Update enemy facing direction
            if(stepX < 0) e.facingRight = false;
            if(stepX > 0) e.facingRight = true;

            // Move axis-by-axis so enemies cannot pass through active walls.
            const prevX = e.x;
            const prevY = e.y;

            e.x += stepX;
            if(checkEnemyWallCollision(e)){
                e.x = prevX;
            }

            e.y += stepY;
            if(checkEnemyWallCollision(e)){
                e.y = prevY;
            }
        }
        // collision with player (circle-rect)
        if(circleRectCollision(e.x,e.y,ENEMY_RADIUS, state.player.x - state.player.size/2, state.player.y - state.player.size/2, state.player.size, state.player.size)){
            triggerGameOver();
        }
    }
    
    // Enemy-to-enemy collision: push apart if overlapping
    for(let i = 0; i < state.enemies.length; i++){
        for(let j = i + 1; j < state.enemies.length; j++){
            const e1 = state.enemies[i];
            const e2 = state.enemies[j];
            const dx = e2.x - e1.x;
            const dy = e2.y - e1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = ENEMY_RADIUS * 2;
            
            if(dist < minDist && dist > 0){
                // Push them apart
                const overlap = minDist - dist;
                const pushX = (dx / dist) * overlap * 0.5;
                const pushY = (dy / dist) * overlap * 0.5;
                
                e1.x -= pushX;
                e1.y -= pushY;
                e2.x += pushX;
                e2.y += pushY;
            }
        }
    }
}

function updateParticles(dt){
    for(let i=state.particles.length-1;i>=0;--i){
        const p = state.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if(p.life <= 0) state.particles.splice(i,1);
    }
}

function updateSpawn(dt){
    state.spawnTimer += dt;
    if(state.spawnTimer >= state.spawnInterval){
        spawnEnemy();
        state.spawnTimer = 0;
        // gradually adjust difficulty: spawn interval always shrinks
        state.spawnInterval = Math.max(MIN_SPAWN_INTERVAL, state.spawnInterval - state.spawnDecreaseRate * dt);
    }
    // enemy speed increases continuously on non-hard modes
    if(state.difficulty !== 'Hard'){
        state.enemySpeed += state.enemySpeedIncreaseRate * dt;
    }
}

function updateTimer(dt){
    if(state.hasPlayerMoved){
        state.timeSurvived += dt;
    }
    if(state.difficulty === 'Hard'){
        state.speedIncreaseTimer += dt;
        if(state.speedIncreaseTimer >= 10){
            state.speedIncreaseTimer -= 10;
            state.playerSpeed *= 1.01;
            // enemy stays at 90% of current player speed
            state.enemySpeed = state.playerSpeed * 0.9;
            // make all existing enemies match new speed as well
            for(const e of state.enemies){
                e.speed = state.enemySpeed;
            }
        }
    }
}

function spawnApple(){
    // Keep one apple on the map at all times.
    if(state.apples.length > 0){
        return;
    }

    let tries = 0;
    while(tries < 50){
        tries += 1;
        const x = APPLE_RADIUS + Math.random() * (CANVAS_WIDTH - APPLE_RADIUS * 2);
        const y = APPLE_RADIUS + Math.random() * (CANVAS_HEIGHT - APPLE_RADIUS * 2);

        const tooCloseToPlayer = Math.hypot(state.player.x - x, state.player.y - y) < (state.player.size + APPLE_RADIUS + 30);
        if(tooCloseToPlayer){
            continue;
        }

        let collidesWall = false;
        for(const w of state.walls){
            if(circleRectCollision(x, y, APPLE_RADIUS, w.x, w.y, w.w, w.h)){
                collidesWall = true;
                break;
            }
        }
        if(collidesWall){
            continue;
        }

        state.apples.push({ x, y });
        return;
    }

    state.apples.push({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });
}

function updateAppleCollection(){
    for(let i = state.apples.length - 1; i >= 0; --i){
        const apple = state.apples[i];
        const dx = state.player.x - apple.x;
        const dy = state.player.y - apple.y;
        const collectDistance = APPLE_RADIUS + (state.player.size / 2);

        if((dx * dx + dy * dy) <= (collectDistance * collectDistance)){
            state.apples.splice(i, 1);
            state.score += 1;
            
            // Track total apples per difficulty
            if(state.difficulty === 'Easy'){
                state.totalApplesEasy += 1;
                localStorage.setItem('totalApplesEasy', state.totalApplesEasy);
            } else if(state.difficulty === 'Medium'){
                state.totalApplesMedium += 1;
                localStorage.setItem('totalApplesMedium', state.totalApplesMedium);
            } else if(state.difficulty === 'Hard'){
                state.totalApplesHard += 1;
                localStorage.setItem('totalApplesHard', state.totalApplesHard);
            }
        }
    }

    if(state.apples.length === 0){
        spawnApple();
    }
}

function triggerGameOver(){
    if(state.mode !== 'PLAY') return;
    state.mode = 'GAMEOVER';
    if(state.score > state.highscore){
        state.highscore = state.score;
        localStorage.setItem('canvas_apocalypse_highscore', state.highscore);
    }
    spawnExplosion(state.player.x, state.player.y);
}

// helper collision
function circleRectCollision(cx,cy,r,rx,ry,rw,rh){
    // find closest point
    const closestX = Math.max(rx, Math.min(cx, rx+rw));
    const closestY = Math.max(ry, Math.min(cy, ry+rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx*dx + dy*dy) < r*r;
}

function spawnEnemy(){
    const edge = Math.floor(Math.random()*4);
    let x, y;
    switch(edge){
        case 0: // top
            x = Math.random()*CANVAS_WIDTH;
            y = 0;
            break;
        case 1: // bottom
            x = Math.random()*CANVAS_WIDTH;
            y = CANVAS_HEIGHT;
            break;
        case 2: // left
            x = 0;
            y = Math.random()*CANVAS_HEIGHT;
            break;
        case 3: // right
            x = CANVAS_WIDTH;
            y = Math.random()*CANVAS_HEIGHT;
            break;
    }
    state.enemies.push({x,y,speed: state.enemySpeed, color: ENEMY_COLOR, facingRight: true});
}

function spawnExplosion(x,y){
    for(let i=0;i<PARTICLE_COUNT;i++){
        const angle = Math.random()*Math.PI*2;
        const speed = 50 + Math.random()*150;
        state.particles.push({
            x,y,
            vx: Math.cos(angle)*speed,
            vy: Math.sin(angle)*speed,
            life: 1
        });
    }
}

// walls for hard mode
function updateWalls(dt){
    state.wallTimer += dt;
    for(let i = state.walls.length-1; i>=0; --i){
        const w = state.walls[i];
        w.life -= dt;
        if(w.life <= 0){
            state.walls.splice(i,1);
        }
    }
    if(state.wallTimer >= state.wallNextSpawn){
        spawnWall();
        state.wallTimer = 0;
        // after first wall, subsequent intervals decrease randomly
        state.wallNextSpawn = Math.max(0.5, state.wallNextSpawn * (0.9 + Math.random() * 0.1));
    }
}

// additional less-frequent ball
function updateExtra(dt){
    state.extraTimer += dt;
    if(state.extraTimer >= EXTRA_INTERVAL){
        state.extraTimer -= EXTRA_INTERVAL;
        spawnExtra();
    }
}

function updateRedBall(dt){
    state.redBallTimer += dt;
    if(state.redBallTimer >= RED_BALL_INTERVAL){
        state.redBallTimer -= RED_BALL_INTERVAL;
        spawnEnemy();
    }
}

function spawnExtra(){
    const edge = Math.floor(Math.random()*4);
    let x, y;
    switch(edge){
        case 0: // top
            x = Math.random()*CANVAS_WIDTH;
            y = 0;
            break;
        case 1: // bottom
            x = Math.random()*CANVAS_WIDTH;
            y = CANVAS_HEIGHT;
            break;
        case 2: // left
            x = 0;
            y = Math.random()*CANVAS_HEIGHT;
            break;
        case 3: // right
            x = CANVAS_WIDTH;
            y = Math.random()*CANVAS_HEIGHT;
            break;
    }
    state.enemies.push({x,y,speed: state.enemySpeed * 1.1, color: EXTRA_COLOR, facingRight: true});
}

function spawnWall(){
    // walls are thin but can be long (shorter than before)
    let w, h;
    if(Math.random() < 0.5){
        // horizontal wall
        w = 60 + Math.random() * 60; // length 60-120
        h = 10 + Math.random() * 20;   // thickness
    } else {
        // vertical wall
        w = 10 + Math.random() * 20;
        h = 60 + Math.random() * 60;
    }
    
    let x, y;
    
    if(state.difficulty === 'Hard'){
        // Predictive positioning: use player velocity direction
        let dirx = 0, diry = 0;
        if(state.keysPressed['w'] || state.keysPressed['ArrowUp']) diry -= 1;
        if(state.keysPressed['s'] || state.keysPressed['ArrowDown']) diry += 1;
        if(state.keysPressed['a'] || state.keysPressed['ArrowLeft']) dirx -= 1;
        if(state.keysPressed['d'] || state.keysPressed['ArrowRight']) dirx += 1;
        if(dirx !== 0 || diry !== 0){
            const len = Math.hypot(dirx, diry);
            dirx /= len;
            diry /= len;
        } else {
            // random direction if stationary
            const angle = Math.random()*Math.PI*2;
            dirx = Math.cos(angle);
            diry = Math.sin(angle);
        }
        // spawn ahead of player with some randomness
        const distance = 100 + Math.random()*100;
        x = state.player.x + dirx * distance - w/2;
        y = state.player.y + diry * distance - h/2;
    } else {
        // Random positioning anywhere on the map (Medium mode)
        x = Math.random() * (CANVAS_WIDTH - w);
        y = Math.random() * (CANVAS_HEIGHT - h);
    }
    
    // clamp inside
    x = Math.max(0, Math.min(CANVAS_WIDTH - w, x));
    y = Math.max(0, Math.min(CANVAS_HEIGHT - h, y));
    state.walls.push({x,y,w,h, life: WALL_LIFESPAN});
}

function rectRectCollision(x1,y1,w1,h1,x2,y2,w2,h2){
    return !(x1 + w1 < x2 || x1 > x2 + w2 || y1 + h1 < y2 || y1 > y2 + h2);
}

function checkPlayerWallCollision(){
    const px = state.player.x - state.player.size/2;
    const py = state.player.y - state.player.size/2;
    const ps = state.player.size;
    for(const w of state.walls){
        if(rectRectCollision(px,py,ps,ps, w.x, w.y, w.w, w.h)){
            return true;
        }
    }
    return false;
}

function checkEnemyWallCollision(enemy){
    for(const w of state.walls){
        if(circleRectCollision(enemy.x, enemy.y, ENEMY_RADIUS, w.x, w.y, w.w, w.h)){
            return true;
        }
    }
    return false;
}

function draw(){
    // background effect
    drawBackground();

    // camera shake offset
    let offsetX = 0, offsetY = 0;
    if(state.shakeTime>0){
        offsetX = (Math.random()-0.5)*10;
        offsetY = (Math.random()-0.5)*10;
    }

    ctx.save();
    ctx.translate(offsetX, offsetY);

    if(state.mode === 'MENU'){
        drawMenu();
    } else if(state.mode === 'SKINS'){
        drawSkinsMenu();
    } else {
        // clear
        ctx.clearRect(-offsetX, -offsetY, CANVAS_WIDTH, CANVAS_HEIGHT);
        drawWalls();
        drawApples();
        drawPlayer();
        drawEnemies();
        drawParticles();
        drawUI();
        if(state.mode === 'GAMEOVER') drawGameOver();
    }

    ctx.restore();
}

function drawApples(){
    for(const apple of state.apples){
        const width = APPLE_RADIUS * 2;
        const height = APPLE_RADIUS * 2.6;
        if(appleImage.complete && appleImage.naturalWidth > 0){
            ctx.drawImage(appleImage, apple.x - width / 2, apple.y - height / 2, width, height);
        } else {
            // Fallback while sprite is loading.
            ctx.fillStyle = '#d62828';
            ctx.beginPath();
            ctx.arc(apple.x, apple.y, APPLE_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawPlayer(){
    let skinImage = pallSkin;
    if(state.selectedSkin === 'pou'){
        skinImage = pouSkin;
    } else if(state.selectedSkin === 'notsu'){
        skinImage = notsuSkin;
    }
    
    const skinSize = state.player.size * 3;
    if(skinImage.complete && skinImage.naturalWidth > 0){
        ctx.save();
        if(state.facingRight){
            ctx.scale(-1, 1);
            ctx.drawImage(skinImage, -state.player.x - skinSize/2, state.player.y - skinSize/2, skinSize, skinSize);
        } else {
            ctx.drawImage(skinImage, state.player.x - skinSize/2, state.player.y - skinSize/2, skinSize, skinSize);
        }
        ctx.restore();
    } else {
        // Fallback
        ctx.fillStyle = PLAYER_COLOR;
        ctx.fillRect(state.player.x - state.player.size/2, state.player.y - state.player.size/2, state.player.size, state.player.size);
    }
}

function drawEnemies(){
    for(const e of state.enemies){
        // Replace red enemy balls with goblin sprite at the original 20x20 size.
        if((e.color || ENEMY_COLOR) === ENEMY_COLOR && goblinImage.complete && goblinImage.naturalWidth > 0){
            const size = GOBLIN_DRAW_SIZE;
            ctx.save();
            const facingRight = e.facingRight !== undefined ? e.facingRight : true;
            if(facingRight){
                ctx.scale(-1, 1);
                ctx.drawImage(goblinImage, -e.x - size / 2, e.y - size / 2, size, size);
            } else {
                ctx.drawImage(goblinImage, e.x - size / 2, e.y - size / 2, size, size);
            }
            ctx.restore();
        } else {
            ctx.fillStyle = e.color || ENEMY_COLOR;
            ctx.beginPath();
            ctx.arc(e.x, e.y, ENEMY_RADIUS, 0, Math.PI*2);
            ctx.fill();
        }
    }
}

function drawWalls(){
    ctx.fillStyle = '#4a3520';
    for(const w of state.walls){
        ctx.fillRect(w.x, w.y, w.w, w.h);
    }
}

function drawParticles(){
    ctx.fillStyle = '#ff0';
    for(const p of state.particles){
        const alpha = Math.max(0, p.life);
        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x-2, p.y-2, 4,4);
    }
    ctx.globalAlpha = 1;
}

function drawUI(){
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Time: ${state.timeSurvived.toFixed(1)}`, 10, 10);
    ctx.fillText(`Score: ${state.score}`, 10, 35);
    
    // Show best score for current difficulty
    let currentBest = 0;
    if(state.difficulty === 'Easy') currentBest = state.highscoreEasy;
    else if(state.difficulty === 'Medium') currentBest = state.highscoreMedium;
    else if(state.difficulty === 'Hard') currentBest = state.highscoreHard;
    ctx.fillText(`Best Score: ${Math.floor(currentBest)}`, 10, 60);
    
    // Hard mode unlock hint
    if(state.difficulty === 'Hard'){
        ctx.textAlign = 'right';
        ctx.fillText('Collect 10 apples to unlock a new skin', CANVAS_WIDTH - 10, 10);
    }
}

// menu drawing is no longer needed since HTML buttons handle it
function drawMenu(){
    // keep canvas cleared behind overlay
    ctx.clearRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
}

function drawSkinsMenu(){
    ctx.clearRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
    
    ctx.fillStyle = '#fff';
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SKINS', CANVAS_WIDTH/2, 60);
    
    // Back button
    ctx.font = '20px sans-serif';
    ctx.fillText('< Back to Menu', 100, 40);
    
    // Skin display
    const skinY = 150;
    const skinSize = 80;
    const spacing = 120;
    
    // Pall (default - always unlocked)
    const pallX = CANVAS_WIDTH/2 - spacing;
    if(pallSkin.complete && pallSkin.naturalWidth > 0){
        ctx.drawImage(pallSkin, pallX - skinSize/2, skinY, skinSize, skinSize);
    }
    ctx.fillStyle = state.selectedSkin === 'pall' ? '#4a7d35' : '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Pall', pallX, skinY + skinSize + 20);
    ctx.fillText('(Default)', pallX, skinY + skinSize + 40);
    if(state.selectedSkin === 'pall'){
        ctx.fillText('✓ Selected', pallX, skinY + skinSize + 60);
    } else {
        ctx.fillText('Click to select', pallX, skinY + skinSize + 60);
    }
    
    // Pou (unlock: 25 apples on medium)
    const pouX = CANVAS_WIDTH/2;
    const pouUnlocked = state.totalApplesMedium >= 25;
    if(pouSkin.complete && pouSkin.naturalWidth > 0 && pouUnlocked){
        ctx.globalAlpha = 1;
        ctx.drawImage(pouSkin, pouX - skinSize/2, skinY, skinSize, skinSize);
    } else {
        ctx.globalAlpha = 0.3;
        if(pouSkin.complete && pouSkin.naturalWidth > 0){
            ctx.drawImage(pouSkin, pouX - skinSize/2, skinY, skinSize, skinSize);
        }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = state.selectedSkin === 'pou' ? '#4a7d35' : '#fff';
    ctx.fillText('Pou', pouX, skinY + skinSize + 20);
    if(pouUnlocked){
        ctx.fillText('Unlocked!', pouX, skinY + skinSize + 40);
        if(state.selectedSkin === 'pou'){
            ctx.fillText('✓ Selected', pouX, skinY + skinSize + 60);
        } else {
            ctx.fillText('Click to select', pouX, skinY + skinSize + 60);
        }
    } else {
        ctx.fillStyle = '#ff6';
        ctx.fillText(`${state.totalApplesMedium}/25 apples`, pouX, skinY + skinSize + 40);
        ctx.fillText('(Medium mode)', pouX, skinY + skinSize + 60);
    }
    
    // Notsu (unlock: 10 apples on hard)
    const notsuX = CANVAS_WIDTH/2 + spacing;
    const notsuUnlocked = state.totalApplesHard >= 10;
    if(notsuSkin.complete && notsuSkin.naturalWidth > 0 && notsuUnlocked){
        ctx.globalAlpha = 1;
        ctx.drawImage(notsuSkin, notsuX - skinSize/2, skinY, skinSize, skinSize);
    } else {
        ctx.globalAlpha = 0.3;
        if(notsuSkin.complete && notsuSkin.naturalWidth > 0){
            ctx.drawImage(notsuSkin, notsuX - skinSize/2, skinY, skinSize, skinSize);
        }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = state.selectedSkin === 'notsu' ? '#4a7d35' : '#fff';
    ctx.fillText('Notsu', notsuX, skinY + skinSize + 20);
    if(notsuUnlocked){
        ctx.fillText('Unlocked!', notsuX, skinY + skinSize + 40);
        if(state.selectedSkin === 'notsu'){
            ctx.fillText('✓ Selected', notsuX, skinY + skinSize + 60);
        } else {
            ctx.fillText('Click to select', notsuX, skinY + skinSize + 60);
        }
    } else {
        ctx.fillStyle = '#ff6';
        ctx.fillText(`${state.totalApplesHard}/10 apples`, notsuX, skinY + skinSize + 40);
        ctx.fillText('(Hard mode)', notsuX, skinY + skinSize + 60);
    }
}

function drawGameOver(){
    ctx.fillStyle = '#fff';
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    ctx.font = '20px sans-serif';
    
    // Show highscore for current difficulty
    let currentBest = 0;
    if(state.difficulty === 'Easy') currentBest = state.highscoreEasy;
    else if(state.difficulty === 'Medium') currentBest = state.highscoreMedium;
    else if(state.difficulty === 'Hard') currentBest = state.highscoreHard;
    ctx.fillText(`Highscore: ${Math.floor(currentBest)}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    // Draw play again button (left)
    const playAgainWidth = 100;
    const playAgainHeight = 100;
    const playAgainX = CANVAS_WIDTH/2 - 120;
    const playAgainY = CANVAS_HEIGHT/2 + 40;
    
    if(playAgainButtonImage.complete && playAgainButtonImage.naturalWidth > 0){
        ctx.drawImage(playAgainButtonImage, playAgainX, playAgainY, playAgainWidth, playAgainHeight);
    } else {
        ctx.fillStyle = '#4a7d35';
        ctx.fillRect(playAgainX, playAgainY, playAgainWidth, playAgainHeight);
    }
    
    // Draw main menu button (right)
    const mainMenuWidth = 100;
    const mainMenuHeight = 100;
    const mainMenuX = CANVAS_WIDTH/2 + 20;
    const mainMenuY = CANVAS_HEIGHT/2 + 40;
    
    if(mainMenuButtonImage.complete && mainMenuButtonImage.naturalWidth > 0){
        ctx.drawImage(mainMenuButtonImage, mainMenuX, mainMenuY, mainMenuWidth, mainMenuHeight);
    } else {
        ctx.fillStyle = '#7d4a35';
        ctx.fillRect(mainMenuX, mainMenuY, mainMenuWidth, mainMenuHeight);
    }
    
    // Instructions
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Press SPACE or click button', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 160);
}

function drawBackground(){
    if(backgroundImage.complete && backgroundImage.naturalWidth > 0){
        ctx.drawImage(backgroundImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
        // Fallback if image not loaded
        ctx.fillStyle = '#3f8f2e';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
}

requestAnimationFrame(loop);
