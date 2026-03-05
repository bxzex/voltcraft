import grass from '../../static/block-icon/grass.png'
import stone from '../../static/block-icon/stone.png'
import tree from '../../static/block-icon/tree.png'
import wood from '../../static/block-icon/wood.png'
import diamond from '../../static/block-icon/diamond.png'
import quartz from '../../static/block-icon/quartz.png'
import glass from '../../static/block-icon/glass.png'
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
  { type: BlockType.bedrock, src: bedrock }
];

const createBlockIcon = (src: string) => {
  const img = document.createElement('img');
  img.src = src;
  img.style.width = '48px';
  img.style.height = '48px';
  img.crossOrigin = 'anonymous';
  img.style.imageRendering = 'pixelated';
  img.style.objectFit = 'contain';
  return img;
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

        const iconNode = createBlockIcon(b.src);
        cell.appendChild(iconNode);

        cell.onmouseover = () => cell.style.border = '2px solid white';
        cell.onmouseout = () => cell.style.border = '2px solid transparent';
        cell.onclick = () => {
          control.holdingBlocks[this.current] = b.type;
          control.holdingBlock = b.type;
          this.icon[this.current] = b.src;
          const slotDiv = this.items[this.current];
          slotDiv.innerHTML = '';
          slotDiv.appendChild(createBlockIcon(b.src));
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

  items = new Array(10).fill(null).map(() => {
    let item = document.createElement('div')
    item.className = 'item'

    if (this.icon[this.iconIndex]) {
      item.appendChild(createBlockIcon(this.icon[this.iconIndex++]));
    }

    return item
  })
}
