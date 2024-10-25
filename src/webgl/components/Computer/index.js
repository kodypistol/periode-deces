import Task from 'core/Task'
import Graph from './activities/Graph'
import { MeshBasicMaterial, Object3D } from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import Call from 'components/Computer/activities/Call.js'

export default class Computer extends Task {
	constructor(options = {}) {
		super(options)
		this.camera = this.experience.camera
		this.sizes = this.experience.sizes
		this.activities = []

		this.sizes.on('resize', this.resize.bind(this))
	}

	init() {
		super.init()
		this.experience.computer = this

		this.activities.push(new Graph())
		this.activities.push(new Call())

		this.activities[1].playTask()

		this.activities.forEach((activity) => {
			activity.on('activity:end', this.handleEndActivity.bind(this))
		})
	}

	handleEndActivity(activity) {
		console.log(activity);

		activity.hide()
		activity.reset()

		this.activeActivity = null
		this.completeTask()
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
		cssObject.scale.set(0.0105, 0.011, 0.0105)

		this.css3dScene.add(cssObject)

		return cssObject
	}

	setScreenPoint() {
		const screenPoint = new Object3D()
		screenPoint.position.set(0.06, 2.16, -0.47)
		this.scene.add(screenPoint)
		return screenPoint
	}

	showTask() {
		super.showTask()

		const randomIndex = Math.floor(Math.random() * this.activities.length)
		const randomActivity = this.activities[randomIndex]
		this.activeActivity = randomActivity

		this.activeActivity.showTask()
	}

	playTask() {
		if (!this.isAvailable || this.isPlaying) {
			return
		}
		this.isPlaying = true
		this.hideTask()

		this.activeActivity.playTask()
	}

	update() {
		// Update CSS3DRenderer if needed
		if (this.css3dRenderer && this.css3dScene && this.camera.instance) {
			this.css3dRenderer.render(this.css3dScene, this.camera.instance)
		}
		if(this.activeActivity) {
			this.activeActivity.update()
		}
	}

	resize() {
		this.css3dRenderer.setSize(window.innerWidth, window.innerHeight)
	}

	reset() {
		super.reset()
		this.activities.forEach((activity) => activity.reset())
	}
}
