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
		this.scene.resources = new Resources(sources)

		this.tasks = []
		this.focusTasks = []
		this._isGameStarted = false
		this._isGameOver = false

		this.scene.resources.on('ready', () => {
			this._start()
			this._addEventListeners()
		})
	}

	_start() {
		this._startMenuElement = document.getElementById('start-menu')
		this._dayPanelElement = document.getElementById('day-panel')
		this._gameOverElement = document.getElementById('game-over')

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

	_playStartAnimation() {
		const startTimeline = gsap.timeline()

		startTimeline.to(this._startMenuElement, { autoAlpha: 0, duration: 0.5, ease: 'sine.inOut' }, 0)
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
				},
			},
			1,
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

	update() {
		if (this.fan) this.fan.update()
		if (this.computer) this.computer.update()
	}
}
