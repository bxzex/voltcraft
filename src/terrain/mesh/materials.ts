import * as THREE from 'three'
import stone from '../../static/textures/block/stone.png'
import coal_ore from '../../static/textures/block/coal_ore.png'
import iron_ore from '../../static/textures/block/iron_ore.png'
import grass_side from '../../static/textures/block/grass_block_side.png'
import grass_top from '../../static/textures/block/grass_block_top.png'
import dirt from '../../static/textures/block/dirt.png'
import oak_log from '../../static/textures/block/oak_log.png'
import oak_log_top from '../../static/textures/block/oak_log_top.png'
import oak_leaves from '../../static/textures/block/oak_leaves.png'
import sand from '../../static/textures/block/sand.png'
import water from '../../static/textures/block/water_still.png'
import oak_wood from '../../static/textures/block/oak_planks.png'
import diamond from '../../static/textures/block/diamond_block.png'
import quartz from '../../static/textures/block/quartz_block_side.png'
import glass from '../../static/textures/block/glass.png'
import bedrock from '../../static/textures/block/bedrock.png'

// New block textures
import cobblestone_tex from '../../static/textures/block/cobblestone.png'
import bricks_tex from '../../static/textures/block/bricks.png'
import stone_bricks_tex from '../../static/textures/block/stone_bricks.png'
import obsidian_tex from '../../static/textures/block/obsidian.png'
import iron_block_tex from '../../static/textures/block/iron_block.png'
import gold_block_tex from '../../static/textures/block/gold_block.png'
import emerald_block_tex from '../../static/textures/block/emerald_block.png'
import lapis_block_tex from '../../static/textures/block/lapis_block.png'
import redstone_ore_tex from '../../static/textures/block/redstone_ore.png'
import tnt_side_tex from '../../static/textures/block/tnt_side.png'
import tnt_top_tex from '../../static/textures/block/tnt_top.png'
import tnt_bottom_tex from '../../static/textures/block/tnt_bottom.png'
import bookshelf_tex from '../../static/textures/block/bookshelf.png'
import mossy_cobblestone_tex from '../../static/textures/block/mossy_cobblestone.png'
import netherrack_tex from '../../static/textures/block/netherrack.png'
import glowstone_tex from '../../static/textures/block/glowstone.png'
import gravel_tex from '../../static/textures/block/gravel.png'
import clay_tex from '../../static/textures/block/clay.png'
import snow_tex from '../../static/textures/block/snow.png'
import crafting_front_tex from '../../static/textures/block/crafting_table_front.png'
import crafting_side_tex from '../../static/textures/block/crafting_table_side.png'
import crafting_top_tex from '../../static/textures/block/crafting_table_top.png'
import furnace_front_tex from '../../static/textures/block/furnace_front.png'
import furnace_side_tex from '../../static/textures/block/furnace_side.png'
import furnace_top_tex from '../../static/textures/block/furnace_top.png'
import birch_planks_tex from '../../static/textures/block/birch_planks.png'
import spruce_planks_tex from '../../static/textures/block/spruce_planks.png'
import nether_bricks_tex from '../../static/textures/block/nether_bricks.png'
import pumpkin_side_tex from '../../static/textures/block/pumpkin_side.png'
import pumpkin_top_tex from '../../static/textures/block/pumpkin_top.png'
import melon_side_tex from '../../static/textures/block/melon_side.png'
import melon_top_tex from '../../static/textures/block/melon_top.png'
import sponge_tex from '../../static/textures/block/sponge.png'

// 31 additional textures
import amethyst_tex from '../../static/textures/block/amethyst_block.png'
import ancient_debris_side from '../../static/textures/block/ancient_debris_side.png'
import ancient_debris_top from '../../static/textures/block/ancient_debris_top.png'
import andesite_tex from '../../static/textures/block/andesite.png'
import polished_andesite_tex from '../../static/textures/block/polished_andesite.png'
import diorite_tex from '../../static/textures/block/diorite.png'
import polished_diorite_tex from '../../static/textures/block/polished_diorite.png'
import granite_tex from '../../static/textures/block/granite.png'
import polished_granite_tex from '../../static/textures/block/polished_granite.png'
import deepslate_tex from '../../static/textures/block/deepslate.png'
import deepslate_top_tex from '../../static/textures/block/deepslate_top.png'
import deepslate_bricks_tex from '../../static/textures/block/deepslate_bricks.png'
import deepslate_tiles_tex from '../../static/textures/block/deepslate_tiles.png'
import basalt_side_tex from '../../static/textures/block/basalt_side.png'
import basalt_top_tex from '../../static/textures/block/basalt_top.png'
import polished_basalt_side_tex from '../../static/textures/block/polished_basalt_side.png'
import polished_basalt_top_tex from '../../static/textures/block/polished_basalt_top.png'
import blackstone_tex from '../../static/textures/block/blackstone.png'
import blackstone_top_tex from '../../static/textures/block/blackstone_top.png'
import gilded_blackstone_tex from '../../static/textures/block/gilded_blackstone.png'
import chiseled_blackstone_tex from '../../static/textures/block/chiseled_polished_blackstone.png'
import end_stone_tex from '../../static/textures/block/end_stone.png'
import end_stone_bricks_tex from '../../static/textures/block/end_stone_bricks.png'
import purpur_tex from '../../static/textures/block/purpur_block.png'
import purpur_pillar_tex from '../../static/textures/block/purpur_pillar.png'
import purpur_pillar_top_tex from '../../static/textures/block/purpur_pillar_top.png'
import red_sandstone_tex from '../../static/textures/block/red_sandstone.png'
import red_sandstone_top_tex from '../../static/textures/block/red_sandstone_top.png'
import red_sandstone_bottom_tex from '../../static/textures/block/red_sandstone_bottom.png'
import chiseled_red_sandstone_tex from '../../static/textures/block/chiseled_red_sandstone.png'
import cut_red_sandstone_tex from '../../static/textures/block/cut_red_sandstone.png'
import magma_tex from '../../static/textures/block/magma.png'
import soul_sand_tex from '../../static/textures/block/soul_sand.png'
import soul_soil_tex from '../../static/textures/block/soul_soil.png'
import bone_block_side_tex from '../../static/textures/block/bone_block_side.png'
import bone_block_top_tex from '../../static/textures/block/bone_block_top.png'
import copper_block_tex from '../../static/textures/block/copper_block.png'
import raw_iron_tex from '../../static/textures/block/raw_iron_block.png'
import raw_gold_tex from '../../static/textures/block/raw_gold_block.png'
import raw_copper_tex from '../../static/textures/block/raw_copper_block.png'

export enum MaterialType {
  grass = 'grass',
  dirt = 'dirt',
  tree = 'tree',
  leaf = 'leaf',
  sand = 'sand',
  water = 'water',
  stone = 'stone',
  coal = 'coal',
  wood = 'wood',
  diamond = 'diamond',
  quartz = 'quartz',
  glass = 'glass',
  bedrock = 'bedrock',
  // New block materials
  cobblestone = 'cobblestone',
  bricks = 'bricks',
  stoneBricks = 'stoneBricks',
  obsidian = 'obsidian',
  iron = 'iron',
  ironBlock = 'ironBlock',
  goldBlock = 'goldBlock',
  emeraldBlock = 'emeraldBlock',
  lapisBlock = 'lapisBlock',
  redstoneOre = 'redstoneOre',
  tnt = 'tnt',
  bookshelf = 'bookshelf',
  mossyCobblestone = 'mossyCobblestone',
  netherrack = 'netherrack',
  glowstone = 'glowstone',
  gravel = 'gravel',
  clay = 'clay',
  snow = 'snow',
  craftingTable = 'craftingTable',
  furnace = 'furnace',
  birchPlanks = 'birchPlanks',
  sprucePlanks = 'sprucePlanks',
  netherBricks = 'netherBricks',
  pumpkin = 'pumpkin',
  melon = 'melon',
  sponge = 'sponge',
  amethyst = 'amethyst',
  ancientDebris = 'ancientDebris',
  andesite = 'andesite',
  polishedAndesite = 'polishedAndesite',
  diorite = 'diorite',
  polishedDiorite = 'polishedDiorite',
  granite = 'granite',
  polishedGranite = 'polishedGranite',
  deepslate = 'deepslate',
  deepslateBricks = 'deepslateBricks',
  deepslateTiles = 'deepslateTiles',
  basalt = 'basalt',
  polishedBasalt = 'polishedBasalt',
  blackstone = 'blackstone',
  gildedBlackstone = 'gildedBlackstone',
  chiseledBlackstone = 'chiseledBlackstone',
  endStone = 'endStone',
  endStoneBricks = 'endStoneBricks',
  purpur = 'purpur',
  purpurPillar = 'purpurPillar',
  redSandstone = 'redSandstone',
  chiseledRedSandstone = 'chiseledRedSandstone',
  cutRedSandstone = 'cutRedSandstone',
  magma = 'magma',
  soulSand = 'soulSand',
  soulSoil = 'soulSoil',
  boneBlock = 'boneBlock',
  copperBlock = 'copperBlock',
  rawIron = 'rawIron',
  rawGold = 'rawGold',
  rawCopper = 'rawCopper'
}

let loader = new THREE.TextureLoader()

// Helper to load and pixelate
function loadTex(src: string): THREE.Texture {
  const t = loader.load(src)
  t.magFilter = THREE.NearestFilter
  return t
}

// load textures
const grassTopTex = loadTex(grass_top)
const grassSideTex = loadTex(grass_side)
const treeTex = loadTex(oak_log)
const treeTopTex = loadTex(oak_log_top)
const dirtTex = loadTex(dirt)
const stoneTex = loadTex(stone)
const coalTex = loadTex(coal_ore)
const ironOreTex = loadTex(iron_ore)
const leafTex = loadTex(oak_leaves)
const sandTex = loadTex(sand)
const waterTex = loadTex(water)
const woodTex = loadTex(oak_wood)
const diamondTex = loadTex(diamond)
const quartzTex = loadTex(quartz)
const glassTex = loadTex(glass)
const bedrockTex = loadTex(bedrock)

// New textures
const cobblestoneTex = loadTex(cobblestone_tex)
const bricksTex = loadTex(bricks_tex)
const stoneBricksTex = loadTex(stone_bricks_tex)
const obsidianTex = loadTex(obsidian_tex)
const ironBlockTex = loadTex(iron_block_tex)
const goldBlockTex = loadTex(gold_block_tex)
const emeraldBlockTex = loadTex(emerald_block_tex)
const lapisBlockTex = loadTex(lapis_block_tex)
const redstoneOreTex = loadTex(redstone_ore_tex)
const tntSideTex = loadTex(tnt_side_tex)
const tntTopTex = loadTex(tnt_top_tex)
const tntBottomTex = loadTex(tnt_bottom_tex)
const bookshelfTex = loadTex(bookshelf_tex)
const mossyCobblestoneTex = loadTex(mossy_cobblestone_tex)
const netherrackTex = loadTex(netherrack_tex)
const glowstoneTex = loadTex(glowstone_tex)
const gravelTex = loadTex(gravel_tex)
const clayTex = loadTex(clay_tex)
const snowTex = loadTex(snow_tex)
const craftingFrontTex = loadTex(crafting_front_tex)
const craftingSideTex = loadTex(crafting_side_tex)
const craftingTopTex = loadTex(crafting_top_tex)
const furnaceFrontTex = loadTex(furnace_front_tex)
const furnaceSideTex = loadTex(furnace_side_tex)
const furnaceTopTex = loadTex(furnace_top_tex)
const birchPlanksTex = loadTex(birch_planks_tex)
const sprucePlanksTex = loadTex(spruce_planks_tex)
const netherBricksTex = loadTex(nether_bricks_tex)
const pumpkinSideTex = loadTex(pumpkin_side_tex)
const pumpkinTopTex = loadTex(pumpkin_top_tex)
const melonSideTex = loadTex(melon_side_tex)
const melonTopTex = loadTex(melon_top_tex)
const spongeTex = loadTex(sponge_tex)

// 31 new textures
const amethystTex = loadTex(amethyst_tex)
const ancientDebrisSideTex = loadTex(ancient_debris_side)
const ancientDebrisTopTex = loadTex(ancient_debris_top)
const andesiteTex = loadTex(andesite_tex)
const polishedAndesiteTex = loadTex(polished_andesite_tex)
const dioriteTex = loadTex(diorite_tex)
const polishedDioriteTex = loadTex(polished_diorite_tex)
const graniteTex = loadTex(granite_tex)
const polishedGraniteTex = loadTex(polished_granite_tex)
const deepslateTex = loadTex(deepslate_tex)
const deepslateTopTex = loadTex(deepslate_top_tex)
const deepslateBricksTex = loadTex(deepslate_bricks_tex)
const deepslateTilesTex = loadTex(deepslate_tiles_tex)
const basaltSideTex = loadTex(basalt_side_tex)
const basaltTopTex = loadTex(basalt_top_tex)
const polishedBasaltSideTex = loadTex(polished_basalt_side_tex)
const polishedBasaltTopTex = loadTex(polished_basalt_top_tex)
const blackstoneTex = loadTex(blackstone_tex)
const blackstoneTopTex = loadTex(blackstone_top_tex)
const gildedBlackstoneTex = loadTex(gilded_blackstone_tex)
const chiseledBlackstoneTex = loadTex(chiseled_blackstone_tex)
const endStoneTex = loadTex(end_stone_tex)
const endStoneBricksTex = loadTex(end_stone_bricks_tex)
const purpurTex = loadTex(purpur_tex)
const purpurPillarTex = loadTex(purpur_pillar_tex)
const purpurPillarTopTex = loadTex(purpur_pillar_top_tex)
const redSandstoneTex = loadTex(red_sandstone_tex)
const redSandstoneTopTex = loadTex(red_sandstone_top_tex)
const redSandstoneBottomTex = loadTex(red_sandstone_bottom_tex)
const chiseledRedSandstoneTex = loadTex(chiseled_red_sandstone_tex)
const cutRedSandstoneTex = loadTex(cut_red_sandstone_tex)
const magmaTex = loadTex(magma_tex)
const soulSandTex = loadTex(soul_sand_tex)
const soulSoilTex = loadTex(soul_soil_tex)
const boneBlockSideTex = loadTex(bone_block_side_tex)
const boneBlockTopTex = loadTex(bone_block_top_tex)
const copperBlockTex = loadTex(copper_block_tex)
const rawIronTex = loadTex(raw_iron_tex)
const rawGoldTex = loadTex(raw_gold_tex)
const rawCopperTex = loadTex(raw_copper_tex)

const mat = (map: THREE.Texture, opts?: any) => new THREE.MeshStandardMaterial({ map, ...opts })

export default class Materials {
  materials: Record<string, THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[]> = {
    grass: [
      mat(grassSideTex), mat(grassSideTex),
      mat(grassTopTex), mat(dirtTex),
      mat(grassSideTex), mat(grassSideTex)
    ],
    dirt: mat(dirtTex),
    sand: mat(sandTex),
    tree: [
      mat(treeTex), mat(treeTex),
      mat(treeTopTex), mat(treeTopTex),
      mat(treeTex), mat(treeTex)
    ],
    leaf: mat(leafTex, { color: new THREE.Color(0, 1, 0), transparent: true }),
    water: mat(waterTex, { 
      transparent: true, 
      opacity: 0.9, 
      color: 0x0044ff,
      side: THREE.DoubleSide
    }),
    stone: mat(stoneTex),
    coal: mat(coalTex),
    wood: mat(woodTex),
    diamond: mat(diamondTex),
    quartz: mat(quartzTex),
    glass: mat(glassTex, { transparent: true }),
    bedrock: mat(bedrockTex),
    // New blocks
    cobblestone: mat(cobblestoneTex),
    bricks: mat(bricksTex),
    stoneBricks: mat(stoneBricksTex),
    obsidian: mat(obsidianTex),
    iron: mat(ironOreTex),
    ironBlock: mat(ironBlockTex),
    goldBlock: mat(goldBlockTex),
    emeraldBlock: mat(emeraldBlockTex),
    lapisBlock: mat(lapisBlockTex),
    redstoneOre: mat(redstoneOreTex),
    tnt: [
      mat(tntSideTex), mat(tntSideTex),
      mat(tntTopTex), mat(tntBottomTex),
      mat(tntSideTex), mat(tntSideTex)
    ],
    bookshelf: [
      mat(bookshelfTex), mat(bookshelfTex),
      mat(woodTex), mat(woodTex),
      mat(bookshelfTex), mat(bookshelfTex)
    ],
    mossyCobblestone: mat(mossyCobblestoneTex),
    netherrack: mat(netherrackTex),
    glowstone: mat(glowstoneTex),
    gravel: mat(gravelTex),
    clay: mat(clayTex),
    snow: mat(snowTex),
    craftingTable: [
      mat(craftingSideTex), mat(craftingSideTex),
      mat(craftingTopTex), mat(woodTex),
      mat(craftingFrontTex), mat(craftingSideTex)
    ],
    furnace: [
      mat(furnaceSideTex), mat(furnaceSideTex),
      mat(furnaceTopTex), mat(stoneTex),
      mat(furnaceFrontTex), mat(furnaceSideTex)
    ],
    birchPlanks: mat(birchPlanksTex),
    sprucePlanks: mat(sprucePlanksTex),
    netherBricks: mat(netherBricksTex),
    pumpkin: [
      mat(pumpkinSideTex), mat(pumpkinSideTex),
      mat(pumpkinTopTex), mat(pumpkinTopTex),
      mat(pumpkinSideTex), mat(pumpkinSideTex)
    ],
    melon: [
      mat(melonSideTex), mat(melonSideTex),
      mat(melonTopTex), mat(melonTopTex),
      mat(melonSideTex), mat(melonSideTex)
    ],
    sponge: mat(spongeTex),
    amethyst: mat(amethystTex),
    ancientDebris: [
      mat(ancientDebrisSideTex), mat(ancientDebrisSideTex),
      mat(ancientDebrisTopTex), mat(ancientDebrisTopTex),
      mat(ancientDebrisSideTex), mat(ancientDebrisSideTex)
    ],
    andesite: mat(andesiteTex),
    polishedAndesite: mat(polishedAndesiteTex),
    diorite: mat(dioriteTex),
    polishedDiorite: mat(polishedDioriteTex),
    granite: mat(graniteTex),
    polishedGranite: mat(polishedGraniteTex),
    deepslate: [
      mat(deepslateTex), mat(deepslateTex),
      mat(deepslateTopTex), mat(deepslateTopTex),
      mat(deepslateTex), mat(deepslateTex)
    ],
    deepslateBricks: mat(deepslateBricksTex),
    deepslateTiles: mat(deepslateTilesTex),
    basalt: [
      mat(basaltSideTex), mat(basaltSideTex),
      mat(basaltTopTex), mat(basaltTopTex),
      mat(basaltSideTex), mat(basaltSideTex)
    ],
    polishedBasalt: [
      mat(polishedBasaltSideTex), mat(polishedBasaltSideTex),
      mat(polishedBasaltTopTex), mat(polishedBasaltTopTex),
      mat(polishedBasaltSideTex), mat(polishedBasaltSideTex)
    ],
    blackstone: [
      mat(blackstoneTex), mat(blackstoneTex),
      mat(blackstoneTopTex), mat(blackstoneTopTex),
      mat(blackstoneTex), mat(blackstoneTex)
    ],
    gildedBlackstone: mat(gildedBlackstoneTex),
    chiseledBlackstone: mat(chiseledBlackstoneTex),
    endStone: mat(endStoneTex),
    endStoneBricks: mat(endStoneBricksTex),
    purpur: mat(purpurTex),
    purpurPillar: [
      mat(purpurPillarTex), mat(purpurPillarTex),
      mat(purpurPillarTopTex), mat(purpurPillarTopTex),
      mat(purpurPillarTex), mat(purpurPillarTex)
    ],
    redSandstone: [
      mat(redSandstoneTex), mat(redSandstoneTex),
      mat(redSandstoneTopTex), mat(redSandstoneBottomTex),
      mat(redSandstoneTex), mat(redSandstoneTex)
    ],
    chiseledRedSandstone: mat(chiseledRedSandstoneTex),
    cutRedSandstone: mat(cutRedSandstoneTex),
    magma: mat(magmaTex),
    soulSand: mat(soulSandTex),
    soulSoil: mat(soulSoilTex),
    boneBlock: [
      mat(boneBlockSideTex), mat(boneBlockSideTex),
      mat(boneBlockTopTex), mat(boneBlockTopTex),
      mat(boneBlockSideTex), mat(boneBlockSideTex)
    ],
    copperBlock: mat(copperBlockTex),
    rawIron: mat(rawIronTex),
    rawGold: mat(rawGoldTex),
    rawCopper: mat(rawCopperTex)
  }

  get = (
    type: MaterialType
  ): THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[] => {
    return this.materials[type]
  }
}
