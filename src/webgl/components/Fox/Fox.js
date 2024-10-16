import Experience from 'core/Experience.js'
import { AnimationMixer, Mesh } from 'three'
import InputManager from 'utils/InputManager.js'
import addObjectDebug from 'utils/addObjectDebug.js'
import AnimationController from 'utils/AnimationController.js'

export default class Fox {
	constructor() {
		this.experience = new Experience()
		this.axis = this.experience.axis
		this.scene = this.experience.scene
		this.resources = this.scene.resources
		this.debug = this.experience.debug
		this.time = this.experience.time

		// Resource
		this.resource = this.resources.items.foxModel

		this.setModel()

		this.animation = new AnimationController({ animations: this.resource.animations, model: this.resource.scene })
		this.animation.fadeAnimation('Survey', { loop: true })

		if (this.debug.active) this.setDebug()
	}

	setModel() {
		this.model = this.resource.scene
		this.model.scale.set(0.02, 0.02, 0.02)
		this.model.name = 'fox'
		this.scene.add(this.model)

		this.model.traverse((child) => {
			if (child instanceof Mesh) {
				child.castShadow = true
			}
		})
	}

	update() {
		this.animation.update(this.time.delta * 0.001)
		const aLValues = this.axis.values.left.stick.position
		const aRValues = this.axis.values.right.stick.position

		const values = {
			x: (aLValues?.x ?? 0) + (aRValues?.x ?? 0),
			y: (aLValues?.y ?? 0) + (aRValues?.y ?? 0),
		}

		this.model.position.x += values.x * 0.01
		this.model.position.z += values.y * 0.01
	}

	setDebug() {
		const debugFolder = addObjectDebug(this.debug.ui, this.model)
		this.animation.setDebug(debugFolder)
	}
}
