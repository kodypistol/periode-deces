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
		this.axis = this.experience.axis
		this.scene.resources = new Resources(sources)

		this.tasks = []
		this.focusTasks = []

		this.scene.resources.on('ready', () => {
			this.startMenu = document.getElementById('start-menu')
			this.dayPanel = document.getElementById('day-panel')
			this.gameover = document.getElementById('gameover')
			this.startMenu.classList.remove('hidden')
			this._createSceneElements()

			const handleDown = (e) => {
				if (e.key === 'a') {
					this._selectionBehavior()
					this.axis.off('down', handleDown)
					this.startMenu.classList.add('hide-element')

					gsap
						.timeline()
						.to(
							'#start-menu',
							{
								autoAlpha: 0,
								duration: 0.5,
								ease: 'sine.inOut',
								onComplete: () => {
									this.startMenu.remove()
								},
							},
							0,
						)
						.to(
							'#day-panel',
							{
								autoAlpha: 1,
								duration: 0.25,
								ease: 'sine.inOut',
								onStart: () => {
									this.dayPanel.classList.remove('hidden')
								},
							},
							0,
						)
						.to(
							'#day-panel',
							{
								autoAlpha: 0,
								delay: .5,
								duration: 0.25,
								ease: 'sine.inOut',
								onComplete: () => {
									this._randomTasks()
									this._randomFocusTasks()

									const handleDown = (e) => {
										if (e.key === 'w') {
											gsap.to('#gameover', {
												opacity: 1,
												duration: 0.25,
												ease: 'sine.inOut',
												onStart: () => {
													this.gameover.classList.remove('hidden')
												},
												onComplete: () => {
													this.axis.on('down', (e) => {
														if (e.key === 'a') {
															window.location.reload()
														}
													})
												},
											})
										}
									}

									this.axis.on('down', handleDown.bind(this))
								},
							},
							1,
						)
				}
			}

			this.axis.on('down', handleDown)
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
		let randomTask
		const repeat = () => {
			if (this.tasks.find((task) => task.mesh.name === 'phone').isPlaying) {
				setTimeout(this._randomFocusTasks.bind(this), 30000)
				return
			}
			const randomIndex = Math.floor(Math.random() * this.focusTasks.length)
			randomTask = this.focusTasks[randomIndex]
			randomTask.playTask()
			this.leftSelectionMode = false
			this.rightSelectionMode = false
			randomTask.on('task:complete', handleComplete)
		}
		setTimeout(repeat, 30000)

		const handleComplete = () => {
			setTimeout(repeat, 30000)
			this.leftSelectionMode = true
			this.rightSelectionMode = true
			randomTask.off('task:complete', handleComplete)
		}
	}

	_selectionBehavior() {
		const selectMaterials = {
			left: new MeshBasicMaterial({ color: 'orange', side: BackSide }),
			right: new MeshBasicMaterial({ color: 'violet', side: BackSide }),
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

		let leftIndexSelection = 0
		this.leftSelectionMode = true

		//first selection
		clonedMeshes[leftIndexSelection].visible = true
		clonedMeshes[leftIndexSelection].traverse((child) => {
			if (child.material) {
				child.material = selectMaterials.left
			}
		})
		//select task
		this.experience.axis.on(`down:left`, (event) => {
			if (!this.leftSelectionMode) return
			if (event.key === 'a') {
				const selectedTask = this.tasks[leftIndexSelection]
				const outlineMesh = clonedMeshes[leftIndexSelection]
				if (!selectedTask.isShowed) {
					// material red and return to original
					gsap.to(selectMaterials.left.color, {
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
				selectedTask.playTask('left')
				outlineMesh.visible = false
				const handleComplete = () => {
					this.leftSelectionMode = true
					outlineMesh.visible = true
					selectedTask.off('task:complete', handleComplete)
				}
				selectedTask.on('task:complete', handleComplete)
			}
		})

		// move selection
		this.experience.axis.on(`joystick:quickmove:left`, (event) => {
			if (event.direction === 'up' || event.direction === 'down') return
			if (!this.leftSelectionMode) return

			clonedMeshes[leftIndexSelection].visible = false

			if (event.direction === 'left') {
				leftIndexSelection = (leftIndexSelection - 1) % this.tasks.length
				if (rightIndexSelection === -1) leftIndexSelection = this.tasks.length - 1

				if (rightIndexSelection === leftIndexSelection)
					leftIndexSelection = (leftIndexSelection - 1) % this.tasks.length
				if (leftIndexSelection === -1) leftIndexSelection = this.tasks.length - 1
			}
			if (event.direction === 'right') {
				leftIndexSelection = (leftIndexSelection + 1) % this.tasks.length
				if (rightIndexSelection === leftIndexSelection)
					leftIndexSelection = (leftIndexSelection + 1) % this.tasks.length
			}
			clonedMeshes[leftIndexSelection].visible = true
			clonedMeshes[leftIndexSelection].traverse((child) => {
				if (child.material) {
					child.material = selectMaterials.left
				}
			})
		})

		//right

		let rightIndexSelection = 1
		this.rightSelectionMode = true

		//first selection
		clonedMeshes[rightIndexSelection].visible = true
		clonedMeshes[rightIndexSelection].traverse((child) => {
			if (child.material) {
				child.material = selectMaterials.right
			}
		})
		//select task
		this.experience.axis.on(`down:right`, (event) => {
			if (!this.rightSelectionMode) return
			if (event.key === 'a') {
				const selectedTask = this.tasks[rightIndexSelection]
				const outlineMesh = clonedMeshes[rightIndexSelection]
				if (!selectedTask.isShowed) {
					// material red and return to original
					gsap.to(selectMaterials.right.color, {
						r: 1,
						g: 0,
						b: 0,
						duration: 0.2,
						repeat: 1,
						yoyo: true,
					})
					return
				}
				this.rightSelectionMode = false
				selectedTask.isShowed = false
				selectedTask.playTask('right')
				outlineMesh.visible = false
				const handleComplete = () => {
					this.rightSelectionMode = true
					outlineMesh.visible = true
					selectedTask.off('task:complete', handleComplete)
				}
				selectedTask.on('task:complete', handleComplete)
			}
		})

		// move selection
		this.experience.axis.on(`joystick:quickmove:right`, (event) => {
			if (event.direction === 'up' || event.direction === 'down') return
			if (!this.rightSelectionMode) return

			clonedMeshes[rightIndexSelection].visible = false

			if (event.direction === 'left') {
				rightIndexSelection = (rightIndexSelection - 1) % this.tasks.length
				if (rightIndexSelection === -1) rightIndexSelection = this.tasks.length - 1
				if (leftIndexSelection === rightIndexSelection)
					rightIndexSelection = (rightIndexSelection - 1) % this.tasks.length
				if (rightIndexSelection === -1) rightIndexSelection = this.tasks.length - 1
			}
			if (event.direction === 'right') {
				rightIndexSelection = (rightIndexSelection + 1) % this.tasks.length
				if (leftIndexSelection === rightIndexSelection)
					rightIndexSelection = (rightIndexSelection + 1) % this.tasks.length
			}
			clonedMeshes[rightIndexSelection].visible = true
			clonedMeshes[rightIndexSelection].traverse((child) => {
				if (child.material) {
					child.material = selectMaterials.right
				}
			})
		})
	}

	update() {
		if (this.fan) this.fan.update()
		// if (this.phone) this.phone.update()
		if (this.computer) this.computer.update()
	}
}
