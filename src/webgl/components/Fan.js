import Experience from 'core/Experience.js'
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector2 } from 'three'
import { lerp } from 'three/src/math/MathUtils.js'
import addObjectDebug from 'utils/addObjectDebug.js'
import EventEmitter from '../core/EventEmitter'

const SETTINGS = {
	TURNS: 4,
}
export default class Fan extends EventEmitter {
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
	}

	_createMesh() {
		this.mesh = this.scene.resources.items.fanModel.scene.children[0].clone()
		console.log(this.scene.resources.items.fanModel)
		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this._material
				if (child.name === 'HELICES') {
					this.helix = child
				}
			}
		})
		this.mesh.name = 'fan'

		this.scene.add(this.mesh)
		// addObjectDebug(this.debug.ui, this.mesh)
	}

	/**
	 * @param {'left' | 'right'} side
	 */
	playTask(side = 'left') {
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

	update() {
		this.helix.rotation.x = lerp(this.helix.rotation.x, -this.targetRotation, 0.01 * this.experience.time.delta)
	}
}
