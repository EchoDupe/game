/**
 * HALLOWECHO MEGA ENGINE
 */
const cvs = document.getElementById('gameCanvas');
const ctx = cvs.getContext('2d');

const texturePath = './assets/textures/';
const soundPath = './assets/sounds/';

const textures = [
    'grimy_plaster_wall.png', 'kitchen_wall.png', 'game_over_static.png',
    'broken_refrigerator.png', 'rusted_stove.png', 'grimy_kitchen_sink.png',
    'flickering_lightbulb.png', 'organic_remains_pile.png'
];

const sounds = [
    'door_open_1s.mp3', 'flickering_light.mp3', 'game_over.mp3'
];

const cache = { tex: {}, sfx: {} };
let loaded = 0;
let totalAssets = textures.length + sounds.length;

// --- ASSET LOADER ---
function loadAll() {
    textures.forEach(name => {
        const img = new Image();
        img.onload = checkProgress;
        img.src = texturePath + name;
        cache.tex[name] = img;
    });

    sounds.forEach(name => {
        const audio = new Audio();
        audio.oncanplaythrough = checkProgress;
        audio.src = soundPath + name;
        cache.sfx[name] = audio;
    });
}

function checkProgress() {
    loaded++;
    let p = Math.floor((loaded / totalAssets) * 100);
    document.getElementById('fill').style.width = p + '%';
    if (loaded >= totalAssets) {
        document.getElementById('status').innerText = "SYSTEMS_READY";
        document.getElementById('start-btn').style.display = 'inline-block';
    }
}

loadAll();

// --- ENGINE STATE ---
let p = { x: 4.5, y: 8.5, dir: -Math.PI / 2, fov: Math.PI / 3 };
let keys = {};
let zBuf = [];
let brightness = 1.0;
let flicker = 1.0;

document.getElementById('bright-slider').oninput = (e) => brightness = e.target.value / 100;

window.onkeydown = (e) => keys[e.code] = true;
window.onkeyup = (e) => keys[e.code] = false;

document.onmousemove = (e) => {
    if (document.pointerLockElement === cvs && !isPaused) {
        p.dir += e.movementX * 0.002;
    }
};

// --- SOUND LOGIC ---
function playSpatial(name, x, y) {
    let dx = x - p.x;
    let dy = y - p.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    let vol = Math.max(0, 1 - (dist / 10));
    let s = cache.sfx[name];
    if (s) {
        s.volume = vol * 0.5;
        if (s.paused) s.play().catch(()=>{});
    }
}

function getMap(x, y) {
    let tx = Math.floor(x), ty = Math.floor(y);
    if (tx < 0 || tx >= 10 || ty < 0 || ty >= 10) return 1;
    return houseData.floor1[ty][tx];
}

function render() {
    const w = cvs.width, h = cvs.height;
    zBuf = [];
    
    // Dynamic Flicker
    if (Math.random() > 0.98) flicker = Math.random() * 0.5 + 0.5;
    else flicker = 1.0;

    for (let i = 0; i < w; i++) {
        let angle = (p.dir - p.fov / 2) + (i / w) * p.fov;
        let d = 0, hit = 0;
        let cos = Math.cos(angle), sin = Math.sin(angle);

        while (hit === 0 && d < 16) {
            d += 0.05;
            hit = getMap(p.x + cos * d, p.y + sin * d);
        }

        zBuf[i] = d;
        let lineH = h / (d * Math.cos(angle - p.dir) || 0.1);
        let start = (h - lineH) / 2;

        let tex = (hit === 2) ? cache.tex['kitchen_wall.png'] : cache.tex['grimy_plaster_wall.png'];
        if (tex && tex.complete) ctx.drawImage(tex, i, start, 1, lineH);

        let darkness = Math.min(0.98, d / (12 * brightness * flicker));
        ctx.fillStyle = `rgba(0,0,0,${darkness})`;
        ctx.fillRect(i, start, 1, lineH);
    }

    // DRAW PROPS
    decorObjects.forEach(obj => {
        let dx = obj.x - p.x, dy = obj.y - p.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        let angle = Math.atan2(dy, dx) - p.dir;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        while (angle > Math.PI) angle -= 2 * Math.PI;

        if (Math.abs(angle) < p.fov) {
            let size = (h / dist) * (obj.scale || 1);
            let screenX = (0.5 * (angle / (p.fov / 2)) + 0.5) * w;
            let tex = cache.tex[obj.img];
            if (tex && tex.complete && dist < zBuf[Math.floor(screenX)] + 0.3) {
                ctx.drawImage(tex, screenX - size/2, (h-size)/2, size, size);
                ctx.fillStyle = `rgba(0,0,0,${Math.min(0.8, dist/10)})`;
                ctx.fillRect(screenX - size/2, (h-size)/2, size, size);
            }
        }
    });
}

function update() {
    if (isPaused) return;
    let s = keys['ShiftLeft'] ? 0.08 : 0.04;
    let nx = p.x, ny = p.y;
    if (keys['KeyW']) { nx += Math.cos(p.dir) * s; ny += Math.sin(p.dir) * s; }
    if (keys['KeyS']) { nx -= Math.cos(p.dir) * s; ny -= Math.sin(p.dir) * s; }
    if (keys['KeyA']) { nx += Math.cos(p.dir - 1.57) * s; ny += Math.sin(p.dir - 1.57) * s; }
    if (keys['KeyD']) { nx += Math.cos(p.dir + 1.57) * s; ny += Math.sin(p.dir + 1.57) * s; }
    
    if (getMap(nx, p.y) === 0) p.x = nx;
    if (getMap(p.x, ny) === 0) p.y = ny;

    // Trigger Ambient Light Sound
    if (Math.random() > 0.995) playSpatial('flickering_light.mp3', 5, 5);
}

window.runEngine = () => {
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    function loop() {
        ctx.fillStyle = '#010101'; ctx.fillRect(0,0,cvs.width,cvs.height);
        update();
        render();
        requestAnimationFrame(loop);
    }
    loop();
};