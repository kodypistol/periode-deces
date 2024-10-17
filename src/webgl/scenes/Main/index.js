import Experience from 'core/Experience.js'
import Resources from 'core/Resources.js'
import sources from './sources.json'
import Fan from 'components/Fan.js'
import { BackSide, Mesh, MeshBasicMaterial } from 'three'

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
		this.fanLeft.mesh.position.x -= 2

		this.fanRight = new Fan()
		this.tasks.push(this.fanRight)
		this.fanRight.mesh.position.x += 2

		this.fanLeft1 = new Fan()
		this.tasks.push(this.fanLeft1)
		this.fanLeft1.mesh.position.x -= 2
		this.fanLeft1.mesh.position.y -= 2

		this.fanRight1 = new Fan()
		this.tasks.push(this.fanRight1)
		this.fanRight1.mesh.position.x += 2
		this.fanRight1.mesh.position.y -= 2
	}

	_selectionBehavior() {
		const selectLeftMaterial = new MeshBasicMaterial({ color: 'blue', side: BackSide })
		const selectRightMaterial = new MeshBasicMaterial({ color: 'green', side: BackSide })
		const clonedMeshes = []
		this.tasks.forEach((task) => {
			const geometry = task.mesh.geometry
			const clonedMesh = new Mesh(geometry, selectLeftMaterial)
			clonedMesh.position.copy(task.mesh.position)
			clonedMesh.rotation.copy(task.mesh.rotation)
			clonedMesh.quaternion.copy(task.mesh.quaternion)
			clonedMesh.scale.copy(task.mesh.scale)
			clonedMesh.name = 'clonedMesh'
			clonedMesh.scale.addScalar(0.02)
			clonedMesh.material = selectLeftMaterial
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
				clonedMeshes[leftIndexSelection].visible = false
			}
		})

		clonedMeshes[leftIndexSelection].visible = true
		clonedMeshes[leftIndexSelection].material = selectLeftMaterial
		this.experience.axis.on('joystick:move:left', (event) => {
			if (!leftSelectionMode) return
			if (event.position.x > 0.9 || event.position.x < -0.9) {
				clonedMeshes[leftIndexSelection].visible = false
				leftIndexSelection = (leftIndexSelection + 1) % this.tasks.length
				if (rightIndexSelection === leftIndexSelection)
					leftIndexSelection = (leftIndexSelection + 1) % this.tasks.length
				clonedMeshes[leftIndexSelection].visible = true
				clonedMeshes[leftIndexSelection].material = selectLeftMaterial
			}
		})

		let rightIndexSelection = 1
		let rightSelectionMode = true
		this.experience.axis.on('down:right', (event) => {
			if (event.key === 'a') {
				this.tasks[rightIndexSelection].playTask('right')
				rightSelectionMode = false
				clonedMeshes[rightIndexSelection].visible = false
			}
		})

		clonedMeshes[rightIndexSelection].visible = true
		clonedMeshes[rightIndexSelection].material = selectRightMaterial
		this.experience.axis.on('joystick:move:right', (event) => {
			if (!rightSelectionMode) return
			if (event.position.x > 0.9 || event.position.x < -0.9) {
				clonedMeshes[rightIndexSelection].visible = false
				rightIndexSelection = (rightIndexSelection + 1) % this.tasks.length
				if (rightIndexSelection === leftIndexSelection)
					rightIndexSelection = (rightIndexSelection + 1) % this.tasks.length
				clonedMeshes[rightIndexSelection].visible = true
				clonedMeshes[rightIndexSelection].material = selectRightMaterial
			}
		})
	}

	update() {
		if (this.fanLeft) this.fanLeft.update()
		if (this.fanRight) this.fanRight.update()
	}
}
