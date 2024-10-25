import Experience from 'core/Experience.js'
import { MeshBasicMaterial } from 'three'

export default class Background {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug
		this.dayManager = this.experience.dayManager
		this._createMaterial('bakeBackgroundTexture')
		this._createMesh('backgroundModel')

		this.dayManager.on('day:finished', (day) => {
			this._updateBackgroundForDay(this.dayManager.day.index)
		})
	}

	_createMaterial(textureKey) {
		const texture = this.scene.resources.items[textureKey]
		texture.flipY = false
		this._material = new MeshBasicMaterial({ map: texture })
	}

	_createMesh(modelKey) {
		this.mesh = this.scene.resources.items[modelKey].scene.clone()
		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this._material
				if (child.name === 'Cork001') {
					child.geometry.attributes.uv = child.geometry.attributes.uv1.clone()
				}
			}
		})
		this.mesh.name = 'background'
		this.scene.add(this.mesh)
	}

	_updateBackgroundForDay(day) {
		// Remove the old background
		this.scene.remove(this.mesh)

		// Choose different model and texture based on the day
		let newModelKey = 'backgroundModel'
		let newTextureKey = 'bakeBackgroundTexture'

		if (day === 2) {
			newModelKey = 'backgroundModel2'
			newTextureKey = 'bakeBackgroundTexture2'
		} else if (day === 3) {
			newModelKey = 'backgroundModel3'
			newTextureKey = 'bakeBackgroundTexture3'
		}
		// Add more conditions for different days if needed

		// Create new material and mesh based on the new day
		this._createMaterial(newTextureKey)
		this._createMesh(newModelKey)
	}
}
