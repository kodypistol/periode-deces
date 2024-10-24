// webgl/scenes/Main/index.js
import Experience from 'core/Experience.js'
import Resources from 'core/Resources.js'
import sources from './sources.json'
import Fan from 'components/Fan.js'
import Computer from 'components/Computer/index.js'
import Background from 'components/Background.js'
import Phone from 'components/Phone/Phone.js'
import Desk from 'components/Desk.js'
import Head from 'components/Head.js'
import gsap from 'gsap'
import JoystickSelectionManager from 'core/JoystickSelectionManager.js'

export default class Main {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.axis = this.experience.axis
		this.dayManager = this.experience.dayManager
		this.moneyManager = this.experience.moneyManager
		this.scene.resources = new Resources(sources)

		this.MoneyCounter = this.setMoneyCounter()

		this.tasks = []
		this.focusTasks = []
		this._isGameStarted = false
		this._isGameOver = false

		this.scene.resources.on('ready', () => {
			this._start()
			this._addEventListeners()
		})
		this.dayManager.on('day:changed', () => {
			this.moneyManager.startIncrement()
			this._randomTasks()
			this._randomFocusTasks()
		})
	}

	_start() {
		this._startMenuElement = document.getElementById('start-menu')
		this._dayPanelElement = document.getElementById('day-panel')
		this._gameOverElement = document.getElementById('game-over')
		this._overlayElement = document.getElementById('overlay')

		this._createSceneComponents()

		// Initialize the JoystickSelectionManager
		this.joystickSelectionManager = new JoystickSelectionManager(this.tasks)
	}

	_reset() {
		this.tasks.forEach((task) => {
			task.reset()
		})

		this.focusTasks.forEach((task) => {
			task.reset()
		})

		this._isGameStarted = false
		this._isGameOver = false

		// Destroy and re-initialize the JoystickSelectionManager
		this.joystickSelectionManager.destroy()
		this.joystickSelectionManager = new JoystickSelectionManager(this.tasks)
	}

	_createSceneComponents() {
		this.background = new Background()
		this.desk = new Desk()

		this.head = new Head()
		this.focusTasks.push(this.head)

		this.fan = new Fan()
		this.scene.add(this.fan)
		this.tasks.push(this.fan)

		this.computer = new Computer()
		this.tasks.push(this.computer)

		this.phone = new Phone()
		this.tasks.push(this.phone)
	}

	_randomTasks(timeout = 10000) {
		setInterval(() => {
			const randomIndex = Math.floor(Math.random() * this.tasks.length)
			const randomTask = this.tasks[randomIndex]
			if (randomTask.isPlaying || randomTask.isShowed) return
			randomTask.showTask()
			randomTask.isShowed = true
		}, timeout)
	}

	_randomFocusTasks(timeout = 30000) {
		let randomTask

		const handleComplete = () => {
			setTimeout(repeat, timeout)
			this.leftSelectionMode = true
			this.rightSelectionMode = true
			randomTask.off('task:complete', handleComplete)
		}

		const repeat = () => {
			if (this.tasks.find((task) => task.mesh.name === 'phone').isPlaying) {
				// Prevent subtitle conflict
				setTimeout(repeat, timeout)
				return
			}
			const randomIndex = Math.floor(Math.random() * this.focusTasks.length)
			randomTask = this.focusTasks[randomIndex]
			randomTask.playTask()
			this.leftSelectionMode = false
			randomTask.on('task:complete', handleComplete)
		}

		setTimeout(repeat, timeout)
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

		//left
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
				leftIndexSelection = (leftIndexSelection - 1 + this.tasks.length) % this.tasks.length

				if (rightIndexSelection === leftIndexSelection)
					leftIndexSelection = (leftIndexSelection - 1 + this.tasks.length) % this.tasks.length
			}
			if (event.direction === 'right') {
				leftIndexSelection = (leftIndexSelection + 1 + this.tasks.length) % this.tasks.length
				if (rightIndexSelection === leftIndexSelection)
					leftIndexSelection = (leftIndexSelection + 1 + this.tasks.length) % this.tasks.length
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
				rightIndexSelection = (rightIndexSelection - 1 + this.tasks.length) % this.tasks.length
				if (leftIndexSelection === rightIndexSelection)
					rightIndexSelection = (rightIndexSelection - 1 + this.tasks.length) % this.tasks.length
			}
			if (event.direction === 'right') {
				rightIndexSelection = (rightIndexSelection + 1 + this.tasks.length) % this.tasks.length
				if (leftIndexSelection === rightIndexSelection)
					rightIndexSelection = (rightIndexSelection + 1 + this.tasks.length) % this.tasks.length
			}
			clonedMeshes[rightIndexSelection].visible = true
			clonedMeshes[rightIndexSelection].traverse((child) => {
				if (child.material) {
					child.material = selectMaterials.right
				}
			})
		})
	}

	_playStartAnimation() {
		const startTimeline = gsap.timeline()

		startTimeline.to(this._startMenuElement, { autoAlpha: 0, duration: 0.5, ease: 'sine.inOut' }, 0)
		startTimeline.to(this._overlayElement, { opacity: 1, duration: 0, ease: 'sine.inOut', delay: '0.25' }, 0)
		startTimeline.to(this._dayPanelElement, { autoAlpha: 1, duration: 0.25, ease: 'sine.inOut' }, 0)
		startTimeline.to(
			this._dayPanelElement,
			{
				autoAlpha: 0,
				delay: 0.5,
				duration: 0.25,
				ease: 'sine.inOut',
				onComplete: () => {
					this._randomTasks()
					this._randomFocusTasks()
					this.moneyManager.startIncrement()
				},
			},
			1
		)
	}

	_playGameOverAnimation() {
		const gameOverTimeline = gsap.timeline()

		gameOverTimeline.to(this._gameOverElement, {
			opacity: 1,
			duration: 0.25,
			ease: 'sine.inOut',
			onComplete: () => {
				this.axis.on('down', this._handleRestart.bind(this))
			},
		})
	}

	_handleRestart(e) {
		if (e.key === 'a') {
			// Reset the game
			this._reset()
			// Remove this event listener after resetting
			this.axis.off('down', this._handleRestart)
		}
	}

	_handleAxisDown(e) {
		if (e.key === 'a' && !this._isGameStarted) {
			this.dayManager.setDay(1)
			this._playStartAnimation()
			this._isGameStarted = true
		}

		if (e.key === 'w' && this._isGameStarted) {
			this._playGameOverAnimation()
			this._isGameOver = true
		}
	}

	_addEventListeners() {
		this.axis.on('down', this._handleAxisDown.bind(this))
	}

	setMoneyCounter() {
		const moneyDisplay = document.querySelector('#overlay .score #count')

		moneyDisplay.textContent = this.moneyManager.formatNumber(this.moneyManager.money)

		this.moneyManager.setOnMoneyChangeCallback((newMoney) => {
			moneyDisplay.textContent = this.moneyManager.formatNumber(newMoney)
		})
	}

	update() {
		if (this.fan) this.fan.update()
		if (this.computer) this.computer.update()
	}

	destroy() {
		this.scene.clear()
	}
}
