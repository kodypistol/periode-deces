import Experience from 'core/Experience.js'
import fragmentShader from './fragment.glsl'
import vertexShader from './vertex.glsl'
import {
	BoxGeometry,
	Mesh,
	Scene,
	ShaderMaterial,
	MeshNormalMaterial,
	Vector3,
	Object3D,
	MeshBasicMaterial,
} from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import addObjectDebug from '@/webgl/utils/addObjectDebug'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import Graph from './activities/Graph'
import EventEmitter from 'core/EventEmitter.js'

import moneyManager from 'core/MoneyManager'

export default class Computer extends EventEmitter {
	constructor(_position = new Vector3(0, 0, 0)) {
		super()
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug
		this.camera = this.experience.camera // Get the camera for projection
		this.resources = this.scene.resources
		this.position = _position

		this.css3dRenderer = this.setCss3dRenderer()
		this.css3dScene = this.setCss3dScene()

		this.screenPoint = this.setScreenPoint()
		this.screenElement = this.setScreenElement()
		this.screenMoneyCounter = this.setScreenMoneyCounter()
		this.screenBounds = this.setScreenBounds()

		this.setMaterial()
		this.setMesh()
		this.setDebug()

		this.tempPosition = new Vector3()

		this._graphActivity = new Graph()

		this._graphActivity.on('end', () => {
			this._graphActivity.hide()
			this._graphActivity.reset()
			this.trigger('task:complete')
			this.isPlaying = false
		})
	}

	showTask() {
		//TODO: Show random task
		this._graphActivity.showTask()
	}

	playTask(side) {
		this.isPlaying = true
		this._graphActivity.playTask(side)
	}

	setMaterial() {
		// this.material = new ShaderMaterial({
		// 	fragmentShader,
		// 	vertexShader,
		// 	uniforms: {
		// 		uOpacity: { value: 1 },
		// 	},
		// })

		const texture = this.resources.items.bakeTexture
		texture.channel = 1

		this.material = new MeshBasicMaterial({
			map: texture,
		})
	}

	setMesh() {
		this.mesh = this.resources.items.computerModel.scene.clone()

		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this.material
			}
		})

		this.scene.resources.items.taskBackgrounds.scene.traverse((child) => {
			if (child.name.includes('computer')) {
				this.backgroundMesh = child
				this.backgroundMesh.material = new MeshBasicMaterial({ color: 0x000000 })
				this.backgroundMesh.visible = false
			}
		})

		this.scene.add(this.backgroundMesh)
		this.scene.add(this.mesh)

		return this.mesh
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
		const scene = new Scene()

		return scene
	}

	setScreenElement() {
		const screen = document.querySelector('.computer-screen')

		const cssObject = new CSS3DObject(screen)

		// Position it on the cube (modify this based on your cube's dimensions and face positioning)
		cssObject.position.copy(this.screenPoint.position) // Example, adjust to position on the correct face
		cssObject.rotation.copy(this.screenPoint.rotation) // Example, adjust to position on the correct face
		cssObject.scale.set(0.0105, 0.0105, 0.0105) // Adjust the rotation as needed

		this.css3dScene.add(cssObject)

		return cssObject
	}

	setScreenMoneyCounter() {
		const screen = document.querySelector('.computer-screen')
		const moneyDisplay = screen.querySelector('.money-counter')

		const moneySpan = document.createElement('span')

		moneySpan.textContent = moneyManager.formatNumber(moneyManager.money)

		moneyDisplay.appendChild(moneySpan)

		moneyManager.setOnMoneyChangeCallback((newMoney) => {
			moneySpan.textContent = moneyManager.formatNumber(newMoney)
		})

		setTimeout(() => {
			moneyManager.subtractMoneyRate(0.02, 2)
		}, (Math.random() * 10 + 5) * 1000)
	}

	setScreenBounds() {
		const screenBounds = {}

		screenBounds.left = this.screenPoint.position.x
		screenBounds.right = this.screenPoint.position.x
		screenBounds.top = this.screenPoint.position.y
		screenBounds.bottom = this.screenPoint.position.y

		return screenBounds
	}

	setScreenPoint() {
		const screenPoint = new Mesh(new BoxGeometry(0.1, 0.1, 0.1), new MeshBasicMaterial({ color: 0xff0000 }))
		screenPoint.position.set(0.06, 2.17, -0.47)
		// screenPoint.rotation.y = Math.PI;

		this.scene.add(screenPoint)

		return screenPoint
	}

	update() {
		this.css3dRenderer.render(this.css3dScene, this.camera.instance)
		if (this._graphActivity.update) this._graphActivity.update()
	}

	setDebug() {
		if (this.debug.active) {
			addObjectDebug(this.debug.ui, this.screenPoint, { title: 'Cube' })
		}
	}
}
