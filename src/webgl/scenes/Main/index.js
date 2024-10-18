import Experience from 'core/Experience.js'
import Resources from 'core/Resources.js'
import sources from './sources.json'
import Fan from 'components/Fan.js'
import Computer from 'components/Computer/index.js'
import { BackSide, Mesh, MeshBasicMaterial } from 'three'
import Background from 'components/Background.js'
import Phone from 'components/Phone/Phone.js'
import Desk from 'components/Desk.js'

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
		this.background = new Background()
		this.desk = new Desk()

		this.fan = new Fan()
		this.tasks.push(this.fan)

		this.computer = new Computer()
		this.tasks.push(this.computer)

		this.phone = new Phone()
		this.tasks.push(this.phone)
		// this.tasks.push(this.computer)
	}

	_selectionBehavior() {
		const selectMaterials = {
			left: new MeshBasicMaterial({ color: 'orange', side: BackSide }),
			right: new MeshBasicMaterial({ color: 'green', side: BackSide }),
		}
		const clonedMeshes = []
		this.tasks.forEach((task) => {
			const clonedMesh = task.mesh.clone()
			clonedMesh.name = 'clonedMesh'
			clonedMesh.scale.addScalar(0.01)
			// clonedMesh.position.z = -0.2
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
				if (!selectionMode) return
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
		let leftIndexSelection
		let rightIndexSelection
		if (this.tasks.length > 0) leftIndexSelection = handleSelection('left')
		// if (this.tasks.length > 1) rightIndexSelection = handleSelection('right')
	}
	update() {
		if (this.fan) this.fan.update()
		// if (this.phone) this.phone.update()
		if (this.computer) this.computer.update()
	}
}
