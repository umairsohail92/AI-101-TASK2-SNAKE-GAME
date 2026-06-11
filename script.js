const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const gameOverEl = document.getElementById("gameOver");

canvas.width = 400;
canvas.height = 400;

const gridSize = 20;
let snake, food, dx, dy, score, highScore;
let game;

function init() {
    snake = [{ x: 10, y: 10 }];
    dx = 1;
    dy = 0;
    score = 0;

    highScore = localStorage.getItem("highScore") || 0;
    highScoreEl.textContent = highScore;

    food = spawnFood();

    gameOverEl.classList.add("hidden");

    clearInterval(game);
    game = setInterval(update, 120);
}

function spawnFood() {
    return {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize))
    };
}

function update() {
    let head = {
        x: snake[0].x + dx,
        y: snake[0].y + dy
    };

    let max = canvas.width / gridSize;

    if (head.x < 0 || head.y < 0 || head.x >= max || head.y >= max) {
        return gameOver();
    }

    for (let s of snake) {
        if (head.x === s.x && head.y === s.y) {
            return gameOver();
        }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;

        if (score > highScore) {
            highScore = score;
            localStorage.setItem("highScore", highScore);
        }

        food = spawnFood();
    } else {
        snake.pop();
    }

    draw();
}

function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "red";
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

    snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? "lime" : "green";
        ctx.fillRect(s.x * gridSize, s.y * gridSize, gridSize, gridSize);
    });
}

function gameOver() {
    clearInterval(game);
    gameOverEl.classList.remove("hidden");
}

function restartGame() {
    init();
}

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -1; }
    if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 1; }
    if (e.key === "ArrowLeft" && dx === 0) { dx = -1; dy = 0; }
    if (e.key === "ArrowRight" && dx === 0) { dx = 1; dy = 0; }
});

init();
