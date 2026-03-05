import grass from '../../static/textures/block/grass_block_side.png'
import stone from '../../static/textures/block/stone.png'
import tree from '../../static/textures/block/oak_log.png'
import wood from '../../static/textures/block/oak_planks.png'
import leaf from '../../static/textures/block/oak_leaves.png'
import dirt from '../../static/textures/block/dirt.png'
import sand from '../../static/textures/block/sand.png'
import coal from '../../static/textures/block/coal_ore.png'
import ironOre from '../../static/textures/block/iron_ore.png'
import redstoneOre from '../../static/textures/block/redstone_ore.png'
import diamond from '../../static/textures/block/diamond_ore.png'
import emeraldBlock from '../../static/textures/block/emerald_block.png'
import goldBlock from '../../static/textures/block/gold_block.png'
import ironBlock from '../../static/textures/block/iron_block.png'
import lapisBlock from '../../static/textures/block/lapis_block.png'
import glass from '../../static/textures/block/glass.png'
import bedrock from '../../static/textures/block/bedrock.png'
import birchPlanks from '../../static/textures/block/birch_planks.png'
import sprucePlanks from '../../static/textures/block/spruce_planks.png'
import bricks from '../../static/textures/block/bricks.png'
import stoneBricks from '../../static/textures/block/stone_bricks.png'
import cobblestone from '../../static/textures/block/cobblestone.png'
import mossyCobblestone from '../../static/textures/block/mossy_cobblestone.png'
import obsidian from '../../static/textures/block/obsidian.png'
import quartz from '../../static/textures/block/quartz_block_side.png'
import gravel from '../../static/textures/block/gravel.png'
import clay from '../../static/textures/block/clay.png'
import snow from '../../static/textures/block/snow.png'
import craftingTable from '../../static/textures/block/crafting_table_side.png'
import furnace from '../../static/textures/block/furnace_front.png'
import bookshelf from '../../static/textures/block/bookshelf.png'
import tnt from '../../static/textures/block/tnt_side.png'
import glowstone from '../../static/textures/block/glowstone.png'
import netherrack from '../../static/textures/block/netherrack.png'
import netherBricks from '../../static/textures/block/nether_bricks.png'
import pumpkin from '../../static/textures/block/pumpkin_side.png'
import melon from '../../static/textures/block/melon_side.png'
import sponge from '../../static/textures/block/sponge.png'
import amethyst from '../../static/textures/block/amethyst_block.png'
import ancientDebris from '../../static/textures/block/ancient_debris_side.png'
import andesite from '../../static/textures/block/andesite.png'
import polishedAndesite from '../../static/textures/block/polished_andesite.png'
import diorite from '../../static/textures/block/diorite.png'
import polishedDiorite from '../../static/textures/block/polished_diorite.png'
import granite from '../../static/textures/block/granite.png'
import polishedGranite from '../../static/textures/block/polished_granite.png'
import deepslate from '../../static/textures/block/deepslate.png'
import deepslateBricks from '../../static/textures/block/deepslate_bricks.png'
import deepslateTiles from '../../static/textures/block/deepslate_tiles.png'
import basalt from '../../static/textures/block/basalt_side.png'
import polishedBasalt from '../../static/textures/block/polished_basalt_side.png'
import blackstone from '../../static/textures/block/blackstone.png'
import gildedBlackstone from '../../static/textures/block/gilded_blackstone.png'
import chiseledBlackstone from '../../static/textures/block/chiseled_polished_blackstone.png'
import endStone from '../../static/textures/block/end_stone.png'
import endStoneBricks from '../../static/textures/block/end_stone_bricks.png'
import purpur from '../../static/textures/block/purpur_block.png'
import purpurPillar from '../../static/textures/block/purpur_pillar.png'
import redSandstone from '../../static/textures/block/red_sandstone.png'
import chiseledRedSandstone from '../../static/textures/block/chiseled_red_sandstone.png'
import cutRedSandstone from '../../static/textures/block/cut_red_sandstone.png'
import magma from '../../static/textures/block/magma.png'
import soulSand from '../../static/textures/block/soul_sand.png'
import soulSoil from '../../static/textures/block/soul_soil.png'
import boneBlock from '../../static/textures/block/bone_block_side.png'
import copperBlock from '../../static/textures/block/copper_block.png'
import rawIron from '../../static/textures/block/raw_iron_block.png'
import rawGold from '../../static/textures/block/raw_gold_block.png'
import rawCopper from '../../static/textures/block/raw_copper_block.png'

import diamond_pickaxe from '../../static/textures/item/diamond_pickaxe.png'
import diamond_shovel from '../../static/textures/item/diamond_shovel.png'
import diamond_sword from '../../static/textures/item/diamond_sword.png'

import { BlockType } from '../../terrain'
import Control from '../../control'
import { isMobile } from '../../utils'

const allBlocks = [
  { type: BlockType.grass, src: grass },
  { type: BlockType.dirt, src: dirt },
  { type: BlockType.sand, src: sand },
  { type: BlockType.stone, src: stone },
  { type: BlockType.cobblestone, src: cobblestone },
  { type: BlockType.coal, src: coal },
  { type: BlockType.iron, src: ironOre },
  { type: BlockType.redstoneOre, src: redstoneOre },
  { type: BlockType.diamond, src: diamond },
  { type: BlockType.emeraldBlock, src: emeraldBlock },
  { type: BlockType.goldBlock, src: goldBlock },
  { type: BlockType.ironBlock, src: ironBlock },
  { type: BlockType.lapisBlock, src: lapisBlock },
  { type: BlockType.wood, src: wood },
  { type: BlockType.birchPlanks, src: birchPlanks },
  { type: BlockType.sprucePlanks, src: sprucePlanks },
  { type: BlockType.tree, src: tree },
  { type: BlockType.leaf, src: leaf },
  { type: BlockType.glass, src: glass },
  { type: BlockType.bricks, src: bricks },
  { type: BlockType.stoneBricks, src: stoneBricks },
  { type: BlockType.mossyCobblestone, src: mossyCobblestone },
  { type: BlockType.obsidian, src: obsidian },
  { type: BlockType.quartz, src: quartz },
  { type: BlockType.gravel, src: gravel },
  { type: BlockType.clay, src: clay },
  { type: BlockType.snow, src: snow },
  { type: BlockType.craftingTable, src: craftingTable },
  { type: BlockType.furnace, src: furnace },
  { type: BlockType.bookshelf, src: bookshelf },
  { type: BlockType.tnt, src: tnt },
  { type: BlockType.glowstone, src: glowstone },
  { type: BlockType.netherrack, src: netherrack },
  { type: BlockType.netherBricks, src: netherBricks },
  { type: BlockType.pumpkin, src: pumpkin },
  { type: BlockType.melon, src: melon },
  { type: BlockType.sponge, src: sponge },
  { type: BlockType.amethyst, src: amethyst },
  { type: BlockType.ancientDebris, src: ancientDebris },
  { type: BlockType.andesite, src: andesite },
  { type: BlockType.polishedAndesite, src: polishedAndesite },
  { type: BlockType.diorite, src: diorite },
  { type: BlockType.polishedDiorite, src: polishedDiorite },
  { type: BlockType.granite, src: granite },
  { type: BlockType.polishedGranite, src: polishedGranite },
  { type: BlockType.deepslate, src: deepslate },
  { type: BlockType.deepslateBricks, src: deepslateBricks },
  { type: BlockType.deepslateTiles, src: deepslateTiles },
  { type: BlockType.basalt, src: basalt },
  { type: BlockType.polishedBasalt, src: polishedBasalt },
  { type: BlockType.blackstone, src: blackstone },
  { type: BlockType.gildedBlackstone, src: gildedBlackstone },
  { type: BlockType.chiseledBlackstone, src: chiseledBlackstone },
  { type: BlockType.endStone, src: endStone },
  { type: BlockType.endStoneBricks, src: endStoneBricks },
  { type: BlockType.purpur, src: purpur },
  { type: BlockType.purpurPillar, src: purpurPillar },
  { type: BlockType.redSandstone, src: redSandstone },
  { type: BlockType.chiseledRedSandstone, src: chiseledRedSandstone },
  { type: BlockType.cutRedSandstone, src: cutRedSandstone },
  { type: BlockType.magma, src: magma },
  { type: BlockType.soulSand, src: soulSand },
  { type: BlockType.soulSoil, src: soulSoil },
  { type: BlockType.boneBlock, src: boneBlock },
  { type: BlockType.copperBlock, src: copperBlock },
  { type: BlockType.rawIron, src: rawIron },
  { type: BlockType.rawGold, src: rawGold },
  { type: BlockType.rawCopper, src: rawCopper },
  { type: BlockType.torch, src: glowstone },
  { type: BlockType.door, src: wood },
  { type: BlockType.bed, src: wood },
  { type: BlockType.bedrock, src: bedrock },
  { type: 100, src: diamond_pickaxe },
  { type: 101, src: diamond_shovel },
  { type: 102, src: diamond_sword }
]

// Specific block textures for 3D icons
import grass_top from '../../static/textures/block/grass_block_top.png'
import dirt_img from '../../static/textures/block/dirt.png'
import oak_log_top from '../../static/textures/block/oak_log_top.png'

const blockTextures: Record<number, string[]> = {
  [BlockType.grass]: [grass, grass, grass_top, dirt_img, grass, grass],
  [BlockType.tree]: [tree, tree, oak_log_top, oak_log_top, tree, tree],
  [BlockType.dirt]: [dirt, dirt, dirt, dirt, dirt, dirt],
  [BlockType.stone]: [stone, stone, stone, stone, stone, stone]
}

const createBlockIcon = (type: number, src: string) => {
  const container = document.createElement('div')
  container.className = 'cube-container'

  // Types 100, 101, 102 are items (pickaxe, shovel, sword), others are blocks
  if (type < 100) {
    const cube = document.createElement('div')
    cube.className = 'cube'
    const faces = ['right', 'left', 'top', 'bottom', 'front', 'back']
    
    // Use specific textures if defined, otherwise use the same src for all faces
    const textures = blockTextures[type] || [src, src, src, src, src, src]

    faces.forEach((face, i) => {
      const faceEl = document.createElement('div')
      faceEl.className = `face ${face}`
      faceEl.style.backgroundImage = `url(${textures[i]})`
      cube.appendChild(faceEl)
    })
    container.appendChild(cube)
  } else {
    const img = document.createElement('img')
    img.src = src
    img.style.width = '100%'
    img.style.height = '100%'
    img.style.imageRendering = 'pixelated'
    container.appendChild(img)
  }

  return container
}

export default class Bag {
  constructor(control: Control) {
    this.bag.className = 'bag'
    this.items[0].classList.add('selected')

    for (let i = 0; i < this.items.length; i++) {
      this.bag.appendChild(this.items[i])
    }

    document.body.appendChild(this.bag)

    // inventory
    const inventoryGrid = document.getElementById('inventory-grid')
    if (inventoryGrid) {
      allBlocks.forEach(block => {
        const item = document.createElement('div')
        item.className = 'inventory-item'
        item.style.cssText = `
          width: 60px;
          height: 60px;
          background: #8b8b8b;
          border: 4px solid #373737;
          border-top-color: #fff;
          border-left-color: #fff;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
        `
        item.appendChild(createBlockIcon(block.type, block.src))

        item.onclick = () => {
          control.holdingBlock = block.type
          const selectedItem = this.items[control.hotbarIndex]
          selectedItem.innerHTML = ''
          selectedItem.appendChild(createBlockIcon(block.type, block.src))

          // Close inventory after selection
          const inv = document.getElementById('inventory-menu')
          if (inv) {
            inv.style.display = 'none'
            inv.classList.add('hidden')
            !isMobile && control.control.lock()
          }
        }
        inventoryGrid.appendChild(item)
      })
    }
  }

  bag = document.createElement('div')
  items = Array.from({ length: 8 }).map((_, i) => {
    const item = document.createElement('div')
    item.className = 'item'

    const defaultBlocks = [
      BlockType.grass,
      BlockType.stone,
      BlockType.wood,
      BlockType.tree,
      BlockType.leaf,
      BlockType.glass,
      BlockType.bricks,
      BlockType.tnt
    ]

    const type = defaultBlocks[i]
    const blockData = allBlocks.find(b => b.type === type)
    if (blockData) {
      item.appendChild(createBlockIcon(type, blockData.src))
    }

    return item
  })
}