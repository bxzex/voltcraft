import * as THREE from 'three'
import hal3 from './musics/hal3.ogg'
import { BlockType } from '../terrain'

import grass1 from './blocks/grass1.ogg'
import grass2 from './blocks/grass2.ogg'
import grass3 from './blocks/grass3.ogg'
import grass4 from './blocks/grass4.ogg'

import sand1 from './blocks/sand1.ogg'
import sand2 from './blocks/sand2.ogg'
import sand3 from './blocks/sand3.ogg'
import sand4 from './blocks/sand4.ogg'

import stone1 from './blocks/stone1.ogg'
import stone2 from './blocks/stone2.ogg'
import stone3 from './blocks/stone3.ogg'
import stone4 from './blocks/stone4.ogg'

import dirt1 from './blocks/dirt1.ogg'
import dirt2 from './blocks/dirt2.ogg'
import dirt3 from './blocks/dirt3.ogg'
import dirt4 from './blocks/dirt4.ogg'

import tree1 from './blocks/tree1.ogg'
import tree2 from './blocks/tree2.ogg'
import tree3 from './blocks/tree3.ogg'
import tree4 from './blocks/tree4.ogg'

import leaf1 from './blocks/leaf1.ogg'
import leaf2 from './blocks/leaf2.ogg'
import leaf3 from './blocks/leaf3.ogg'
import leaf4 from './blocks/leaf4.ogg'

import splash1 from '../static/sounds/liquid/splash.ogg'
import splash2 from '../static/sounds/liquid/splash2.ogg'
import splash3 from '../static/sounds/liquid/heavy_splash.ogg'

// Mob sounds
import cow_say1 from '../static/sounds/mob/cow/say1.ogg'
import cow_say2 from '../static/sounds/mob/cow/say2.ogg'
import cow_say3 from '../static/sounds/mob/cow/say3.ogg'
import cow_step from '../static/sounds/mob/cow/step1.ogg'

import pig_say1 from '../static/sounds/mob/pig/say1.ogg'
import pig_say2 from '../static/sounds/mob/pig/say2.ogg'
import pig_say3 from '../static/sounds/mob/pig/say3.ogg'
import pig_step from '../static/sounds/mob/pig/step1.ogg'

export default class Audio {
  bgm: THREE.Audio | null = null
  listener: THREE.AudioListener | null = null
  mobSounds: Record<string, THREE.Audio[]> = {}
  landingSounds: THREE.Audio[] = []
  soundSet: THREE.Audio[][] = []
  index = 0
  disabled = false
  musicVolume = 1
  soundVolume = 1

  constructor(camera: THREE.PerspectiveCamera) {
    this.listener = new THREE.AudioListener()
    const audioLoader = new THREE.AudioLoader()
    camera.add(this.listener)

    // load landing sounds
    audioLoader.load(stone1, buffer => {
      const audio = new THREE.Audio(this.listener!)
      audio.setBuffer(buffer)
      audio.setVolume(this.soundVolume * 0.2)
      this.landingSounds.push(audio)
    })

    // load bgm
    this.bgm = new THREE.Audio(this.listener)
    this.bgm.autoplay = false
    audioLoader.load(hal3, buffer => {
      if (!this.bgm) return
      this.bgm.setBuffer(buffer)
      this.bgm.setVolume(this.musicVolume * 0.1)
      this.bgm.setLoop(true)
      if (this.bgm.isPlaying) {
        this.bgm.pause()
        this.bgm.play()
      }
    })

    // play / pause bgm
    document.addEventListener('pointerlockchange', () => {
      if (!this.bgm) return
      if (document.pointerLockElement && !this.bgm.isPlaying && !this.disabled && this.musicVolume > 0) {
        this.bgm.play()
      } else {
        this.bgm.pause()
      }
    })

    // load sound effect
    for (const types of this.sourceSet) {
      const audios: THREE.Audio[] = []
      for (const type of types) {
        audioLoader.load(type, buffer => {
          const audio = new THREE.Audio(this.listener!)
          audio.setBuffer(buffer)
          audio.setVolume(this.soundVolume * 0.15)
          audios.push(audio)
        })
      }
      this.soundSet.push(audios)
    }

    // load mob sounds
    const mobSources: Record<string, string[]> = {
      cow_say: [cow_say1, cow_say2, cow_say3],
      cow_step: [cow_step],
      pig_say: [pig_say1, pig_say2, pig_say3],
      pig_step: [pig_step]
    }

    for (const key in mobSources) {
      this.mobSounds[key] = []
      for (const src of mobSources[key]) {
        audioLoader.load(src, buffer => {
          const audio = new THREE.Audio(listener!)
          audio.setBuffer(buffer)
          audio.setVolume(this.soundVolume * 0.1)
          this.mobSounds[key].push(audio)
        })
      }
    }
  }

  unlock() {
    if (this.listener?.context.state === 'suspended') {
      this.listener.context.resume()
    }
  }

  stopAll() {
    if (this.bgm && this.bgm.isPlaying) {
      this.bgm.stop()
    }
    // Also stop all other playing sounds if any
    for (const audios of this.soundSet) {
      for (const audio of audios) {
        if (audio.isPlaying) audio.stop()
      }
    }
    for (const key in this.mobSounds) {
      for (const audio of this.mobSounds[key]) {
        if (audio.isPlaying) audio.stop()
      }
    }
  }

  setMusicVolume(v: number) {
    this.musicVolume = v
    if (this.bgm) {
      this.bgm.setVolume(v * 0.1)
      if (v === 0 && this.bgm.isPlaying) {
        this.bgm.pause()
      } else if (v > 0 && !this.bgm.isPlaying && document.pointerLockElement) {
        this.bgm.play()
      }
    }
  }

  setSoundVolume(v: number) {
    this.soundVolume = v
    for (const audios of this.soundSet) {
      for (const audio of audios) {
        audio.setVolume(v * 0.15)
      }
    }
    for (const key in this.mobSounds) {
      for (const audio of this.mobSounds[key]) {
        audio.setVolume(v * 0.1)
      }
    }
    for (const audio of this.landingSounds) {
      audio.setVolume(v * 0.2)
    }
  }

  sourceSet = [
    [grass1, grass2, grass3, grass4],       // 0  grass
    [sand1, sand2, sand3, sand4],           // 1  sand
    [tree1, tree2, tree3, tree4],           // 2  tree
    [leaf1, leaf2, leaf3, leaf4],           // 3  leaf
    [dirt1, dirt2, dirt3, dirt4],            // 4  dirt
    [stone1, stone2, stone3, stone4],       // 5  stone
    [stone1, stone2, stone3, stone4],       // 6  coal
    [tree1, tree2, tree3, tree4],           // 7  wood
    [stone1, stone2, stone3, stone4],       // 8  diamond
    [stone1, stone2, stone3, stone4],       // 9  quartz
    [stone1, stone2, stone3, stone4],       // 10 glass
    [stone1, stone2, stone3, stone4],       // 11 bedrock
    [splash1, splash2, splash3, splash1],   // 12 water
    // New blocks
    [stone1, stone2, stone3, stone4],       // 13 cobblestone
    [stone1, stone2, stone3, stone4],       // 14 bricks
    [stone1, stone2, stone3, stone4],       // 15 stoneBricks
    [stone1, stone2, stone3, stone4],       // 16 obsidian
    [stone1, stone2, stone3, stone4],       // 17 iron (ore)
    [stone1, stone2, stone3, stone4],       // 18 ironBlock
    [stone1, stone2, stone3, stone4],       // 19 goldBlock
    [stone1, stone2, stone3, stone4],       // 20 emeraldBlock
    [stone1, stone2, stone3, stone4],       // 21 lapisBlock
    [stone1, stone2, stone3, stone4],       // 22 redstoneOre
    [grass1, grass2, grass3, grass4],       // 23 tnt
    [tree1, tree2, tree3, tree4],           // 24 bookshelf
    [stone1, stone2, stone3, stone4],       // 25 mossyCobblestone
    [stone1, stone2, stone3, stone4],       // 26 netherrack
    [stone1, stone2, stone3, stone4],       // 27 glowstone
    [dirt1, dirt2, dirt3, dirt4],            // 28 gravel
    [dirt1, dirt2, dirt3, dirt4],            // 29 clay
    [grass1, grass2, grass3, grass4],       // 30 snow
    [tree1, tree2, tree3, tree4],           // 31 craftingTable
    [stone1, stone2, stone3, stone4],       // 32 furnace
    [tree1, tree2, tree3, tree4],           // 33 birchPlanks
    [tree1, tree2, tree3, tree4],           // 34 sprucePlanks
    [stone1, stone2, stone3, stone4],       // 35 netherBricks
    [tree1, tree2, tree3, tree4],           // 36 pumpkin
    [tree1, tree2, tree3, tree4],           // 37 melon
    [grass1, grass2, grass3, grass4],       // 38 sponge
    [stone1, stone2, stone3, stone4],       // 39 amethyst
    [stone1, stone2, stone3, stone4],       // 40 ancientDebris
    [stone1, stone2, stone3, stone4],       // 41 andesite
    [stone1, stone2, stone3, stone4],       // 42 polishedAndesite
    [stone1, stone2, stone3, stone4],       // 43 diorite
    [stone1, stone2, stone3, stone4],       // 44 polishedDiorite
    [stone1, stone2, stone3, stone4],       // 45 granite
    [stone1, stone2, stone3, stone4],       // 46 polishedGranite
    [stone1, stone2, stone3, stone4],       // 47 deepslate
    [stone1, stone2, stone3, stone4],       // 48 deepslateBricks
    [stone1, stone2, stone3, stone4],       // 49 deepslateTiles
    [stone1, stone2, stone3, stone4],       // 50 basalt
    [stone1, stone2, stone3, stone4],       // 51 polishedBasalt
    [stone1, stone2, stone3, stone4],       // 52 blackstone
    [stone1, stone2, stone3, stone4],       // 53 gildedBlackstone
    [stone1, stone2, stone3, stone4],       // 54 chiseledBlackstone
    [stone1, stone2, stone3, stone4],       // 55 endStone
    [stone1, stone2, stone3, stone4],       // 56 endStoneBricks
    [stone1, stone2, stone3, stone4],       // 57 purpur
    [stone1, stone2, stone3, stone4],       // 58 purpurPillar
    [stone1, stone2, stone3, stone4],       // 59 redSandstone
    [stone1, stone2, stone3, stone4],       // 60 chiseledRedSandstone
    [stone1, stone2, stone3, stone4],       // 61 cutRedSandstone
    [stone1, stone2, stone3, stone4],       // 62 magma
    [sand1, sand2, sand3, sand4],           // 63 soulSand
    [dirt1, dirt2, dirt3, dirt4],           // 64 soulSoil
    [stone1, stone2, stone3, stone4],       // 65 boneBlock
    [stone1, stone2, stone3, stone4],       // 66 copperBlock
    [stone1, stone2, stone3, stone4],       // 67 rawIron
    [stone1, stone2, stone3, stone4],       // 68 rawGold
    [stone1, stone2, stone3, stone4],       // 69 rawCopper
  ]

  soundSet: THREE.Audio[][] = []

  index = 0

  playSound(type: BlockType) {
    if (!this.disabled) {
      this.index++ === 3 && (this.index = 0)
      const audio = this.soundSet[type]?.[this.index]
      if (audio) {
        audio.setVolume(this.soundVolume * 0.15)
        audio.play()
      }
    }
  }

  playMobSound(mob: 'cow' | 'pig', type: 'say' | 'step') {
    if (this.disabled) return
    const key = `${mob}_${type}`
    const sounds = this.mobSounds[key]
    if (sounds && sounds.length > 0) {
      const s = sounds[Math.floor(Math.random() * sounds.length)]
      if (!s.isPlaying) {
        s.setVolume(this.soundVolume * 0.1)
        s.play()
      }
    }
  }

  playLanding() {
    if (this.disabled) return
    const sounds = this.landingSounds
    if (sounds && sounds.length > 0) {
      const s = sounds[Math.floor(Math.random() * sounds.length)]
      if (!s.isPlaying) {
        s.setVolume(this.soundVolume * 0.2)
        s.play()
      }
    }
  }

  playSplash() {
    if (this.disabled) return
    const splashIdx = 12 // Water index
    const sounds = this.soundSet[splashIdx]
    if (sounds && sounds.length > 0) {
      const s = sounds[Math.floor(Math.random() * sounds.length)]
      if (!s.isPlaying) {
        s.setVolume(this.soundVolume * 0.1) // Slightly quieter for continuous movement
        s.play()
      }
    }
  }
}
