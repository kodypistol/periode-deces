import Experience from 'core/Experience.js'
import Resources from 'core/Resources.js'
import sources from './sources.json'
import Fan from 'components/Fan.js'
import { BackSide, MeshBasicMaterial } from 'three'

export default class Main {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.scene.resources = new Resources(sources)

		this.tasks = []

		this.scene.resources.on('ready', () => {
			this._createSceneElements()
			this._selectionBehavior()
		})
	}

	_createSceneElements() {
		this.fanLeft = new Fan()
		this.tasks.push(this.fanLeft)
		// this.fanLeft.playTask('left')
		this.fanLeft.mesh.position.x -= 2
		this.fanRight = new Fan()
		this.tasks.push(this.fanRight)
		// this.fanRight.playTask('right')
		this.fanRight.mesh.position.x += 2
	}

	_selectionBehavior() {
		const basicMaterial = new MeshBasicMaterial({ color: 'white', side: BackSide })
		const clonedMeshes = []
		this.tasks.forEach((task) => {
			const clonedMesh = task.mesh.clone()
			clonedMesh.scale.set(1.01, 1.01, 1.01)
			clonedMesh.material = basicMaterial
			clonedMesh.visible = false
			clonedMeshes.push(clonedMesh)
			this.scene.add(clonedMesh)
		})

		let leftIndexSelection = 0
		let leftSelectionMode = true
		this.experience.axis.on('down:left', (event) => {
			if (event.key === 'a') {
				this.tasks[leftIndexSelection].playTask('left')
				leftSelectionMode = false
			}
		})

		clonedMeshes[leftIndexSelection].visible = true
		this.experience.axis.on('joystick:move:left', (event) => {
			if (!leftSelectionMode) return
			if (event.position.x > 0.9 || event.position.x < -0.9) {
				clonedMeshes[leftIndexSelection].visible = false
				leftIndexSelection = (leftIndexSelection + 1) % this.tasks.length
				clonedMeshes[leftIndexSelection].visible = true
				// if (rightIndexSelection === leftIndexSelection) leftIndexSelection = (leftIndexSelection + 1) % tasks.length
			}
		})
	}

	update() {
		if (this.fanLeft) this.fanLeft.update()
		if (this.fanRight) this.fanRight.update()
	}
}
