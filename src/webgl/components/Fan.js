import Experience from 'core/Experience.js'
import { BoxGeometry, Mesh, Vector2 } from 'three'
import { lerp } from 'three/src/math/MathUtils.js'

export default class Fan {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug

		this._createGeometry()
		this._createMesh()

		addEventListener('wheel', (event) => {
			this.targetRotation += event.deltaX
		})

		let lastAngle = new Vector2()
		// addEventListener('mousemove', (event) => {
		// 	const x = (event.clientX / innerWidth - 0.5) * 2
		// 	const y = (-event.clientY / innerHeight + 0.5) * 2
		// 	const position = new Vector2(x, y)
		//
		// 	const distanceFromCenter = position.distanceTo(new Vector2())
		// 	const angle = position.angle()
		// 	const angleDelta = angle - lastAngle
		//
		// 	if (distanceFromCenter > 0.75 && angleDelta > 0) {
		// 		this.targetRotation += angleDelta
		// 	}
		// 	lastAngle = angle
		// })

		this.experience.axis.on('stick:left', (event) => {
			const distanceFromCenter = event.position.distanceTo(new Vector2())
			const angle = event.position.angle()
			const angleDelta = angle - lastAngle

			if (distanceFromCenter > 0.75 && angleDelta > 0 && angleDelta < 1) {
				this.targetRotation += angleDelta
			}
			lastAngle = angle
		})

		this.targetRotation = 0
	}

	_createGeometry() {
		this.geometry = new BoxGeometry()
	}

	_createMesh() {
		this.mesh = new Mesh(this.geometry)
		this.scene.add(this.mesh)
	}

	update() {
		this.mesh.rotation.y = lerp(this.mesh.rotation.y, this.targetRotation, 0.01 * this.experience.time.delta)
	}
}
