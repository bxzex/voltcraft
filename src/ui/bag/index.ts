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

import dirt from '../../static/textures/block/dirt.png'
import cobblestone from '../../static/textures/block/cobblestone.png'
import bedrock from '../../static/textures/block/bedrock.png'
import sand from '../../static/textures/block/sand.png'
import leaf from '../../static/textures/block/oak_leaves.png'
import coal from '../../static/textures/block/coal_ore.png'

const allBlocks = [
  { type: BlockType.grass, src: grass },
  { type: BlockType.sand, src: sand },
  { type: BlockType.tree, src: tree },
  { type: BlockType.leaf, src: leaf },
  { type: BlockType.dirt, src: dirt },
  { type: BlockType.stone, src: stone },
  { type: BlockType.coal, src: coal },
  { type: BlockType.wood, src: wood },
  { type: BlockType.diamond, src: diamond },
  { type: BlockType.quartz, src: quartz },
  { type: BlockType.glass, src: glass },
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
