import Experience from 'core/Experience.js'
import { BoxGeometry, Mesh, MeshBasicMaterial, Plane, PlaneGeometry, Scene, Vector2 } from 'three'
import { lerp } from 'three/src/math/MathUtils.js'
import EventEmitter from '../core/EventEmitter'
import Component from '../core/Component'
import { gsap } from 'gsap'
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer'

export default class Horloge extends Component {
	constructor() {
		super()
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.resources = this.scene.resources
		this.debug = this.experience.debug
		this.camera = this.experience.camera
		this.dayManager = this.experience.dayManager
		this.moneyManager = this.experience.moneyManager

				this._createMaterial()
				this._createMesh()

		this.css3dRenderer = this.setCss3dRenderer()
		this.css3dScene = this.setCss3dScene()

		this.screenPoint = this.setScreenPoint()
		this.screenElement = this.setScreenElement()
		this.screenBounds = this.setScreenBounds()
	}

	_createMaterial() {
		const texture = this.resources.items.horloge
		// texture.channel = 1

		this.material = new MeshBasicMaterial({
			map: texture,
		})
	}

	_createMesh() {
		this.mesh = this.resources.items.horlogeModel.scene.clone()
		console.log(this.mesh);

		this.mesh.traverse((child) => {
			if (child.isMesh) {
				console.log(child);

				child.material = this.material
			}
		})

		this.mesh.name = 'horloge'
		this.scene.add(this.mesh)
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
		const screen = document.querySelector('.horloge-screen')

		const cssObject = new CSS3DObject(screen)

		// Position it on the cube (modify this based on your cube's dimensions and face positioning)
		cssObject.position.copy(this.screenPoint.position) // Example, adjust to position on the correct face
		cssObject.rotation.copy(this.screenPoint.rotation) // Example, adjust to position on the correct face
		cssObject.scale.set(0.005, 0.005, 0.005) // Adjust the rotation as needed

		this.css3dScene.add(cssObject)

		return cssObject
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
		// screenPoint.position.set(-0.97194, 0.24741, 1.466)
		screenPoint.position.set(-0.97694, 1.426, -0.34741)
		screenPoint.rotation.y = Math.PI / 6;

		this.scene.add(screenPoint)

		return screenPoint
	}

	update() {
		this.css3dRenderer.render(this.css3dScene, this.camera.instance)
	}
}
