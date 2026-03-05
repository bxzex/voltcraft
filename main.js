import * as THREE from 'three';

// --- 1. CORE MATERIALS & CONFIG ---
const skinMat = new THREE.MeshLambertMaterial({ color: 0xe0ac69 });
const eyeMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
const shirtMat = new THREE.MeshLambertMaterial({ color: 0x2288cc });
const pantsMat = new THREE.MeshLambertMaterial({ color: 0x111144 });

const CONFIG = {
    worldSize: 8,
    chunkSize: 16,
    maxInstances: 300000,
    mouseSensitivity: 0.002,
    playerSpeed: 5,
    jumpForce: 10,
    gravity: 25,
    flySpeed: 15,
    actionDuration: 200,
    timeSpeed: 0.0001,
    bedrockDepth: -60,
    playerRadius: 0.3
};

let state = {
    gameStarted: false,
    inventoryOpen: false,
    firstPerson: true,
    isFlying: false,
    actionTime: 0,
    prevTime: performance.now(),
    yaw: 0,
    pitch: 0,
    velocity: new THREE.Vector3(),
    move: { f: 0, b: 0, l: 0, r: 0, u: 0, d: 0 },
    lastTaps: {},
    stepLatch: false,
    activeSlot: 0,
    selectedItem: 'grass',
    worldTime: 0
};

const inventoryItems = ['grass', 'dirt', 'stone', 'wood', 'leaves', 'sand', 'glass', 'brick', 'planks', 'diamond', 'plant', 'pickaxe', 'shovel', 'rifle'];
let hotbarSlots = ['grass', 'dirt', 'stone', 'wood', 'sand', 'pickaxe', 'shovel', 'rifle', 'diamond'];
state.selectedItem = hotbarSlots[state.activeSlot];

// --- 2. TEXTURES & MATERIALS MAP ---
function generateNoiseTexture(color, noise = 50, size = 64, wood = false) {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color; ctx.fillRect(0, 0, size, size);
    const img = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < img.data.length; i += 4) {
        const x = (i / 4) % size;
        let n = (Math.random() - 0.5) * noise;
        if (wood) n += (Math.sin(x * 0.5) * 20);
        img.data[i] = Math.min(255, Math.max(0, img.data[i] + n));
        img.data[i+1] = Math.min(255, Math.max(0, img.data[i+1] + n));
        img.data[i+2] = Math.min(255, Math.max(0, img.data[i+2] + n));
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    return tex;
}

const textures = {
    grass: generateNoiseTexture('#3b7a2d', 60),
    dirt: generateNoiseTexture('#4a3525', 60),
    stone: generateNoiseTexture('#666666', 70),
    wood: generateNoiseTexture('#5c4033', 30, 64, true),
    leaves: generateNoiseTexture('#2d5a1e', 40),
    bedrock: generateNoiseTexture('#222222', 80),
    sand: generateNoiseTexture('#d2b48c', 20),
    glass: generateNoiseTexture('#add8e6', 10),
    brick: generateNoiseTexture('#b22222', 50),
    planks: generateNoiseTexture('#cd853f', 20, 64, true),
    diamond: generateNoiseTexture('#00ffff', 40)
};

const materialsMap = {
    dirt: new THREE.MeshLambertMaterial({ map: textures.dirt }),
    grass: [
        new THREE.MeshLambertMaterial({ map: textures.dirt }),
        new THREE.MeshLambertMaterial({ map: textures.dirt }),
        new THREE.MeshLambertMaterial({ map: textures.grass }),
        new THREE.MeshLambertMaterial({ map: textures.dirt }),
        new THREE.MeshLambertMaterial({ map: textures.dirt }),
        new THREE.MeshLambertMaterial({ map: textures.dirt })
    ],
    stone: new THREE.MeshLambertMaterial({ map: textures.stone }),
    wood: new THREE.MeshLambertMaterial({ map: textures.wood }),
    leaves: new THREE.MeshLambertMaterial({ map: textures.leaves }),
    bedrock: new THREE.MeshLambertMaterial({ map: textures.bedrock }),
    sand: new THREE.MeshLambertMaterial({ map: textures.sand }),
    glass: new THREE.MeshLambertMaterial({ map: textures.glass, transparent: true, opacity: 0.6 }),
    brick: new THREE.MeshLambertMaterial({ map: textures.brick }),
    planks: new THREE.MeshLambertMaterial({ map: textures.planks }),
    diamond: new THREE.MeshLambertMaterial({ map: textures.diamond })
};

// --- 3. SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 20, 150);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
dirLight.shadow.camera.left = -100; dirLight.shadow.camera.right = 100;
dirLight.shadow.camera.top = 100; dirLight.shadow.camera.bottom = -100;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.bias = -0.0005;
scene.add(dirLight);

// --- 4. WORLD ENGINE ---
const blockGeo = new THREE.BoxGeometry(1, 1, 1);
const plantGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
const world = new Map();
const blockMeshes = {};

const allTypes = Array.from(new Set([...inventoryItems, 'bedrock', 'leaves', 'plant']));

function setupInstancedMeshes() {
    allTypes.forEach(t => {
        if (blockMeshes[t]) scene.remove(blockMeshes[t]);
        const mat = t === 'plant' ? materialsMap.leaves : (materialsMap[t] || materialsMap.stone);
        const geo = t === 'plant' ? plantGeo : blockGeo;
        blockMeshes[t] = new THREE.InstancedMesh(geo, mat, CONFIG.maxInstances);
        blockMeshes[t].castShadow = true; blockMeshes[t].receiveShadow = true;
        scene.add(blockMeshes[t]);
    });
}
setupInstancedMeshes();

const getBlockKey = (x, y, z) => `${Math.floor(x + 0.5)},${Math.floor(y + 0.5)},${Math.floor(z + 0.5)}`;

function buildHouse(wx, wy, wz) {
    for(let hx = -2; hx <= 2; hx++) {
        for(let hz = -2; hz <= 2; hz++) {
            world.set(getBlockKey(wx + hx, wy, wz + hz), { type: 'planks' });
            for (let hy = 1; hy <= 3; hy++) {
                if (Math.abs(hx) === 2 || Math.abs(hz) === 2) {
                    if (!(hx === 0 && hz === 2 && hy <= 2)) world.set(getBlockKey(wx + hx, wy + hy, wz + hz), { type: 'brick' });
                }
            }
            world.set(getBlockKey(wx + hx, wy + 4, wz + hz), { type: 'wood' });
        }
    }
}

function generateWorld() {
    world.clear();
    for (let cx = -CONFIG.worldSize; cx < CONFIG.worldSize; cx++) {
        for (let cz = -CONFIG.worldSize; cz < CONFIG.worldSize; cz++) {
            for (let x = 0; x < CONFIG.chunkSize; x++) {
                for (let z = 0; z < CONFIG.chunkSize; z++) {
                    const wx = cx * CONFIG.chunkSize + x; const wz = cz * CONFIG.chunkSize + z;
                    const h = Math.floor(Math.sin(wx * 0.05) * 4 + Math.cos(wz * 0.05) * 4) + 8;
                    for (let y = h; y >= CONFIG.bedrockDepth; y--) {
                        let type = 'stone';
                        if (y === CONFIG.bedrockDepth) type = 'bedrock';
                        else if (y === h) type = 'grass';
                        else if (y > h - 4) type = 'dirt';
                        world.set(getBlockKey(wx, y, wz), { type });
                    }
                    if (Math.random() < 0.004) {
                        for(let th=1; th<=5; th++) world.set(getBlockKey(wx, h+th, wz), { type: 'wood' });
                        for(let lx=-2; lx<=2; lx++) for(let lz=-2; lz<=2; lz++) for(let ly=h+4; ly<=h+7; ly++) {
                            if (Math.abs(lx)+Math.abs(lz)+Math.abs(ly-(h+5)) < 4) world.set(getBlockKey(wx+lx, ly, wz+lz), { type: 'leaves' });
                        }
                    } else if (Math.random() < 0.05) world.set(getBlockKey(wx, h+1, wz), { type: 'plant' });
                }
            }
        }
    }
    updateInstances();
}

const dummy = new THREE.Object3D();
function updateInstances() {
    const counts = {}; allTypes.forEach(t => counts[t] = 0);
    for (const [key, data] of world.entries()) {
        const [x, y, z] = key.split(',').map(Number);
        dummy.position.set(x, (data.type === 'plant' ? y - 0.2 : y), z); 
        dummy.updateMatrix();
        if (blockMeshes[data.type] && counts[data.type] < CONFIG.maxInstances) {
            blockMeshes[data.type].setMatrixAt(counts[data.type]++, dummy.matrix);
        }
    }
    allTypes.forEach(t => { if(blockMeshes[t]){ blockMeshes[t].count = counts[t]; blockMeshes[t].instanceMatrix.needsUpdate = true; } });
}

// --- 5. PLAYER MODEL & SETUP ---
const player = new THREE.Group(); player.position.set(0, 40, 0); scene.add(player);
const pitchPivot = new THREE.Group(); player.add(pitchPivot); pitchPivot.add(camera);
const playerBody = new THREE.Group(); playerBody.rotation.y = Math.PI; playerBody.position.y = -1.4; player.add(playerBody);

const headModel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat); headModel.position.y = 1.65; playerBody.add(headModel);
const pe1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), eyeMat); pe1.position.set(0.1, 0.05, 0.26); headModel.add(pe1);
const pe2 = pe1.clone(); pe2.position.x = -0.1; headModel.add(pe2);
const torsoModel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.3), shirtMat); torsoModel.position.y = 0.95; playerBody.add(torsoModel);
const lArmP = new THREE.Group(); lArmP.position.set(0.45, 1.3, 0); playerBody.add(lArmP);
const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.25), skinMat); lArm.position.y = -0.35; lArmP.add(lArm);
const rArmP = new THREE.Group(); rArmP.position.set(-0.45, 1.3, 0); playerBody.add(rArmP);
const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.25), skinMat); rArm.position.y = -0.35; rArmP.add(rArm);
const lLegP = new THREE.Group(); lLegP.position.set(0.15, 0.5, 0); playerBody.add(lLegP);
const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), pantsMat); lLeg.position.y = -0.45; lLegP.add(lLeg);
const rLegP = new THREE.Group(); rLegP.position.set(-0.15, 0.5, 0); playerBody.add(rLegP);
const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), pantsMat); rLeg.position.y = -0.45; rLegP.add(rLeg);

// Fixed Held Item positions
const heldItem = new THREE.Group(); heldItem.position.set(0, -0.8, 0); rArmP.add(heldItem);
const fpItem = new THREE.Group(); fpItem.position.set(0.3, -0.3, -0.5); camera.add(fpItem);

function createTool(type) {
    const g = new THREE.Group();
    if (materialsMap[type]) {
        const m = Array.isArray(materialsMap[type]) ? materialsMap[type][0] : materialsMap[type];
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), m);
        mesh.castShadow = true; g.add(mesh);
    } else if (type === 'pickaxe') {
        const h = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), woodMat);
        const headG = new THREE.Group();
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.08), new THREE.MeshLambertMaterial({color:0x999999})); c.position.y = 0.22;
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.08), new THREE.MeshLambertMaterial({color:0x999999})); l.position.set(0.14, 0.18, 0); l.rotation.z = Math.PI/8;
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.08), new THREE.MeshLambertMaterial({color:0x999999})); r.position.set(-0.14, 0.18, 0); r.rotation.z = -Math.PI/8;
        [h,c,l,r].forEach(m => m.castShadow = true); headG.add(c); headG.add(l); headG.add(r); g.add(h); g.add(headG);
    } else if (type === 'shovel') {
        const h = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), woodMat);
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.04), new THREE.MeshLambertMaterial({color:0x999999})); b.position.y = 0.3;
        [h,b].forEach(m => m.castShadow = true); g.add(h); g.add(b);
    } else if (type === 'rifle') {
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.25), woodMat); s.position.z = 0.1;
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), new THREE.MeshLambertMaterial({color:0x333333})); b.position.z = -0.3;
        [s,b].forEach(m => m.castShadow = true); g.add(s); g.add(b);
    }
    return g;
}

// --- 6. FLUFF ---
const sunObj = new THREE.Mesh(new THREE.SphereGeometry(8, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffaa })); scene.add(sunObj);
const moonObj = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 32), new THREE.MeshBasicMaterial({ color: 0xcccccc })); scene.add(moonObj);
const starsPos = new Float32Array(6000); for(let i=0; i<6000; i++) starsPos[i] = (Math.random() - 0.5) * 800;
const starsGeo = new THREE.BufferGeometry(); starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0 });
const starsObj = new THREE.Points(starsGeo, starsMat); scene.add(starsObj);

const clouds = new THREE.Group();
const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
for(let i=0; i<40; i++) {
    const cluster = new THREE.Group();
    for(let c=0; c<8; c++) {
        const clump = new THREE.Mesh(blockGeo, cloudMat);
        clump.scale.set(5+Math.random()*5, 2+Math.random()*2, 5+Math.random()*5);
        clump.position.set((Math.random()-0.5)*10, (Math.random()-0.5)*2, (Math.random()-0.5)*10);
        cluster.add(clump);
    }
    cluster.position.set((Math.random()-0.5)*400, 50+Math.random()*15, (Math.random()-0.5)*400);
    clouds.add(cluster);
}
scene.add(clouds);

const birds = new THREE.Group();
for(let i=0; i<15; i++) {
    const b = new THREE.Group();
    const bM = new THREE.MeshLambertMaterial({color:0xffffff});
    const bbody = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.7), bM); b.add(bbody);
    const bhead = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), bM); bhead.position.set(0, 0.2, 0.4);
    const beak = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.2), new THREE.MeshLambertMaterial({color:0xffaa00})); beak.position.z = 0.2; bhead.add(beak); b.add(bhead);
    const blWp = new THREE.Group(); blWp.position.set(0.2, 0.1, 0); const blW = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.3), bM); blW.position.x = 0.3; blWp.add(blW); b.add(blWp);
    const brWp = new THREE.Group(); brWp.position.set(-0.2, 0.1, 0); const brW = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.3), bM); brW.position.x = -0.3; brWp.add(brW); b.add(brWp);
    b.position.set((Math.random()-0.5)*300, 40+Math.random()*20, (Math.random()-0.5)*300);
    const dir = new THREE.Vector3(Math.random()-0.5, 0, Math.random()-0.5).normalize();
    b.lookAt(b.position.clone().add(dir));
    b.userData = { dir, speed: 5+Math.random()*5, lWp: blWp, rWp: brWp, off: Math.random()*10 };
    birds.add(b);
}
scene.add(birds);

const animals = [];
for(let i=0; i<20; i++) {
    const isPig = Math.random()>0.5;
    const g = new THREE.Group(); const mat = isPig ? new THREE.MeshLambertMaterial({ color: 0xffb6c1 }) : new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const abody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.2), mat); abody.position.y = 0.6; g.add(abody);
    const ahead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat); ahead.position.set(0, 0.8, 0.7); g.add(ahead);
    const as1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), eyeMat); as1.position.set(0.15, 0.1, 0.26); ahead.add(as1);
    const as2 = as1.clone(); as2.position.x = -0.15; ahead.add(as2);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), isPig ? new THREE.MeshLambertMaterial({color:0xff99aa}) : new THREE.MeshLambertMaterial({color:0xeeeeee})); snout.position.set(0, -0.1, 0.3); ahead.add(snout);
    const aLegs = [];
    [[0.25,0.4], [-0.25,0.4], [0.25,-0.4], [-0.25,-0.4]].forEach(p => {
        const lp = new THREE.Group(); lp.position.set(p[0], 0.4, p[1]);
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), mat); l.position.y = -0.25; lp.add(l); g.add(lp); aLegs.push(lp);
    });
    g.position.set((Math.random()-0.5)*200, 10, (Math.random()-0.5)*200);
    scene.add(g); animals.push({ g, legs: aLegs, dir: new THREE.Vector3(Math.random()-0.5, 0, Math.random()-0.5).normalize(), speed: 1+Math.random(), timer: Math.random()*5 });
}

// --- 7. AUDIO ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(f, type, d, v) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, audioCtx.currentTime);
    g.gain.setValueAtTime(v, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + d);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + d);
}
const playPop = () => playTone(400, 'sine', 0.1, 0.1);
const playCrunch = () => playTone(120, 'square', 0.15, 0.1);
const playStep = () => playTone(90, 'triangle', 0.05, 0.03);

// --- 8. UI LOGIC ---
const hotbarEl = document.getElementById('hotbar');
const invGrid = document.getElementById('inventory-grid');
const invMenu = document.getElementById('inventory-menu');
const closeInvBtn = document.getElementById('close-inv-btn');

function renderUI() {
    if (!hotbarEl) return;
    hotbarEl.innerHTML = '';
    hotbarSlots.forEach((t, i) => {
        const s = document.createElement('div'); s.className = 'slot' + (i === state.activeSlot ? ' active' : '');
        s.innerHTML = `<span>${i+1}</span>${t}`; hotbarEl.appendChild(s);
    });
    [fpItem, heldItem].forEach(p => { while(p.children.length > 0) p.remove(p.children[0]); p.add(createTool(state.selectedItem)); });
}

if (invGrid) {
    inventoryItems.forEach(t => {
        const s = document.createElement('div'); s.className = 'inv-slot'; s.innerHTML = `<span>${t}</span>`;
        s.onclick = () => { hotbarSlots[state.activeSlot] = t; state.selectedItem = t; renderUI(); }; invGrid.appendChild(s);
    });
}

function toggleInventory() {
    state.inventoryOpen = !state.inventoryOpen;
    if (invMenu) invMenu.style.display = state.inventoryOpen ? 'flex' : 'none';
    if (state.inventoryOpen) document.exitPointerLock(); 
    else if (state.gameStarted) document.body.requestPointerLock();
}
if (closeInvBtn) closeInvBtn.onclick = toggleInventory;

const startBtn = document.getElementById('start-btn');
const resumeBtn = document.getElementById('resume-btn');
const regenBtn = document.getElementById('regen-btn');
const instMenu = document.getElementById('instructions');
const pauseMenu = document.getElementById('pause-menu');
const renderRange = document.getElementById('render-dist');
const renderVal = document.getElementById('render-val');
const timeRange = document.getElementById('time-speed');
const timeVal = document.getElementById('time-val');

if(renderRange) renderRange.oninput = (e) => { CONFIG.worldSize = parseInt(e.target.value); if(renderVal) renderVal.innerText = e.target.value; };
if(timeRange) timeRange.oninput = (e) => { CONFIG.timeSpeed = parseInt(e.target.value) / 100000; if(timeVal) timeVal.innerText = e.target.value; };
if(regenBtn) regenBtn.onclick = () => { setupInstancedMeshes(); generateWorld(); if(pauseMenu) pauseMenu.style.display = 'none'; document.body.requestPointerLock(); };

if(startBtn) startBtn.onclick = () => { state.gameStarted = true; instMenu.style.display = 'none'; document.body.requestPointerLock(); };
if(resumeBtn) resumeBtn.onclick = () => { if(pauseMenu) pauseMenu.style.display = 'none'; document.body.requestPointerLock(); };

function toggleCamera() {
    state.firstPerson = !state.firstPerson;
    const modeEl = document.getElementById('camera-mode');
    if (modeEl) modeEl.innerText = state.firstPerson ? "First Person" : "Third Person";
    const crosshair = document.getElementById('crosshair');
    if (state.firstPerson) {
        camera.position.set(0, 0, 0);
        if (crosshair) crosshair.style.display = 'flex';
    } else {
        camera.position.set(0, 0, 6); 
        if (crosshair) crosshair.style.display = 'none';
    }
}

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement !== document.body && state.gameStarted && !state.inventoryOpen) {
        if(pauseMenu) pauseMenu.style.display = 'flex';
    }
});

// --- 9. INTERACTION ---
function getTarget() {
    const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
    const start = new THREE.Vector3(); camera.getWorldPosition(start);
    for (let d=0; d<8; d+=0.05) {
        const p = start.clone().addScaledVector(dir, d);
        const k = getBlockKey(p.x, p.y, p.z);
        if (world.has(k)) {
            const blockPos = new THREE.Vector3(Math.round(p.x), Math.round(p.y), Math.round(p.z));
            const diff = p.clone().sub(blockPos);
            const adx = Math.abs(diff.x), ady = Math.abs(diff.y), adz = Math.abs(diff.z);
            let normal = new THREE.Vector3();
            if (adx > ady && adx > adz) normal.x = Math.sign(diff.x); else if (ady > adz) normal.y = Math.sign(diff.y); else normal.z = Math.sign(diff.z);
            return { k, pos: blockPos, normal };
        }
    }
    return null;
}

document.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement !== document.body) return;
    state.actionTime = performance.now();
    const t = getTarget();
    if (e.button === 0) { // Break
        if (t && world.get(t.k).type !== 'bedrock') { world.delete(t.k); updateInstances(); playCrunch(); }
    } else if (e.button === 2) { // Place
        if (t) {
            const pk = getBlockKey(t.pos.x + t.normal.x, t.pos.y + t.normal.y, t.pos.z + t.normal.z);
            if (!world.has(pk)) {
                const checkInside = (ox, oz) => {
                    const k = getBlockKey(player.position.x + ox, player.position.y - 1.8, player.position.z + oz);
                    const k2 = getBlockKey(player.position.x + ox, player.position.y - 0.8, player.position.z + oz);
                    return pk === k || pk === k2;
                };
                const r = CONFIG.playerRadius;
                if (!checkInside(r, r) && !checkInside(-r, r) && !checkInside(r, -r) && !checkInside(-r, -r)) {
                    world.set(pk, { type: state.selectedItem }); updateInstances(); playPop();
                }
            }
        }
    }
});
document.addEventListener('contextmenu', e => e.preventDefault());

// --- 10. CONTROLS ---
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyI') { toggleInventory(); return; }
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

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== document.body) return;
    state.yaw -= e.movementX * CONFIG.mouseSensitivity; state.pitch -= e.movementY * CONFIG.mouseSensitivity;
    state.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, state.pitch));
    player.rotation.y = state.yaw; pitchPivot.rotation.x = state.pitch;
});

// --- 11. ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    const time = performance.now(); const delta = Math.min((time - state.prevTime)/1000, 0.1); state.prevTime = time;

    clouds.children.forEach(c => { c.position.x += delta * 2; if (c.position.x > 200) c.position.x = -200; });
    state.worldTime += delta * CONFIG.timeSpeed * 500;
    const sunR = 250;
    sunObj.position.set(Math.cos(state.worldTime)*sunR, Math.sin(state.worldTime)*sunR, 0);
    moonObj.position.set(Math.cos(state.worldTime+Math.PI)*sunR, Math.sin(state.worldTime+Math.PI)*sunR, 0);
    dirLight.position.set(sunObj.position.x + player.position.x, sunObj.position.y + player.position.y, sunObj.position.z + player.position.z);
    dirLight.target.position.copy(player.position); dirLight.target.updateMatrixWorld();
    const sh = Math.sin(state.worldTime);
    scene.background.set(sh > 0.2 ? 0x87CEEB : (sh > 0 ? 0xff7f50 : 0x0a0a2a));
    starsMat.opacity = sh < 0 ? 1 : (sh < 0.2 ? 1 - sh*5 : 0);

    if (state.gameStarted) {
        if (state.isFlying) { state.velocity.y = (state.move.u - state.move.d) * CONFIG.flySpeed; } else { state.velocity.y -= CONFIG.gravity * delta; }
        const localMove = new THREE.Vector3((state.move.r - state.move.l)*CONFIG.playerSpeed*delta, 0, (state.move.b - state.move.f)*CONFIG.playerSpeed*delta);
        localMove.applyAxisAngle(new THREE.Vector3(0,1,0), player.rotation.y);
        
        // Multi-point Collision Check
        const canMoveTo = (nx, nz) => {
            const r = CONFIG.playerRadius;
            const points = [[r,r],[-r,r],[r,-r],[-r,-r]];
            for(let p of points) {
                if (world.has(getBlockKey(nx + p[0], player.position.y - 0.8, nz + p[1]))) return false;
                if (world.has(getBlockKey(nx + p[0], player.position.y - 1.8, nz + p[1]))) return false;
            }
            return true;
        };

        if (canMoveTo(player.position.x + localMove.x, player.position.z)) player.position.x += localMove.x;
        if (canMoveTo(player.position.x, player.position.z + localMove.z)) player.position.z += localMove.z;
        player.position.y += state.velocity.y * delta;

        const ck = getBlockKey(player.position.x, player.position.y - 1.8, player.position.z);
        if (world.has(ck) && !state.isFlying && state.velocity.y <= 0) {
            state.velocity.y = 0; player.position.y = Math.floor(player.position.y - 1.8 + 0.5) + 0.5 + 1.8;
        }

        playerBody.visible = !state.firstPerson;
        fpItem.visible = state.firstPerson; heldItem.visible = !state.firstPerson;

        const actionElapsed = time - state.actionTime;
        if (actionElapsed < CONFIG.actionDuration) {
            const pVal = actionElapsed / CONFIG.actionDuration; const sVal = Math.sin(pVal * Math.PI);
            if (state.firstPerson) {
                fpItem.position.set(0.3, -0.3 - sVal * 0.2, -0.5 - sVal * 0.3); fpItem.rotation.set(-sVal * 1.2, -Math.PI / 4, 0);
            } else { rArmP.rotation.x = -sVal * 1.8; }
        } else if (state.firstPerson) {
            fpItem.position.set(0.3, -0.3, -0.5); fpItem.rotation.set(0, -Math.PI / 4, 0);
        }

        const isMoving = state.move.f || state.move.b || state.move.l || state.move.r;
        if (isMoving && !state.isFlying && state.velocity.y === 0) {
            const sCycle = Math.sin(time * 0.01) * 0.8;
            lLegP.rotation.x = sCycle; rLegP.rotation.x = -sCycle; lArmP.rotation.x = -sCycle; 
            if (actionElapsed >= CONFIG.actionDuration) rArmP.rotation.x = sCycle;
            if (Math.sin(time * 0.01) > 0.9 && !state.stepLatch) { playStep(); state.stepLatch = true; } else if (Math.sin(time * 0.01) < 0) { state.stepLatch = false; }
        } else {
            lLegP.rotation.x = rLegP.rotation.x = lArmP.rotation.x = 0;
            if (actionElapsed >= CONFIG.actionDuration) rArmP.rotation.x = 0;
        }

        birds.children.forEach(b => {
            b.position.addScaledVector(b.userData.dir, b.userData.speed * delta);
            b.position.y += Math.sin(time * 0.005 + b.userData.off) * 0.05;
            if (b.position.x > 200) b.position.x = -200; if (b.position.z > 200) b.position.z = -200;
            const fsCycle = Math.sin(time * 0.02 + b.userData.off) * 0.8; b.userData.lWp.rotation.z = fsCycle; b.userData.rWp.rotation.z = -fsCycle;
        });

        animals.forEach(a => {
            a.timer -= delta; if (a.timer <= 0) { a.dir.set(Math.random()-0.5, 0, Math.random()-0.5).normalize(); a.timer = 2 + Math.random()*3; if(Math.random()<0.3) a.dir.set(0,0,0); }
            if (a.dir.lengthSq() > 0.1) {
                const nX = a.g.position.x + a.dir.x * delta * a.speed; const nZ = a.g.position.z + a.dir.z * delta * a.speed;
                const ar = 0.4;
                const canAnimalMove = (anx, anz) => {
                    const pts = [[ar,ar],[-ar,ar],[ar,-ar],[-ar,-ar]];
                    for(let p of pts) {
                        if (world.has(getBlockKey(anx + p[0], a.g.position.y + 0.1, anz + p[1]))) return false;
                        if (world.has(getBlockKey(anx + p[0], a.g.position.y + 1.1, anz + p[1]))) return false;
                    }
                    return true;
                };
                if (canAnimalMove(nX, nZ)) { a.g.position.x = nX; a.g.position.z = nZ; } else { a.dir.set(0,0,0); }
                a.g.lookAt(a.g.position.x + a.dir.x, a.g.position.y, a.g.position.z + a.dir.z);
                const sLeg = Math.sin(time * 0.01 * a.speed) * 0.5; a.legs[0].rotation.x = sLeg; a.legs[1].rotation.x = -sLeg; a.legs[2].rotation.x = -sLeg; a.legs[3].rotation.x = sLeg;
            } else { a.legs.forEach(l => l.rotation.x = 0); }
            const floorK = getBlockKey(a.g.position.x, a.g.position.y - 0.1, a.g.position.z);
            if (!world.has(floorK)) { a.g.position.y -= 10 * delta; if (a.g.position.y < -20) a.g.position.y = 20; } 
            else { a.g.position.y = Math.floor(a.g.position.y - 0.1 + 0.5) + 0.5; }
        });
    }
    renderer.render(scene, camera);
}

// --- 12. STARTUP ---
generateWorld(); renderUI(); animate();
window.onresize = () => { camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };