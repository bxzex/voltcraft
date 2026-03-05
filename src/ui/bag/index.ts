import grass from '../../static/textures/block/grass_block_side.png'
import stone from '../../static/textures/block/stone.png'
import tree from '../../static/textures/block/oak_log.png'
import wood from '../../static/textures/block/oak_planks.png'
import diamond from '../../static/textures/block/diamond_block.png'
import quartz from '../../static/textures/block/quartz_block_side.png'
import glass from '../../static/textures/block/glass.png'
import { isMobile } from '../../utils'
import Control from '../../control'
import { BlockType } from '../../terrain'

// Block textures for inventory
import dirt from '../../static/textures/block/dirt.png'
import cobblestone from '../../static/textures/block/cobblestone.png'
import bedrock from '../../static/textures/block/bedrock.png'
import sand from '../../static/textures/block/sand.png'
import leaf from '../../static/textures/block/oak_leaves.png'
import coal from '../../static/textures/block/coal_ore.png'
import bricks from '../../static/textures/block/bricks.png'
import stoneBricks from '../../static/textures/block/stone_bricks.png'
import obsidian from '../../static/textures/block/obsidian.png'
import ironOre from '../../static/textures/block/iron_ore.png'
import ironBlock from '../../static/textures/block/iron_block.png'
import goldBlock from '../../static/textures/block/gold_block.png'
import emeraldBlock from '../../static/textures/block/emerald_block.png'
import lapisBlock from '../../static/textures/block/lapis_block.png'
import redstoneOre from '../../static/textures/block/redstone_ore.png'
import tnt from '../../static/textures/block/tnt_side.png'
import bookshelf from '../../static/textures/block/bookshelf.png'
import mossyCobblestone from '../../static/textures/block/mossy_cobblestone.png'
import netherrack from '../../static/textures/block/netherrack.png'
import glowstone from '../../static/textures/block/glowstone.png'
import gravel from '../../static/textures/block/gravel.png'
import clay from '../../static/textures/block/clay.png'
import snow from '../../static/textures/block/snow.png'
import craftingTable from '../../static/textures/block/crafting_table_front.png'
import furnace from '../../static/textures/block/furnace_front.png'
import birchPlanks from '../../static/textures/block/birch_planks.png'
import sprucePlanks from '../../static/textures/block/spruce_planks.png'
import netherBricks from '../../static/textures/block/nether_bricks.png'
import pumpkin from '../../static/textures/block/pumpkin_side.png'
import melon from '../../static/textures/block/melon_side.png'
import sponge from '../../static/textures/block/sponge.png'

// 31 additional textures
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
  { type: BlockType.bedrock, src: bedrock }
];

// Specific block textures for 3D icons
import grass_top from '../../static/textures/block/grass_block_top.png'
import oak_log_top from '../../static/textures/block/oak_log_top.png'
import tnt_top from '../../static/textures/block/tnt_top.png'
import furnace_top from '../../static/textures/block/furnace_top.png'
import crafting_top from '../../static/textures/block/crafting_table_top.png'
import pumpkin_top from '../../static/textures/block/pumpkin_top.png'
import melon_top from '../../static/textures/block/melon_top.png'

const createBlockIcon = (type: BlockType, src: string) => {
  const container = document.createElement('div');
  container.className = 'cube-container';
  
  const cube = document.createElement('div');
  cube.className = 'cube';
  
  // Define textures for faces
  let frontSrc = src;
  let topSrc = src;
  let rightSrc = src;

  // Handle special blocks with multi-textures
  if (type === BlockType.grass) topSrc = grass_top;
  if (type === BlockType.tree) topSrc = oak_log_top;
  if (type === BlockType.tnt) topSrc = tnt_top;
  if (type === BlockType.furnace) topSrc = furnace_top;
  if (type === BlockType.craftingTable) topSrc = crafting_top;
  if (type === BlockType.pumpkin) topSrc = pumpkin_top;
  if (type === BlockType.melon) topSrc = melon_top;

  const createFace = (faceClass: string, texture: string) => {
    const face = document.createElement('div');
    face.className = `face ${faceClass}`;
    const img = document.createElement('img');
    img.src = texture;
    img.crossOrigin = 'anonymous';
    face.appendChild(img);
    return face;
  };

  cube.appendChild(createFace('front', frontSrc));
  cube.appendChild(createFace('back', frontSrc));
  cube.appendChild(createFace('left', frontSrc));
  cube.appendChild(createFace('right', rightSrc));
  cube.appendChild(createFace('top', topSrc));
  cube.appendChild(createFace('bottom', frontSrc));

  container.appendChild(cube);
  return container;
};

export default class Bag {
  constructor(control: Control) {
    if (isMobile) return

    this.bag.className = 'bag'
    this.items[0].classList.add('selected')

    for (let i = 0; i < this.items.length; i++) {
      this.bag.appendChild(this.items[i])
    }
    document.body.appendChild(this.bag)

    // Build Inventory Grid Overlay
    const grid = document.getElementById('inventory-grid');
    if (grid) {
      allBlocks.forEach(b => {
        const cell = document.createElement('div');
        cell.style.width = '60px'; cell.style.height = '60px';
        cell.style.cursor = 'pointer'; cell.style.border = '2px solid transparent';
        cell.style.backgroundColor = '#8b8b8b'; cell.style.display = 'flex';
        cell.style.justifyContent = 'center'; cell.style.alignItems = 'center';

        const iconNode = createBlockIcon(b.type, b.src);
        cell.appendChild(iconNode);

        cell.onmouseover = () => cell.style.border = '2px solid white';
        cell.onmouseout = () => cell.style.border = '2px solid transparent';
        cell.onclick = () => {
          control.holdingBlocks[this.current] = b.type;
          control.holdingBlock = b.type;
          this.icon[this.current] = b.src;
          const slotDiv = this.items[this.current];
          slotDiv.innerHTML = '';
          slotDiv.appendChild(createBlockIcon(b.type, b.src));
        };
        grid.appendChild(cell);
      });
    }

    document.body.addEventListener('keydown', (e: KeyboardEvent) => {
      if (isNaN(parseInt(e.key)) || e.key === '0') {
        return
      }

      for (let i = 0; i < this.items.length; i++) {
        this.items[i].classList.remove('selected')
      }

      this.current = parseInt(e.key) - 1
      this.items[this.current].classList.add('selected')
      control.holdingBlock = control.holdingBlocks[this.current];
    })

    document.body.addEventListener('wheel', (e: WheelEvent) => {
      if (!this.wheelGap) {
        this.wheelGap = true
        setTimeout(() => {
          this.wheelGap = false
        }, 100)
        if (e.deltaY > 0) {
          this.current++
          this.current > 9 && (this.current = 0)
        } else if (e.deltaY < 0) {
          this.current--
          this.current < 0 && (this.current = 9)
        }
        for (let i = 0; i < this.items.length; i++) {
          this.items[i].classList.remove('selected')
        }
        this.items[this.current].classList.add('selected')
        control.holdingBlock = control.holdingBlocks[this.current];
      }
    })
  }
  wheelGap = false
  current = 0
  icon = [grass, stone, tree, wood, diamond, quartz, glass, dirt, cobblestone, bedrock]
  iconIndex = 0
  y = 0

  bag = document.createElement('div')

  items = new Array(10).fill(null).map((_, i) => {
    let item = document.createElement('div')
    item.className = 'item'

    const defaultBlocks = [
        BlockType.grass, BlockType.stone, BlockType.tree, BlockType.wood, 
        BlockType.diamond, BlockType.quartz, BlockType.glass, BlockType.dirt, 
        BlockType.cobblestone, BlockType.bedrock
    ];

    if (this.icon[i]) {
      item.appendChild(createBlockIcon(defaultBlocks[i], this.icon[i]));
    }

    return item
  })
}
