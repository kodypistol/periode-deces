import Task from 'core/Task'
import Graph from './activities/Graph'
import { MeshBasicMaterial, Object3D } from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'

export default class Computer extends Task {
	constructor(options = {}) {
		super(options)
		this.camera = this.experience.camera // Get the camera for projection

		this._graphActivity = new Graph()

		this._graphActivity.on('end', () => {
			this._graphActivity.hide()
			this._graphActivity.reset()
			this.completeTask()
			this.isPlaying = false
		})
	}

	_createMesh() {
		const texture = this.resources.items.bakeTexture
		texture.channel = 1

		this._material = new MeshBasicMaterial({ map: texture })

		const computerModel = this.resources.items.computerModel
		if (!computerModel) {
			console.error('computerModel not found in resources.items')
			return
		}

		this.mesh = computerModel.scene.clone()

		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this._material
			}
		})

		this.mesh.name = 'computer'
		this.add(this.mesh)

		// Initialize CSS3D renderer and scene
		this.css3dRenderer = this.setCss3dRenderer()
		this.css3dScene = this.setCss3dScene()

		// Set up screen elements
		this.screenPoint = this.setScreenPoint()
		this.screenElement = this.setScreenElement()
	}

	setCss3dRenderer() {
		const renderer = new CSS3DRenderer()
		renderer.setSize(window.innerWidth, window.innerHeight)
		renderer.domElement.style.position = 'absolute'
		renderer.domElement.style.top = 0
		renderer.domElement.style.pointerEvents = 'none'
		document.body.appendChild(renderer.domElement)

		return renderer
	}

	setCss3dScene() {
		const scene = new Object3D()
		return scene
	}

	setScreenElement() {
		const screen = document.querySelector('.computer-screen')

		const cssObject = new CSS3DObject(screen)

		// Position it on the screen point
		cssObject.position.copy(this.screenPoint.position)
		cssObject.rotation.copy(this.screenPoint.rotation)
		cssObject.scale.set(0.0105, 0.0105, 0.0105)

		this.css3dScene.add(cssObject)

		return cssObject
	}

	setScreenPoint() {
		const screenPoint = new Object3D()
		screenPoint.position.set(0.06, 2.17, -0.47)
		this.scene.add(screenPoint)
		return screenPoint
	}

	playTask() {
		if (!this.isAvailable || this.isPlaying) return
		console.log('play')
		this.isPlaying = true
		this.hideTask()
		this._graphActivity.showTask()
		this._graphActivity.playTask()
	}

	update() {
		// Update CSS3DRenderer if needed
		if (this.css3dRenderer && this.css3dScene && this.camera.instance) {
			this.css3dRenderer.render(this.css3dScene, this.camera.instance)
		}
	}

	reset() {
		super.reset()
		this._graphActivity.reset()
	}
}
