// Background.js
import Experience from 'core/Experience.js'
import { MeshBasicMaterial } from 'three'

export default class Background {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug
		this.dayManager = this.experience.dayManager

		// Initialize materials and mesh
		this._materials = {}
		this.mesh = null

		// Create initial material and mesh based on the starting day
		const dayIndex = this.dayManager.day.index
		this.updateMaterialForDay(dayIndex)
		this.updateBackgroundForDay(dayIndex)

		// Listen to day change events to update background
		this.dayManager.on('day:changed', () => {
			const newDayIndex = this.dayManager.day.index
			this.updateMaterialForDay(newDayIndex)
			this.updateBackgroundForDay(newDayIndex)
		})
	}

	updateMaterialForDay(dayIndex) {
		const textureName = `bakeBackgroundTextureDay${dayIndex}`
		const texture = this.scene.resources.items[textureName]
		if (!texture) {
			console.warn(`Background texture for day ${dayIndex} not found.`)
			return
		}
		texture.flipY = false
		const material = new MeshBasicMaterial({ map: texture })

		// Store material for reuse if needed
		this._materials[dayIndex] = material
	}

	updateBackgroundForDay(dayIndex) {
		// Remove the old mesh if it exists
		if (this.mesh) {
			this.scene.remove(this.mesh)
			this.mesh.traverse((child) => {
				if (child.geometry) child.geometry.dispose()
				if (child.material) child.material.dispose()
			})
		}

		// Get the new background model
		const modelName = `backgroundModelDay${dayIndex}`
		const modelResource = this.scene.resources.items[modelName]
		if (!modelResource) {
			console.warn(`Background model for day ${dayIndex} not found.`)
			return
		}

		// Clone and add the new mesh
		this.mesh = modelResource.scene.clone()
		const material = this._materials[dayIndex]
		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = material
				if (child.name === 'Cork001') {
					if (child.geometry.attributes.uv1) {
						child.geometry.attributes.uv = child.geometry.attributes.uv1.clone()
					}
				}
			}
		})
		this.mesh.name = 'background'
		this.scene.add(this.mesh)
	}
}
