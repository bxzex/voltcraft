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

const ASSET_URL = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.11/assets/minecraft/textures/block/';
const dirt = ASSET_URL + 'dirt.png';
const cobblestone = ASSET_URL + 'cobblestone.png';
const bedrock = ASSET_URL + 'bedrock.png';
const sand = ASSET_URL + 'sand.png';
const leaf = ASSET_URL + 'oak_leaves.png';
const coal = ASSET_URL + 'coal_ore.png';

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
  if (src.includes('block-icon')) {
    const img = document.createElement('img');
    img.src = src; img.style.width = '48px'; img.style.height = '48px';
    img.crossOrigin = 'anonymous';
    img.style.imageRendering = 'pixelated';
    return img;
  }
  
  const wrapper = document.createElement('div');
  wrapper.style.width = '48px'; wrapper.style.height = '48px';
  wrapper.style.display = 'flex'; wrapper.style.justifyContent = 'center'; wrapper.style.alignItems = 'center';
  
  const cube = document.createElement('div');
  cube.style.width = '24px'; cube.style.height = '24px';
  cube.style.position = 'relative';
  cube.style.transformStyle = 'preserve-3d';
  cube.style.transform = 'rotateX(-30deg) rotateY(45deg)';
  
  const addFace = (transform: string, brightness: number) => {
    const face = document.createElement('div');
    face.style.position = 'absolute';
    face.style.width = '100%'; face.style.height = '100%';
    face.style.backgroundImage = `url(${src})`;
    face.style.backgroundSize = 'cover';
    face.style.imageRendering = 'pixelated';
    face.style.transform = transform;
    face.style.filter = `brightness(${brightness})`;
    if (src.includes('glass') || src.includes('water')) {
        face.style.opacity = '0.7';
    }
    cube.appendChild(face);
  };
  
  addFace('rotateX(90deg) translateZ(12px)', 1.2); // top
  addFace('rotateY(-90deg) translateZ(12px)', 0.8); // left
  addFace('translateZ(12px)', 0.6); // front
  
  wrapper.appendChild(cube);
  return wrapper;
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
