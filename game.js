const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WORLD_SIZE = 3500;
const INITIAL_FOOD_COUNT = 350;
const BOT_COUNT = 15;

let player;
let worms = [];
let foods = [];
let camera = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
let isGameOver = false;

// Inputs & Control States
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let controlMode = "mouse"; // "mouse", "keyboard", or "touch"
let keys = {};

// Names and Colors
const BOT_NAMES = ["Python", "Anaconda", "Mamba", "Devourer", "SlitherPro", "Chonker", "NeonSnake", "Glutton", "Worminator", "Spaghetti", "Noodle", "LongBoi", "Cobra", "Basilisk", "Viper"];
const SNAKE_COLORS = ['#ff5e57', '#ffdd59', '#ffc048', '#575fcf', '#ef5777', '#05c46b', '#0be881', '#4bcffa', '#00d8d6', '#05c46b', '#1dd1a1', '#ff6b6b'];

class Worm {
    constructor(x, y, color, name, isPlayer = false) {
        this.segments = [];
        this.radius = 12;
        this.spacing = 8;
        this.color = color;
        this.name = name;
        this.isPlayer = isPlayer;
        this.speed = 2.5;
        this.normalSpeed = 2.5;
        this.boostSpeed = 4.5;
        this.isBoosting = false;
        this.angle = Math.random() * Math.PI * 2;
        this.score = 0;
        this.dead = false;

        // Populate initial body segments
        const startLength = 15;
        for (let i = 0; i < startLength; i++) {
            this.segments.push({ x: x, y: y + i * this.spacing });
        }
    }

    update() {
        if (this.dead) return;

        // Boosting mechanics (requires score)
        if (this.isBoosting && this.score > 10 && this.segments.length > 5) {
            this.speed = this.boostSpeed;
            if (Math.random() < 0.15) {
                this.score -= 2;
                // Leave food trails behind while boosting
                const tail = this.segments[this.segments.length - 1];
                foods.push(new Food(tail.x + (Math.random() - 0.5) * 15, tail.y + (Math.random() - 0.5) * 15, 3, '#ffa500'));
            }
        } else {
            this.speed = this.normalSpeed;
            this.isBoosting = false;
        }

        // Move the head segment
        const head = this.segments[0];
        const nextX = head.x + Math.cos(this.angle) * this.speed;
        const nextY = head.y + Math.sin(this.angle) * this.speed;

        this.segments.unshift({ x: nextX, y: nextY });

        // Maintain size and length proportional to score
        const expectedLength = Math.max(15, Math.floor(this.score / 8) + 15);
        while (this.segments.length > expectedLength) {
            this.segments.pop();
        }

        // Apply inverse kinematics so trailing segments follow smoothly
        for (let i = 1; i < this.segments.length; i++) {
            const prev = this.segments[i - 1];
            const curr = this.segments[i];
            const dx = prev.x - curr.x;
            const dy = prev.y - curr.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > this.spacing) {
                const angle = Math.atan2(dy, dx);
                curr.x = prev.x - Math.cos(angle) * this.spacing;
                curr.y = prev.y - Math.sin(angle) * this.spacing;
            }
        }

        // Out of world bounds checks
        const newHead = this.segments[0];
        if (newHead.x < 0 || newHead.x > WORLD_SIZE || newHead.y < 0 || newHead.y > WORLD_SIZE) {
            this.die();
        }
    }

    die() {
        this.dead = true;
        // Turn body segments into food when eliminated
        for (let i = 0; i < this.segments.length; i += 2) {
            if (Math.random() < 0.6) {
                foods.push(new Food(this.segments[i].x, this.segments[i].y, Math.floor(Math.random() * 4) + 4, this.color));
            }
        }
    }

    draw(camera) {
        if (this.dead) return;

        ctx.save();
        // Render from tail to head to layer overlapping correctly
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const seg = this.segments[i];
            const screenX = seg.x - camera.x + canvas.width / 2;
            const screenY = seg.y - camera.y + canvas.height / 2;

            // Simple viewport culling
            if (screenX < -50 || screenX > canvas.width + 50 || screenY < -50 || screenY > canvas.height + 50) {
                continue;
            }

            ctx.beginPath();
            if (i === 0) {
                ctx.fillStyle = this.color;
                ctx.arc(screenX, screenY, this.radius + 2, 0, Math.PI * 2);
            } else {
                ctx.fillStyle = i % 2 === 0 ? this.color : '#ffffff';
                ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
            }
            ctx.fill();
            ctx.closePath();
        }

        // Draw character face / eyes
        const head = this.segments[0];
        const hX = head.x - camera.x + canvas.width / 2;
        const hY = head.y - camera.y + canvas.height / 2;

        const eyeOffset = 0.5;
        const eyeDist = this.radius * 0.7;

        const leftEyeX = hX + Math.cos(this.angle - eyeOffset) * eyeDist;
        const leftEyeY = hY + Math.sin(this.angle - eyeOffset) * eyeDist;
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(leftEyeX, leftEyeY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.arc(leftEyeX + Math.cos(this.angle) * 1.5, leftEyeY + Math.sin(this.angle) * 1.5, 2, 0, Math.PI * 2);
        ctx.fill();

        const rightEyeX = hX + Math.cos(this.angle + eyeOffset) * eyeDist;
        const rightEyeY = hY + Math.sin(this.angle + eyeOffset) * eyeDist;
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(rightEyeX, rightEyeY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.arc(rightEyeX + Math.cos(this.angle) * 1.5, rightEyeY + Math.sin(this.angle) * 1.5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Render Name Tag
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, hX, hY - 24);
        ctx.restore();
    }
}

class Bot extends Worm {
    constructor(x, y, color, name) {
        super(x, y, color, name, false);
        this.decisionTimer = 0;
    }

    update() {
        if (this.dead) return;

        this.decisionTimer++;
        if (this.decisionTimer > 12) { // Evaluate movements in intervals to save CPU cycles
            this.decisionTimer = 0;
            this.evaluateNextMove();
        }

        super.update();
    }

    evaluateNextMove() {
        const head = this.segments[0];

        // 1. Boundary Warning (Turn away from walls)
        const margin = 180;
        if (head.x < margin) { this.angle = 0; return; }
        if (head.x > WORLD_SIZE - margin) { this.angle = Math.PI; return; }
        if (head.y < margin) { this.angle = Math.PI / 2; return; }
        if (head.y > WORLD_SIZE - margin) { this.angle = -Math.PI / 2; return; }

        // 2. Obstacle & Snake Body Avoidance
        let threatFound = false;
        const scannerRange = 100;

        for (let worm of worms) {
            if (worm.dead || worm === this) continue;
            for (let i = 0; i < worm.segments.length; i += 3) {
                const seg = worm.segments[i];
                const dx = seg.x - head.x;
                const dy = seg.y - head.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < scannerRange) {
                    const avoidanceAngle = Math.atan2(dy, dx);
                    this.angle = avoidanceAngle + Math.PI + (Math.random() - 0.5) * 0.8;
                    threatFound = true;
                    this.isBoosting = Math.random() < 0.4; // Boost out of panic
                    break;
                }
            }
            if (threatFound) break;
        }

        if (threatFound) return;

        // 3. Target Nearest Food
        this.isBoosting = false;
        let closestFood = null;
        let minDist = Infinity;

        for (let food of foods) {
            const dx = food.x - head.x;
            const dy = food.y - head.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist && dist < 300) {
                minDist = dist;
                closestFood = food;
            }
        }

        if (closestFood) {
            const dx = closestFood.x - head.x;
            const dy = closestFood.y - head.y;
            this.angle = Math.atan2(dy, dx);
        } else {
            // Idle roaming
            if (Math.random() < 0.04) {
                this.angle += (Math.random() - 0.5) * 1.2;
            }
        }
    }
}

class Food {
    constructor(x, y, value = 5, color = null) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = value * 1.5;
        this.color = color || this.getRandomColor();
    }

    getRandomColor() {
        const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c', '#fd79a8', '#ffeaa7'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    draw(camera) {
        const screenX = this.x - camera.x + canvas.width / 2;
        const screenY = this.y - camera.y + canvas.height / 2;

        if (screenX < -20 || screenX > canvas.width + 20 || screenY < -20 || screenY > canvas.height + 20) {
            return;
        }

        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 4;
        ctx.shadowColor = this.color;
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}

function spawnFoodRandomly() {
    const rx = Math.random() * WORLD_SIZE;
    const ry = Math.random() * WORLD_SIZE;
    const value = Math.floor(Math.random() * 4) + 4;
    foods.push(new Food(rx, ry, value));
}

function spawnBot() {
    const rx = Math.random() * (WORLD_SIZE - 200) + 100;
    const ry = Math.random() * (WORLD_SIZE - 200) + 100;
    const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const color = SNAKE_COLORS[Math.floor(Math.random() * SNAKE_COLORS.length)];
    worms.push(new Bot(rx, ry, color, name));
}

function init() {
    worms = [];
    foods = [];
    isGameOver = false;
    document.getElementById('game-over-screen').style.display = 'none';

    // Reset camera coordinates to center
    camera = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };

    // Init Player
    player = new Worm(WORLD_SIZE / 2, WORLD_SIZE / 2, '#00bcff', 'Player', true);
    worms.push(player);

    // Populate Arena
    for (let i = 0; i < BOT_COUNT; i++) {
        spawnBot();
    }
    for (let i = 0; i < INITIAL_FOOD_COUNT; i++) {
        spawnFoodRandomly();
    }
}

// Collisions & Dynamic Respawn Loops
function checkCollisions() {
    for (let w of worms) {
        if (w.dead) continue;
        const head = w.segments[0];

        // 1. Food Consumption
        for (let i = foods.length - 1; i >= 0; i--) {
            const food = foods[i];
            const dx = head.x - food.x;
            const dy = head.y - food.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < w.radius + food.radius) {
                w.score += food.value;
                foods.splice(i, 1);
                spawnFoodRandomly();
            }
        }

        // 2. Snake head crashing on other bodies
        for (let other of worms) {
            if (other.dead || other === w) continue;

            for (let k = 0; k < other.segments.length; k++) {
                const seg = other.segments[k];
                const dx = head.x - seg.x;
                const dy = head.y - seg.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < w.radius + other.radius - 2) {
                    w.die();
                    break;
                }
            }
        }
    }
}

function drawBackground(camera) {
    ctx.save();
    ctx.strokeStyle = '#1a1a24';
    ctx.lineWidth = 1;

    const gridSize = 100;
    const startX = Math.floor((camera.x - canvas.width / 2) / gridSize) * gridSize;
    const startY = Math.floor((camera.y - canvas.height / 2) / gridSize) * gridSize;
    const endX = Math.ceil((camera.x + canvas.width / 2) / gridSize) * gridSize;
    const endY = Math.ceil((camera.y + canvas.height / 2) / gridSize) * gridSize;

    // Draw Grid Lines
    for (let x = startX; x <= endX; x += gridSize) {
        const screenX = x - camera.x + canvas.width / 2;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvas.height);
        ctx.stroke();
    }
    for (let y = startY; y <= endY; y += gridSize) {
        const screenY = y - camera.y + canvas.height / 2;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(canvas.width, screenY);
        ctx.stroke();
    }

    // Map Border
    ctx.strokeStyle = '#ff3f34';
    ctx.lineWidth = 8;
    ctx.strokeRect(
        -camera.x + canvas.width / 2,
        -camera.y + canvas.height / 2,
        WORLD_SIZE,
        WORLD_SIZE
    );
    ctx.restore();
}

function updateLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    
    const sorted = [...worms]
        .filter(w => !w.dead)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    sorted.forEach(w => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${w.name}</strong>: ${w.score}`;
        if (w.isPlayer) li.style.color = '#00bcff';
        list.appendChild(li);
    });
}

function showGameOver() {
    isGameOver = true;
    document.getElementById('final-score').innerText = player.score;
    document.getElementById('game-over-screen').style.display = 'block';
}

// Main Update loop
function update() {
    if (!isGameOver && player) {
        
        // 1. Keyboard Steer Calculations
        if (controlMode === "keyboard") {
            let keyDx = 0;
            let keyDy = 0;

            if (keys['arrowup'] || keys['w']) keyDy = -1;
            if (keys['arrowdown'] || keys['s']) keyDy = 1;
            if (keys['arrowleft'] || keys['a']) keyDx = -1;
            if (keys['arrowright'] || keys['d']) keyDx = 1;

            // Only update direction angle if a direction key is actively held down.
            // If they release keys, the snake continues in its current direction.
            if (keyDx !== 0 || keyDy !== 0) {
                player.angle = Math.atan2(keyDy, keyDx);
            }
        } 
        // 2. Mouse Steer Calculations
        else if (controlMode === "mouse") {
            const dx = mouseX - canvas.width / 2;
            const dy = mouseY - canvas.height / 2;
            player.angle = Math.atan2(dy, dx);
        }

        // Camera smoothly tracking player position
        camera.x += (player.segments[0].x - camera.x) * 0.08;
        camera.y += (player.segments[0].y - camera.y) * 0.08;

        // Entities state changes
        for (let i = worms.length - 1; i >= 0; i--) {
            const w = worms[i];
            w.update();
            if (w.dead) {
                if (w.isPlayer) {
                    if (!isGameOver) showGameOver();
                } else {
                    worms.splice(i, 1);
                    spawnBot();
                }
            }
        }

        checkCollisions();
    }
}

// Render everything onto canvas
let uiFrameCounter = 0;
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground(camera);

    // Draw Foods
    foods.forEach(f => f.draw(camera));

    // Draw Worms
    worms.forEach(w => w.draw(camera));

    // Fast HTML DOM Updates
    if (uiFrameCounter++ % 15 === 0) {
        document.getElementById('score-val').innerText = player ? player.score : 0;
        updateLeaderboard();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Controller Setup (Touch & Desktop)
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

// Mouse Movement Input
window.addEventListener('mousemove', (e) => {
    if (controlMode === "touch") return;
    
    // Calculate distance mouse moved to filter out minor/accidental movements
    const deltaX = Math.abs(e.clientX - mouseX);
    const deltaY = Math.abs(e.clientY - mouseY);
    
    if (deltaX > 2 || deltaY > 2) {
        controlMode = "mouse"; // Switch focus back to mouse controls
    }
    
    mouseX = e.clientX;
    mouseY = e.clientY;
});

window.addEventListener('mousedown', () => { 
    if (controlMode !== "touch" && player) player.isBoosting = true; 
});
window.addEventListener('mouseup', () => { 
    if (controlMode !== "touch" && player) player.isBoosting = false; 
});

// Keyboard Listeners
window.addEventListener('keydown', (e) => {
    const lowKey = e.key.toLowerCase();
    keys[lowKey] = true;
    keys[e.key] = true;

    // Hand control mode over to keyboard if Arrow/WASD keys are pressed
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(lowKey)) {
        controlMode = "keyboard";
    }

    // Prevent default browser scrolling actions on arrows and spacebar
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'spacebar'].includes(lowKey)) {
        e.preventDefault();
    }

    if (lowKey === ' ' || lowKey === 'spacebar') {
        if (player) player.isBoosting = true;
    }

    if (lowKey === 'r') {
        init();
    }
});

window.addEventListener('keyup', (e) => {
    const lowKey = e.key.toLowerCase();
    keys[lowKey] = false;
    keys[e.key] = false;

    if (lowKey === ' ' || lowKey === 'spacebar') {
        if (player) player.isBoosting = false;
    }
});

// Avoid controls freezing when window loses focus
window.addEventListener('blur', () => {
    keys = {};
    if (player) player.isBoosting = false;
});

// Mobile Touch Control Events
const mobileControls = document.getElementById('mobile-controls');
const joystickZone = document.getElementById('joystick-zone');
const joystickKnob = document.getElementById('joystick-knob');
const boostBtn = document.getElementById('boost-btn');

let joystickActive = false;
let joystickStart = { x: 0, y: 0 };

window.addEventListener('touchstart', () => {
    controlMode = "touch";
    useTouch = true;
    mobileControls.style.display = 'block';
}, { once: true });

joystickZone.addEventListener('touchstart', (e) => {
    joystickActive = true;
    const touch = e.touches[0];
    const rect = joystickZone.getBoundingClientRect();
    joystickStart = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
    handleJoystickMove(touch);
});

window.addEventListener('touchmove', (e) => {
    if (!joystickActive) return;
    for (let touch of e.touches) {
        if (touch.clientX < window.innerWidth / 2) {
            handleJoystickMove(touch);
        }
    }
});

window.addEventListener('touchend', (e) => {
    let joystickTouched = false;
    for (let touch of e.touches) {
        if (touch.clientX < window.innerWidth / 2) {
            joystickTouched = true;
        }
    }
    if (!joystickTouched) {
        joystickActive = false;
        joystickKnob.style.transform = `translate(0px, 0px)`;
    }
});

function handleJoystickMove(touch) {
    const dx = touch.clientX - joystickStart.x;
    const dy = touch.clientY - joystickStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 35;

    const angle = Math.atan2(dy, dx);
    if (player) player.angle = angle;

    const moveDist = Math.min(distance, maxRadius);
    const knobX = Math.cos(angle) * moveDist;
    const knobY = Math.sin(angle) * moveDist;

    joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
}

boostBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (player) player.isBoosting = true;
});
boostBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (player) player.isBoosting = false;
});

// UI Restart Action Listeners
document.getElementById('respawn-btn').addEventListener('click', init);
document.getElementById('hud-restart-btn').addEventListener('click', init);

// Boot Game
resizeCanvas();
init();
gameLoop();
