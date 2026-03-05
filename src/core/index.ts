import * as THREE from 'three'

export default class Core {
  constructor() {
    this.camera = new THREE.PerspectiveCamera()
    this.renderer = new THREE.WebGLRenderer()
    this.scene = new THREE.Scene()
    this.initScene()
    this.initRenderer()
    this.initCamera()
  }

  camera: THREE.PerspectiveCamera
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  sunLight!: THREE.DirectionalLight
  fillLight!: THREE.DirectionalLight
  reflectionLight!: THREE.AmbientLight

  initCamera = () => {
    this.camera.fov = 50
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.near = 0.01
    this.camera.far = 500
    this.camera.updateProjectionMatrix()
    this.camera.position.set(8, 50, 8)

    this.camera.lookAt(100, 30, 100)

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
    })
  }

  initScene = () => {
    this.scene = new THREE.Scene()
    const backgroundColor = 0x87ceeb

    this.scene.fog = new THREE.Fog(backgroundColor, 1, 96)
    this.scene.background = new THREE.Color(backgroundColor)

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0)
    this.sunLight.position.set(100, 100, 100)
    this.sunLight.castShadow = false // Optimization
    this.scene.add(this.sunLight)

    this.fillLight = new THREE.DirectionalLight(0xffffff, 0.4)
    this.fillLight.position.set(-100, 50, -100)
    this.scene.add(this.fillLight)

    this.reflectionLight = new THREE.AmbientLight(0x606060)
    this.scene.add(this.reflectionLight)
  }

  initRenderer = () => {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })
  }
}
