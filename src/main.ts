import * as THREE from 'three'
import Core from './core'
import Control from './control'
import Player from './player'
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
;(window as any).multiplayer = multiplayer;

// Animals
const ASSET_URL = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.2/assets/minecraft/';
const texLoader = new THREE.TextureLoader();
const extTex = (path: string) => {
    const t = texLoader.load(ASSET_URL + 'textures/' + path);
    t.magFilter = THREE.NearestFilter;
    return t;
};
const entitySkins = {
    pig: extTex('entity/pig/pig.png'),
    cow: extTex('entity/cow/cow.png')
};
const mobs: { mesh: THREE.Mesh, type: string, timer: number }[] = [];
function spawnMob(type: 'pig' | 'cow', x: number, y: number, z: number) {
    const isQuad = (type === 'pig' || type === 'cow');
    const mat = new THREE.MeshLambertMaterial({ map: entitySkins[type], transparent: true, alphaTest: 0.5 });
    const geo = new THREE.BoxGeometry(isQuad?1:0.6, isQuad?0.8:1.8, isQuad?1.5:0.6);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    scene.add(m);
    mobs.push({ mesh: m, type, timer: Math.random()*100 });
}
for(let i=0; i<12; i++) spawnMob(Math.random()>0.5 ? 'pig' : 'cow', (Math.random()-0.5)*40 + 8, 30, (Math.random()-0.5)*40 + 8);

// Weather
let weather = 'clear';
const rainGeo = new THREE.BufferGeometry();
const rainCount = 1500;
const rainPos = new Float32Array(rainCount * 3);
for(let i=0;i<rainCount*3;i++) {
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
    if(w === 'rain' || w === 'thunder') {
        rainSys.visible = true;
        if(rainAudio.paused) rainAudio.play().catch(()=>{});
        if(w === 'thunder') thunderAudio.play().catch(()=>{});
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
if(myWorldId && copyIdBtn) {
    setInterval(() => {
        if(multiplayer.peer?.id) myWorldId.value = multiplayer.peer.id;
    }, 1000);
    copyIdBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(myWorldId.value);
        copyIdBtn.innerHTML = 'Copied!';
        setTimeout(() => copyIdBtn.innerHTML = 'Copy', 2000);
    });
}

// Animation
;(function animate() {
  requestAnimationFrame(animate)

  control.update()
  terrain.update()
  ui.update()
  multiplayer.update()

  // Animate Animals
  mobs.forEach(m => {
      m.timer += 0.01;
      m.mesh.position.y += Math.sin(m.timer)*0.005;
      m.mesh.rotation.y += Math.cos(m.timer*0.5)*0.005;
  });

  // Animate Weather
  if(weather !== 'clear') {
      const pArray = rainGeo.attributes.position.array as Float32Array;
      for(let i=1; i<rainCount*3; i+=3) {
          pArray[i] -= 1.0;
          if(pArray[i] < -50) pArray[i] = 50;
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

  renderer.render(scene, camera)
})()
