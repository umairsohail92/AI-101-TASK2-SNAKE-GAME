const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let scoreEl = document.getElementById("score");
let highEl = document.getElementById("high");
let statusEl = document.getElementById("status");

let startScreen = document.getElementById("start");
let gameOverScreen = document.getElementById("gameOver");

let running = false;

/* CAMERA */
let camera = { x: 0, y: 0 };

/* PLAYER WORM */
let worm;

/* ENEMIES */
let enemies = [];

/* FOOD */
let food = [];

let score = 0;
let high = localStorage.getItem("high") || 0;
highEl.innerText = high;

/* INIT GAME */
function init() {
    worm = {
        x: 0,
        y: 0,
        angle: 0,
        speed: 2.5,
        boost: false,
        body: []
    };

    enemies = [];
    food = [];

    for (let i = 0; i < 150; i++) {
        food.push({
            x: (Math.random() - 0.5) * 4000,
            y: (Math.random() - 0.5) * 4000
        });
    }

    for (let i = 0; i < 5; i++) {
        enemies.push({
            x: Math.random() * 2000,
            y: Math.random() * 2000,
            angle: Math.random() * Math.PI * 2,
            body: []
        });
    }

    score = 0;
}

/* INPUT */
let mouse = { x: 0, y: 0 };

document.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

document.addEventListener("keydown", e => {
    if (e.key === "Shift") worm.boost = true;
});

document.addEventListener("keyup", e => {
    if (e.key === "Shift") worm.boost = false;
});

/* GAME LOOP */
function loop() {
    if (!running) return;

    requestAnimationFrame(loop);

    update();
    draw();
}

/* UPDATE */
function update() {

    let dx = mouse.x - canvas.width / 2;
    let dy = mouse.y - canvas.height / 2;

    worm.angle = Math.atan2(dy, dx);

    let speed = worm.boost ? worm.speed * 2 : worm.speed;

    worm.x += Math.cos(worm.angle) * speed;
    worm.y += Math.sin(worm.angle) * speed;

    worm.body.unshift({ x: worm.x, y: worm.y });

    if (worm.body.length > score * 6 + 30) worm.body.pop();

    camera.x = worm.x;
    camera.y = worm.y;

    /* FOOD EAT */
    food.forEach((f, i) => {
        let d = Math.hypot(worm.x - f.x, worm.y - f.y);
        if (d < 20) {
            score++;
            scoreEl.innerText = score;

            food[i] = {
                x: (Math.random() - 0.5) * 4000,
                y: (Math.random() - 0.5) * 4000
            };

            if (score > high) {
                high = score;
                localStorage.setItem("high", high);
                highEl.innerText = high;
            }
        }
    });

    /* SELF COLLISION */
    for (let i = 20; i < worm.body.length; i++) {
        let b = worm.body[i];
        if (Math.hypot(worm.x - b.x, worm.y - b.y) < 10) {
            die();
        }
    }

    /* ENEMY AI (BASIC CHASE FOOD) */
    enemies.forEach(e => {
        let target = food[0];

        e.angle = Math.atan2(target.y - e.y, target.x - e.x);

        e.x += Math.cos(e.angle) * 1.5;
        e.y += Math.sin(e.angle) * 1.5;

        e.body.unshift({ x: e.x, y: e.y });
        if (e.body.length > 60) e.body.pop();
    });
}

/* DRAW */
function draw() {

    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2 - camera.x, canvas.height / 2 - camera.y);

    /* FOOD */
    food.forEach(f => {
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(f.x, f.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    /* ENEMIES */
    enemies.forEach(e => {
        e.body.forEach((b, i) => {
            ctx.fillStyle = "orange";
            ctx.beginPath();
            ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
            ctx.fill();
        });
    });

    /* PLAYER */
    worm.body.forEach((b, i) => {
        ctx.fillStyle = i === 0 ? "#7CFC00" : "#39ff14";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.restore();
}

/* DEATH */
function die() {
    running = false;
    statusEl.innerText = "DEAD";
    gameOverScreen.classList.remove("hidden");
}

/* START */
document.getElementById("startBtn").onclick = () => {
    startScreen.classList.add("hidden");
    init();
    running = true;
    loop();
};
