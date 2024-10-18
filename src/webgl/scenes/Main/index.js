import Experience from 'core/Experience.js'
import Resources from 'core/Resources.js'
import sources from './sources.json'
import Fan from 'components/Fan.js'
import Computer from 'components/Computer/index.js'
import { BackSide, MeshBasicMaterial } from 'three'
import Background from 'components/Background.js'
import Phone from 'components/Phone/Phone.js'
import Desk from 'components/Desk.js'
import Head from 'components/Head.js'
import gsap from 'gsap'

export default class Main {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.scene.resources = new Resources(sources)

		this.tasks = []
		this.focusTasks = []

		this.scene.resources.on('ready', () => {
			this._createSceneElements()
			this._selectionBehavior()
			this._randomTasks()
			this._randomFocusTasks()
		})
	}

	_createSceneElements() {
		this.background = new Background()
		this.desk = new Desk()

		this.head = new Head()
		this.focusTasks.push(this.head)

		this.fan = new Fan()
		this.tasks.push(this.fan)

		this.computer = new Computer()
		this.tasks.push(this.computer)

		this.phone = new Phone()
		this.tasks.push(this.phone)
	}

	_randomTasks() {
		setInterval(() => {
			const randomIndex = Math.floor(Math.random() * this.tasks.length)
			const randomTask = this.tasks[randomIndex]
			if (randomTask.isPlaying || randomTask.isShowed) return
			randomTask.showTask()
			randomTask.isShowed = true
		}, 10000)
	}
	_randomFocusTasks() {
		const repeat = () => {
			if (this.tasks.find((task) => task.mesh.name === 'phone').isPlaying) {
				setTimeout(this._randomFocusTasks.bind(this), 30000)
				return
			}
			const randomIndex = Math.floor(Math.random() * this.focusTasks.length)
			const randomTask = this.focusTasks[randomIndex]
			randomTask.playTask()
			this.leftselectionMode = false
			this.rightselectionMode = false
		}
		setTimeout(repeat, 30000)

		const handleComplete = () => {
			setTimeout(repeat, 30000)
			this.leftselectionMode = true
			this.rightselectionMode = true
		}

		this.focusTasks.forEach((task) => {
			task.on('task:complete', handleComplete)
		})
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

		//TODO: Refactor this
		const handleSelection = (side) => {
			let indexSelection = side === 'left' ? 0 : 1
			if (side === 'left') {
				rightIndexSelection = indexSelection
			} else {
				leftIndexSelection = indexSelection
			}
			this[`${side}SelectionMode`] = true

			this.experience.axis.on(`down:${side}`, (event) => {
				if (!this[`${side}SelectionMode`]) return
				if (event.key === 'a') {
					if (!this.tasks[indexSelection].isShowed) {
						// material red and return to original
						gsap.to(selectMaterials[side].color, {
							r: 1,
							g: 0,
							b: 0,
							duration: 0.2,
							repeat: 1,
							yoyo: true,
						})

						return
					}
					this.tasks[indexSelection].isShowed = false
					this.tasks[indexSelection].playTask(side)
					const handleComplete = () => {
						this[`${side}SelectionMode`] = true
						clonedMeshes[indexSelection].visible = true
						this.tasks[indexSelection].off('task:complete', handleComplete)
					}
					this.tasks[indexSelection].on('task:complete', handleComplete)
					this[`${side}SelectionMode`] = false
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
				if (!this[`${side}SelectionMode`]) return
				if (!clonedMeshes[indexSelection]) return
				if (event.direction === 'up' || event.direction === 'down') return

				clonedMeshes[indexSelection].visible = false

				if (event.direction === 'left') {
					indexSelection = (indexSelection - 1) % this.tasks.length
					if (side === 'left') {
						rightIndexSelection = indexSelection
					} else {
						leftIndexSelection = indexSelection
					}
					if (rightIndexSelection === leftIndexSelection) indexSelection = (indexSelection - 1) % this.tasks.length
					if (side === 'left') {
						rightIndexSelection = indexSelection
					} else {
						leftIndexSelection = indexSelection
					}
				}
				if (event.direction === 'right') {
					indexSelection = (indexSelection + 1) % this.tasks.length
					if (side === 'left') {
						rightIndexSelection = indexSelection
					} else {
						leftIndexSelection = indexSelection
					}
					console.log(rightIndexSelection, leftIndexSelection)
					if (rightIndexSelection === leftIndexSelection) indexSelection = (indexSelection + 1) % this.tasks.length
					if (side === 'left') {
						rightIndexSelection = indexSelection
					} else {
						leftIndexSelection = indexSelection
					}
				}
				if (clonedMeshes[indexSelection]) {
					clonedMeshes[indexSelection].visible = true
					clonedMeshes[indexSelection].traverse((child) => {
						if (child.material) {
							child.material = selectMaterials[side]
						}
					})
				}
			})

			return indexSelection
		}

		let leftIndexSelection
		let rightIndexSelection
		leftIndexSelection = handleSelection('left')
		rightIndexSelection = handleSelection('right')
	}

	update() {
		if (this.fan) this.fan.update()
		// if (this.phone) this.phone.update()
		if (this.computer) this.computer.update()
	}
}
