// Desk.js
import Experience from 'core/Experience.js'
import { MeshBasicMaterial } from 'three'

export default class Desk {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug
		this.dayManager = this.experience.dayManager

		this._createMaterial()
		this._createMesh()
		this._createPostIts()

		// Listen to day change events
		this.dayManager.on('day:changed', () => {
			const dayIndex = this.dayManager.day.index
			this.updateDeskModelForDay(dayIndex)
		})
	}

	_createMaterial() {
		const texture = this.scene.resources.items.bakeTexture
		this._material = new MeshBasicMaterial({ map: texture })
	}

	_createMesh() {
		this.mesh = null
		const dayIndex = this.dayManager.day.index
		this.updateDeskModelForDay(dayIndex)
	}

	updateDeskModelForDay(dayIndex) {
		// Remove the old mesh
		if (this.mesh) {
			this.scene.remove(this.mesh)
			this.mesh.traverse((child) => {
				if (child.geometry) child.geometry.dispose()
				if (child.material) child.material.dispose()
			})
		}

		// Get the new desk model
		const deskModelName = `deskModelDay${dayIndex}`
		const deskModelResource = this.scene.resources.items[deskModelName]
		if (!deskModelResource) {
			console.warn(`Desk model for day ${dayIndex} not found.`)
			return
		}

		// Clone and add the new mesh
		this.mesh = deskModelResource.scene.clone()
		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this._material
				if (child.name === '_NAS') {
					child.material = new MeshBasicMaterial({ color: 0x333333, side: 0 })
				}
			}
		})
		this.mesh.name = 'desk'
		this.scene.add(this.mesh)
	}

	_createPostIts() {
		// If post-its change per day, handle them here
	}
}
