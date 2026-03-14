/**
 * HALLOWECHO: HARDENED RAYCASTING ENGINE
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const assetsPath = './assets/';
const textureCache = {};
const textureNames = [
    'grimy_plaster_wall.png', 'dusty_hardwood_floor.png', 
    'kitchen_wall.png', 'creature_silhouette.png', 'game_over_static.png'
];

// Preload Textures with Status Logging
textureNames.forEach(name => {
    const img = new Image();
    img.onload = () => console.log(`[HallowEcho] Asset Loaded: ${name}`);
    img.onerror = () => console.error(`[HallowEcho] Asset Missing: ${name}`);
    img.src = assetsPath + name;
    textureCache[name] = img;
});

const sfx = {
    gameOver: new Audio(assetsPath + 'game_over.mp3'),
    footstep: new Audio(assetsPath + 'footstep_wood.mp3')
};

// Player State
let player = {
    x: 4.5, y: 8.5, // Start at door (updated from map.js spawn)
    dir: -Math.PI / 2, // Face North
    fov: Math.PI / 3,
    dead: false,
    stamina: 100
};

let keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Collision Helper: Checks if a grid coordinate is a wall
function isWall(x, y) {
    if (x < 0 || x >= 10 || y < 0 || y >= 10) return true;
    const tile = houseData.floor1[Math.floor(y)][Math.floor(x)];
    return (tile === 1 || tile === 2); // 1 and 2 are walls
}

function castRays() {
    const width = canvas.width;
    const height = canvas.height;
    const map = houseData.floor1;

    for (let i = 0; i < width; i++) {
        let rayAngle = (player.dir - player.fov / 2) + (i / width) * player.fov;
        let distanceToWall = 0;
        let hitWall = false;
        let hitType = 0;

        let eyeX = Math.cos(rayAngle);
        let eyeY = Math.sin(rayAngle);

        // Ray Marching
        while (!hitWall && distanceToWall < 16) {
            distanceToWall += 0.04; // Slightly larger step for performance
            let testX = Math.floor(player.x + eyeX * distanceToWall);
            let testY = Math.floor(player.y + eyeY * distanceToWall);

            if (testX < 0 || testX >= 10 || testY < 0 || testY >= 10) {
                hitWall = true; distanceToWall = 16;
            } else {
                let cell = map[testY][testX];
                if (cell === 1 || cell === 2) {
                    hitWall = true;
                    hitType = cell;
                }
            }
        }

        // Draw 3D Walls
        let wallHeight = height / distanceToWall;
        let ceiling = (height - wallHeight) / 2;
        
        // Select Texture
        let tex = hitType === 2 ? textureCache['kitchen_wall.png'] : textureCache['grimy_plaster_wall.png'];
        
        if (tex && tex.complete && tex.naturalWidth !== 0) {
            ctx.drawImage(tex, i, ceiling, 1, wallHeight);
        } else {
            // Fallback: If image fails, draw a dark grey bar
            ctx.fillStyle = hitType === 2 ? "#1a1a1a" : "#2a2a2a";
            ctx.fillRect(i, ceiling, 1, wallHeight);
        }
        
        // Depth Shading (Darker in the distance)
        let shade = Math.min(1, distanceToWall / 12);
        ctx.fillStyle = `rgba(0,0,0,${shade})`;
        ctx.fillRect(i, ceiling, 1, wallHeight);
    }
}

function drawMiniMap() {
    const size = 10;
    const map = houseData.floor1;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(10, 10, 100, 100);
    
    for(let y=0; y<10; y++) {
        for(let x=0; x<10; x++) {
            if(map[y][x] === 1 || map[y][x] === 2) {
                ctx.fillStyle = "#555";
                ctx.fillRect(10 + x*10, 10 + y*10, 10, 10);
            }
        }
    }
    // Draw Player dot
    ctx.fillStyle = "cyan";
    ctx.fillRect(10 + player.x*10 - 2, 10 + player.y*10 - 2, 4, 4);
}

function update() {
    if (player.dead) return;

    let moveSpeed = keys['ShiftLeft'] ? 0.08 : 0.05;
    let rotSpeed = 0.04;

    if (keys['KeyA']) player.dir -= rotSpeed;
    if (keys['KeyD']) player.dir += rotSpeed;

    let nx = player.x;
    let ny = player.y;

    if (keys['KeyW']) {
        nx += Math.cos(player.dir) * moveSpeed;
        ny += Math.sin(player.dir) * moveSpeed;
    }
    if (keys['KeyS']) {
        nx -= Math.cos(player.dir) * moveSpeed;
        ny -= Math.sin(player.dir) * moveSpeed;
    }

    // Basic Wall Sliding Collision
    if (!isWall(nx, player.y)) player.x = nx;
    if (!isWall(player.x, ny)) player.y = ny;
}

function draw() {
    if (player.dead) {
        ctx.drawImage(textureCache['game_over_static.png'], 0, 0, canvas.width, canvas.height);
        return;
    }

    // Ceiling & Floor
    ctx.fillStyle = "#020202"; ctx.fillRect(0, 0, canvas.width, canvas.height/2);
    ctx.fillStyle = "#080808"; ctx.fillRect(0, canvas.height/2, canvas.width, canvas.height/2);

    castRays();

    // Horror Vignette (Flashlight)
    const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 20, canvas.width/2, canvas.height/2, canvas.width/0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMiniMap(); // Helps you find your way
}

window.initHallowEcho = () => {
    console.log("HallowEcho initialized.");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Set Spawn from Map Data if available
    if(houseData.spawn) {
        player.x = houseData.spawn.x;
        player.y = houseData.spawn.y;
        player.dir = houseData.spawn.dir;
    }

    function loop() { 
        update(); 
        draw(); 
        requestAnimationFrame(loop); 
    }
    loop();
};