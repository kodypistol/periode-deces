import Component from './Component'
import { gsap } from 'gsap'

export default class Task extends Component {
	constructor(options = {}) {
		super()
		this.experience = options.experience
		this.scene = this.experience.scene
		this.axis = this.experience.axis
		this.resources = this.scene.resources
		this.isPlaying = false
		this.isPaused = false
		this.isAvailable = false
		this.showTaskTl = null
		this.materials = []
	}

	init() {
		if (this._createMesh === undefined) {
			throw new TypeError('Must override method _createMesh')
		}

		this._createMesh()
		this._setupMaterials()
	}

	_setupMaterials() {
		this.materials = []
		this.mesh.traverse((child) => {
			if (child.isMesh && child.material) {
				this.materials.push(child.material)
			}
		})
	}

	playTask() {
		// To be implemented by subclasses
	}

	pause() {
		if (this.isPlaying && !this.isPaused) {
			this.isPaused = true
			// Implement pausing logic in subclasses
		}
	}

	resume() {
		if (this.isPlaying && this.isPaused) {
			this.isPaused = false
			// Implement resuming logic in subclasses
		}
	}

	showTask() {
		this.isAvailable = true
		this.showTaskTl = gsap.to(this.materials, {
			duration: 0.5,
			opacity: 0.5,
			repeat: -1,
			yoyo: true,
		})
	}

	hideTask() {
		this.isAvailable = false
		if (this.showTaskTl) this.showTaskTl.kill()
		this.materials.forEach((material) => {
			material.opacity = 1
		})
	}

	completeTask() {
		this.isPlaying = false
		this.isPaused = false
		this.hideTask()
		// Use dispatchEvent to emit the 'task:complete' event with the task as a parameter
		this.dispatchEvent({ type: 'task:complete', task: this })
	}

	reset() {
		this.isPlaying = false
		this.isPaused = false
		this.hideTask()
	}
}
