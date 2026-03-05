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
const ASSET_URL = '/';
const texLoader = new THREE.TextureLoader();
const mobs: { mesh: THREE.Group, type: string, timer: number }[] = [];

function buildAnimalBox(type: 'pig' | 'cow', u: number, v: number, w: number, h: number, d: number) {
    const getM = (ox: number, oy: number, mw: number, mh: number) => {
        const mat = new THREE.MeshLambertMaterial({ transparent: true, alphaTest: 0.5 });
        const img = new Image();
        img.src = ASSET_URL + 'textures/entity/' + type + '/' + type + '.png';
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 32;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            const tex = new THREE.CanvasTexture(canvas);
            tex.magFilter = THREE.NearestFilter;
            tex.repeat.set(mw / 64, mh / 32);
            tex.offset.set(ox / 64, 1 - (oy + mh) / 32);
            mat.map = tex;
            mat.needsUpdate = true;
        }
        return mat;
    };
    return [
        getM(u + d + w, v + d, d, h), // right (left side from front)
        getM(u, v + d, d, h),         // left
        getM(u + d, v, w, d),         // top
        getM(u + d + w, v, w, d),     // bottom
        getM(u + d, v + d, w, h),     // front
        getM(u + d + w + d, v + d, w, h) // back
    ];
}

function spawnMob(type: 'pig' | 'cow', x: number, y: number, z: number) {
    const group = new THREE.Group();

    // Body (28, 8, 10x16x8 mapped horizontally in some versions, but let's approximate)
    const bodyMat = buildAnimalBox(type, 28, 8, 10, 16, 8);
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.6, 1.2);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.6, 0);
    group.add(body);

    // Head (0, 0, 8x8x8)
    const headMat = buildAnimalBox(type, 0, 0, 8, 8, 8);
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 0.9, 0.7);
    group.add(head);

    // Legs
    const legMat = buildAnimalBox(type, 0, 16, 4, 12, 4); // Standard animal leg texture position
    const legGeo = new THREE.BoxGeometry(0.25, 0.4, 0.25);
    [[0.25, 0.4], [-0.25, 0.4], [0.25, -0.4], [-0.25, -0.4]].forEach(p => {
        const l = new THREE.Mesh(legGeo, legMat);
        l.position.set(p[0], 0.2, p[1]);
        group.add(l);
    });

    group.position.set(x, y, z);
    scene.add(group);
    mobs.push({ mesh: group, type, timer: Math.random() * 100 });
}
for (let i = 0; i < 12; i++) {
    const x = (Math.random() - 0.5) * 40 + 8;
    const z = (Math.random() - 0.5) * 40 + 8;
    const noise = terrain.noise;
    const groundY = Math.floor(noise.get(x / noise.gap, z / noise.gap, noise.seed) * noise.amp) + 30;
    spawnMob(Math.random() > 0.5 ? 'pig' : 'cow', x, groundY + 0.5, z);
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
const thunderAudio = new window.Audio(ASSET_URL + 'sounds/ambient/weather/thunder1.ogg');

function setWeather(w: string) {
    weather = w;
    if (w === 'rain' || w === 'thunder') {
        rainSys.visible = true;
        if (rainAudio.paused) rainAudio.play().catch(() => { });
        if (w === 'thunder') thunderAudio.play().catch(() => { });
    } else {
        rainSys.visible = false;
        rainAudio.pause();
    }
}
document.getElementById('weather-clear')?.addEventListener('click', () => setWeather('clear'));
document.getElementById('weather-rain')?.addEventListener('click', () => setWeather('rain'));
document.getElementById('weather-thunder')?.addEventListener('click', () => setWeather('thunder'));

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
        return [getM(u + d + w, v + d, d, h), getM(u, v + d, d, h), getM(u + d, v, w, d), getM(u + d + w, v, w, d), getM(u + d, v + d, w, h), getM(u + d + w + d, v + d, w, h)];
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
for (let i = 0; i < 8; i++) spawnParrot((Math.random() - 0.5) * 40 + 8, 35 + Math.random() * 10, (Math.random() - 0.5) * 40 + 8);

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
        getM(u + d + w, v + d, d, h), // left
        getM(u, v + d, d, h),         // right
        getM(u + d, v, w, d),         // top
        getM(u + d + w, v, w, d),     // bottom
        getM(u + d, v + d, w, h),     // front
        getM(u + d + w + d, v + d, w, h) // back
    ];
}

let playerParts: any = {};
const fpHand = new THREE.Group();
fpHand.position.set(0.4, -0.3, -0.6);
camera.add(fpHand);
const tpHand = new THREE.Group();
tpHand.position.set(0, -0.6, -0.4);

function createPlayerMesh(skinName: string) {
    playerGroup.clear();
    const texUrl = `/skins/${skinName}.png`;

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
    playerGroup.rotation.y = Math.PI;
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
        const typeStr = terrain.materialType[currentHeldBlock];
        if (typeStr !== undefined) {
            const mat = terrain.materials.get(typeStr);
            if (mat) {
                const meshFP = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), mat);
                meshFP.rotation.set(0.3, 0.4, 0.1);
                fpHand.add(meshFP);
                const meshTP = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), mat);
                meshTP.rotation.set(0.3, 0.4, 0.1);
                tpHand.add(meshTP);
            }
        }
    }
    fpHand.visible = !thirdPerson;
    tpHand.visible = thirdPerson;

    // Animate Animals
    mobs.forEach(m => {
        m.timer += 0.01;
        if (m.type === 'parrot') {
            m.mesh.position.y += Math.sin(m.timer) * 0.05;
            m.mesh.position.x += Math.cos(m.timer) * 0.05;
            const wings = m.mesh.children.slice(2);
            wings.forEach(w => w.rotation.z = Math.sin(m.timer * 10) * 0.5);
        } else {
            // Horizontal movement
            m.mesh.rotation.y += Math.cos(m.timer * 0.5) * 0.005;
            m.mesh.position.x += Math.cos(m.timer * 0.5) * 0.01;
            m.mesh.position.z += Math.sin(m.timer * 0.5) * 0.01;

            // Grounding logic
            const nx = m.mesh.position.x;
            const nz = m.mesh.position.z;
            const noise = terrain.noise;
            const groundY = Math.floor(noise.get(nx / noise.gap, nz / noise.gap, noise.seed) * noise.amp) + 30;
            // Set Y to top of block (groundY + 0.5)
            m.mesh.position.y = groundY + 0.5 + Math.sin(m.timer) * 0.005;

            // Sounds
            if (m.type === 'pig' || m.type === 'cow') {
                if (Math.random() < 0.01) { // say sounds
                    control.audio.playMobSound(m.type, 'say');
                }
                if (m.mesh.position.y < 29.5) { // splash in water
                    if (Math.random() < 0.05) control.audio.playSplash();
                } else if (Math.random() < 0.05) { // step sounds
                    control.audio.playMobSound(m.type, 'step');
                }
            }

            // Animate Legs (children 2 to 5)
            if (m.mesh.children.length >= 6) {
                const sCycle = Math.sin(m.timer * 5) * 0.5;
                m.mesh.children[2].rotation.x = sCycle; // Front right
                m.mesh.children[3].rotation.x = -sCycle; // Front left
                m.mesh.children[4].rotation.x = -sCycle; // Back right
                m.mesh.children[5].rotation.x = sCycle; // Back left
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
        if (playerParts.head) playerParts.head.position.y = 0.35; // Lower head
        // Bend legs slightly for sneaking
        if (playerParts.leftLegGroup) playerParts.leftLegGroup.rotation.x = -0.3;
        if (playerParts.rightLegGroup) playerParts.rightLegGroup.rotation.x = -0.3;
    } else {
        if (playerParts.body) playerParts.body.rotation.x = 0;
        if (playerParts.head) playerParts.head.position.y = 0.55; // Default head Y
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

    // Animate Weather
    if (weather !== 'clear') {
        const pArray = rainGeo.attributes.position.array as Float32Array;
        for (let i = 1; i < rainCount * 3; i += 3) {
            pArray[i] -= 1.0;
            if (pArray[i] < -50) pArray[i] = 50;
        }
        rainGeo.attributes.position.needsUpdate = true;
        rainSys.position.copy(camera.position);
    }

    if (weather === 'thunder' && Math.random() < 0.01) {
        scene.background = new THREE.Color(0xffffff);
        scene.fog = new THREE.Fog(0xffffff, 1, 96);
        setTimeout(() => {
            scene.background = new THREE.Color(0x333333);
            scene.fog = new THREE.Fog(0x333333, 1, 96);
        }, 100);
    } else if (weather !== 'clear') {
        scene.background = new THREE.Color(0x333333);
        scene.fog = new THREE.Fog(0x333333, 1, 96);
    } else {
        scene.background = new THREE.Color(0x87ceeb);
        scene.fog = new THREE.Fog(0x87ceeb, 1, 96);
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
