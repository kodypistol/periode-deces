import Experience from 'core/Experience.js'
import { MeshBasicMaterial, PlaneGeometry, Mesh } from 'three'
import addObjectDebug from '../utils/addObjectDebug'

export default class Desk {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug
		this.dayManager = this.experience.dayManager

		this._createMaterial('bakeTexture')
		this._createMesh('deskModel')
		this._createPostIts()

		this.dayManager.on('day:finished', (day) => {
			this._updateBackgroundForDay(this.dayManager.day.index)
		})
	}

	_createMaterial(textureKey) {
		const texture = this.scene.resources.items[textureKey]
		this._material = new MeshBasicMaterial({ map: texture })
	}

	_createMesh(modelKey) {
		this.mesh = this.scene.resources.items[modelKey].scene.clone()

		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this._material
				if (child.name === '_NAS') {
					// replace mesh with this.scene.resources.items.sasModel.scene.clone()
					child.geometry = this.scene.resources.items.nasModel.scene.clone().children[0].geometry
					// child.geometry.attributes.uv = child.geometry.attributes.uv1.clone()
					child.material = new MeshBasicMaterial({ map: this.scene.resources.items.NASTexture })
					//flipY
					child.material.map.flipY = false
				}
			}

			if (child.name === 'Paper') {
				child.position.y += 0.003
			}
		})
		this.mesh.name = 'background'
		this.scene.add(this.mesh)
	}

	_createPostIts() {
		const geometry = new PlaneGeometry(1, 1)
		const texture1 = this.scene.resources.items.postItZiziTexture
		const material1 = new MeshBasicMaterial({ map: texture1 })
		const postIt1 = new Mesh(geometry, material1)
		let scale = 0.3
		postIt1.scale.set(scale, scale, scale)
		postIt1.position.set(-1.15, 1.7, -1)
		postIt1.rotation.set(-0.2, 0, -0.2)
		this.scene.add(postIt1)

		const texture2 = this.scene.resources.items.postItWolfTexture
		const material2 = new MeshBasicMaterial({ map: texture2 })
		const postIt2 = new Mesh(geometry, material2)
		postIt2.position.set(1.7, 1.7, -1)
		postIt2.rotation.set(-0.2, 0, 0.2)
		scale = 0.4
		postIt2.scale.set(scale, scale, scale)
		this.scene.add(postIt2)

		const texture3 = this.scene.resources.items.posterWolfTexture
		const material3 = new MeshBasicMaterial({ map: texture3, transparent: false })
		const poster = new Mesh(geometry, material3)
		poster.position.set(1.65, 2.05, -1.05)
		poster.rotation.set(-0, 0, -0.1)
		scale = 0.5
		poster.scale.set(scale, scale, scale)
		this.scene.add(poster)

		const texture4 = this.scene.resources.items.posterGirlTexture
		const material4 = new MeshBasicMaterial({ map: texture4, transparent: false })
		const poster2 = new Mesh(geometry, material4)
		poster2.position.set(-1.4, 2, -1.05)
		poster2.rotation.set(-0, 0, 0.1)
		scale = 0.4
		poster2.scale.set(scale, scale, scale)
		this.scene.add(poster2)
	}

	_updateBackgroundForDay(day) {
		// Remove the old background
		this.scene.remove(this.mesh)

		// Choose different model and texture based on the day
		let newModelKey = 'deskModel'
		let newTextureKey = 'bakeTexture'

		if (day === 2) {
			newModelKey = 'deskModel2'
			newTextureKey = 'bakeTexture2'
		} else if (day === 3) {
			newModelKey = 'deskModel3'
			newTextureKey = 'bakeTexture3'
		}
		// Add more conditions for different days if needed

		// Create new material and mesh based on the new day
		this._createMaterial(newTextureKey)
		this._createMesh(newModelKey)
	}
}
