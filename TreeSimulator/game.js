// --- 1. DATA & SAVING ---
let stats = {
    money: 0,
    mult: 5,
    rebirths: 0,
    workers: 0,
    wPrice: 25,
    aPrice: 100
};

// Save to Local Storage
function save() {
    localStorage.setItem('EchoDupe_Galactic_Save', JSON.stringify(stats));
}

// Load from Local Storage
function load() {
    const data = localStorage.getItem('EchoDupe_Galactic_Save');
    if (data) {
        stats = JSON.parse(data);
        updateUI();
        // Respawn their drones
        for(let i=0; i < stats.workers; i++) spawnBot(true);
    }
}

// Reset Button Logic
window.resetGame = function() {
    if(confirm("Wipe all credits, rebirths, and drones?")) {
        localStorage.removeItem('EchoDupe_Galactic_Save');
        location.reload();
    }
};

// --- 2. THE WORLD SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02050a);
scene.fog = new THREE.FogExp2(0x02050a, 0.006);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Bright Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.9)); 
const sun = new THREE.DirectionalLight(0x00ffff, 0.8);
sun.position.set(20, 100, 20);
scene.add(sun);

// Ground
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshStandardMaterial({ color: 0x0a1a0a })
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// Borders (The Hard Walls)
function makeWall(x, z, w, d) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 15, d), new THREE.MeshStandardMaterial({color: 0x050505}));
    wall.position.set(x, 7.5, z); scene.add(wall);
}
makeWall(0, 150, 300, 2); makeWall(0, -150, 300, 2);
makeWall(150, 0, 2, 300); makeWall(-150, 0, 2, 300);

// Shop
const shop = new THREE.Group();
shop.add(new THREE.Mesh(new THREE.BoxGeometry(16, 12, 16), new THREE.MeshStandardMaterial({color: 0x000000})));
const glow = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.5, 16.5), new THREE.MeshBasicMaterial({color: 0x00ffff}));
glow.position.y = 6; shop.add(glow);
shop.position.set(0, 6, -60); scene.add(shop);

// --- 3. GAMEPLAY ---
let trees = [];
function createTree(x, z) {
    const g = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 5), new THREE.MeshStandardMaterial({color: 0x1a0d00}));
    const l = new THREE.Mesh(new THREE.ConeGeometry(3, 9, 6), new THREE.MeshStandardMaterial({color: 0x00ff00, emissive: 0x002200}));
    l.position.y = 5; g.add(t, l);
    g.position.set(x, 0, z); scene.add(g);
    return { obj: g, x, z };
}
for(let i=0; i<70; i++) trees.push(createTree((Math.random()-0.5)*270, (Math.random()-0.5)*270));

let bots = [];
function spawnBot(loading = false) {
    const b = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7), new THREE.MeshStandardMaterial({color: 0x00ffff, wireframe: true}));
    b.position.set((Math.random()-0.5)*40, 6, (Math.random()-0.5)*40);
    scene.add(b); bots.push(b);
    if(!loading) save();
}

// --- 4. CONTROLS & CAMERA ---
let player = { x: 0, z: 20, yaw: 0 };
let keys = {};

// Handle clicking to look around (No more "Start" button)
document.addEventListener("mousedown", () => {
    if (document.pointerLockElement !== document.body) {
        document.body.requestPointerLock();
    }
});

document.addEventListener("mousemove", (e) => {
    if(document.pointerLockElement === document.body) {
        player.yaw -= e.movementX * 0.0025;
        camera.rotation.set(0, player.yaw, 0);
    }
});

document.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if(k === 'e' && Math.sqrt(player.x**2 + (player.z + 60)**2) < 22) document.getElementById('store-gui').style.display='block';
    if(k === 'k') { player.x = 0; player.z = -40; } // TP to Shop
    if(k === 'p') document.getElementById('settings-gui').style.display='block';
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// --- 5. LOGIC & UI ---
window.buyWorker = function() {
    if(stats.money >= stats.wPrice) {
        stats.money -= stats.wPrice; stats.workers++;
        spawnBot(); stats.wPrice = Math.floor(stats.wPrice * 1.8);
        updateUI(); save();
    }
};

window.doRebirth = function() {
    if(stats.money >= 5000) {
        stats.money = 0; stats.rebirths++;
        stats.mult = 5 * (stats.rebirths + 1);
        stats.workers = 0; stats.wPrice = 25;
        bots.forEach(b => scene.remove(b)); bots = [];
        updateUI(); save();
    }
};

function updateUI() {
    document.getElementById('money').innerText = Math.floor(stats.money);
    document.getElementById('rebirths').innerText = stats.rebirths;
    document.getElementById('w-cost').innerText = stats.wPrice;
}

// Worker Income
setInterval(() => {
    if(stats.workers > 0) {
        stats.money += (stats.workers * (stats.rebirths + 1));
        updateUI(); save();
    }
}, 1000);

// --- 6. ANIMATION LOOP ---
function update() {
    let speed = keys["shift"] ? 0.9 : 0.5;
    if(keys["w"]) { player.x -= Math.sin(player.yaw) * speed; player.z -= Math.cos(player.yaw) * speed; }
    if(keys["s"]) { player.x += Math.sin(player.yaw) * speed; player.z += Math.cos(player.yaw) * speed; }
    if(keys["a"]) { player.x -= Math.cos(player.yaw) * speed; player.z += Math.sin(player.yaw) * speed; }
    if(keys["d"]) { player.x += Math.cos(player.yaw) * speed; player.z -= Math.sin(player.yaw) * speed; }

    player.x = Math.max(-145, Math.min(145, player.x));
    player.z = Math.max(-145, Math.min(145, player.z));
    camera.position.set(player.x, 5, player.z);

    trees.forEach(t => {
        if(Math.sqrt((player.x - t.x)**2 + (player.z - t.z)**2) < 5) {
            stats.money += stats.mult; updateUI(); save();
            t.x = (Math.random()-0.5)*270; t.z = (Math.random()-0.5)*270;
            t.obj.position.set(t.x, 0, t.z);
        }
    });

    bots.forEach(b => { b.rotation.y += 0.03; b.position.y = 6 + Math.sin(Date.now()*0.003); });
}

function animate() { requestAnimationFrame(animate); update(); renderer.render(scene, camera); }

load();
animate();
