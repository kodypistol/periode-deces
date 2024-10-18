import Experience from 'core/Experience.js'
import Resources from 'core/Resources.js'
import sources from './sources.json'
import Fan from 'components/Fan.js'
import Computer from 'components/Computer/index.js'
import { BackSide, Mesh, MeshBasicMaterial } from 'three'
import Background from 'components/Background.js'

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
		this.computer = new Computer()

		this.background = new Background()

		// this.fan = new Fan()
		// this.tasks.push(this.fan)
		//
		// this.fan1 = new Fan()
		// this.fan1.mesh.position.x += 0.5
		// this.tasks.push(this.fan1)
		//
		// this.fan2 = new Fan()
		// this.fan2.mesh.position.x += 1
		// this.tasks.push(this.fan2)
		//
		// this.fan3 = new Fan()
		// this.fan3.mesh.position.x += 1.5
		// this.tasks.push(this.fan3)

		this.tasks.push(this.computer)
	}

	_selectionBehavior() {
		const selectMaterials = {
			left: new MeshBasicMaterial({ color: 'blue', side: BackSide }),
			right: new MeshBasicMaterial({ color: 'green', side: BackSide }),
		}
		const clonedMeshes = []
		this.tasks.forEach((task) => {
			const clonedMesh = task.mesh.clone()
			clonedMesh.name = 'clonedMesh'
			clonedMesh.scale.addScalar(0.02)
			clonedMesh.position.z = -0.2
			clonedMesh.traverse((child) => {
				if (child.material) {
					child.material = selectMaterials.left
				}
			})
			clonedMesh.visible = false
			clonedMeshes.push(clonedMesh)
			this.scene.add(clonedMesh)
		})

		const handleSelection = (side) => {
			let indexSelection = side === 'left' ? 0 : 1
			let selectionMode = true

			this.experience.axis.on(`down:${side}`, (event) => {
				if (event.key === 'a') {
					this.tasks[indexSelection].playTask(side)
					const handleComplete = () => {
						selectionMode = true
						clonedMeshes[indexSelection].visible = true
						this.tasks[indexSelection].off('task:complete', handleComplete)
					}
					this.tasks[indexSelection].on('task:complete', handleComplete)
					selectionMode = false
					clonedMeshes[indexSelection].visible = false
				}
			})

			clonedMeshes[indexSelection].visible = true
			clonedMeshes[indexSelection].traverse((child) => {
				if (child.material) {
					child.material = selectMaterials[side]
				}
			})

			this.experience.axis.on(`joystick:quickmove:${side}`, (event) => {
				if (!selectionMode) return
				if (event.direction === 'up' || event.direction === 'up') return
				clonedMeshes[indexSelection].visible = false
				if (event.direction === 'left') {
					indexSelection = (indexSelection - 1) % this.tasks.length
					if (indexSelection === (side === 'left' ? rightIndexSelection : leftIndexSelection))
						indexSelection = (indexSelection - 1) % this.tasks.length
				}
				if (event.direction === 'right') {
					indexSelection = (indexSelection + 1) % this.tasks.length
					if (indexSelection === (side === 'left' ? rightIndexSelection : leftIndexSelection))
						indexSelection = (indexSelection + 1) % this.tasks.length
				}
				clonedMeshes[indexSelection].visible = true
				clonedMeshes[indexSelection].traverse((child) => {
					if (child.material) {
						child.material = selectMaterials[side]
					}
				})
			})

			return indexSelection
		}

		let leftIndexSelection = handleSelection('left')
		let rightIndexSelection = handleSelection('right')
	}
	update() {
		if (this.fan) this.fan.update()
		if (this.fan1) this.fan1.update()
		if (this.fan2) this.fan2.update()
		if (this.fan3) this.fan3.update()
		if (this.computer) this.computer.update()
	}
}
