import Experience from 'core/Experience.js'
import { MeshBasicMaterial } from 'three'

export default class Desk {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug

		this._createMaterial()
		this._createMesh()
	}

	_createMaterial() {
		const texture = this.scene.resources.items.bakeTexture
		this._material = new MeshBasicMaterial({ map: texture })
	}

	_createMesh() {
		this.mesh = this.scene.resources.items.deskModel.scene.clone()
		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this._material
			}
		})
		this.mesh.name = 'background'
		this.scene.add(this.mesh)
	}
}
