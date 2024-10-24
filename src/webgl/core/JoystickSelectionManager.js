import { BackSide, MeshBasicMaterial, Color } from 'three'
import gsap from 'gsap'
import Experience from 'core/Experience.js'

export default class JoystickSelectionManager {
	constructor(tasks) {
		this.experience = new Experience()
		this.axis = this.experience.axis
		this.scene = this.experience.scene
		this.tasks = tasks

		this.isSelectionActive = true
		this.currentSelectionIndex = 0

		this.outlineMeshes = []
		this.keysDown = {}
		this.eventsAttached = false

		this.handleKeyDown = this.handleKeyDown.bind(this)
		this.handleKeyUp = this.handleKeyUp.bind(this)
		this.handleMove = this.handleMove.bind(this)

		this.init()
	}

	init() {
		this.createOutlineMeshes()
		this.setupEventListeners()
		this.updateSelection(this.currentSelectionIndex)
	}

	createOutlineMeshes() {
		this.outlineMeshes = this.tasks
			.map((task, index) => {
				if (!task.mesh) {
					console.warn(`Task at index ${index} does not have a mesh property.`)
					return null
				}

				// Clone the mesh without scaling
				const outlineMesh = task.mesh.clone()
				outlineMesh.name = 'outlineMesh'

				// Create a new material for the outline mesh
				const outlineMaterial = new MeshBasicMaterial({
					color: 0x00ff00, // Initial color (green for available)
					side: BackSide, // Render the back faces
					transparent: true,
					opacity: 1,
					depthTest: true,
					depthWrite: false,
				})

				outlineMesh.traverse((child) => {
					if (child.isMesh) {
						child.material = outlineMaterial
					}
				})

				// Ensure the outlineMesh is rendered behind the original mesh
				outlineMesh.renderOrder = -1
				outlineMesh.scale.addScalar(0.01)
				outlineMesh.position.addScalar(-0.01)

				outlineMesh.visible = false
				this.scene.add(outlineMesh)
				return outlineMesh
			})
			.filter((mesh) => mesh !== null)
	}

	setupEventListeners() {
		if (this.eventsAttached) return
		this.axis.on('down:left', this.handleKeyDown)
		this.axis.on('up:left', this.handleKeyUp)
		this.axis.on('joystick:quickmove:left', this.handleMove)
		this.eventsAttached = true
	}

	removeEventListeners() {
		if (!this.eventsAttached) return
		this.axis.off('down:left', this.handleKeyDown)
		this.axis.off('up:left', this.handleKeyUp)
		this.axis.off('joystick:quickmove:left', this.handleMove)
		this.eventsAttached = false
	}

	handleKeyDown(event) {
		if (!this.isSelectionActive) return
		if (this.keysDown[event.key]) return

		this.keysDown[event.key] = true

		if (event.key === 'a') {
			this.handleSelect()
		}
	}

	handleKeyUp(event) {
		this.keysDown[event.key] = false
	}

	handleSelect() {
		const selectedTask = this.tasks[this.currentSelectionIndex]

		if (!selectedTask.isAvailable) {
			this.flashInvalidSelection()
			return
		}

		selectedTask.playTask()
		this.outlineMeshes[this.currentSelectionIndex].visible = false
	}

	handleMove(event) {
		if (!this.isSelectionActive) return
		if (event.direction !== 'left' && event.direction !== 'right') return

		const direction = event.direction === 'left' ? -1 : 1
		this.changeSelection(direction)
	}

	changeSelection(direction) {
		// Hide current selection
		if (this.outlineMeshes[this.currentSelectionIndex]) {
			this.stopBlinking(this.outlineMeshes[this.currentSelectionIndex])
			this.outlineMeshes[this.currentSelectionIndex].visible = false
		}

		const totalTasks = this.tasks.length
		this.currentSelectionIndex = (this.currentSelectionIndex + direction + totalTasks) % totalTasks

		// Show new selection
		if (this.outlineMeshes[this.currentSelectionIndex]) {
			this.outlineMeshes[this.currentSelectionIndex].visible = true
			this.startBlinking(this.outlineMeshes[this.currentSelectionIndex], this.tasks[this.currentSelectionIndex])
		}
	}

	updateSelection(index) {
		this.outlineMeshes.forEach((mesh) => {
			if (mesh) {
				this.stopBlinking(mesh)
				mesh.visible = false
			}
		})

		if (this.outlineMeshes[index]) {
			this.outlineMeshes[index].visible = true
			this.startBlinking(this.outlineMeshes[index], this.tasks[index])
		}
	}

	startBlinking(outlineMesh, task) {
		const color = task.isAvailable ? new Color(0x00ff00) : new Color(0xff0000) // Green if available, red if not
		outlineMesh.traverse((child) => {
			if (child.isMesh) {
				child.material.color = color.clone()
				child.material.opacity = 1
				child.blinkTween = gsap.to(child.material, {
					opacity: 0.5,
					duration: 0.5,
					repeat: -1,
					yoyo: true,
					ease: 'sine.inOut',
				})
			}
		})
	}

	stopBlinking(outlineMesh) {
		outlineMesh.traverse((child) => {
			if (child.isMesh) {
				if (child.blinkTween) {
					child.blinkTween.kill()
					child.blinkTween = null
				}
				child.material.opacity = 1
			}
		})
	}

	flashInvalidSelection() {
		const outlineMesh = this.outlineMeshes[this.currentSelectionIndex]
		if (outlineMesh) {
			outlineMesh.traverse((child) => {
				if (child.isMesh) {
					const originalColor = child.material.color.clone()
					gsap.to(child.material.color, {
						r: 1,
						g: 0,
						b: 0,
						duration: 0.1,
						yoyo: true,
						repeat: 1,
						onComplete: () => {
							child.material.color.copy(originalColor)
						},
					})
				}
			})
		}
	}

	setEnabled(enabled) {
		console.log(`JoystickSelectionManager setEnabled: ${enabled}`)
		this.isSelectionActive = enabled
		if (!enabled) {
			this.removeEventListeners()
			this.outlineMeshes.forEach((mesh) => {
				if (mesh) {
					this.stopBlinking(mesh)
					mesh.visible = false
				}
			})
		} else {
			this.setupEventListeners()
			this.updateSelection(this.currentSelectionIndex)
		}
	}

	destroy() {
		this.removeEventListeners()
		this.outlineMeshes.forEach((mesh) => {
			if (mesh) {
				this.stopBlinking(mesh)
				this.scene.remove(mesh)
			}
		})
	}
}
