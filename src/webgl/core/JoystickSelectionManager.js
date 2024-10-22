// webgl/utils/JoystickSelectionManager.js
import { BackSide, MeshBasicMaterial } from 'three'
import gsap from 'gsap'
import Experience from 'core/Experience.js'

export default class JoystickSelectionManager {
	constructor(tasks) {
		this.experience = new Experience()
		this.axis = this.experience.axis
		this.scene = this.experience.scene
		this.tasks = tasks

		this.leftSelectionMode = true

		// Bind methods for event listeners
		this.handleLeftSelect = this.handleLeftSelect.bind(this)
		this.handleLeftMove = this.handleLeftMove.bind(this)

		this.init()
	}

	init() {
		this.selectMaterial = new MeshBasicMaterial({ color: 'orange', side: BackSide })
		this.clonedMeshes = []

		this.tasks.forEach((task) => {
			const clonedMesh = task.mesh.clone()
			clonedMesh.name = 'clonedMesh'
			clonedMesh.scale.addScalar(0.01)
			clonedMesh.traverse((child) => {
				if (child.material) {
					child.material = this.selectMaterial
				}
			})
			clonedMesh.visible = false
			this.clonedMeshes.push(clonedMesh)
			this.scene.add(clonedMesh)
		})

		this.setupLeftSelection()
	}

	setupLeftSelection() {
		this.leftIndexSelection = 0
		this.leftSelectionMode = true

		// Initial selection
		this.clonedMeshes[this.leftIndexSelection].visible = true

		// Event listeners
		this.axis.on('down:left', this.handleLeftSelect)
		this.axis.on('joystick:quickmove:left', this.handleLeftMove)
	}

	handleLeftSelect(event) {
		if (!this.leftSelectionMode) return
		if (event.key === 'a') {
			const selectedTask = this.tasks[this.leftIndexSelection]
			const outlineMesh = this.clonedMeshes[this.leftIndexSelection]
			if (!selectedTask.isShowed) {
				// Flash red to indicate invalid selection
				gsap.to(this.selectMaterial.color, {
					r: 1,
					g: 0,
					b: 0,
					duration: 0.2,
					repeat: 1,
					yoyo: true,
				})
				return
			}
			this.leftSelectionMode = false
			selectedTask.isShowed = false
			selectedTask.playTask() // No need to pass 'left' or 'right'
			outlineMesh.visible = false

			const handleComplete = () => {
				this.leftSelectionMode = true
				outlineMesh.visible = true
				selectedTask.off('task:complete', handleComplete)
			}
			selectedTask.on('task:complete', handleComplete)
		}
	}

	handleLeftMove(event) {
		if (event.direction === 'up' || event.direction === 'down') return
		if (!this.leftSelectionMode) return
		console.log('ev', event)

		this.clonedMeshes[this.leftIndexSelection].visible = false

		if (event.direction === 'left') {
			this.leftIndexSelection = (this.leftIndexSelection - 1 + this.tasks.length) % this.tasks.length
		}
		if (event.direction === 'right') {
			this.leftIndexSelection = (this.leftIndexSelection + 1) % this.tasks.length
		}
		this.clonedMeshes[this.leftIndexSelection].visible = true
	}

	destroy() {
		// Remove event listeners
		this.axis.off('down:left', this.handleLeftSelect)
		this.axis.off('joystick:quickmove:left', this.handleLeftMove)

		// Remove cloned meshes from the scene
		this.clonedMeshes.forEach((mesh) => {
			this.scene.remove(mesh)
		})
	}
}
