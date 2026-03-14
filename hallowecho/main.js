/**
 * HALLOWECHO UNBREAKABLE ENGINE
 */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const texturePath = './assets/textures/';
const soundPath = './assets/sounds/';

const texturesToLoad = [
    'grimy_plaster_wall.png', 'kitchen_wall.png', 'game_over_static.png',
    'broken_refrigerator.png', 'rusted_stove.png', 'grimy_kitchen_sink.png',
    'organic_remains_pile.png', 'tipped_over_chair.png', 'boarded_up_window.png'
];

const cache = { tex: {}, sfx: {} };
let loadedAssets = 0;

// --- DYNAMIC FALLBACK GENERATOR ---
// If an image is broken, we draw a pink box so the engine doesn't crash.
function createErrorTexture(name) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 64; tempCanvas.height = 64;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = '#ff00ff'; // Neon Pink
    tempCtx.fillRect(0, 0, 64, 64);
    tempCtx.fillStyle = 'black';
    tempCtx.font = '10px Arial';
    tempCtx.fillText("ERROR", 15, 30);
    const img = new Image();
    img.src = tempCanvas.toDataURL();
    return img;
}

// --- BULLETPROOF LOADER ---
function logError(msg) {
    const log = document.getElementById('error-log');
    if(log) log.innerHTML += `<div>${msg}</div>`;
}

function updateLoader() {
    loadedAssets++;
    let progress = Math.floor((loadedAssets / texturesToLoad.length) * 100);
    document.getElementById('load-fill').style.width = progress + '%';
    document.getElementById('status-text').innerText = `SYNCING... ${progress}%`;

    if (loadedAssets === texturesToLoad.length) {
        document.getElementById('status-text').innerText = "ALL SYSTEMS NOMINAL.";
        document.getElementById('start-btn').style.display = 'inline-block';
        document.getElementById('force-btn').style.display = 'none'; // Hide force start if perfect
    }
}

texturesToLoad.forEach(name => {
    const img = new Image();
    img.onload = () => {
        cache.tex[name] = img;
        updateLoader();
    };
    img.onerror = () => {
        logError(`MISSING TEXTURE: ${name}`);
        cache.tex[name] = createErrorTexture(name); // Use fake image
        updateLoader(); // Keep going anyway!
    };
    img.src = texturePath + name;
});

// --- ENGINE VARIABLES ---
let p = { x: 4.5, y: 8.5, dir: -Math.PI / 2, fov: Math.PI / 3 };
let keys = {};
let zBuf = [];
let brightness = 1.0;
let sens = 0.002;

document.getElementById('b-slide').oninput = (e) => brightness = e.target.value / 100;
document.getElementById('s-slide').oninput = (e) => sens = (e.target.value / 100) * 0.003;

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

document.addEventListener('mousemove', e => {
    if (document.pointerLockElement === canvas && !isPaused) {
        p.dir += e.movementX * sens;
    }
});

function getTile(x, y) {
    let tx = Math.floor(x), ty = Math.floor(y);
    if (tx < 0 || tx >= 10 || ty < 0 || ty >= 10) return 1;
    return houseData.floor1[ty][tx];
}

function drawWorld() {
    const w = canvas.width, h = canvas.height;
    zBuf = new Array(w);
    
    for (let i = 0; i < w; i++) {
        let rayAngle = (p.dir - p.fov / 2) + (i / w) * p.fov;
        let dist = 0, hitType = 0;
        let cos = Math.cos(rayAngle), sin = Math.sin(rayAngle);

        while (hitType === 0 && dist < 16) {
            dist += 0.05;
            hitType = getTile(p.x + cos * dist, p.y + sin * dist);
        }

        let correctedDist = dist * Math.cos(rayAngle - p.dir);
        zBuf[i] = correctedDist;
        
        // Prevent Divide by Zero
        if (correctedDist <= 0.1) correctedDist = 0.1; 
        
        let lineH = h / correctedDist;
        let start = (h - lineH) / 2;

        let texName = (hitType === 2) ? 'kitchen_wall.png' : 'grimy_plaster_wall.png';
        let tex = cache.tex[texName];
        
        if (tex && tex.complete && tex.naturalWidth !== 0) {
            ctx.drawImage(tex, i, start, 1, lineH);
        } else {
            ctx.fillStyle = '#555'; ctx.fillRect(i, start, 1, lineH);
        }

        let shade = Math.min(0.98, dist / (12 * brightness));
        ctx.fillStyle = `rgba(0,0,0,${shade})`;
        ctx.fillRect(i, start, 1, lineH);
    }
}

function drawProps() {
    const w = canvas.width, h = canvas.height;
    
    decorObjects.forEach(obj => {
        let dx = obj.x - p.x, dy = obj.y - p.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        let angle = Math.atan2(dy, dx) - p.dir;
        
        while (angle < -Math.PI) angle += 2 * Math.PI;
        while (angle > Math.PI) angle -= 2 * Math.PI;

        if (Math.abs(angle) < p.fov) {
            let sSize = (h / dist) * (obj.scale || 1);
            let screenX = (0.5 * (angle / (p.fov / 2)) + 0.5) * w;
            
            let tex = cache.tex[obj.img];
            if (tex && tex.complete && dist < zBuf[Math.floor(screenX)] + 0.5) {
                ctx.drawImage(tex, screenX - sSize/2, (h - sSize)/2, sSize, sSize);
                ctx.fillStyle = `rgba(0,0,0,${Math.min(0.8, dist/10)})`;
                ctx.fillRect(screenX - sSize/2, (h - sSize)/2, sSize, sSize);
            }
        }
    });
}

window.runEngine = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // SAFE SPAWN GUARD
    if (getTile(p.x, p.y) !== 0) {
        console.warn("SPAWNED IN WALL. RELOCATING.");
        p.x = 1.5; p.y = 1.5; 
    }

    function loop() {
        if (!isPaused) {
            // Movement
            let speed = keys['ShiftLeft'] ? 0.08 : 0.04;
            let nx = p.x, ny = p.y;
            
            if (keys['KeyW']) { nx += Math.cos(p.dir) * speed; ny += Math.sin(p.dir) * speed; }
            if (keys['KeyS']) { nx -= Math.cos(p.dir) * speed; ny -= Math.sin(p.dir) * speed; }
            if (keys['KeyA']) { nx += Math.cos(p.dir - 1.57) * speed; ny += Math.sin(p.dir - 1.57) * speed; }
            if (keys['KeyD']) { nx += Math.cos(p.dir + 1.57) * speed; ny += Math.sin(p.dir + 1.57) * speed; }
            
            // Wall Sliding Collision
            if (getTile(nx, p.y) === 0) p.x = nx;
            if (getTile(p.x, ny) === 0) p.y = ny;

            // Render
            ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawWorld();
            drawProps();
        }
        requestAnimationFrame(loop);
    }
    loop();
};

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});