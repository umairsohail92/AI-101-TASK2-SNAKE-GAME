const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const finalScoreEl = document.getElementById("finalScore");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOver");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");

const GRID = 20;

let snake, food;
let dx, dy;
let score = 0;
let highScore = 0;

let speed = 6;
let lastTime = 0;
let acc = 0;

let running = false;
let paused = false;

/* RESIZE */
function resize() {
    canvas.width = Math.min(500, window.innerWidth * 0.9);
    canvas.height = canvas.width;
}
resize();
window.addEventListener("resize", resize);

/* INIT */
function init() {
    snake = [{ x: 10, y: 10 }];
    dx = 1;
    dy = 0;
    score = 0;
    speed = 6;
    acc = 0;

    highScore = localStorage.getItem("neoHigh") || 0;
    highScoreEl.textContent = highScore;

    food = spawnFood();
    scoreEl.textContent = 0;

    gameOverScreen.classList.add("hidden");
}

/* FOOD */
function spawnFood() {
    return {
        x: Math.floor(Math.random() * (canvas.width / GRID)),
        y: Math.floor(Math.random() * (canvas.height / GRID))
    };
}

/* GAME LOOP */
function loop(time) {
    if (!running) return;

    requestAnimationFrame(loop);

    if (paused) return;

    let delta = (time - lastTime) / 1000;
    lastTime = time;

    acc += delta;

    if (acc < 1 / speed) return;

    acc = 0;
    update();
}

/* UPDATE */
function update() {
    let head = {
        x: snake[0].x + dx,
        y: snake[0].y + dy
    };

    let max = canvas.width / GRID;

    if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= max ||
        head.y >= max
    ) {
        return gameOver();
    }

    if (snake.some(s => s.x === head.x && s.y === head.y)) {
        return gameOver();
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;

        if (score > highScore) {
            highScore = score;
            localStorage.setItem("neoHigh", highScore);
            highScoreEl.textContent = highScore;
        }

        food = spawnFood();

        /* SPEED BOOST */
        if (score % 5 === 0) speed += 0.5;

    } else {
        snake.pop();
    }

    draw();
}

/* DRAW (MODERN EFFECTS) */
function draw() {
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* FOOD GLOW */
    ctx.shadowBlur = 20;
    ctx.shadowColor = "red";
    ctx.fillStyle = "red";
    ctx.fillRect(food.x * GRID, food.y * GRID, GRID, GRID);

    /* SNAKE NEON */
    snake.forEach((s, i) => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#39ff14";

        ctx.fillStyle = i === 0 ? "#7CFC00" : "#39ff14";
        ctx.fillRect(s.x * GRID, s.y * GRID, GRID - 2, GRID - 2);
    });

    ctx.shadowBlur = 0;
}

/* GAME OVER */
function gameOver() {
    running = false;
    finalScoreEl.textContent = score;
    gameOverScreen.classList.remove("hidden");
}

/* CONTROLS */
document.addEventListener("keydown", (e) => {
    if (e.key === " ") togglePause();

    if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -1; }
    if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 1; }
    if (e.key === "ArrowLeft" && dx === 0) { dx = -1; dy = 0; }
    if (e.key === "ArrowRight" && dx === 0) { dx = 1; dy = 0; }
});

/* PAUSE */
function togglePause() {
    if (!running) return;
    paused = !paused;
    pauseBtn.textContent = paused ? "Resume" : "Pause";
}

/* BUTTONS */
startBtn.onclick = () => {
    startScreen.classList.add("hidden");
    running = true;
    init();
    requestAnimationFrame(loop);
};

restartBtn.onclick = () => {
    gameOverScreen.classList.add("hidden");
    running = true;
    init();
    requestAnimationFrame(loop);
};

pauseBtn.onclick = togglePause;
