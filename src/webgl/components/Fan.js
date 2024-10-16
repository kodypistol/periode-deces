import Experience from 'core/Experience.js'
import { BoxGeometry, Mesh, MeshBasicMaterial, Vector2 } from 'three'
import { lerp } from 'three/src/math/MathUtils.js'

export default class Fan {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug

		this._createGeometry()
		this._createMaterial()
		this._createMesh()

		this.targetRotation = 0
	}

	_createGeometry() {
		this._geometry = new BoxGeometry()
	}

	_createMaterial() {
		this._material = new MeshBasicMaterial({ color: 'red' })
	}

	_createMesh() {
		this.mesh = new Mesh(this._geometry, this._material)
		this.mesh.name = 'fan'
		this.scene.add(this.mesh)
	}

	/**
	 * @param {'left' | 'right'} side
	 */
	playTask(side = 'left') {
		let lastAngle = new Vector2()

		this.experience.axis.on(`stick:${side}`, (event) => {
			const distanceFromCenter = event.position.distanceTo(new Vector2())
			const angle = event.position.angle()
			const angleDelta = angle - lastAngle

			if (distanceFromCenter > 0.75 && angleDelta > 0 && angleDelta < 1) {
				this.targetRotation += angleDelta
			}
			lastAngle = angle
		})
	}

	update() {
		this.mesh.rotation.y = lerp(this.mesh.rotation.y, this.targetRotation, 0.01 * this.experience.time.delta)
	}
}
