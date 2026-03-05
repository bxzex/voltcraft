import * as THREE from 'three';

// --- 1. CORE CONFIG & STATE ---
const CONFIG = {
    worldSize: 6, chunkSize: 16, maxInstances: 300000,
    mouseSensitivity: 0.002, playerSpeed: 6, jumpForce: 10,
    gravity: 25, flySpeed: 20, actionDuration: 200, bedrockDepth: -20,
    playerRadius: 0.3
};

let state = {
    gameStarted: false, inventoryOpen: false, firstPerson: true, isFlying: false,
    actionTime: 0, prevTime: performance.now(), yaw: 0, pitch: 0,
    velocity: new THREE.Vector3(), move: { f: 0, b: 0, l: 0, r: 0, u: 0, d: 0 },
    lastTaps: {}, stepLatch: false, activeSlot: 0, selectedItem: 'grass',
    worldTime: Math.PI / 4, // Morning
    weather: 'clear' // clear, rain, thunder
};

const inventoryItems = [
    'grass', 'dirt', 'stone', 'cobblestone', 'wood', 'planks', 'leaves', 
    'sand', 'glass', 'brick', 'bookshelf', 'obsidian', 'diamond_ore', 
    'gold_ore', 'iron_ore', 'coal_ore', 'crafting_table', 'furnace', 'tnt',
    'water', 'lava',
    'dandelion', 'poppy', 'pickaxe', 'sword'
];
let hotbarSlots = ['grass', 'cobblestone', 'planks', 'crafting_table', 'furnace', 'diamond_ore', 'water', 'pickaxe', 'sword'];
state.selectedItem = hotbarSlots[state.activeSlot];

const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// --- 2. MULTIPLAYER (PeerJS) ---
let peer = null;
let connections = {};
let myId = null;

const mpStatus = document.getElementById('mp-status');
const hostBtn = document.getElementById('host-btn');
const joinBtn = document.getElementById('join-btn');
const worldIdInput = document.getElementById('world-id-input');

function setupPeerEvents(conn) {
    conn.on('open', () => {
        mpStatus.innerText = `Connected to ${conn.peer}!`;
        if (peer.id === myId) conn.send({ type: 'init_world', data: Array.from(world.entries()), time: state.worldTime, weather: state.weather });
    });
    conn.on('data', (msg) => {
        if (msg.type === 'init_world') {
            world.clear();
            msg.data.forEach(([k, v]) => world.set(k, v));
            state.worldTime = msg.time;
            setWeather(msg.weather);
            updateInstances();
            mpStatus.innerText = "World downloaded! Ready to play.";
        } else if (msg.type === 'place') {
            world.set(msg.k, { type: msg.blockType });
            updateInstances();
            playSound('place');
        } else if (msg.type === 'break') {
            world.delete(msg.k);
            updateInstances();
            playSound('break');
        } else if (msg.type === 'player_move') {
            updateRemotePlayer(conn.peer, msg.pos, msg.yaw, msg.pitch, msg.isMoving);
        } else if (msg.type === 'set_time') {
            state.worldTime = msg.time;
        } else if (msg.type === 'set_weather') {
            setWeather(msg.weather);
        }
    });
    conn.on('close', () => {
        mpStatus.innerText = `Player ${conn.peer} left.`;
        removeRemotePlayer(conn.peer);
        delete connections[conn.peer];
    });
}

function broadcast(msg) {
    Object.values(connections).forEach(c => { if(c.open) c.send(msg); });
}

if(hostBtn) hostBtn.onclick = () => {
    peer = new window.Peer();
    peer.on('open', (id) => {
        myId = id;
        worldIdInput.value = id;
        mpStatus.innerText = `Hosting World: ${id} (Waiting...)`;
    });
    peer.on('connection', (conn) => {
        connections[conn.peer] = conn;
        setupPeerEvents(conn);
    });
};

if(joinBtn) joinBtn.onclick = () => {
    const targetId = worldIdInput.value.trim();
    if(!targetId) return alert("Enter a World ID");
    mpStatus.innerText = "Connecting...";
    peer = new window.Peer();
    peer.on('open', (id) => {
        const conn = peer.connect(targetId);
        connections[targetId] = conn;
        setupPeerEvents(conn);
    });
};

// --- 3. PROCEDURAL & EXTERNAL ASSETS (VOLTCRAFT) ---
const ASSET_URL = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.2/assets/minecraft/';
const texLoader = new THREE.TextureLoader();
texLoader.setCrossOrigin('anonymous');

const extTex = (path) => {
    const t = texLoader.load(ASSET_URL + 'textures/' + path);
    t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
    return t;
};

// We mix procedural blocks with actual Minecraft entity textures to satisfy the prompt.
const texCache = {};
const dataUrls = {};

function createTexture(name, size=16, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx, size);
    
    dataUrls[name] = canvas.toDataURL();
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    texCache[name] = tex;
    return tex;
}

function noise(ctx, size, baseColor, varAmt, rR, rG, rB) {
    ctx.fillStyle = baseColor; ctx.fillRect(0,0,size,size);
    const img = ctx.getImageData(0,0,size,size);
    for(let i=0; i<img.data.length; i+=4) {
        let n = (Math.random()-0.5)*varAmt;
        img.data[i] = Math.max(0, Math.min(255, img.data[i]+n*rR));
        img.data[i+1] = Math.max(0, Math.min(255, img.data[i+1]+n*rG));
        img.data[i+2] = Math.max(0, Math.min(255, img.data[i+2]+n*rB));
    }
    ctx.putImageData(img, 0, 0);
}

createTexture('dirt', 16, ctx => noise(ctx, 16, '#5C4033', 30, 1, 0.9, 0.8));
createTexture('grass_top', 16, ctx => noise(ctx, 16, '#4CA938', 40, 0.8, 1, 0.5));
createTexture('grass_side', 16, ctx => {
    noise(ctx, 16, '#5C4033', 30, 1, 0.9, 0.8);
    ctx.fillStyle = '#4CA938';
    for(let x=0; x<16; x++) { ctx.fillRect(x, 0, 1, 4 + Math.random()*3); }
});
createTexture('stone', 16, ctx => noise(ctx, 16, '#7D7D7D', 40, 1, 1, 1));
createTexture('cobblestone', 16, ctx => {
    noise(ctx, 16, '#666666', 20, 1, 1, 1); ctx.fillStyle = '#444444';
    ctx.fillRect(0,0,16,1); ctx.fillRect(0,8,16,1); ctx.fillRect(8,0,1,8); ctx.fillRect(4,8,1,8); ctx.fillRect(12,8,1,8);
});
createTexture('wood', 16, ctx => {
    noise(ctx, 16, '#4A3525', 10, 1, 0.8, 0.5); ctx.fillStyle = '#332211';
    for(let x=0; x<16; x+=3) ctx.fillRect(x, 0, 1, 16);
});
createTexture('wood_top', 16, ctx => {
    noise(ctx, 16, '#8B5A2B', 15, 1, 0.9, 0.6); ctx.strokeStyle = '#4A3525'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(8, 8, 4, 0, Math.PI*2); ctx.stroke();
});
createTexture('planks', 16, ctx => {
    noise(ctx, 16, '#C19A6B', 15, 1, 0.9, 0.6); ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(0, 3, 16, 1); ctx.fillRect(0, 7, 16, 1); ctx.fillRect(0, 11, 16, 1); ctx.fillRect(0, 15, 16, 1);
});
createTexture('leaves', 16, ctx => {
    ctx.clearRect(0,0,16,16); ctx.fillStyle = '#228B22';
    for(let i=0; i<60; i++) ctx.fillRect(Math.random()*16, Math.random()*16, 2, 2);
    ctx.fillStyle = '#006400';
    for(let i=0; i<60; i++) ctx.fillRect(Math.random()*16, Math.random()*16, 2, 2);
});
createTexture('sand', 16, ctx => noise(ctx, 16, '#EEDD82', 15, 1, 1, 0.8));
createTexture('glass', 16, ctx => {
    ctx.fillStyle = 'rgba(173, 216, 230, 0.3)'; ctx.fillRect(0,0,16,16);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(0,0,16,2); ctx.fillRect(0,0,2,16); ctx.fillRect(14,0,2,16); ctx.fillRect(0,14,16,2); ctx.fillRect(4,4,4,2);
});
createTexture('brick', 16, ctx => {
    ctx.fillStyle = '#B22222'; ctx.fillRect(0,0,16,16); ctx.fillStyle = '#DDDDDD';
    ctx.fillRect(0,3,16,1); ctx.fillRect(0,7,16,1); ctx.fillRect(0,11,16,1); ctx.fillRect(0,15,16,1);
    for(let y=0; y<16; y+=4) { let off = (y%8===0)?4:8; ctx.fillRect(off, y, 1, 4); ctx.fillRect(off+8, y, 1, 4); }
});
createTexture('obsidian', 16, ctx => noise(ctx, 16, '#1A0B2E', 20, 1, 0.5, 1));
createTexture('bedrock', 16, ctx => noise(ctx, 16, '#222222', 60, 1, 1, 1));
createTexture('water', 16, ctx => { noise(ctx, 16, '#0000FF', 20, 0, 0, 1); });
createTexture('lava', 16, ctx => { noise(ctx, 16, '#FF4500', 40, 1, 0.5, 0); });

const genOre = (name, color) => {
    createTexture(name, 16, ctx => {
        ctx.drawImage(texCache['stone'].image, 0, 0); ctx.fillStyle = color;
        for(let i=0; i<8; i++) { ctx.fillRect(2+Math.random()*10, 2+Math.random()*10, 2+Math.random()*2, 2+Math.random()*2); }
    });
};
genOre('diamond_ore', '#00FFFF'); genOre('gold_ore', '#FFD700'); genOre('iron_ore', '#F5F5DC'); genOre('coal_ore', '#111111');

createTexture('craft_top', 16, ctx => {
    ctx.fillStyle = '#C19A6B'; ctx.fillRect(0,0,16,16); ctx.fillStyle = '#8B5A2B'; ctx.fillRect(2,2,12,12);
    ctx.fillStyle = '#C19A6B'; ctx.fillRect(4,4,3,3); ctx.fillRect(8,4,3,3); ctx.fillRect(4,8,3,3); ctx.fillRect(8,8,3,3);
});
createTexture('craft_side', 16, ctx => {
    ctx.drawImage(texCache['wood'].image, 0, 0); ctx.fillStyle = '#A0522D'; ctx.fillRect(2,2,12,4);
    ctx.fillStyle = '#8B4513'; ctx.fillRect(4,3,2,2); ctx.fillRect(10,3,2,2);
});
createTexture('furnace_front', 16, ctx => {
    ctx.drawImage(texCache['cobblestone'].image, 0, 0); ctx.fillStyle = '#222222'; ctx.fillRect(4,8,8,6);
    ctx.fillStyle = '#FF4500'; ctx.fillRect(5,10,6,3); ctx.fillStyle = '#111111'; ctx.fillRect(4,2,8,4);
});
createTexture('bookshelf', 16, ctx => {
    ctx.drawImage(texCache['planks'].image, 0, 0); ctx.fillStyle = '#332211'; ctx.fillRect(2,2,12,5); ctx.fillRect(2,9,12,5);
    const cols = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
    for(let i=0; i<6; i++) {
        ctx.fillStyle = cols[Math.floor(Math.random()*cols.length)]; ctx.fillRect(3+i*2, 2, 1, 4+Math.random());
        ctx.fillStyle = cols[Math.floor(Math.random()*cols.length)]; ctx.fillRect(3+i*2, 9, 1, 4+Math.random());
    }
});
createTexture('tnt_side', 16, ctx => {
    ctx.fillStyle = '#FF3333'; ctx.fillRect(0,0,16,16); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0,6,16,4);
    ctx.fillStyle = '#000000'; ctx.font = '5px monospace'; ctx.fillText('TNT', 1, 9);
    ctx.fillStyle = '#AA0000'; ctx.fillRect(3,0,1,16); ctx.fillRect(8,0,1,16); ctx.fillRect(13,0,1,16);
});
createTexture('tnt_top', 16, ctx => {
    ctx.fillStyle = '#CC2222'; ctx.fillRect(0,0,16,16); ctx.fillStyle = '#555555'; ctx.fillRect(6,6,4,4); ctx.fillStyle = '#DDDDDD'; ctx.fillRect(7,7,2,2);
});
createTexture('dandelion', 16, ctx => {
    ctx.clearRect(0,0,16,16); ctx.fillStyle = '#228B22'; ctx.fillRect(7,8,2,8); ctx.fillRect(5,10,3,1); ctx.fillRect(8,12,3,1);
    ctx.fillStyle = '#FFFF00'; ctx.fillRect(6,4,4,4); ctx.fillRect(7,3,2,6); ctx.fillRect(5,5,6,2);
});
createTexture('poppy', 16, ctx => {
    ctx.clearRect(0,0,16,16); ctx.fillStyle = '#228B22'; ctx.fillRect(7,8,2,8); ctx.fillRect(5,11,3,1);
    ctx.fillStyle = '#FF0000'; ctx.fillRect(5,4,6,4); ctx.fillRect(6,3,4,6); ctx.fillRect(4,5,8,2); ctx.fillStyle = '#000000'; ctx.fillRect(7,5,2,2);
});
createTexture('pickaxe', 16, ctx => {
    ctx.clearRect(0,0,16,16); ctx.fillStyle = '#8B5A2B';
    for(let i=0; i<10; i++) ctx.fillRect(14-i, 14-i, 2, 2);
    ctx.fillStyle = '#DDDDDD'; ctx.fillRect(2,4,4,2); ctx.fillRect(4,2,2,4); ctx.fillRect(1,5,2,2); ctx.fillRect(5,1,2,2);
    ctx.fillStyle = '#888888'; ctx.fillRect(3,3,2,2);
});
createTexture('sword', 16, ctx => {
    ctx.clearRect(0,0,16,16); ctx.fillStyle = '#8B5A2B'; ctx.fillRect(12,12,2,2); ctx.fillRect(10,14,2,2);
    ctx.fillStyle = '#555555'; ctx.fillRect(10,10,2,2); ctx.fillRect(12,8,2,2); ctx.fillRect(8,12,2,2);
    ctx.fillStyle = '#DDDDDD'; for(let i=0; i<8; i++) ctx.fillRect(8-i, 8-i, 2, 2);
    ctx.fillStyle = '#FFFFFF'; for(let i=0; i<7; i++) ctx.fillRect(9-i, 7-i, 1, 1);
});

// Entity skins (Minecraft original)
const entitySkins = {
    pig: extTex('entity/pig/pig.png'),
    cow: extTex('entity/cow/cow.png'),
    villager: extTex('entity/villager/villager.png'),
    player: extTex('entity/steve.png')
};

const m = (t) => new THREE.MeshLambertMaterial({ map: texCache[t] });
const mT = (t) => new THREE.MeshLambertMaterial({ map: texCache[t], transparent: true, alphaTest: 0.5 });
const mD = (t) => new THREE.MeshLambertMaterial({ map: texCache[t], transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });

const materialsMap = {
    grass: [m('grass_side'), m('grass_side'), m('grass_top'), m('dirt'), m('grass_side'), m('grass_side')],
    dirt: m('dirt'), stone: m('stone'), cobblestone: m('cobblestone'),
    wood: [m('wood'), m('wood'), m('wood_top'), m('wood_top'), m('wood'), m('wood')],
    planks: m('planks'), leaves: mT('leaves'), sand: m('sand'),
    glass: new THREE.MeshLambertMaterial({ map: texCache['glass'], transparent: true, opacity: 0.6 }),
    brick: m('brick'), bookshelf: [m('bookshelf'), m('bookshelf'), m('planks'), m('planks'), m('bookshelf'), m('bookshelf')],
    obsidian: m('obsidian'), bedrock: m('bedrock'), 
    water: new THREE.MeshLambertMaterial({ map: texCache['water'], transparent: true, opacity: 0.7, color: 0x88CCFF }), 
    lava: new THREE.MeshBasicMaterial({ map: texCache['lava'] }),
    diamond_ore: m('diamond_ore'), gold_ore: m('gold_ore'), iron_ore: m('iron_ore'), coal_ore: m('coal_ore'),
    crafting_table: [m('craft_side'), m('craft_side'), m('craft_top'), m('planks'), m('craft_side'), m('craft_side')],
    furnace: [m('cobblestone'), m('cobblestone'), m('cobblestone'), m('cobblestone'), m('furnace_front'), m('cobblestone')],
    tnt: [m('tnt_side'), m('tnt_side'), m('tnt_top'), m('tnt_top'), m('tnt_side'), m('tnt_side')],
    dandelion: mD('dandelion'), poppy: mD('poppy'),
    pickaxe: m('pickaxe'), sword: m('sword')
};

// High Quality Sounds (Minecraft style online assets)
const sounds = {
    break: new Audio(ASSET_URL + 'sounds/dig/stone1.ogg'),
    place: new Audio(ASSET_URL + 'sounds/dig/grass1.ogg'),
    step: new Audio(ASSET_URL + 'sounds/step/grass1.ogg'),
    rain: new Audio(ASSET_URL + 'sounds/ambient/weather/rain1.ogg'),
    thunder: new Audio(ASSET_URL + 'sounds/ambient/weather/thunder1.ogg')
};
Object.values(sounds).forEach(s => { s.crossOrigin = 'anonymous'; s.volume = 0.2; });
sounds.rain.loop = true; sounds.rain.volume = 0.4;
const playSound = (n) => { if(sounds[n]) { sounds[n].currentTime = 0; sounds[n].play().catch(()=>{}); } };

// --- 4. SCENE SETUP (Environment) ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); scene.add(ambientLight);

// Sun & Moon
const sunGroup = new THREE.Group(); scene.add(sunGroup);
const sunMesh = new THREE.Mesh(new THREE.BoxGeometry(8,8,0.1), new THREE.MeshBasicMaterial({color:0xFFFFaa}));
sunMesh.position.set(0, 150, 0); sunGroup.add(sunMesh);
const moonMesh = new THREE.Mesh(new THREE.BoxGeometry(6,6,0.1), new THREE.MeshBasicMaterial({color:0xDDDDDD}));
moonMesh.position.set(0, -150, 0); sunGroup.add(moonMesh);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(0, 150, 0); dirLight.castShadow = true;
dirLight.shadow.camera.left = -60; dirLight.shadow.camera.right = 60;
dirLight.shadow.camera.top = 60; dirLight.shadow.camera.bottom = -60;
dirLight.shadow.mapSize.set(1024, 1024);
sunGroup.add(dirLight);

// Clouds
const clouds = new THREE.Group(); scene.add(clouds);
const cloudMat = new THREE.MeshLambertMaterial({color:0xFFFFFF, transparent:true, opacity:0.8});
for(let i=0; i<20; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(4+Math.random()*6, 2, 4+Math.random()*6), cloudMat);
    c.position.set((Math.random()-0.5)*200, 60 + Math.random()*20, (Math.random()-0.5)*200);
    clouds.add(c);
}

// Rain System
const rainGeo = new THREE.BufferGeometry();
const rainCount = 1500;
const rainPos = new Float32Array(rainCount * 3);
for(let i=0;i<rainCount*3;i++) {
    rainPos[i] = (Math.random() - 0.5) * 100;
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainMat = new THREE.PointsMaterial({
    color: 0xaaaaFF,
    size: 0.2,
    transparent: true,
    opacity: 0.6
});
const rainSys = new THREE.Points(rainGeo, rainMat);
scene.add(rainSys);
rainSys.visible = false;

function setWeather(w) {
    state.weather = w;
    if(w === 'rain' || w === 'thunder') {
        rainSys.visible = true;
        scene.fog.color.set(0x555555);
        if(sounds.rain.paused) sounds.rain.play().catch(()=>{});
        if(w === 'thunder') playSound('thunder');
    } else {
        rainSys.visible = false;
        sounds.rain.pause();
    }
}

// --- 5. WORLD ENGINE ---
const blockGeo = new THREE.BoxGeometry(1, 1, 1);
const plantGeo = new THREE.PlaneGeometry(0.8, 0.8); plantGeo.translate(0, 0.4, 0);

const world = new Map();
const blockMeshes = {};
const allTypes = Array.from(new Set([...inventoryItems, 'bedrock']));
const solidTypes = allTypes.filter(t => t !== 'dandelion' && t !== 'poppy' && t !== 'water' && t !== 'pickaxe' && t !== 'sword');

function setupInstancedMeshes() {
    allTypes.forEach(t => {
        if (blockMeshes[t]) scene.remove(blockMeshes[t]);
        const mat = materialsMap[t] || materialsMap.stone;
        if(t === 'pickaxe' || t === 'sword') return; 
        const isPlant = t === 'dandelion' || t === 'poppy';
        const geo = isPlant ? plantGeo : blockGeo;
        blockMeshes[t] = new THREE.InstancedMesh(geo, mat, CONFIG.maxInstances);
        blockMeshes[t].castShadow = !isPlant && t !== 'water' && t !== 'glass'; 
        blockMeshes[t].receiveShadow = true;
        scene.add(blockMeshes[t]);
    });
}
setupInstancedMeshes();

const getBlockKey = (x, y, z) => `${Math.floor(x + 0.5)},${Math.floor(y + 0.5)},${Math.floor(z + 0.5)}`;

function noise2D(x, z) {
    const s = 0.05; return Math.sin(x * s) * Math.cos(z * s) * 4 + Math.sin(x * s * 0.5) * 6;
}

// 3D Noise function for realistic winding caves
function noise3D(x, y, z) {
    let nx = x * 0.07; let ny = y * 0.07; let nz = z * 0.07;
    let val1 = Math.sin(nx) * Math.cos(ny) * Math.sin(nz);
    let val2 = Math.cos(nx * 1.5 + 2) * Math.sin(ny * 1.5) * Math.cos(nz * 1.5 + 2);
    let val3 = Math.sin(nx * 2.5) * Math.cos(ny * 2.5) * Math.sin(nz * 2.5);
    return val1 + val2 * 0.5 + val3 * 0.25;
}

function isCave(x, y, z) {
    // We create worm-like tunnels by carving out areas where the 3D noise is close to zero (a ridged noise technique)
    let n = noise3D(x, y, z);
    // Cave logic: only hollow out if the noise is tightly around 0 (creates winding tunnels)
    // and make caves rarer the higher up they are
    let threshold = 0.15 + (y * 0.005); // Tunnels get thinner/stop near surface
    return Math.abs(n) < threshold;
}

function buildTree(wx, wy, wz) {
    for(let th=1; th<=5; th++) world.set(getBlockKey(wx, wy+th, wz), { type: 'wood' });
    for(let lx=-2; lx<=2; lx++) for(let lz=-2; lz<=2; lz++) for(let ly=wy+4; ly<=wy+7; ly++) {
        if (Math.abs(lx)+Math.abs(lz)+Math.abs(ly-(wy+5)) < 4) {
            const k = getBlockKey(wx+lx, ly, wz+lz);
            if (!world.has(k)) world.set(k, { type: 'leaves' });
        }
    }
}

function buildHouse(wx, wy, wz) {
    for(let hx = -2; hx <= 2; hx++) {
        for(let hz = -2; hz <= 2; hz++) {
            world.set(getBlockKey(wx + hx, wy, wz + hz), { type: 'cobblestone' });
            for (let hy = 1; hy <= 3; hy++) {
                if (Math.abs(hx) === 2 || Math.abs(hz) === 2) {
                    if (!(hx === 0 && hz === 2 && hy <= 2)) world.set(getBlockKey(wx + hx, wy + hy, wz + hz), { type: 'planks' });
                }
            }
            world.set(getBlockKey(wx + hx, wy + 4, wz + hz), { type: 'wood' });
        }
    }
    world.set(getBlockKey(wx - 1, wy + 1, wz - 1), { type: 'crafting_table' });
    world.set(getBlockKey(wx + 1, wy + 1, wz - 1), { type: 'furnace' });
    world.set(getBlockKey(wx - 1, wy + 1, wz + 1), { type: 'bookshelf' });
}

function buildWell(wx, wy, wz) {
    for(let x=-1; x<=1; x++) {
        for(let z=-1; z<=1; z++) {
            world.set(getBlockKey(wx+x, wy, wz+z), { type: 'cobblestone' });
            if(Math.abs(x)===1 || Math.abs(z)===1) {
                world.set(getBlockKey(wx+x, wy+1, wz+z), { type: 'cobblestone' });
                world.set(getBlockKey(wx+x, wy+3, wz+z), { type: 'wood' });
            } else {
                world.set(getBlockKey(wx+x, wy, wz+z), { type: 'water' });
            }
        }
    }
    world.set(getBlockKey(wx-1, wy+2, wz-1), { type: 'planks' });
    world.set(getBlockKey(wx+1, wy+2, wz-1), { type: 'planks' });
    world.set(getBlockKey(wx-1, wy+2, wz+1), { type: 'planks' });
    world.set(getBlockKey(wx+1, wy+2, wz+1), { type: 'planks' });
}

function generateWorld() {
    world.clear();
    const villageCenters = [];
    if(Math.random() > 0.05) villageCenters.push({x: 10, z: 10});
    if(Math.random() > 0.4) villageCenters.push({x: -30, z: 20});
    
    for (let cx = -CONFIG.worldSize; cx < CONFIG.worldSize; cx++) {
        for (let cz = -CONFIG.worldSize; cz < CONFIG.worldSize; cz++) {
            for (let x = 0; x < CONFIG.chunkSize; x++) {
                for (let z = 0; z < CONFIG.chunkSize; z++) {
                    const wx = cx * CONFIG.chunkSize + x; const wz = cz * CONFIG.chunkSize + z;
                    
                    let vDist = 999;
                    villageCenters.forEach(v => { const d = Math.sqrt((wx-v.x)**2 + (wz-v.z)**2); if(d < vDist) vDist = d; });
                    
                    let rawH = noise2D(wx, wz);
                    if (vDist < 20) rawH = rawH * (vDist/20); 
                    const h = Math.floor(rawH) + 10;
                    
                    for (let y = h; y >= CONFIG.bedrockDepth; y--) {
                        if (y === CONFIG.bedrockDepth) { world.set(getBlockKey(wx, y, wz), { type: 'bedrock' }); continue; }
                        
                        if (y > h && y <= 8) { world.set(getBlockKey(wx, y, wz), { type: 'water' }); continue; }
                        if (y > h) continue;

                        if (y < h - 3 && isCave(wx, y, wz)) {
                            if (y < CONFIG.bedrockDepth + 4) world.set(getBlockKey(wx, y, wz), { type: 'lava' });
                            continue;
                        }

                        let type = 'stone';
                        if (y === h) {
                            if (y <= 9) type = 'sand';
                            else type = (vDist < 20 && Math.random()<0.3) ? 'dirt' : 'grass';
                        }
                        else if (y > h - 4) type = 'dirt';
                        else {
                            if (Math.random() < 0.005) type = 'diamond_ore';
                            else if (Math.random() < 0.01) type = 'gold_ore';
                            else if (Math.random() < 0.03) type = 'iron_ore';
                            else if (Math.random() < 0.04) type = 'coal_ore';
                        }
                        world.set(getBlockKey(wx, y, wz), { type });
                    }
                    
                    if (h > 8 && vDist >= 20 && Math.random() < 0.015) buildTree(wx, h, wz);
                    else if (h > 8 && vDist >= 20 && Math.random() < 0.05) world.set(getBlockKey(wx, h+1, wz), { type: Math.random() > 0.5 ? 'dandelion' : 'poppy' });
                }
            }
        }
    }
    
    villageCenters.forEach(v => {
        const vh = Math.floor(noise2D(v.x, v.z))+10;
        if(vh > 8) {
            buildHouse(v.x, vh, v.z);
            buildHouse(v.x + 10, vh, v.z);
            buildHouse(v.x, vh, v.z + 10);
            buildHouse(v.x + 10, vh, v.z + 10);
            buildWell(v.x + 5, vh, v.z + 5);
            
            for(let p=-2; p<=12; p++) {
                world.set(getBlockKey(v.x + p, vh, v.z + 5), {type: 'sand'});
                world.set(getBlockKey(v.x + 5, vh, v.z + p), {type: 'sand'});
            }
            
            spawnVillager(v.x + 5, vh+1, v.z + 2);
            spawnVillager(v.x + 2, vh+1, v.z + 5);
            spawnVillager(v.x + 8, vh+1, v.z + 5);
        }
    });
    updateInstances();
}

const dummy = new THREE.Object3D();
const dummyPlant1 = new THREE.Object3D(); const dummyPlant2 = new THREE.Object3D();

function updateInstances() {
    const counts = {}; allTypes.forEach(t => counts[t] = 0);
    for (const [key, data] of world.entries()) {
        if(data.type === 'pickaxe' || data.type === 'sword') continue;
        const [x, y, z] = key.split(',').map(Number);
        if (data.type === 'dandelion' || data.type === 'poppy') {
            dummyPlant1.position.set(x, y - 0.5, z); dummyPlant1.rotation.y = Math.PI / 4; dummyPlant1.updateMatrix();
            if (counts[data.type] < CONFIG.maxInstances) blockMeshes[data.type].setMatrixAt(counts[data.type]++, dummyPlant1.matrix);
            dummyPlant2.position.set(x, y - 0.5, z); dummyPlant2.rotation.y = -Math.PI / 4; dummyPlant2.updateMatrix();
            if (counts[data.type] < CONFIG.maxInstances) blockMeshes[data.type].setMatrixAt(counts[data.type]++, dummyPlant2.matrix);
        } else {
            dummy.position.set(x, y, z); dummy.updateMatrix();
            if (blockMeshes[data.type] && counts[data.type] < CONFIG.maxInstances) blockMeshes[data.type].setMatrixAt(counts[data.type]++, dummy.matrix);
        }
    }
    allTypes.forEach(t => { if(blockMeshes[t]){ blockMeshes[t].count = counts[t]; blockMeshes[t].instanceMatrix.needsUpdate = true; } });
}

// --- 6. ENTITIES & MULTIPLAYER PLAYERS ---
const entities = [];
const remotePlayers = {}; 

function getSkinMat(tex, u, v, w, h, tW=64, tH=64) {
    const t = tex.clone();
    t.needsUpdate = true;
    t.repeat.set(w/tW, h/tH);
    t.offset.set(u/tW, 1 - (v+h)/tH);
    return new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.5 });
}

function createMobModel(type) {
    const g = new THREE.Group();
    const isQuad = (type === 'pig' || type === 'cow');
    const tex = entitySkins[type];
    
    let mBody, mHead, mLeg, mArm;
    if (type === 'player') {
        mHead = getSkinMat(tex, 8, 8, 8, 8);
        mBody = getSkinMat(tex, 20, 20, 8, 12);
        mArm = getSkinMat(tex, 44, 20, 4, 12);
        mLeg = getSkinMat(tex, 4, 20, 4, 12);
    } else if (type === 'pig') {
        mHead = getSkinMat(tex, 8, 8, 8, 8, 64, 32);
        mBody = getSkinMat(tex, 28, 16, 16, 8, 64, 32);
        mLeg = getSkinMat(tex, 0, 16, 4, 4, 64, 32);
    } else if (type === 'cow') {
        mHead = getSkinMat(tex, 0, 0, 8, 8, 64, 32);
        mBody = getSkinMat(tex, 18, 14, 18, 10, 64, 32);
        mLeg = getSkinMat(tex, 0, 16, 4, 4, 64, 32);
    } else if (type === 'villager') {
        mHead = getSkinMat(tex, 0, 0, 8, 10);
        mBody = getSkinMat(tex, 18, 20, 12, 18);
        mLeg = getSkinMat(tex, 0, 22, 4, 12);
    }

    if (isQuad) {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.2), mBody); body.position.y = 0.6; g.add(body);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mHead); head.position.set(0, 0.9, 0.7); g.add(head);
        const legs = [];
        [[0.25,0.4], [-0.25,0.4], [0.25,-0.4], [-0.25,-0.4]].forEach(p => {
            const lp = new THREE.Group(); lp.position.set(p[0], 0.4, p[1]);
            const l = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.25), mLeg); l.position.y = -0.2; lp.add(l); g.add(lp); legs.push(lp);
        });
        return { g, legs, head, isQuad };
    } else {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.3), mBody); body.position.y = 0.8; g.add(body);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mHead); head.position.set(0, 1.4, 0); g.add(head);
        const legs = [];
        [[0.15,0], [-0.15,0]].forEach(p => {
            const lp = new THREE.Group(); lp.position.set(p[0], 0.4, p[1]);
            const l = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.25), mLeg); l.position.y = -0.2; lp.add(l); g.add(lp); legs.push(lp);
        });
        const arms = [];
        [[0.35, 0.8], [-0.35, 0.8]].forEach(p => {
            const ap = new THREE.Group(); ap.position.set(p[0], 1.2, 0);
            const a = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), mArm || mLeg); a.position.y = -0.4; ap.add(a); g.add(ap); arms.push(ap);
        });
        return { g, legs, arms, head, isQuad };
    }
}

function spawnMob(type, x, y, z) {
    const model = createMobModel(type); model.g.position.set(x, y, z); scene.add(model.g);
    entities.push({ ...model, type, dir: new THREE.Vector3(Math.random()-0.5, 0, Math.random()-0.5).normalize(), speed: 1 + Math.random(), timer: Math.random()*5 });
}
function spawnVillager(x, y, z) { spawnMob('villager', x, y, z); }

for(let i=0; i<12; i++) spawnMob(Math.random()>0.5 ? 'pig' : 'cow', (Math.random()-0.5)*40, 20, (Math.random()-0.5)*40);

function updateRemotePlayer(id, pos, yaw, pitch, isMoving) {
    if(!remotePlayers[id]) {
        const p = createMobModel('player');
        scene.add(p.g);
        remotePlayers[id] = p;
    }
    const p = remotePlayers[id];
    p.g.position.copy(pos);
    p.g.rotation.y = yaw;
    p.head.rotation.x = pitch;
    
    if (isMoving) {
        const sCycle = Math.sin(performance.now() * 0.015) * 0.8;
        p.legs[0].rotation.x = sCycle; p.legs[1].rotation.x = -sCycle;
        if(p.arms) { p.arms[0].rotation.x = -sCycle; p.arms[1].rotation.x = sCycle; }
    } else {
        p.legs.forEach(l => l.rotation.x = 0);
        if(p.arms) p.arms.forEach(a => a.rotation.x = 0);
    }
}
function removeRemotePlayer(id) {
    if(remotePlayers[id]) { scene.remove(remotePlayers[id].g); delete remotePlayers[id]; }
}

const player = new THREE.Group(); player.position.set(0, 30, 0); scene.add(player);
const pitchPivot = new THREE.Group(); player.add(pitchPivot); pitchPivot.add(camera);
const pModel = createMobModel('player'); pModel.g.position.y = -1.5; pModel.g.rotation.y = Math.PI; player.add(pModel.g);

const fpItem = new THREE.Group(); fpItem.position.set(0.4, -0.3, -0.5); camera.add(fpItem);

function createTool(type) {
    const g = new THREE.Group();
    if(type === 'pickaxe' || type === 'sword') {
        const mat = new THREE.MeshLambertMaterial({map: texCache[type], transparent: true, alphaTest: 0.5});
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), mat);
        mesh.rotation.y = -Math.PI/4; mesh.castShadow = true; g.add(mesh);
    } else if (materialsMap[type]) {
        const m = Array.isArray(materialsMap[type]) ? materialsMap[type] : materialsMap[type];
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), m);
        mesh.castShadow = true; g.add(mesh);
    } else {
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), new THREE.MeshLambertMaterial({color:0x5c4033}));
        c.castShadow = true; g.add(c);
    }
    return g;
}

// --- 7. UI LOGIC ---
const hotbarEl = document.getElementById('hotbar-container');
const invGrid = document.getElementById('inventory-grid');
const invMenu = document.getElementById('inventory-menu');

function getIconUrl(t) {
    if(t === 'wood') return dataUrls['wood_top'];
    if(t === 'grass') return dataUrls['grass_side'];
    if(t === 'crafting_table') return dataUrls['craft_top'];
    if(t === 'furnace') return dataUrls['furnace_front'];
    if(t === 'tnt') return dataUrls['tnt_side'];
    return dataUrls[t];
}

function renderUI() {
    if (hotbarEl) {
        hotbarEl.innerHTML = '';
        hotbarSlots.forEach((t, i) => {
            const s = document.createElement('div'); s.className = 'slot' + (i === state.activeSlot ? ' active' : '');
            if(t) s.style.backgroundImage = `url(${getIconUrl(t)})`;
            s.innerText = i+1;
            s.onclick = () => { state.activeSlot = i; state.selectedItem = t; renderUI(); };
            hotbarEl.appendChild(s);
        });
    }
    while(fpItem.children.length > 0) fpItem.remove(fpItem.children[0]);
    fpItem.add(createTool(state.selectedItem));
}

if (invGrid) {
    inventoryItems.forEach(t => {
        const s = document.createElement('div'); s.className = 'inv-slot'; s.setAttribute('data-item', t);
        s.style.backgroundImage = `url(${getIconUrl(t)})`;
        s.onclick = () => { hotbarSlots[state.activeSlot] = t; state.selectedItem = t; renderUI(); };
        invGrid.appendChild(s);
    });
}

function toggleInventory() {
    state.inventoryOpen = !state.inventoryOpen;
    if (invMenu) invMenu.style.display = state.inventoryOpen ? 'flex' : 'none';
    if (!isMobile) {
        if (state.inventoryOpen) document.exitPointerLock(); 
        else if (state.gameStarted) document.body.requestPointerLock();
    }
}
document.getElementById('close-inv-btn').onclick = toggleInventory;

const startSetup = () => {
    state.gameStarted = true; 
    document.getElementById('instructions').style.display = 'none'; 
    if(!isMobile) document.body.requestPointerLock();
    if(isMobile) document.getElementById('mobile-controls').style.display = 'block';
};
document.getElementById('start-btn').onclick = startSetup;
document.getElementById('resume-btn').onclick = () => { 
    document.getElementById('pause-menu').style.display = 'none'; 
    if(!isMobile) document.body.requestPointerLock();
    if(isMobile) document.getElementById('mobile-controls').style.display = 'block';
};
document.getElementById('regen-btn').onclick = () => { 
    setupInstancedMeshes(); generateWorld(); 
    document.getElementById('pause-menu').style.display = 'none'; 
    if(!isMobile) document.body.requestPointerLock();
    if(isMobile) document.getElementById('mobile-controls').style.display = 'block';
};

// Pause Menu Buttons
const copyIdBtn = document.getElementById('copy-id-btn');
if(copyIdBtn) copyIdBtn.onclick = () => { navigator.clipboard.writeText(myId||''); alert('ID Copied!'); }

document.getElementById('time-day-btn').onclick = () => { state.worldTime = Math.PI/4; broadcast({type:'set_time', time: state.worldTime}); }
document.getElementById('time-night-btn').onclick = () => { state.worldTime = Math.PI + Math.PI/4; broadcast({type:'set_time', time: state.worldTime}); }
document.getElementById('weather-clear-btn').onclick = () => { setWeather('clear'); broadcast({type:'set_weather', weather: 'clear'}); }
document.getElementById('weather-rain-btn').onclick = () => { setWeather('rain'); broadcast({type:'set_weather', weather: 'rain'}); }
document.getElementById('weather-thunder-btn').onclick = () => { setWeather('thunder'); broadcast({type:'set_weather', weather: 'thunder'}); }

function toggleCamera() {
    state.firstPerson = !state.firstPerson;
    document.getElementById('crosshair').style.display = state.firstPerson ? 'flex' : 'none';
    camera.position.set(0, 0, state.firstPerson ? 0 : 5);
    pModel.g.visible = !state.firstPerson;
    fpItem.visible = state.firstPerson;
}

document.addEventListener('pointerlockchange', () => {
    if (!isMobile && document.pointerLockElement !== document.body && state.gameStarted && !state.inventoryOpen) {
        handlePause();
    }
});

function handlePause() {
    if(state.gameStarted && !state.inventoryOpen) {
        document.getElementById('pause-menu').style.display = 'flex';
        document.getElementById('pause-world-id').innerText = myId || 'Not Hosting';
        document.getElementById('pause-block-count').innerText = world.size.toLocaleString();
        
        if(isMobile) document.getElementById('mobile-controls').style.display = 'none';
        if(!isMobile) document.exitPointerLock();
    }
}

// --- 8. INTERACTION & CONTROLS ---
function getTarget() {
    const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
    const start = new THREE.Vector3(); camera.getWorldPosition(start);
    for (let d=0; d<8; d+=0.05) {
        const p = start.clone().addScaledVector(dir, d);
        const k = getBlockKey(p.x, p.y, p.z);
        if (world.has(k) && world.get(k).type !== 'water') {
            const bPos = new THREE.Vector3(Math.round(p.x), Math.round(p.y), Math.round(p.z));
            const diff = p.clone().sub(bPos);
            let normal = new THREE.Vector3();
            if (Math.abs(diff.x) > Math.abs(diff.y) && Math.abs(diff.x) > Math.abs(diff.z)) normal.x = Math.sign(diff.x);
            else if (Math.abs(diff.y) > Math.abs(diff.z)) normal.y = Math.sign(diff.y);
            else normal.z = Math.sign(diff.z);
            return { k, pos: bPos, normal };
        }
    }
    return null;
}

function handleBlockAction(type) {
    state.actionTime = performance.now();
    const t = getTarget();
    if (type === 'break') {
        if (t && world.get(t.k).type !== 'bedrock') { 
            world.delete(t.k); updateInstances(); playSound('break'); 
            broadcast({ type: 'break', k: t.k });
        }
    } else if (type === 'place') {
        if (t && state.selectedItem !== 'pickaxe' && state.selectedItem !== 'sword') {
            const pk = getBlockKey(t.pos.x + t.normal.x, t.pos.y + t.normal.y, t.pos.z + t.normal.z);
            if (!world.has(pk) || world.get(pk).type === 'water') {
                const checkInside = (ox, oz) => {
                    const k = getBlockKey(player.position.x + ox, player.position.y - 1.8, player.position.z + oz);
                    const k2 = getBlockKey(player.position.x + ox, player.position.y - 0.8, player.position.z + oz);
                    return pk === k || pk === k2;
                };
                if (!checkInside(CONFIG.playerRadius, CONFIG.playerRadius) && !checkInside(-CONFIG.playerRadius, CONFIG.playerRadius) && !checkInside(CONFIG.playerRadius, -CONFIG.playerRadius) && !checkInside(-CONFIG.playerRadius, -CONFIG.playerRadius)) {
                    world.set(pk, { type: state.selectedItem }); updateInstances(); playSound('place');
                    broadcast({ type: 'place', k: pk, blockType: state.selectedItem });
                }
            }
        }
    }
}

// Desktop Mouse
document.addEventListener('mousedown', (e) => {
    if (isMobile || document.pointerLockElement !== document.body) return;
    if (e.button === 0) handleBlockAction('break');
    else if (e.button === 2) handleBlockAction('place');
});
document.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('mousemove', (e) => {
    if (isMobile || document.pointerLockElement !== document.body) return;
    state.yaw -= e.movementX * CONFIG.mouseSensitivity; state.pitch -= e.movementY * CONFIG.mouseSensitivity;
    state.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, state.pitch));
    player.rotation.y = state.yaw; pitchPivot.rotation.x = state.pitch;
});

// Desktop Keyboard
document.addEventListener('keydown', (e) => {
    if(e.code === 'Escape') { handlePause(); return; }
    if (e.code === 'KeyE') { toggleInventory(); return; }
    if (state.inventoryOpen) return;
    const now = performance.now();
    if (state.lastTaps[e.code] && now - state.lastTaps[e.code] < 300 && e.code === 'Space') { state.isFlying = !state.isFlying; state.velocity.y = 0; }
    state.lastTaps[e.code] = now;
    if (e.code === 'KeyW') state.move.f = 1; if (e.code === 'KeyS') state.move.b = 1;
    if (e.code === 'KeyA') state.move.l = 1; if (e.code === 'KeyD') state.move.r = 1;
    if (e.code === 'Space') { if (state.isFlying) state.move.u = 1; else if (state.velocity.y === 0) state.velocity.y = CONFIG.jumpForce; }
    if (e.code === 'ShiftLeft') if (state.isFlying) state.move.d = 1;
    if (e.code === 'KeyV') toggleCamera();
    if (e.code.startsWith('Digit')) { const d = parseInt(e.code.slice(5)) - 1; if (d >= 0 && d < 9) { state.activeSlot = d; state.selectedItem = hotbarSlots[d]; renderUI(); } }
});
document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW') state.move.f = 0; if (e.code === 'KeyS') state.move.b = 0;
    if (e.code === 'KeyA') state.move.l = 0; if (e.code === 'KeyD') state.move.r = 0;
    if (e.code === 'Space') state.move.u = 0; if (e.code === 'ShiftLeft') state.move.d = 0;
});

// Mobile Controls
let touchStartX = 0, touchStartY = 0;
document.addEventListener('touchstart', (e) => {
    if (!isMobile || !state.gameStarted || state.inventoryOpen) return;
    if(e.target.closest('#mobile-controls') || e.target.closest('#hotbar-container')) return;
    touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
}, {passive: false});

document.addEventListener('touchmove', (e) => {
    if (!isMobile || !state.gameStarted || state.inventoryOpen) return;
    if(e.target.closest('#mobile-controls') || e.target.closest('#hotbar-container')) return;
    e.preventDefault(); 
    const moveX = e.touches[0].clientX - touchStartX;
    const moveY = e.touches[0].clientY - touchStartY;
    touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
    state.yaw -= moveX * CONFIG.mouseSensitivity; 
    state.pitch -= moveY * CONFIG.mouseSensitivity;
    state.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, state.pitch));
    player.rotation.y = state.yaw; pitchPivot.rotation.x = state.pitch;
}, {passive: false});

const bindTouch = (id, key, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', (e) => { e.preventDefault(); state.move[key] = val; });
    el.addEventListener('touchend', (e) => { e.preventDefault(); state.move[key] = 0; });
    el.addEventListener('touchcancel', (e) => { e.preventDefault(); state.move[key] = 0; });
};
bindTouch('btn-up', 'f', 1); bindTouch('btn-down', 'b', 1);
bindTouch('btn-left', 'l', 1); bindTouch('btn-right', 'r', 1);

const btnJump = document.getElementById('btn-jump');
if(btnJump) {
    btnJump.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        const now = performance.now();
        if (state.lastTaps['btnJump'] && now - state.lastTaps['btnJump'] < 300) { state.isFlying = !state.isFlying; state.velocity.y = 0; }
        state.lastTaps['btnJump'] = now;
        if (state.isFlying) state.move.u = 1; else if (state.velocity.y === 0) state.velocity.y = CONFIG.jumpForce; 
    });
    btnJump.addEventListener('touchend', (e) => { e.preventDefault(); state.move.u = 0; });
    btnJump.addEventListener('touchcancel', (e) => { e.preventDefault(); state.move.u = 0; });
}

document.getElementById('btn-break').addEventListener('touchstart', (e) => { e.preventDefault(); handleBlockAction('break'); });
document.getElementById('btn-place').addEventListener('touchstart', (e) => { e.preventDefault(); handleBlockAction('place'); });
document.getElementById('btn-inv').addEventListener('touchstart', (e) => { e.preventDefault(); toggleInventory(); });
document.getElementById('btn-cam').addEventListener('touchstart', (e) => { e.preventDefault(); toggleCamera(); });
document.getElementById('btn-pause').addEventListener('touchstart', (e) => { e.preventDefault(); handlePause(); });

// --- 9. ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    const time = performance.now(); const delta = Math.min((time - state.prevTime)/1000, 0.1); state.prevTime = time;

    // Environment Animation
    state.worldTime += delta * 0.05;
    sunGroup.rotation.z = state.worldTime;
    const isNight = Math.sin(state.worldTime) < 0;
    
    if (state.weather === 'clear') {
        scene.background.set(isNight ? 0x0A0A2A : 0x87CEEB);
        scene.fog.color.set(isNight ? 0x0A0A2A : 0x87CEEB);
    } else {
        scene.background.set(0x555555);
        scene.fog.color.set(0x555555);
    }
    
    ambientLight.intensity = isNight ? 0.2 : (state.weather==='clear'?0.6:0.4);
    dirLight.intensity = isNight ? 0.1 : (state.weather==='clear'?1.0:0.5);

    if(state.weather === 'thunder' && Math.random() < 0.01) {
        scene.background.set(0xFFFFFF); // Lightning flash
    }
    
    if(state.weather !== 'clear') {
        const pArray = rainGeo.attributes.position.array;
        for(let i=1; i<rainCount*3; i+=3) {
            pArray[i] -= delta * 30;
            if(pArray[i] < -20) pArray[i] = 40 + Math.random()*20;
        }
        rainGeo.attributes.position.needsUpdate = true;
        rainSys.position.copy(player.position);
    }

    clouds.children.forEach(c => {
        c.position.x += delta * 2;
        if(c.position.x > 100) c.position.x = -100;
    });

    if (state.gameStarted) {
        if (state.isFlying) { state.velocity.y = (state.move.u - state.move.d) * CONFIG.flySpeed; } else { state.velocity.y -= CONFIG.gravity * delta; }
        const localMove = new THREE.Vector3((state.move.r - state.move.l)*CONFIG.playerSpeed*delta, 0, (state.move.b - state.move.f)*CONFIG.playerSpeed*delta);
        localMove.applyAxisAngle(new THREE.Vector3(0,1,0), player.rotation.y);
        
        const canMoveTo = (nx, nz) => {
            const r = CONFIG.playerRadius; const points = [[r,r],[-r,r],[r,-r],[-r,-r]];
            for(let p of points) {
                const k1 = getBlockKey(nx + p[0], player.position.y - 0.8, nz + p[1]);
                const k2 = getBlockKey(nx + p[0], player.position.y - 1.8, nz + p[1]);
                if (world.has(k1) && solidTypes.includes(world.get(k1).type)) return false;
                if (world.has(k2) && solidTypes.includes(world.get(k2).type)) return false;
            }
            return true;
        };

        if (canMoveTo(player.position.x + localMove.x, player.position.z)) player.position.x += localMove.x;
        if (canMoveTo(player.position.x, player.position.z + localMove.z)) player.position.z += localMove.z;
        player.position.y += state.velocity.y * delta;

        const ck = getBlockKey(player.position.x, player.position.y - 1.8, player.position.z);
        if (world.has(ck) && solidTypes.includes(world.get(ck).type) && !state.isFlying && state.velocity.y <= 0) {
            state.velocity.y = 0; player.position.y = Math.floor(player.position.y - 1.8 + 0.5) + 0.5 + 1.8;
        }

        // Multiplayer Broadcast
        const isMoving = state.move.f || state.move.b || state.move.l || state.move.r;
        if (Object.keys(connections).length > 0) {
            broadcast({ type: 'player_move', pos: player.position, yaw: player.rotation.y, pitch: pitchPivot.rotation.x, isMoving });
        }

        const actionElapsed = time - state.actionTime;
        if (actionElapsed < CONFIG.actionDuration) {
            const pVal = actionElapsed / CONFIG.actionDuration; const sVal = Math.sin(pVal * Math.PI);
            fpItem.position.set(0.4, -0.3 - sVal * 0.2, -0.5 - sVal * 0.3); fpItem.rotation.set(-sVal * 1.2, -Math.PI / 4, 0);
            if(pModel.arms) pModel.arms[1].rotation.x = -sVal * 2;
        } else {
            fpItem.position.set(0.4, -0.3, -0.5); fpItem.rotation.set(0, -Math.PI / 4, 0);
        }

        if (isMoving && !state.isFlying && state.velocity.y === 0) {
            const sCycle = Math.sin(time * 0.015) * 0.8;
            pModel.legs[0].rotation.x = sCycle; pModel.legs[1].rotation.x = -sCycle;
            if(pModel.arms && actionElapsed >= CONFIG.actionDuration) { pModel.arms[0].rotation.x = -sCycle; pModel.arms[1].rotation.x = sCycle; }
            if (Math.sin(time * 0.015) > 0.9 && !state.stepLatch) { playSound('step'); state.stepLatch = true; } else if (Math.sin(time * 0.015) < 0) { state.stepLatch = false; }
        } else { 
            pModel.legs.forEach(l => l.rotation.x = 0);
            if(pModel.arms && actionElapsed >= CONFIG.actionDuration) pModel.arms.forEach(a => a.rotation.x = 0); 
        }

        entities.forEach(e => {
            if(e.velocity_y === undefined) e.velocity_y = 0;
            e.timer -= delta; if (e.timer <= 0) { e.dir.set(Math.random()-0.5, 0, Math.random()-0.5).normalize(); e.timer = 2 + Math.random()*3; if(Math.random()<0.4) e.dir.set(0,0,0); }
            
            // Gravity
            e.velocity_y -= CONFIG.gravity * delta;
            
            const ar = e.isQuad ? 0.4 : 0.2;
            const canEntMove = (anx, anz, ay) => {
                const pts = [[ar,ar],[-ar,ar],[ar,-ar],[-ar,-ar]];
                for(let p of pts) {
                    const k1 = getBlockKey(anx + p[0], ay + 0.1, anz + p[1]);
                    const k2 = getBlockKey(anx + p[0], ay + 1.1, anz + p[1]);
                    if (world.has(k1) && solidTypes.includes(world.get(k1).type)) return false;
                    if (world.has(k2) && solidTypes.includes(world.get(k2).type)) return false;
                }
                return true;
            };

            let onGround = false;
            const floorK = getBlockKey(e.g.position.x, e.g.position.y - 0.1, e.g.position.z);
            if (world.has(floorK) && solidTypes.includes(world.get(floorK).type) && e.velocity_y <= 0) {
                e.velocity_y = 0; 
                e.g.position.y = Math.floor(e.g.position.y - 0.1 + 0.5) + (e.isQuad?0.5:0.8);
                onGround = true;
            } else {
                e.g.position.y += e.velocity_y * delta;
            }
            if (e.g.position.y < -20) { e.g.position.y = 20; e.g.position.x = player.position.x; e.g.position.z = player.position.z; }

            if (e.dir.lengthSq() > 0.1) {
                const nX = e.g.position.x + e.dir.x * delta * e.speed; const nZ = e.g.position.z + e.dir.z * delta * e.speed;
                if (canEntMove(nX, nZ, e.g.position.y)) { 
                    e.g.position.x = nX; e.g.position.z = nZ; 
                } else {
                    // Try jumping if blocked and on ground
                    if(onGround) e.velocity_y = CONFIG.jumpForce * 0.8;
                    else e.dir.set(0,0,0); 
                }
                e.g.lookAt(e.g.position.x + e.dir.x, e.g.position.y, e.g.position.z + e.dir.z);
                const sLeg = Math.sin(time * 0.01 * e.speed) * 0.5;
                if(e.isQuad) { e.legs[0].rotation.x=sLeg; e.legs[1].rotation.x=-sLeg; e.legs[2].rotation.x=-sLeg; e.legs[3].rotation.x=sLeg; }
                else { e.legs[0].rotation.x=sLeg; e.legs[1].rotation.x=-sLeg; if(e.arms){ e.arms[0].rotation.x=-sLeg; e.arms[1].rotation.x=sLeg; } }
            } else { 
                e.legs.forEach(l => l.rotation.x = 0);
                if(e.arms) e.arms.forEach(a => a.rotation.x = 0);
            }
        });
    }
    renderer.render(scene, camera);
}

// --- 10. STARTUP ---
generateWorld(); renderUI(); animate();
window.onresize = () => { camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };