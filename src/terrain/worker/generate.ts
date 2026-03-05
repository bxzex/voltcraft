import * as THREE from 'three'
import Block from '../mesh/block'
import Noise from '../noise'

enum BlockType {
  grass = 0,
  sand = 1,
  tree = 2,
  leaf = 3,
  dirt = 4,
  stone = 5,
  coal = 6,
  wood = 7,
  diamond = 8,
  quartz = 9,
  glass = 10,
  bedrock = 11,
  water = 12,
  // New blocks
  cobblestone = 13,
  bricks = 14,
  stoneBricks = 15,
  obsidian = 16,
  iron = 17,
  ironBlock = 18,
  goldBlock = 19,
  emeraldBlock = 20,
  lapisBlock = 21,
  redstoneOre = 22,
  tnt = 23,
  bookshelf = 24,
  mossyCobblestone = 25,
  netherrack = 26,
  glowstone = 27,
  gravel = 28,
  clay = 29,
  snow = 30,
  craftingTable = 31,
  furnace = 32,
  birchPlanks = 33,
  sprucePlanks = 34,
  netherBricks = 35,
  pumpkin = 36,
  melon = 37,
  sponge = 38,
  amethyst = 39,
  ancientDebris = 40,
  andesite = 41,
  polishedAndesite = 42,
  diorite = 43,
  polishedDiorite = 44,
  granite = 45,
  polishedGranite = 46,
  deepslate = 47,
  deepslateBricks = 48,
  deepslateTiles = 49,
  basalt = 50,
  polishedBasalt = 51,
  blackstone = 52,
  gildedBlackstone = 53,
  chiseledBlackstone = 54,
  endStone = 55,
  endStoneBricks = 56,
  purpur = 57,
  purpurPillar = 58,
  redSandstone = 59,
  chiseledRedSandstone = 60,
  cutRedSandstone = 61,
  magma = 62,
  soulSand = 63,
  soulSoil = 64,
  boneBlock = 65,
  copperBlock = 66,
  rawIron = 67,
  rawGold = 68,
  torch = 70
}

function generateHouse(x: number, y: number, z: number, idMap: Map<string, number>, blocksCount: number[], blocks: THREE.InstancedMesh[], matrix: THREE.Matrix4) {
  // Simple house 5x5
  for (let dx = 0; dx < 5; dx++) {
    for (let dz = 0; dz < 5; dz++) {
      for (let dy = 0; dy < 4; dy++) {
        // Walls and Roof
        const isWall = (dx === 0 || dx === 4 || dz === 0 || dz === 4) && dy < 3;
        const isRoof = dy === 3;
        const isDoor = dx === 2 && dz === 0 && dy < 2;
        
        if ((isWall || isRoof) && !isDoor) {
          const px = x + dx;
          const py = y + dy;
          const pz = z + dz;
          const type = isRoof ? BlockType.wood : BlockType.stoneBricks;
          matrix.setPosition(px, py, pz);
          idMap.set(`${px}_${py}_${pz}`, blocksCount[type]);
          blocks[type].setMatrixAt(blocksCount[type]++, matrix);
        }
      }
    }
  }
}

const matrix = new THREE.Matrix4()
const noise = new Noise()
const blocks: THREE.InstancedMesh[] = []

const geometry = new THREE.BoxGeometry()

let isFirstRun = true

onmessage = (
  msg: MessageEvent<{
    distance: number
    chunk: THREE.Vector2
    noiseSeed: number
    treeSeed: number
    stoneSeed: number
    coalSeed: number
    idMap: Map<string, number>
    blocksFactor: number[]
    blocksCount: number[]
    customBlocks: Block[]
    chunkSize: number
  }>
) => {
  // let p1 = performance.now()
  const {
    distance,
    chunk,
    noiseSeed,
    idMap,
    blocksFactor,
    treeSeed,
    stoneSeed,
    coalSeed,
    customBlocks,
    blocksCount,
    chunkSize
  } = msg.data

  const maxCount = (distance * chunkSize * 2 + chunkSize) ** 2 + 500

  if (isFirstRun) {
    for (let i = 0; i < blocksCount.length; i++) {
      let block = new THREE.InstancedMesh(
        geometry,
        new THREE.MeshBasicMaterial(),
        maxCount * blocksFactor[i]
      )
      blocks.push(block)
    }

    isFirstRun = false
  }

  noise.seed = noiseSeed
  noise.treeSeed = treeSeed
  noise.stoneSeed = stoneSeed
  noise.coalSeed = coalSeed

  for (let i = 0; i < blocks.length; i++) {
    blocks[i].instanceMatrix = new THREE.InstancedBufferAttribute(
      new Float32Array(maxCount * blocksFactor[i] * 16),
      16
    )
  }

  for (
    let x = -chunkSize * distance + chunkSize * chunk.x;
    x < chunkSize * distance + chunkSize + chunkSize * chunk.x;
    x++
  ) {
    for (
      let z = -chunkSize * distance + chunkSize * chunk.y;
      z < chunkSize * distance + chunkSize + chunkSize * chunk.y;
      z++
    ) {
      const y = 30
      const yOffset = Math.floor(
        noise.get(x / noise.gap, z / noise.gap, noise.seed) * noise.amp
      )

      matrix.setPosition(x, y + yOffset, z)

      const stoneOffset =
        noise.get(x / noise.stoneGap, z / noise.stoneGap, noise.stoneSeed) *
        noise.stoneAmp

      const coalOffset =
        noise.get(x / noise.coalGap, z / noise.coalGap, noise.coalSeed) *
        noise.coalAmp

      if (stoneOffset > noise.stoneThreshold) {
        if (coalOffset > noise.coalThreshold) {
          // coal
          idMap.set(`${x}_${y + yOffset}_${z}`, blocksCount[BlockType.coal])
          blocks[BlockType.coal].setMatrixAt(
            blocksCount[BlockType.coal]++,
            matrix
          )
        } else {
          // stone
          idMap.set(`${x}_${y + yOffset}_${z}`, blocksCount[BlockType.stone])
          blocks[BlockType.stone].setMatrixAt(
            blocksCount[BlockType.stone]++,
            matrix
          )
        }
      } else {
        if (yOffset < -1) {
          // sand
          idMap.set(`${x}_${y + yOffset}_${z}`, blocksCount[BlockType.sand])
          blocks[BlockType.sand].setMatrixAt(
            blocksCount[BlockType.sand]++,
            matrix
          )

          // Generate water above sand up to sea level (-1)
          // Optimization: Only top layer of water is often enough for visibility if underwater is not rendered, 
          // but for "instant" feel we just make sure the loop is tight.
          for (let wy = -1; wy > yOffset; wy--) {
            matrix.setPosition(x, y + wy, z)
            idMap.set(`${x}_${y + wy}_${z}`, blocksCount[BlockType.water])
            blocks[BlockType.water].setMatrixAt(
              blocksCount[BlockType.water]++,
              matrix
            )
          }
        } else {
          // grass
          idMap.set(`${x}_${y + yOffset}_${z}`, blocksCount[BlockType.grass])
          blocks[BlockType.grass].setMatrixAt(
            blocksCount[BlockType.grass]++,
            matrix
          )

          // Randomly generate a house on grass
          if (Math.random() < 0.001) {
            generateHouse(x, y + yOffset + 1, z, idMap, blocksCount, blocks, matrix);
          }
        }
      }

      // tree
      const treeOffset =
        noise.get(x / noise.treeGap, z / noise.treeGap, noise.treeSeed) *
        noise.treeAmp

      if (
        treeOffset > noise.treeThreshold &&
        yOffset >= -3 &&
        stoneOffset < noise.stoneThreshold
      ) {
        for (let i = 1; i <= noise.treeHeight; i++) {
          idMap.set(`${x}_${y + yOffset + i}_${z}`, blocksCount[BlockType.tree])

          matrix.setPosition(x, y + yOffset + i, z)

          blocks[BlockType.tree].setMatrixAt(
            blocksCount[BlockType.tree]++,
            matrix
          )
        }

        // leaf
        for (let i = -3; i < 3; i++) {
          for (let j = -3; j < 3; j++) {
            for (let k = -3; k < 3; k++) {
              if (i === 0 && k === 0) {
                continue
              }
              const leafOffset =
                noise.get(
                  (x + i + j) / noise.leafGap,
                  (z + k) / noise.leafGap,
                  noise.leafSeed
                ) * noise.leafAmp
              if (leafOffset > noise.leafThreshold) {
                idMap.set(
                  `${x + i}_${y + yOffset + noise.treeHeight + j}_${z + k}`,
                  blocksCount[BlockType.leaf]
                )
                matrix.setPosition(
                  x + i,
                  y + yOffset + noise.treeHeight + j,
                  z + k
                )
                blocks[BlockType.leaf].setMatrixAt(
                  blocksCount[BlockType.leaf]++,
                  matrix
                )
              }
            }
          }
        }
      }
    }
  }

  for (const block of customBlocks) {
    if (
      block.x > -chunkSize * distance + chunkSize * chunk.x &&
      block.x < chunkSize * distance + chunkSize + chunkSize * chunk.x &&
      block.z > -chunkSize * distance + chunkSize * chunk.y &&
      block.z < chunkSize * distance + chunkSize + chunkSize * chunk.y
    ) {
      if (block.placed) {
        // placed blocks
        matrix.setPosition(block.x, block.y, block.z)
        blocks[block.type].setMatrixAt(blocksCount[block.type]++, matrix)
      } else {
        // removed blocks
        const id = idMap.get(`${block.x}_${block.y}_${block.z}`)

        blocks[block.type].setMatrixAt(
          id!,
          new THREE.Matrix4().set(
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0
          )
        )
      }
    }
  }

  const arrays = blocks.map(block => block.instanceMatrix.array)
  postMessage({ idMap, arrays, blocksCount })
  // console.log(performance.now() - p1)
}
