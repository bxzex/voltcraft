import FPS from './fps'
import Bag from './bag'
import Terrain from '../terrain'
import Block from '../terrain/mesh/block'
import Control from '../control'
import { Mode } from '../player'
import Joystick from './joystick'
import { isMobile } from '../utils'
import * as THREE from 'three'

export default class UI {
  constructor(terrain: Terrain, control: Control) {
    this.fps = new FPS()
    this.bag = new Bag(control)
    this.joystick = new Joystick(control)

    this.crossHair.className = 'cross-hair'
    this.crossHair.innerHTML = '+'
    document.body.appendChild(this.crossHair)

    // play
    this.play?.addEventListener('click', () => {
      const isStart = this.menu?.classList.contains('start')
      if (isStart && (this.play?.innerHTML === 'Singleplayer' || this.play?.innerHTML === 'Play')) {
        this.onPlay()

        // reset game
        terrain.noise.seed = Math.random()
        terrain.noise.stoneSeed = Math.random()
        terrain.noise.treeSeed = Math.random()
        terrain.noise.coalSeed = Math.random()
        terrain.noise.leafSeed = Math.random()
        terrain.customBlocks = []
        terrain.initBlocks()
        terrain.generate()
        terrain.camera.position.y = 40
        control.player.setMode(Mode.walking)
      } else {
        this.onPlay()
      }
      !isMobile && control.control.lock()
    })

    // save load
    this.save?.addEventListener('click', () => {
      if (this.save?.innerHTML === 'Save and Exit') {
        // save game
        window.localStorage.setItem(
          'block',
          JSON.stringify(terrain.customBlocks)
        )
        window.localStorage.setItem('seed', JSON.stringify(terrain.noise.seed))

        window.localStorage.setItem(
          'position',
          JSON.stringify({
            x: terrain.camera.position.x,
            y: terrain.camera.position.y,
            z: terrain.camera.position.z
          })
        )

        // ui update
        this.onExit()
        this.onSave()
      } else {
        // load game
        terrain.noise.seed =
          Number(window.localStorage.getItem('seed')) ?? Math.random()

        const customBlocks =
          (JSON.parse(
            window.localStorage.getItem('block') || 'null'
          ) as Block[]) ?? []

        terrain.customBlocks = customBlocks
        terrain.initBlocks()
        terrain.generate()

        const position =
          (JSON.parse(window.localStorage.getItem('position') || 'null') as {
            x: number
            y: number
            z: number
          }) ?? null

        position && (terrain.camera.position.x = position.x)
        position && (terrain.camera.position.y = position.y)
        position && (terrain.camera.position.z = position.z)

        // ui update
        this.onPlay()
        this.onLoad()
        !isMobile && control.control.lock()
      }
    })

    // guide
    this.feature?.addEventListener('click', () => {
      this.features?.classList.remove('hidden')
    })
    this.back?.addEventListener('click', () => {
      this.features?.classList.add('hidden')
    })

    // setting
    this.setting?.addEventListener('click', () => {
      this.settings?.classList.remove('hidden')
    })
    this.settingBack?.addEventListener('click', () => {
      this.settings?.classList.add('hidden')
    })

    // render distance
    this.distanceInput?.addEventListener('input', (e: Event) => {
      if (this.distance && e.target instanceof HTMLInputElement) {
        this.distance.innerHTML = `Render Distance: ${e.target.value}`
      }
    })

    // fov
    this.fovInput?.addEventListener('input', (e: Event) => {
      if (this.fov && e.target instanceof HTMLInputElement) {
        this.fov.innerHTML = `Field of View: ${e.target.value}`
        control.camera.fov = parseInt(e.target.value)
        control.camera.updateProjectionMatrix()
      }
    })

    // music volume
    this.musicInput?.addEventListener('input', (e: Event) => {
      if (this.music && e.target instanceof HTMLInputElement) {
        const val = parseInt(e.target.value)
        control.audio.setMusicVolume(val / 100)
        this.music.innerHTML = `Music Volume: ${val}%`
        // Also sync weather rain audio volume if it exists globally
        if ((window as any).rainAudio) {
          (window as any).rainAudio.volume = (val / 100) * 0.4;
        }
      }
    })

    // sound volume
    this.soundInput?.addEventListener('input', (e: Event) => {
      if (this.sound && e.target instanceof HTMLInputElement) {
        const val = parseInt(e.target.value)
        control.audio.setSoundVolume(val / 100)
        this.sound.innerHTML = `Sound Volume: ${val}%`
        // Also sync weather thunder audio volume if it exists globally
        if ((window as any).thunderAudio) {
          (window as any).thunderAudio.volume = (val / 100);
        }
      }
    })

    // fps toggle
    this.fpsBtn?.addEventListener('click', () => {
      if (this.fpsToggle) {
        const isVisible = this.fps.fps.style.display !== 'none'
        const nextVisible = !isVisible
        this.fps.toggle(nextVisible)
        this.fpsToggle.innerHTML = `FPS Counter: ${nextVisible ? 'On' : 'Off'}`
      }
    })

    // apply settings
    this.settingBack?.addEventListener('click', () => {
      if (this.distanceInput instanceof HTMLInputElement) {
        terrain.distance = parseInt(this.distanceInput.value)
        terrain.maxCount =
          (terrain.distance * terrain.chunkSize * 2 + terrain.chunkSize) ** 2 +
          500

        terrain.initBlocks()
        terrain.generate()
        terrain.scene.fog = new THREE.Fog(
          0x87ceeb,
          1,
          terrain.distance * 24 + 24
        )
      }
      this.settings?.classList.add('hidden')
      // If we are in-game (Resume shown), automatically resume after applying
      if (this.play?.innerHTML === 'Resume') {
          this.onPlay();
          !isMobile && control.control.lock();
      }
    })

    // menu and fullscreen
    document.body.addEventListener('keydown', (e: KeyboardEvent) => {
      // menu
      const inv = document.getElementById('inventory-menu');
      if (e.key === 'e' || e.code === 'Escape') {
        if (e.code === 'Escape') e.preventDefault(); // Prevent exit fullscreen default
        if (inv && inv.style.display === 'flex' && !document.pointerLockElement) {
          // Close inventory
          inv.style.display = 'none';
          inv.classList.add('hidden');
          !isMobile && control.control.lock();
          // Prevent ESC from triggering pause menu logic
          e.stopPropagation();
          return;
        } else if (e.key === 'e' && document.pointerLockElement) {
          // Open inventory
          if (inv) {
            inv.style.display = 'flex';
            inv.classList.remove('hidden');
            !isMobile && control.control.unlock();
          }
        }
      }

      // fullscreen
      if (e.key === 'f') {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          document.body.requestFullscreen()
        }
      }
    })

    // exit
    this.exit?.addEventListener('click', () => {
      this.onExit()
    })

    // MP menu flow
    this.joinMenuBtn?.addEventListener('click', () => {
      this.mainMenuContent?.classList.add('hidden');
      this.joinMenuContent?.classList.remove('hidden');
    });
    this.joinBackBtn?.addEventListener('click', () => {
      this.joinMenuContent?.classList.add('hidden');
      this.mainMenuContent?.classList.remove('hidden');
    });

    // play / pause handler
    document.addEventListener('pointerlockchange', () => {
      const inv = document.getElementById('inventory-menu');
      if (document.pointerLockElement) {
        if (!document.querySelector('.menu')?.classList.contains('start')) {
            this.onPlay()
            if (inv && inv.style.display === 'flex') {
                inv.style.display = 'none';
                inv.classList.add('hidden');
            }
        }
      } else {
        if (!document.querySelector('.menu')?.classList.contains('start')) {
            if (inv && inv.style.display === 'flex') {
              // Inventory is open, do not pause
              this.crossHair.classList.add('hidden')
            } else {
              this.onPause()
            }
        }
      }
    })

    // disable context menu
    document.addEventListener('contextmenu', e => {
      e.preventDefault()
    })

    // fallback lock handler
    document.querySelector('canvas')?.addEventListener('click', (e: Event) => {
      e.preventDefault()
      !isMobile && control.control.lock()
    })
  }

  fps: FPS
  bag: Bag
  joystick: Joystick

  menu = document.querySelector('#main-menu-container')
  crossHair = document.createElement('div')

  // buttons
  play = document.querySelector('#play')
  control = document.querySelector('#control')
  setting = document.querySelector('#setting')
  feature = document.querySelector('#feature')
  back = document.querySelector('#back')
  exit = document.querySelector('#exit')
  save = document.querySelector('#save')

  // MP buttons
  mpButtons = document.querySelector('#mp-buttons')
  mpStatus = document.querySelector('#mp-status')
  mainMenuContent = document.querySelector('#main-menu-container')
  joinMenuContent = document.querySelector('#join-menu-container')
  joinMenuBtn = document.querySelector('#join-menu-btn')
  joinBackBtn = document.querySelector('#join-back-btn')

  // modals
  saveModal = document.querySelector('.save-modal')
  loadModal = document.querySelector('.load-modal')
  settings = document.querySelector('.settings')
  features = document.querySelector('.features')
  github = document.querySelector('.github')
  donate = document.querySelector('.donate-btn')

  // settings
  distance = document.querySelector('#distance')
  distanceInput = document.querySelector('#distance-input')

  fov = document.querySelector('#fov')
  fovInput = document.querySelector('#fov-input')

  music = document.querySelector('#music')
  musicInput = document.querySelector('#music-input')

  sound = document.querySelector('#sound')
  soundInput = document.querySelector('#sound-input')

  fpsToggle = document.querySelector('#fps-toggle')
  fpsBtn = document.querySelector('#fps-btn')

  settingBack = document.querySelector('#setting-back')

  onPlay = () => {
    isMobile && this.joystick.init()
    this.menu?.classList.add('hidden')
    this.menu?.classList.remove('start')
    this.joinMenuContent?.classList.add('hidden')
    this.play && (this.play.innerHTML = 'Resume')
    this.crossHair.classList.remove('hidden')
    this.github && this.github.classList.add('hidden')
    this.donate && this.donate.classList.add('hidden')
    this.feature?.classList.add('hidden')
  }

  onPause = () => {
    this.menu?.classList.remove('hidden')
    this.crossHair.classList.add('hidden')
    this.save && (this.save.innerHTML = 'Save and Exit')
    this.github && this.github.classList.remove('hidden')
    this.donate && this.donate.classList.remove('hidden')
    if (this.mpButtons) (this.mpButtons as HTMLElement).style.display = 'none'
    if (this.mpStatus) (this.mpStatus as HTMLElement).style.display = 'none'
    const username = document.getElementById('username');
    if (username) username.style.display = 'none';
  }

  onExit = () => {
    this.menu?.classList.add('start')
    this.play && (this.play.innerHTML = 'Singleplayer')
    this.save && (this.save.innerHTML = 'Load Game')
    this.feature?.classList.remove('hidden')
    if (this.mpButtons) (this.mpButtons as HTMLElement).style.display = 'flex'
    if (this.mpStatus) (this.mpStatus as HTMLElement).style.display = 'block'
    const username = document.getElementById('username');
    if (username) username.style.display = 'inline-block';
    this.joinMenuContent?.classList.add('hidden')
    this.mainMenuContent?.classList.remove('hidden')
  }

  onSave = () => {
    this.saveModal?.classList.remove('hidden')
    setTimeout(() => {
      this.saveModal?.classList.add('show')
    })
    setTimeout(() => {
      this.saveModal?.classList.remove('show')
    }, 1000)

    setTimeout(() => {
      this.saveModal?.classList.add('hidden')
    }, 1350)
  }

  onLoad = () => {
    this.loadModal?.classList.remove('hidden')
    setTimeout(() => {
      this.loadModal?.classList.add('show')
    })
    setTimeout(() => {
      this.loadModal?.classList.remove('show')
    }, 1000)

    setTimeout(() => {
      this.loadModal?.classList.add('hidden')
    }, 1350)
  }

  update = () => {
    this.fps.update()
  }
}
