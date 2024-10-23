import Task from 'core/Task'
import { MeshBasicMaterial, MeshStandardMaterial, Vector2 } from 'three'
import { lerp } from 'three/src/math/MathUtils.js'

const SETTINGS = {
	TURNS: 4,
}

export default class Fan extends Task {
	constructor(options = {}) {
		super(options)
		this.targetRotation = 0
	}

	_createMesh() {
		console.log('Fan _createMesh: this.resources:', this.resources)
		const texture = this.resources.items.bakeTexture
		this._material = new MeshBasicMaterial({ map: texture })

		const fanModel = this.resources.items.fanModel
		if (!fanModel) {
			console.error('fanModel not found in resources.items')
			return
		}

		this.mesh = fanModel.scene.children[0].clone()
		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this._material.clone()
				if (child.name === 'HELICES') {
					this.helix = child
				}
			}
		})
		this.mesh.name = 'fan'
		this.add(this.mesh)
	}

	playTask() {
		if (!this.isAvailable || this.isPlaying) return
		this.isPlaying = true
		this.hideTask()

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
				this.completeTask()
				this.axis.off(`joystick:move:right`, handleMove)
				this.targetRotation = 0
				this.helix.rotation.x = 0
			}
		}

		this.axis.on(`joystick:move:right`, handleMove)
	}

	update() {
		if (this.helix) {
			this.helix.rotation.x = lerp(this.helix.rotation.x, -this.targetRotation, 0.01 * this.experience.time.delta)
		}
	}

	reset() {
		super.reset()
		this.targetRotation = 0
		if (this.helix) {
			this.helix.rotation.x = 0
		}
	}
}
