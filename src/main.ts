import * as THREE from 'three'
import Core from './core'
import Control from './control'
import Player, { Mode } from './player'
import Terrain from './terrain'
import UI from './ui'
import Audio from './audio'
import Multiplayer from './multiplayer'

import './style.css'

const core = new Core()
const camera = core.camera
const scene = core.scene
const renderer = core.renderer

const player = new Player()
const audio = new Audio(camera)

const terrain = new Terrain(scene, camera)
const control = new Control(scene, camera, player, terrain, audio)

const ui = new UI(terrain, control)
const multiplayer = new Multiplayer(scene, terrain, player, control)
    ; (window as any).multiplayer = multiplayer;

// Animals
const ASSET_URL = './';
const texLoader = new THREE.TextureLoader();
const mobs: { mesh: THREE.Group, type: string, timer: number }[] = [];

function buildMobBox(type: string, u: number, v: number, w: number, h: number, d: number) {
    const getM = (ox: number, oy: number, mw: number, mh: number) => {
        const mat = new THREE.MeshLambertMaterial({ transparent: true, alphaTest: 0.5 });
        const img = new Image();
        let path = ASSET_URL + 'textures/entity/' + type + '/' + type + '.png';
        if (type === 'chicken') path = ASSET_URL + 'textures/entity/chicken.png';
        if (type === 'creeper') path = ASSET_URL + 'textures/entity/creeper/creeper.png';
        if (type === 'skeleton') path = ASSET_URL + 'textures/entity/skeleton/skeleton.png';
        
        img.src = path;
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64; // Using 64x64 for all to be safe
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            const tex = new THREE.CanvasTexture(canvas);
            tex.magFilter = THREE.NearestFilter;
            tex.repeat.set(mw / 64, mh / 64);
            tex.offset.set(ox / 64, 1 - (oy + mh) / 64);
            mat.map = tex;
            mat.needsUpdate = true;
        }
        return mat;
    };
    return [
        getM(u + d + w, v + d, d, h), // right (+x)
        getM(u, v + d, d, h),         // left (-x)
        getM(u + d, v, w, d),         // top (+y)
        getM(u + d + w, v, w, d),     // bottom (-y)
        getM(u + d, v + d, w, h),     // front (+z)
        getM(u + d + w + d, v + d, w, h) // back (-z)
    ];
}

function spawnMob(type: string, x: number, y: number, z: number) {
    const group = new THREE.Group();

    if (type === 'chicken') {
        // Chicken Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.6), buildMobBox('chicken', 0, 9, 6, 6, 8));
        body.position.set(0, 0.4, 0); group.add(body);
        // Chicken Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), buildMobBox('chicken', 0, 0, 4, 6, 3));
        head.position.set(0, 0.7, 0.3); group.add(head);
        // Beak (14, 0, 4x2x2)
        const beakMat = buildMobBox('chicken', 14, 0, 4, 2, 2);
        const beak = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.1), beakMat);
        beak.position.set(0, 0.65, 0.45); group.add(beak);
        // Legs (40, 0, 3x3x3)
        const legMat = buildMobBox('chicken', 40, 0, 3, 3, 3);
        const legGeo = new THREE.BoxGeometry(0.1, 0.3, 0.1);
        [[-0.1, 0], [0.1, 0]].forEach(p => {
            const l = new THREE.Mesh(legGeo, legMat);
            l.position.set(p[0], 0.15, p[1]);
            group.add(l);
        });
    } else if (type === 'creeper') {
        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), buildMobBox('creeper', 0, 0, 8, 8, 8));
        head.position.set(0, 1.15, 0); group.add(head);
        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.25), buildMobBox('creeper', 16, 16, 8, 12, 4));
        body.position.set(0, 0.525, 0); group.add(body);
        // Feet
        const footMat = buildMobBox('creeper', 0, 16, 4, 6, 4);
        const footGeo = new THREE.BoxGeometry(0.25, 0.375, 0.25);
        [[0.125, 0.125], [-0.125, 0.125], [0.125, -0.375], [-0.125, -0.375]].forEach(p => {
            const f = new THREE.Mesh(footGeo, footMat);
            f.position.set(p[0], 0.1875, p[1]);
            group.add(f);
        });
    } else if (type === 'skeleton') {
        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), buildMobBox('skeleton', 0, 0, 8, 8, 8));
        head.position.set(0, 1.4, 0); group.add(head);
        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.3), buildMobBox('skeleton', 16, 16, 8, 12, 4));
        body.position.set(0, 0.775, 0); group.add(body);
        // Arms
        const armMat = buildMobBox('skeleton', 40, 16, 4, 12, 4);
        const armGeo = new THREE.BoxGeometry(0.15, 0.75, 0.15);
        [[-0.325, 0.775], [0.325, 0.775]].forEach(p => {
            const a = new THREE.Mesh(armGeo, armMat);
            a.position.set(p[0], p[1], 0);
            group.add(a);
        });
        // Legs
        const legMat = buildMobBox('skeleton', 0, 16, 4, 12, 4);
        const legGeo = new THREE.BoxGeometry(0.15, 0.75, 0.15);
        [[-0.175, 0.375], [0.175, 0.375]].forEach(p => {
            const l = new THREE.Mesh(legGeo, legMat);
            l.position.set(p[0], p[1], 0);
            group.add(l);
        });
    } else {
        // Body (pig, cow)
        const bodyMat = buildMobBox(type, 28, 8, 10, 16, 8);
        const bodyGeo = new THREE.BoxGeometry(0.8, 0.6, 1.2);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 0.6, 0); group.add(body);

        // Head
        const headMat = buildMobBox(type, 0, 0, 8, 8, 8);
        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, 0.9, 0.7); group.add(head);

        // Snout
        if (type === 'pig') {
            const snoutMat = buildMobBox('pig', 16, 16, 4, 3, 1);
            const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.1), snoutMat);
            snout.position.set(0, 0.85, 0.95); group.add(snout);
        } else if (type === 'cow') {
            const snoutMat = buildMobBox('cow', 0, 4, 8, 8, 8);
            const snout = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), snoutMat);
            snout.position.set(0, 0.8, 0.95); group.add(snout);
        }

        // Legs
        const legMat = buildMobBox(type, 0, 16, 4, 12, 4);
        const legGeo = new THREE.BoxGeometry(0.25, 0.4, 0.25);
        [[0.25, 0.4], [-0.25, 0.4], [0.25, -0.4], [-0.25, -0.4]].forEach(p => {
            const l = new THREE.Mesh(legGeo, legMat);
            l.position.set(p[0], 0.2, p[1]);
            group.add(l);
        });
    }

    group.position.set(x, y, z);
    scene.add(group);
    mobs.push({ mesh: group, type, timer: Math.random() * 100 });
}
for (let i = 0; i < 30; i++) {
    let x, z, groundY;
    const noise = terrain.noise;
    let attempts = 0;
    do {
        x = (Math.random() - 0.5) * 200 + 8;
        z = (Math.random() - 0.5) * 200 + 8;
        groundY = Math.floor(noise.get(x / noise.gap, z / noise.gap, noise.seed) * noise.amp) + 30;
        attempts++;
    } while (groundY < 30 && attempts < 100);

    const rand = Math.random();
    let type = 'pig';
    if (rand < 0.2) type = 'pig';
    else if (rand < 0.4) type = 'cow';
    else if (rand < 0.6) type = 'chicken';
    else if (rand < 0.8) type = 'creeper';
    else type = 'skeleton';
    spawnMob(type, x, groundY + 0.5, z);
}

// Weather
let weather = 'clear';
const rainGeo = new THREE.BufferGeometry();
const rainCount = 1500;
const rainPos = new Float32Array(rainCount * 3);
for (let i = 0; i < rainCount * 3; i++) {
    rainPos[i] = (Math.random() - 0.5) * 100;
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainMat = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.1,
    transparent: true
});
const rainSys = new THREE.Points(rainGeo, rainMat);
scene.add(rainSys);
rainSys.visible = false;

const rainAudio = new window.Audio(ASSET_URL + 'sounds/ambient/weather/rain1.ogg');
rainAudio.loop = true;
rainAudio.volume = 0.4;
(window as any).rainAudio = rainAudio;

const thunderAudio = new window.Audio(ASSET_URL + 'sounds/ambient/weather/thunder1.ogg');
(window as any).thunderAudio = thunderAudio;

function setWeather(w: string) {
    weather = w;
    if (w === 'rain' || w === 'thunder') {
        rainSys.visible = true;
        if (rainAudio.paused) rainAudio.play().catch(() => { });
    } else {
        rainSys.visible = false;
        rainAudio.pause();
    }
}
document.getElementById('weather-clear')?.addEventListener('click', () => setWeather('clear'));
document.getElementById('weather-rain')?.addEventListener('click', () => setWeather('rain'));
document.getElementById('weather-thunder')?.addEventListener('click', () => setWeather('thunder'));

// Time
let timeMode = 'day';
const celestialGroup = new THREE.Group();
scene.add(celestialGroup);

// Sun
const sunTex = texLoader.load('./textures/environment/sun.png');
sunTex.magFilter = THREE.NearestFilter;
const sunMat = new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, side: THREE.DoubleSide });
const sunMesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), sunMat);
sunMesh.position.set(0, 200, 0); // Far away
sunMesh.rotation.x = Math.PI / 2;
celestialGroup.add(sunMesh);

// Moon
const moonTex = texLoader.load('./textures/environment/moon_phases.png');
moonTex.magFilter = THREE.NearestFilter;
moonTex.repeat.set(1/4, 1/2); // Just show one phase for now
const moonMat = new THREE.MeshBasicMaterial({ map: moonTex, transparent: true, side: THREE.DoubleSide });
const moonMesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), moonMat);
moonMesh.position.set(0, -200, 0); // Opposite of sun
moonMesh.rotation.x = -Math.PI / 2;
celestialGroup.add(moonMesh);

// Stars
const starsGeo = new THREE.BufferGeometry();
const starsCount = 2000;
const starsPos = new Float32Array(starsCount * 3);
for (let i = 0; i < starsCount; i++) {
    const r = 400;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starsPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starsPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starsPos[i * 3 + 2] = r * Math.cos(phi);
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0 });
const starsSys = new THREE.Points(starsGeo, starsMat);
scene.add(starsSys);

function setTime(t: string) {
    timeMode = t;
}
(window as any).setTime = setTime;
document.getElementById('time-day')?.addEventListener('click', () => setTime('day'));
document.getElementById('time-night')?.addEventListener('click', () => setTime('night'));

// Multiplayer ID Copy
const myWorldId = document.getElementById('my-world-id') as HTMLInputElement;
const copyIdBtn = document.getElementById('copy-id');
if (myWorldId && copyIdBtn) {
    setInterval(() => {
        if (multiplayer.peer?.id) myWorldId.value = multiplayer.peer.id;
    }, 1000);
    copyIdBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(myWorldId.value);
        copyIdBtn.innerHTML = 'Copied!';
        setTimeout(() => copyIdBtn.innerHTML = 'Copy', 2000);
    });
}

// Parrots
function spawnParrot(x: number, y: number, z: number) {
    const group = new THREE.Group();
    const parrotTexUrl = ASSET_URL + 'textures/entity/parrot/parrot_red_blue.png';
    const buildParrotBox = (u: number, v: number, w: number, h: number, d: number) => {
        const getM = (ox: number, oy: number, mw: number, mh: number) => {
            const t = texLoader.load(parrotTexUrl);
            t.magFilter = THREE.NearestFilter;
            t.repeat.set(mw / 32, mh / 32); t.offset.set(ox / 32, 1 - (oy + mh) / 32);
            return new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.5 });
        };
        return [
            getM(u + d + w, v + d, d, h), // right (+x)
            getM(u, v + d, d, h),         // left (-x)
            getM(u + d, v, w, d),         // top (+y)
            getM(u + d + w, v, w, d),     // bottom (-y)
            getM(u + d, v + d, w, h),     // front (+z)
            getM(u + d + w + d, v + d, w, h) // back (-z)
        ];
    };

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), buildParrotBox(2, 2, 2, 3, 2));
    head.position.set(0, 0.4, 0); group.add(head);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), buildParrotBox(2, 8, 3, 4, 3));
    body.position.set(0, 0, 0); group.add(body);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.3), buildParrotBox(19, 8, 1, 4, 3));
    wingL.position.set(0.2, 0, 0); group.add(wingL);
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.3), buildParrotBox(19, 8, 1, 4, 3));
    wingR.position.set(-0.2, 0, 0); group.add(wingR);

    group.position.set(x, y, z);
    scene.add(group);
    mobs.push({ mesh: group, type: 'parrot', timer: Math.random() * 100 });
}
for (let i = 0; i < 4; i++) spawnParrot((Math.random() - 0.5) * 40 + 8, 35 + Math.random() * 10, (Math.random() - 0.5) * 40 + 8);

// Player Skin & 3rd Person
const playerGroup = new THREE.Group();
let currentSkin = localStorage.getItem('skin') || 'steve';
let thirdPerson = false;

function buildSkinBox(texUrl: string, u: number, v: number, w: number, h: number, d: number) {
    const getM = (ox: number, oy: number, mw: number, mh: number) => {
        const mat = new THREE.MeshLambertMaterial({ transparent: true, alphaTest: 0.5 });

        const img = new Image();
        img.src = texUrl;
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            // If it's a 64x32 legacy skin, copy the left arm/leg to the right side if they are empty
            if (img.height === 32) {
                // Copy right leg to left leg
                ctx.scale(-1, 1);
                ctx.drawImage(canvas, -16, 20, 4, 12, -24, 52, 4, 12); // Leg Front
                ctx.drawImage(canvas, -8, 20, 4, 12, -28, 52, 4, 12);  // Leg Back
                ctx.drawImage(canvas, -12, 20, 4, 12, -20, 52, 4, 12); // Leg Right
                ctx.drawImage(canvas, -4, 20, 4, 12, -16, 52, 4, 12);  // Leg Left
                ctx.drawImage(canvas, -12, 16, 4, 4, -24, 48, 4, 4);   // Leg Top
                ctx.drawImage(canvas, -16, 16, 4, 4, -28, 48, 4, 4);   // Leg Bottom

                // Copy right arm to left arm
                ctx.drawImage(canvas, -44, 20, 4, 12, -40, 52, 4, 12); // Arm Front
                ctx.drawImage(canvas, -52, 20, 4, 12, -32, 52, 4, 12); // Arm Back
                ctx.drawImage(canvas, -48, 20, 4, 12, -36, 52, 4, 12); // Arm Right
                ctx.drawImage(canvas, -40, 20, 4, 12, -44, 52, 4, 12); // Arm Left
                ctx.drawImage(canvas, -48, 16, 4, 4, -40, 48, 4, 4);   // Arm Top
                ctx.drawImage(canvas, -52, 16, 4, 4, -44, 48, 4, 4);   // Arm Bottom
                ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
            }

            const tex = new THREE.CanvasTexture(canvas);
            tex.magFilter = THREE.NearestFilter;
            tex.repeat.set(mw / 64, mh / 64);
            tex.offset.set(ox / 64, 1 - (oy + mh) / 64);
            mat.map = tex;
            mat.needsUpdate = true;
        };

        return mat;
    };
    return [
        getM(u + d + w, v + d, d, h), // right (+x)
        getM(u, v + d, d, h),         // left (-x)
        getM(u + d, v, w, d),         // top (+y)
        getM(u + d + w, v, w, d),     // bottom (-y)
        getM(u + d, v + d, w, h),     // front (+z)
        getM(u + d + w + d, v + d, w, h) // back (-z)
    ];
}

let playerParts: any = {};
const fpHand = new THREE.Group();
fpHand.position.set(0.4, -0.4, -0.6); 
camera.add(fpHand);
const tpHand = new THREE.Group();
tpHand.position.set(0, -0.6, -0.4);

function createPlayerMesh(skinName: string) {
    playerGroup.clear();
    const texUrl = `./skins/${skinName}.png`;

    const headMat = buildSkinBox(texUrl, 0, 0, 8, 8, 8);
    playerParts.head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMat);
    playerParts.head.position.set(0, 1.4, 0);
    playerGroup.add(playerParts.head);

    const bodyMat = buildSkinBox(texUrl, 16, 16, 8, 12, 4);
    playerParts.body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.3), bodyMat);
    playerParts.body.position.set(0, 0.8, 0);
    playerGroup.add(playerParts.body);

    const armMat = buildSkinBox(texUrl, 40, 16, 4, 12, 4);
    playerParts.leftArmGroup = new THREE.Group();
    playerParts.leftArmGroup.position.set(0.35, 1.2, 0);
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), armMat);
    leftArm.position.y = -0.4;
    playerParts.leftArmGroup.add(leftArm);
    playerGroup.add(playerParts.leftArmGroup);

    playerParts.rightArmGroup = new THREE.Group();
    playerParts.rightArmGroup.position.set(-0.35, 1.2, 0);
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), armMat);
    rightArm.position.y = -0.4;
    playerParts.rightArmGroup.add(rightArm);

    // Add tpHand to the right arm group
    if (tpHand.parent) tpHand.parent.remove(tpHand);
    playerParts.rightArmGroup.add(tpHand);

    playerGroup.add(playerParts.rightArmGroup);

    const legMat = buildSkinBox(texUrl, 0, 16, 4, 12, 4);
    playerParts.leftLegGroup = new THREE.Group();
    playerParts.leftLegGroup.position.set(0.15, 0.4, 0);
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.25), legMat);
    leftLeg.position.y = -0.2;
    playerParts.leftLegGroup.add(leftLeg);
    playerGroup.add(playerParts.leftLegGroup);

    playerParts.rightLegGroup = new THREE.Group();
    playerParts.rightLegGroup.position.set(-0.15, 0.4, 0);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.25), legMat);
    rightLeg.position.y = -0.2;
    playerParts.rightLegGroup.add(rightLeg);
    playerGroup.add(playerParts.rightLegGroup);

    playerGroup.position.y = -1.5;
}
createPlayerMesh(currentSkin);
scene.add(playerGroup);

document.querySelectorAll('.skin-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const skin = target.getAttribute('data-skin');
        if (skin) {
            currentSkin = skin;
            localStorage.setItem('skin', skin);
            createPlayerMesh(skin);
            target.innerHTML = 'Selected';
            setTimeout(() => target.innerHTML = skin.charAt(0).toUpperCase() + skin.slice(1), 1000);
        }
    });
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyV') {
        thirdPerson = !thirdPerson;
    }
});

import diamond_pickaxe_url from './static/textures/item/diamond_pickaxe.png'
import diamond_shovel_url from './static/textures/item/diamond_shovel.png'
import diamond_sword_url from './static/textures/item/diamond_sword.png'

const itemTextures: Record<number, string> = {
    100: diamond_pickaxe_url,
    101: diamond_shovel_url,
    102: diamond_sword_url
};

let currentHeldBlock = -1;

// Animation
; (function animate() {
    requestAnimationFrame(animate)

    control.update()
    terrain.update()
    ui.update()
    multiplayer.update()

    if (currentHeldBlock !== control.holdingBlock) {
        currentHeldBlock = control.holdingBlock;
        fpHand.clear();
        tpHand.clear();

        if (currentHeldBlock >= 100) {
            // Render Tool
            const tex = texLoader.load(itemTextures[currentHeldBlock]);
            tex.magFilter = THREE.NearestFilter;
            const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
            const geo = new THREE.PlaneGeometry(0.8, 0.8);
            
            const meshFP = new THREE.Mesh(geo, mat);
            meshFP.rotation.set(0, -Math.PI / 2, Math.PI / 4);
            meshFP.position.set(0.1, 0.2, 0);
            fpHand.add(meshFP);

            const meshTP = new THREE.Mesh(geo, mat);
            meshTP.rotation.set(0, Math.PI / 4, 0);
            meshTP.position.set(0, 0.1, 0);
            tpHand.add(meshTP);
        } else {
            // Render Block
            const typeStr = terrain.materialType[currentHeldBlock];
            if (typeStr !== undefined) {
                const mat = terrain.materials.get(typeStr);
                if (mat) {
                    const meshFP = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), mat);
                    meshFP.rotation.set(0.3, 0.4, 0.1);
                    meshFP.position.set(0.1, 0, 0);
                    fpHand.add(meshFP);
                    const meshTP = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), mat);
                    meshTP.rotation.set(0.3, 0.4, 0.1);
                    tpHand.add(meshTP);
                }
            }
        }
    }
    fpHand.visible = !thirdPerson;
    tpHand.visible = thirdPerson;

    // Animate Animals
    mobs.forEach((m, idx) => {
        m.timer += 0.01;
        if (m.type === 'parrot') {
            m.mesh.position.y += Math.sin(m.timer) * 0.05;
            m.mesh.position.x += Math.cos(m.timer) * 0.05;
            const wings = m.mesh.children.slice(2);
            wings.forEach(w => w.rotation.z = Math.sin(m.timer * 10) * 0.5);
        } else {
            // Horizontal movement
            const oldX = m.mesh.position.x;
            const oldZ = m.mesh.position.z;

            m.mesh.rotation.y += Math.cos(m.timer * 0.5) * 0.005;
            m.mesh.position.x += Math.cos(m.timer * 0.5) * 0.01;
            m.mesh.position.z += Math.sin(m.timer * 0.5) * 0.01;

            // Grounding logic
            const nx = m.mesh.position.x;
            const nz = m.mesh.position.z;
            const noise = terrain.noise;
            const groundY = Math.floor(noise.get(nx / noise.gap, nz / noise.gap, noise.seed) * noise.amp) + 30;
            
            // Prevent entering water
            if (groundY < 30) {
                m.mesh.position.x = oldX;
                m.mesh.position.z = oldZ;
                m.timer += Math.PI; // Change direction
                return;
            }

            // Jumping in water? No, animals stay on land now.
            let yBase = groundY + 0.5;
            yBase += Math.sin(m.timer) * 0.005;
            m.mesh.position.y = yBase;

            // Sounds
            if (m.type === 'pig' || m.type === 'cow' || m.type === 'chicken') {
                if (Math.random() < 0.0005) { // say sounds (approx every 30s at 60fps)
                    if (m.type !== 'chicken') {
                        control.audio.playMobSound(m.type as any, 'say');
                    }
                }
                if (m.mesh.position.y < 29.5) { // splash in water
                    if (Math.random() < 0.005) control.audio.playSplash(); // reduced
                } else if (Math.random() < 0.001) { // step sounds (reduced)
                    if (m.type !== 'chicken') {
                        control.audio.playMobSound(m.type as any, 'step');
                    }
                }
            }

            // Animate Legs/Arms
            const sCycle = Math.sin(m.timer * 5) * 0.5;
            if (m.type === 'pig' || m.type === 'cow') {
                if (m.mesh.children.length >= 7) {
                    m.mesh.children[3].rotation.x = sCycle; // Front right
                    m.mesh.children[4].rotation.x = -sCycle; // Front left
                    m.mesh.children[5].rotation.x = -sCycle; // Back right
                    m.mesh.children[6].rotation.x = sCycle; // Back left
                }
            } else if (m.type === 'chicken') {
                if (m.mesh.children.length >= 5) {
                    m.mesh.children[3].rotation.x = sCycle;
                    m.mesh.children[4].rotation.x = -sCycle;
                }
            } else if (m.type === 'creeper') {
                if (m.mesh.children.length >= 6) {
                    m.mesh.children[2].rotation.x = sCycle;
                    m.mesh.children[3].rotation.x = -sCycle;
                    m.mesh.children[4].rotation.x = -sCycle;
                    m.mesh.children[5].rotation.x = sCycle;
                }
            } else if (m.type === 'skeleton') {
                if (m.mesh.children.length >= 6) {
                    m.mesh.children[2].rotation.x = -sCycle; // Arm L
                    m.mesh.children[3].rotation.x = sCycle;  // Arm R
                    m.mesh.children[4].rotation.x = sCycle;  // Leg L
                    m.mesh.children[5].rotation.x = -sCycle; // Leg R
                }
            }
        }
    });

    // Player Mesh Update
    playerGroup.position.copy(camera.position);
    playerGroup.position.y -= 1.5;
    playerGroup.rotation.y = camera.rotation.y; // Face same direction as camera
    if (playerParts.head) playerParts.head.rotation.x = -camera.rotation.x; // Head follows pitch

    // Sneaking animation
    const isSneaking = control.player.mode === Mode.sneaking;
    if (isSneaking) {
        playerGroup.position.y -= 0.15; // Lower overall group
        if (playerParts.body) playerParts.body.rotation.x = 0.3; // Tilt body forward
        if (playerParts.head) {
            playerParts.head.position.y = 1.25; // Adjusted (was 0.35)
            playerParts.head.position.z = 0.1;  // Forward lean
        }
        // Bend legs slightly for sneaking
        if (playerParts.leftLegGroup) playerParts.leftLegGroup.rotation.x = -0.3;
        if (playerParts.rightLegGroup) playerParts.rightLegGroup.rotation.x = -0.3;
    } else {
        if (playerParts.body) playerParts.body.rotation.x = 0;
        if (playerParts.head) {
            playerParts.head.position.y = 1.4; // Adjusted (was 0.55)
            playerParts.head.position.z = 0;
        }
    }

    if (control.velocity.x !== 0 || control.velocity.z !== 0) {
        const sCycle = Math.sin(performance.now() * 0.015) * 0.8;
        if (!isSneaking) {
            if (playerParts.leftLegGroup) playerParts.leftLegGroup.rotation.x = sCycle;
            if (playerParts.rightLegGroup) playerParts.rightLegGroup.rotation.x = -sCycle;
        } else {
            // Slower, smaller leg movement when sneaking
            const sneakCycle = Math.sin(performance.now() * 0.01) * 0.3;
            if (playerParts.leftLegGroup) playerParts.leftLegGroup.rotation.x = -0.3 + sneakCycle;
            if (playerParts.rightLegGroup) playerParts.rightLegGroup.rotation.x = -0.3 - sneakCycle;
        }
        if (playerParts.leftArmGroup) playerParts.leftArmGroup.rotation.x = -sCycle;
        if (playerParts.rightArmGroup) playerParts.rightArmGroup.rotation.x = sCycle;
    } else if (!isSneaking) {
        if (playerParts.leftLegGroup) playerParts.leftLegGroup.rotation.x = 0;
        if (playerParts.rightLegGroup) playerParts.rightLegGroup.rotation.x = 0;
        if (playerParts.leftArmGroup) playerParts.leftArmGroup.rotation.x = 0;
        if (playerParts.rightArmGroup) playerParts.rightArmGroup.rotation.x = 0;
    }

    playerGroup.visible = thirdPerson;

    // Animate Weather & Time
    if (weather !== 'clear') {
        const pArray = rainGeo.attributes.position.array as Float32Array;
        for (let i = 1; i < rainCount * 3; i += 3) {
            pArray[i] -= 1.0;
            if (pArray[i] < -50) pArray[i] = 50;
        }
        rainGeo.attributes.position.needsUpdate = true;
        rainSys.position.copy(camera.position);
    }

    // Celestial Animation
    celestialGroup.position.copy(camera.position);
    starsSys.position.copy(camera.position);

    let targetRotation = 0; // Day
    let targetStarOpacity = 0;
    if (timeMode === 'night') {
        targetRotation = Math.PI; // Night
        targetStarOpacity = 1.0;
    }

    // Rotate celestial group smoothly
    let currentRot = celestialGroup.rotation.x;
    celestialGroup.rotation.x += (targetRotation - currentRot) * 0.02;
    
    // Smoothly fade stars
    starsMat.opacity += (targetStarOpacity - starsMat.opacity) * 0.02;

    // Look at player logic for sun/moon to keep them facing camera correctly
    sunMesh.lookAt(camera.position);
    moonMesh.lookAt(camera.position);

    // Target colors, intensities and fog distance
    let targetBg = new THREE.Color(0x87ceeb);
    let targetSun = 1.0;
    let targetFill = 0.4;
    let targetReflect = 0.4;
    let targetFogFar = 250; // Clear Day

    if (timeMode === 'night') {
        targetBg = new THREE.Color(0x050510);
        targetSun = 0.05;
        targetFill = 0.1;
        targetReflect = 0.1;
        targetFogFar = 400; // Clear Night (to see stars)
    }

    if (weather === 'rain') {
        targetBg.lerp(new THREE.Color(0x333333), 0.5);
        targetSun *= 0.5;
        targetFill *= 0.8;
        targetFogFar = 120;
    } else if (weather === 'thunder') {
        targetBg.lerp(new THREE.Color(0x222222), 0.7);
        targetSun *= 0.3;
        targetFill *= 0.6;
        targetFogFar = 80;
    }

    // Smoothly transition colors
    const currentBg = (scene.background as THREE.Color);
    currentBg.lerp(targetBg, 0.02);
    const currentFog = (scene.fog as THREE.Fog);
    currentFog.color.copy(currentBg);
    currentFog.far += (targetFogFar - currentFog.far) * 0.02;
    
    // Smoothly transition light intensities
    core.sunLight.intensity += (targetSun - core.sunLight.intensity) * 0.02;
    core.fillLight.intensity += (targetFill - core.fillLight.intensity) * 0.02;
    core.reflectionLight.intensity += (targetReflect - core.reflectionLight.intensity) * 0.02;

    if (weather === 'thunder' && Math.random() < 0.002) {
        scene.background = new THREE.Color(0xffffff);
        scene.fog = new THREE.Fog(0xffffff, 1, 200);
        
        // Play thunder sound with flash
        thunderAudio.currentTime = 0;
        thunderAudio.play().catch(()=>{});

        setTimeout(() => {
            scene.background = currentBg;
            scene.fog = new THREE.Fog(currentBg, 1, targetFogFar);
        }, 100);
    }

    if (thirdPerson) {
        const backward = new THREE.Vector3(0, 0, 4).applyQuaternion(camera.quaternion);
        camera.position.add(backward);
        renderer.render(scene, camera);
        camera.position.sub(backward);
    } else {
        renderer.render(scene, camera);
    }
})()
