// --- 1. DATA ---
let stats = { money: 0, mult: 5, rebirths: 0, workers: 0, wPrice: 25 };
let sensitivity = 0.003;
let isHarvesting = false;
let isMenuOpen = false;

function save() { localStorage.setItem('Echo_Tree_v3', JSON.stringify(stats)); }
function load() {
    const d = localStorage.getItem('Echo_Tree_v3');
    if(d) { stats = JSON.parse(d); updateUI(); }
}
window.resetGame = function() {
    if(confirm("Wipe all data?")) { localStorage.removeItem('Echo_Tree_v3'); location.reload(); }
};
window.updateSens = function(val) { sensitivity = val * 0.001; };

// --- 2. WORLD SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(50, 150, 50);
scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshStandardMaterial({ color: 0x3d8c40 }));
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// --- 3. THE SHOP HOUSE ---
const shopHouse = new THREE.Group();
const houseBody = new THREE.Mesh(new THREE.BoxGeometry(12, 10, 12), new THREE.MeshStandardMaterial({color: 0x8d6e63}));
houseBody.position.y = 5;
const roof = new THREE.Mesh(new THREE.ConeGeometry(10, 6, 4), new THREE.MeshStandardMaterial({color: 0x4e342e}));
roof.position.y = 13; roof.rotation.y = Math.PI/4;
shopHouse.add(houseBody, roof);
shopHouse.position.set(0, 0, -50);
scene.add(shopHouse);

// --- 4. DIVERSE TREES ---
let trees = [];
function createTree(x, z) {
    const group = new THREE.Group();
    const heightScale = 0.8 + Math.random() * 1.5;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 5 * heightScale), new THREE.MeshStandardMaterial({ color: 0x5d4037 }));
    trunk.position.y = (5 * heightScale) / 2;
    group.add(trunk);
    
    const leafType = Math.floor(Math.random() * 3);
    let leafGeo = leafType === 0 ? new THREE.ConeGeometry(4, 10 * heightScale, 8) : 
                  leafType === 1 ? new THREE.SphereGeometry(4, 8, 8) : new THREE.BoxGeometry(6, 6, 6);
    const leaves = new THREE.Mesh(leafGeo, new THREE.MeshStandardMaterial({ color: 0x2e7d32 }));
    leaves.position.y = (5 * heightScale) + 3;
    group.add(leaves);

    group.position.set(x, 0, z);
    scene.add(group);
    return { obj: group, x, z };
}
for(let i=0; i<100; i++) trees.push(createTree((Math.random()-0.5)*450, (Math.random()-0.5)*450));

// --- 5. CONTROLS FIX ---
let player = { x: 0, z: 10, yaw: 0 };
let keys = {};

window.addEventListener("mousedown", (e) => {
    // ONLY lock the mouse if we aren't clicking a menu
    if(!isMenuOpen) {
        renderer.domElement.requestPointerLock();
    }
});

document.addEventListener("pointerlockchange", () => {
    // Sync menu state with pointer lock
    if (document.pointerLockElement !== renderer.domElement) {
        // Pointer was lost (esc pressed or menu opened)
    } else {
        isMenuOpen = false;
        document.getElementById('store-gui').style.display = 'none';
        document.getElementById('settings-gui').style.display = 'none';
    }
});

document.addEventListener("mousemove", (e) => {
    if(document.pointerLockElement === renderer.domElement) {
        player.yaw -= e.movementX * sensitivity;
        camera.rotation.set(0, player.yaw, 0);
    }
});

document.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if(k === 'e') {
        let distToShop = Math.sqrt(player.x**2 + (player.z + 50)**2);
        if(distToShop < 20) {
            isMenuOpen = true;
            document.getElementById('store-gui').style.display = 'block';
            document.exitPointerLock();
        }
    }
    if(k === 'p') {
        isMenuOpen = true;
        document.getElementById('settings-gui').style.display = 'block';
        document.exitPointerLock();
    }
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// --- 6. SHOP LOGIC ---
window.buyWorker = function() {
    if(stats.money >= stats.wPrice) {
        stats.money -= stats.wPrice;
        stats.workers++;
        stats.wPrice = Math.floor(stats.wPrice * 1.6);
        updateUI(); save();
        console.log("Worker Bought!");
    } else {
        alert("Not enough money!");
    }
};

window.doRebirth = function() {
    if(stats.money >= 5000) {
        stats.money = 0; stats.rebirths++;
        stats.mult = 5 * (stats.rebirths + 1);
        stats.workers = 0; stats.wPrice = 25;
        updateUI(); save();
    }
};

function updateUI() {
    document.getElementById('money').innerText = Math.floor(stats.money);
    document.getElementById('w-cost').innerText = stats.wPrice;
}

// --- 7. MAIN LOOP ---
function update() {
    if(isMenuOpen) return; // Freeze player movement when menu is open

    let speed = keys["shift"] ? 1.3 : 0.7;
    if(keys["w"]) { player.x -= Math.sin(player.yaw) * speed; player.z -= Math.cos(player.yaw) * speed; }
    if(keys["s"]) { player.x += Math.sin(player.yaw) * speed; player.z += Math.cos(player.yaw) * speed; }
    if(keys["a"]) { player.x -= Math.cos(player.yaw) * speed; player.z += Math.sin(player.yaw) * speed; }
    if(keys["d"]) { player.x += Math.cos(player.yaw) * speed; player.z -= Math.sin(player.yaw) * speed; }

    camera.position.set(player.x, 6, player.z);

    if(!isHarvesting) {
        trees.forEach(t => {
            const dist = Math.sqrt((player.x - t.x)**2 + (player.z - t.z)**2);
            if(dist < 5) {
                isHarvesting = true;
                stats.money += stats.mult;
                updateUI(); save();
                t.x = (Math.random()-0.5)*450; t.z = (Math.random()-0.5)*450;
                t.obj.position.set(t.x, 0, t.z);
                setTimeout(() => { isHarvesting = false; }, 150); 
            }
        });
    }
}

function animate() { requestAnimationFrame(animate); update(); renderer.render(scene, camera); }
load(); animate();
