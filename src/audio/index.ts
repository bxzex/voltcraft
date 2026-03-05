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
import { isMobile } from '../utils'

export default class Audio {
  constructor(camera: THREE.PerspectiveCamera) {
    if (isMobile) return

    const listener = new THREE.AudioListener()
    const audioLoader = new THREE.AudioLoader()
    camera.add(listener)

    // load bgm
    const bgm = new THREE.Audio(listener)
    bgm.autoplay = false
    audioLoader.load(hal3, buffer => {
      bgm.setBuffer(buffer)
      bgm.setVolume(0.1)
      bgm.setLoop(true)
      if (bgm.isPlaying) {
        bgm.pause()
        bgm.play()
      }
    })

    // play / pause bgm
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement && !bgm.isPlaying && !this.disabled) {
        bgm.play()
      } else {
        bgm.pause()
      }
    })

    // load sound effect
    for (const types of this.sourceSet) {
      const audios: THREE.Audio[] = []
      for (const type of types) {
        audioLoader.load(type, buffer => {
          const audio = new THREE.Audio(listener!)
          audio.setBuffer(buffer)
          audio.setVolume(0.15)
          audios.push(audio)
        })
      }
      this.soundSet.push(audios)
    }
  }

  disabled = false

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
    [grass1, grass2, grass3, grass4],       // 12 water
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
  ]

  soundSet: THREE.Audio[][] = []

  index = 0

  playSound(type: BlockType) {
    if (!this.disabled && !isMobile) {
      this.index++ === 3 && (this.index = 0)
      this.soundSet[type]?.[this.index]?.play()
    }
  }
}
