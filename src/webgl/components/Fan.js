import Experience from 'core/Experience.js'
import { MeshBasicMaterial, Vector2 } from 'three'
import { lerp } from 'three/src/math/MathUtils.js'
import EventEmitter from '../core/EventEmitter'
import Component from '../core/Component'
import { gsap } from 'gsap'

const SETTINGS = {
	TURNS: 4,
}
export default class Fan extends Component {
	constructor() {
		super()
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug

		this._createMaterial()
		this._createMesh()

		this.targetRotation = 0
	}

	_createMaterial() {
		const texture = this.scene.resources.items.bakeTexture
		// texture.flipY = false
		// texture.channels = 1
		this._material = new MeshBasicMaterial({ map: texture })

		this._witnessMaterial = new MeshBasicMaterial({ map: texture })
	}

	_createMesh() {
		this.mesh = this.scene.resources.items.fanModel.scene.children[0].clone()
		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this._material
				// child.material.depthTest = false
				if (child.name === 'HELICES') {
					this.helix = child
				}
				if (child.name === 'BOUTON') {
					this.witness = child
					child.material = this._witnessMaterial
					// child.material.depthTest = false
				}
			}
		})
		this.mesh.name = 'fan'

		this.scene.resources.items.taskBackgrounds.scene.traverse((child) => {
			if (child.name.includes('fan')) {
				this.backgroundMesh = child
				this.backgroundMesh.material = new MeshBasicMaterial({ color: 0x000000 })
				this.backgroundMesh.visible = false
			}
		})

		this.add(this.mesh)
		this.add(this.backgroundMesh)
		// addObjectDebug(this.debug.ui, this.mesh)
	}

	/**
	 * @param {'left' | 'right'} side
	 */
	playTask(side = 'left') {
		this.isPlaying = true
		this.showTaskTl?.kill()
		this.witness.material.color.set(0xffffff)

		let lastAngle = new Vector2()

		const handleMove = (event) => {
			const distanceFromCenter = event.position.distanceTo(new Vector2())
			const angle = event.position.angle()
			const angleDelta = angle - lastAngle

			if (distanceFromCenter > 0.75 && angleDelta > 0 && angleDelta < 1) {
				this.targetRotation += angleDelta
			}
			lastAngle = angle

			if (this.targetRotation >= Math.PI * 2 * SETTINGS.TURNS) {
				this.trigger('task:complete')
				this.isPlaying = false
				this.experience.axis.off(`joystick:move:${side}`, handleMove)

				this.targetRotation = Math.PI * 2 * SETTINGS.TURNS

				setTimeout(() => {
					this.targetRotation = 0
					this.helix.rotation.x = 0
				}, 1000)
			}
		}

		this.experience.axis.on(`joystick:move:${side}`, handleMove)
	}

	showTask() {
		this.showTaskTl = gsap.to(this.witness.material.color, {
			r: 100,
			duration: 0.5,
			repeat: -1,
			yoyo: true,
		})
	}

	update() {
		this.helix.rotation.x = lerp(this.helix.rotation.x, -this.targetRotation, 0.01 * this.experience.time.delta)
	}
}
