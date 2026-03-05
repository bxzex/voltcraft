import * as THREE from 'three';

const CONFIG = {
    worldSize: 6, chunkSize: 16, maxInstances: 300000,
    mouseSensitivity: 0.002, playerSpeed: 6, jumpForce: 10,
    gravity: 25, flySpeed: 20, actionDuration: 200, bedrockDepth: -15,
    playerRadius: 0.3
};

let state = {
    gameStarted: false, inventoryOpen: false, firstPerson: true, isFlying: false,
    actionTime: 0, prevTime: performance.now(), yaw: 0, pitch: 0,
    velocity: new THREE.Vector3(), move: { f: 0, b: 0, l: 0, r: 0, u: 0, d: 0 },
    lastTaps: {}, stepLatch: false, activeSlot: 0, selectedItem: 'grass',
    worldTime: Math.PI / 4
};

const inventoryItems = [
    'grass', 'dirt', 'stone', 'cobblestone', 'wood', 'planks', 'leaves', 
    'sand', 'glass', 'brick', 'bookshelf', 'obsidian', 'diamond_ore', 
    'gold_ore', 'iron_ore', 'coal_ore', 'crafting_table', 'furnace', 'tnt',
    'dandelion', 'poppy', 'pickaxe', 'sword'
];
let hotbarSlots = ['grass', 'cobblestone', 'planks', 'crafting_table', 'furnace', 'diamond_ore', 'tnt', 'pickaxe', 'sword'];
state.selectedItem = hotbarSlots[state.activeSlot];

const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

const ASSET_URL = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.2/assets/minecraft/';
const texLoader = new THREE.TextureLoader();
texLoader.setCrossOrigin('anonymous');

const loadTex = (path) => {
    const t = texLoader.load(ASSET_URL + 'textures/' + path);
    t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
    return t;
};

const tData = {
    grass_top: loadTex('block/grass_block_top.png'),
    grass_side: loadTex('block/grass_block_side.png'),
    dirt: loadTex('block/dirt.png'),
    stone: loadTex('block/stone.png'),
    cobblestone: loadTex('block/cobblestone.png'),
    wood: loadTex('block/oak_log.png'),
    wood_top: loadTex('block/oak_log_top.png'),
    planks: loadTex('block/oak_planks.png'),
    leaves: loadTex('block/oak_leaves.png'),
    sand: loadTex('block/sand.png'),
    glass: loadTex('block/glass.png'),
    brick: loadTex('block/bricks.png'),
    bookshelf: loadTex('block/bookshelf.png'),
    obsidian: loadTex('block/obsidian.png'),
    diamond_ore: loadTex('block/diamond_ore.png'),
    gold_ore: loadTex('block/gold_ore.png'),
    iron_ore: loadTex('block/iron_ore.png'),
    coal_ore: loadTex('block/coal_ore.png'),
    craft_top: loadTex('block/crafting_table_top.png'),
    craft_side: loadTex('block/crafting_table_front.png'),
    furnace_front: loadTex('block/furnace_front.png'),
    furnace_top: loadTex('block/furnace_top.png'),
    furnace_side: loadTex('block/furnace_side.png'),
    tnt_side: loadTex('block/tnt_side.png'),
    tnt_top: loadTex('block/tnt_top.png'),
    tnt_bottom: loadTex('block/tnt_bottom.png'),
    dandelion: loadTex('block/dandelion.png'),
    poppy: loadTex('block/poppy.png')
};

const m = (tex) => new THREE.MeshLambertMaterial({ map: tex });
const mT = (tex) => new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.5 });
const mD = (tex) => new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });

const materialsMap = {
    dirt: m(tData.dirt), stone: m(tData.stone), cobblestone: m(tData.cobblestone),
    planks: m(tData.planks), sand: m(tData.sand), brick: m(tData.brick),
    obsidian: m(tData.obsidian), diamond_ore: m(tData.diamond_ore),
    gold_ore: m(tData.gold_ore), iron_ore: m(tData.iron_ore), coal_ore: m(tData.coal_ore),
    glass: new THREE.MeshLambertMaterial({ map: tData.glass, transparent: true, opacity: 0.6 }),
    leaves: mT(tData.leaves), dandelion: mD(tData.dandelion), poppy: mD(tData.poppy),
    grass: [m(tData.grass_side), m(tData.grass_side), m(tData.grass_top), m(tData.dirt), m(tData.grass_side), m(tData.grass_side)],
    wood: [m(tData.wood), m(tData.wood), m(tData.wood_top), m(tData.wood_top), m(tData.wood), m(tData.wood)],
    crafting_table: [m(tData.craft_side), m(tData.craft_side), m(tData.craft_top), m(tData.planks), m(tData.craft_side), m(tData.craft_side)],
    furnace: [m(tData.furnace_side), m(tData.furnace_side), m(tData.furnace_top), m(tData.furnace_top), m(tData.furnace_front), m(tData.furnace_side)],
    bookshelf: [m(tData.bookshelf), m(tData.bookshelf), m(tData.planks), m(tData.planks), m(tData.bookshelf), m(tData.bookshelf)],
    tnt: [m(tData.tnt_side), m(tData.tnt_side), m(tData.tnt_top), m(tData.tnt_bottom), m(tData.tnt_side), m(tData.tnt_side)]
};

const sounds = {
    break: new Audio(ASSET_URL + 'sounds/dig/stone1.ogg'),
    place: new Audio(ASSET_URL + 'sounds/dig/grass1.ogg'),
    step: new Audio(ASSET_URL + 'sounds/step/grass1.ogg')
};
Object.values(sounds).forEach(s => { s.crossOrigin = 'anonymous'; s.volume = 0.2; });
const playSound = (n) => { if(sounds[n]) { sounds[n].currentTime = 0; sounds[n].play().catch(()=>{}); } };

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(50, 100, 50); dirLight.castShadow = true;
dirLight.shadow.camera.left = -60; dirLight.shadow.camera.right = 60;
dirLight.shadow.camera.top = 60; dirLight.shadow.camera.bottom = -60;
dirLight.shadow.mapSize.set(2048, 2048);
scene.add(dirLight);

const blockGeo = new THREE.BoxGeometry(1, 1, 1);
const plantGeo = new THREE.PlaneGeometry(0.8, 0.8); plantGeo.translate(0, 0.4, 0);

const world = new Map();
const blockMeshes = {};
const allTypes = Array.from(new Set([...inventoryItems, 'bedrock', 'leaves']));
const solidTypes = allTypes.filter(t => t !== 'dandelion' && t !== 'poppy');

function setupInstancedMeshes() {
    allTypes.forEach(t => {
        if (blockMeshes[t]) scene.remove(blockMeshes[t]);
        const mat = materialsMap[t] || materialsMap.stone;
        const isPlant = t === 'dandelion' || t === 'poppy';
        const geo = isPlant ? plantGeo : blockGeo;
        blockMeshes[t] = new THREE.InstancedMesh(geo, mat, CONFIG.maxInstances);
        blockMeshes[t].castShadow = !isPlant; blockMeshes[t].receiveShadow = true;
        scene.add(blockMeshes[t]);
    });
}
setupInstancedMeshes();

const getBlockKey = (x, y, z) => `${Math.floor(x + 0.5)},${Math.floor(y + 0.5)},${Math.floor(z + 0.5)}`;

function noise2D(x, z) {
    const s = 0.05; return Math.sin(x * s) * Math.cos(z * s) * 4 + Math.sin(x * s * 0.5) * 6;
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

function generateWorld() {
    world.clear();
    const villageCenters = [];
    if(Math.random() > 0.2) villageCenters.push({x: 10, z: 10});
    
    for (let cx = -CONFIG.worldSize; cx < CONFIG.worldSize; cx++) {
        for (let cz = -CONFIG.worldSize; cz < CONFIG.worldSize; cz++) {
            for (let x = 0; x < CONFIG.chunkSize; x++) {
                for (let z = 0; z < CONFIG.chunkSize; z++) {
                    const wx = cx * CONFIG.chunkSize + x; const wz = cz * CONFIG.chunkSize + z;
                    
                    let vDist = 999;
                    villageCenters.forEach(v => { const d = Math.sqrt((wx-v.x)**2 + (wz-v.z)**2); if(d < vDist) vDist = d; });
                    
                    let rawH = noise2D(wx, wz);
                    if (vDist < 15) rawH = rawH * (vDist/15); 
                    const h = Math.floor(rawH) + 10;
                    
                    for (let y = h; y >= CONFIG.bedrockDepth; y--) {
                        let type = 'stone';
                        if (y === CONFIG.bedrockDepth) type = 'bedrock';
                        else if (y === h) type = (vDist < 15 && Math.random()<0.3) ? 'dirt' : 'grass';
                        else if (y > h - 4) type = 'dirt';
                        else {
                            if (Math.random() < 0.005) type = 'diamond_ore';
                            else if (Math.random() < 0.01) type = 'gold_ore';
                            else if (Math.random() < 0.03) type = 'iron_ore';
                            else if (Math.random() < 0.04) type = 'coal_ore';
                        }
                        world.set(getBlockKey(wx, y, wz), { type });
                    }
                    
                    if (vDist >= 15 && Math.random() < 0.01) buildTree(wx, h, wz);
                    else if (vDist >= 15 && Math.random() < 0.05) world.set(getBlockKey(wx, h+1, wz), { type: Math.random() > 0.5 ? 'dandelion' : 'poppy' });
                }
            }
        }
    }
    
    villageCenters.forEach(v => {
        buildHouse(v.x, Math.floor(noise2D(v.x, v.z))+10, v.z);
        buildHouse(v.x + 8, Math.floor(noise2D(v.x+8, v.z))+10, v.z);
        spawnVillager(v.x + 4, Math.floor(noise2D(v.x+4, v.z))+11, v.z + 4);
    });
    updateInstances();
}

const dummy = new THREE.Object3D();
const dummyPlant1 = new THREE.Object3D(); const dummyPlant2 = new THREE.Object3D();

function updateInstances() {
    const counts = {}; allTypes.forEach(t => counts[t] = 0);
    for (const [key, data] of world.entries()) {
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

const entities = [];

function createMobModel(type) {
    const g = new THREE.Group();
    let isQuad = false;
    let bC, hC, lC; 
    
    if (type === 'pig') { isQuad=true; bC=0xffb6c1; hC=0xff99aa; lC=0xffb6c1; }
    else if (type === 'cow') { isQuad=true; bC=0x4a3a2a; hC=0x3a2a1a; lC=0x3a2a1a; }
    else if (type === 'villager') { isQuad=false; bC=0x5c4033; hC=0xe0ac69; lC=0x3c2013; }
    else { isQuad=false; bC=0x00aaaa; hC=0xe0ac69; lC=0x222288; }

    const matB = new THREE.MeshLambertMaterial({ color: bC });
    const matH = new THREE.MeshLambertMaterial({ color: hC });
    const matL = new THREE.MeshLambertMaterial({ color: lC });

    if (isQuad) {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.2), matB); body.position.y = 0.6; g.add(body);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), matH); head.position.set(0, 0.9, 0.7); g.add(head);
        const legs = [];
        [[0.25,0.4], [-0.25,0.4], [0.25,-0.4], [-0.25,-0.4]].forEach(p => {
            const lp = new THREE.Group(); lp.position.set(p[0], 0.4, p[1]);
            const l = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.25), matL); l.position.y = -0.2; lp.add(l); g.add(lp); legs.push(lp);
        });
        return { g, legs, head, isQuad };
    } else {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.3), matB); body.position.y = 0.8; g.add(body);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), matH); head.position.set(0, 1.4, 0); g.add(head);
        const legs = [];
        [[0.15,0], [-0.15,0]].forEach(p => {
            const lp = new THREE.Group(); lp.position.set(p[0], 0.4, p[1]);
            const l = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.25), matL); l.position.y = -0.2; lp.add(l); g.add(lp); legs.push(lp);
        });
        const arms = [];
        [[0.35, 0.8], [-0.35, 0.8]].forEach(p => {
            const ap = new THREE.Group(); ap.position.set(p[0], 1.2, 0);
            const a = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), matB); a.position.y = -0.4; ap.add(a); g.add(ap); arms.push(ap);
        });
        return { g, legs, arms, head, isQuad };
    }
}

function spawnMob(type, x, y, z) {
    const model = createMobModel(type);
    model.g.position.set(x, y, z);
    scene.add(model.g);
    entities.push({
        ...model, type, dir: new THREE.Vector3(Math.random()-0.5, 0, Math.random()-0.5).normalize(),
        speed: 1 + Math.random(), timer: Math.random()*5
    });
}
function spawnVillager(x, y, z) { spawnMob('villager', x, y, z); }

for(let i=0; i<12; i++) spawnMob(Math.random()>0.5 ? 'pig' : 'cow', (Math.random()-0.5)*40, 20, (Math.random()-0.5)*40);

const player = new THREE.Group(); player.position.set(0, 30, 0); scene.add(player);
const pitchPivot = new THREE.Group(); player.add(pitchPivot); pitchPivot.add(camera);
const pModel = createMobModel('player'); pModel.g.position.y = -1.5; pModel.g.rotation.y = Math.PI; player.add(pModel.g);

const fpItem = new THREE.Group(); fpItem.position.set(0.4, -0.3, -0.5); camera.add(fpItem);

function createTool(type) {
    const g = new THREE.Group();
    if (materialsMap[type]) {
        const m = Array.isArray(materialsMap[type]) ? materialsMap[type][0] : materialsMap[type];
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), m);
        mesh.castShadow = true; g.add(mesh);
    } else {
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), new THREE.MeshLambertMaterial({color:0x5c4033}));
        c.castShadow = true; g.add(c);
    }
    return g;
}

const hotbarEl = document.getElementById('hotbar-container');
const invGrid = document.getElementById('inventory-grid');
const invMenu = document.getElementById('inventory-menu');

function getIconUrl(t) {
    if(t === 'wood') return 'oak_log';
    if(t === 'planks') return 'oak_planks';
    if(t === 'grass') return 'grass_block_side';
    if(t === 'crafting_table') return 'crafting_table_front';
    if(t === 'furnace') return 'furnace_front';
    if(t === 'tnt') return 'tnt_side';
    return t;
}

function renderUI() {
    if (hotbarEl) {
        hotbarEl.innerHTML = '';
        hotbarSlots.forEach((t, i) => {
            const s = document.createElement('div'); s.className = 'slot' + (i === state.activeSlot ? ' active' : '');
            if(t !== '' && t !== 'sword' && t !== 'pickaxe') {
                s.style.backgroundImage = `url(${ASSET_URL}textures/block/${getIconUrl(t)}.png)`;
            } else if (t === 'sword' || t === 'pickaxe') {
                s.style.backgroundImage = `url(${ASSET_URL}textures/item/${t === 'sword' ? 'iron_sword' : 'iron_pickaxe'}.png)`;
            }
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
        const s = document.createElement('div'); s.className = 'inv-slot';
        s.setAttribute('data-item', t);
        if(t !== 'sword' && t !== 'pickaxe') s.style.backgroundImage = `url(${ASSET_URL}textures/block/${getIconUrl(t)}.png)`;
        else s.style.backgroundImage = `url(${ASSET_URL}textures/item/${t === 'sword' ? 'iron_sword' : 'iron_pickaxe'}.png)`;
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

document.getElementById('start-btn').onclick = () => { 
    state.gameStarted = true; 
    document.getElementById('instructions').style.display = 'none'; 
    if(!isMobile) document.body.requestPointerLock();
    if(isMobile) document.getElementById('mobile-controls').style.display = 'block';
};
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

function toggleCamera() {
    state.firstPerson = !state.firstPerson;
    document.getElementById('crosshair').style.display = state.firstPerson ? 'flex' : 'none';
    camera.position.set(0, 0, state.firstPerson ? 0 : 5);
    pModel.g.visible = !state.firstPerson;
}

document.addEventListener('pointerlockchange', () => {
    if (!isMobile && document.pointerLockElement !== document.body && state.gameStarted && !state.inventoryOpen) {
        document.getElementById('pause-menu').style.display = 'flex';
    }
});

function handlePause() {
    if(state.gameStarted && !state.inventoryOpen) {
        document.getElementById('pause-menu').style.display = 'flex';
        if(isMobile) document.getElementById('mobile-controls').style.display = 'none';
        if(!isMobile) document.exitPointerLock();
    }
}

function getTarget() {
    const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
    const start = new THREE.Vector3(); camera.getWorldPosition(start);
    for (let d=0; d<8; d+=0.05) {
        const p = start.clone().addScaledVector(dir, d);
        const k = getBlockKey(p.x, p.y, p.z);
        if (world.has(k)) {
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
        if (t && world.get(t.k).type !== 'bedrock') { world.delete(t.k); updateInstances(); playSound('break'); }
    } else if (type === 'place') {
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
                    world.set(pk, { type: state.selectedItem }); updateInstances(); playSound('place');
                }
            }
        }
    }
}

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

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now(); const delta = Math.min((time - state.prevTime)/1000, 0.1); state.prevTime = time;

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

        const actionElapsed = time - state.actionTime;
        if (actionElapsed < CONFIG.actionDuration) {
            const pVal = actionElapsed / CONFIG.actionDuration; const sVal = Math.sin(pVal * Math.PI);
            fpItem.position.set(0.4, -0.3 - sVal * 0.2, -0.5 - sVal * 0.3); fpItem.rotation.set(-sVal * 1.2, -Math.PI / 4, 0);
            if(pModel.arms) pModel.arms[1].rotation.x = -sVal * 2;
        } else {
            fpItem.position.set(0.4, -0.3, -0.5); fpItem.rotation.set(0, -Math.PI / 4, 0);
        }

        const isMoving = state.move.f || state.move.b || state.move.l || state.move.r;
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
            e.timer -= delta; if (e.timer <= 0) { e.dir.set(Math.random()-0.5, 0, Math.random()-0.5).normalize(); e.timer = 2 + Math.random()*3; if(Math.random()<0.4) e.dir.set(0,0,0); }
            if (e.dir.lengthSq() > 0.1) {
                const nX = e.g.position.x + e.dir.x * delta * e.speed; const nZ = e.g.position.z + e.dir.z * delta * e.speed;
                const ar = e.isQuad ? 0.4 : 0.2;
                const canEntMove = (anx, anz) => {
                    const pts = [[ar,ar],[-ar,ar],[ar,-ar],[-ar,-ar]];
                    for(let p of pts) {
                        const k1 = getBlockKey(anx + p[0], e.g.position.y + 0.1, anz + p[1]);
                        const k2 = getBlockKey(anx + p[0], e.g.position.y + 1.1, anz + p[1]);
                        if (world.has(k1) && solidTypes.includes(world.get(k1).type)) return false;
                        if (world.has(k2) && solidTypes.includes(world.get(k2).type)) return false;
                    }
                    return true;
                };
                if (canEntMove(nX, nZ)) { e.g.position.x = nX; e.g.position.z = nZ; } else { e.dir.set(0,0,0); }
                e.g.lookAt(e.g.position.x + e.dir.x, e.g.position.y, e.g.position.z + e.dir.z);
                const sLeg = Math.sin(time * 0.01 * e.speed) * 0.5;
                if(e.isQuad) { e.legs[0].rotation.x=sLeg; e.legs[1].rotation.x=-sLeg; e.legs[2].rotation.x=-sLeg; e.legs[3].rotation.x=sLeg; }
                else { e.legs[0].rotation.x=sLeg; e.legs[1].rotation.x=-sLeg; if(e.arms){ e.arms[0].rotation.x=-sLeg; e.arms[1].rotation.x=sLeg; } }
            } else { 
                e.legs.forEach(l => l.rotation.x = 0);
                if(e.arms) e.arms.forEach(a => a.rotation.x = 0);
            }
            const floorK = getBlockKey(e.g.position.x, e.g.position.y - 0.1, e.g.position.z);
            if (!world.has(floorK) || !solidTypes.includes(world.get(floorK).type)) { e.g.position.y -= 10 * delta; if (e.g.position.y < -20) { e.g.position.y = 20; e.g.position.x = player.position.x; e.g.position.z = player.position.z; } } 
            else { e.g.position.y = Math.floor(e.g.position.y - 0.1 + 0.5) + (e.isQuad?0.5:0.8); }
        });
    }
    renderer.render(scene, camera);
}

generateWorld(); renderUI(); animate();
window.onresize = () => { camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
