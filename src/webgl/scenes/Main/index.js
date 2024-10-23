import Experience from 'core/Experience.js'
import Resources from 'core/Resources.js'
import sources from './sources.json'
import Fan from 'components/Fan.js'
import Computer from 'components/Computer/index.js'
import Phone from 'components/Phone/Phone.js'
import Background from 'components/Background.js'
import Desk from 'components/Desk.js'
import Head from 'components/Head.js'
import gsap from 'gsap'
import JoystickSelectionManager from 'core/JoystickSelectionManager.js'
import TaskManager from 'core/TaskManager.js'

export default class Main {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.axis = this.experience.axis

		// Assign resources to this.scene.resources
		this.scene.resources = new Resources(sources)

		this.tasks = []
		this.focusTasks = []
		this._isGameStarted = false
		this._isGameOver = false

		// Listen for resources to be ready
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

		// Initialize tasks after resources are loaded
		this.tasks.forEach((task) => {
			task.init()
			this.scene.add(task)
		})
		this.focusTasks.forEach((task) => {
			task.init()
			this.scene.add(task)
		})

		// Initialize the JoystickSelectionManager
		this.joystickSelectionManager = new JoystickSelectionManager(this.tasks)

		// Initialize the TaskManager
		this.taskManager = new TaskManager({
			tasks: this.tasks,
			focusTasks: this.focusTasks,
			axis: this.axis,
			selectionManager: this.joystickSelectionManager,
		})
	}

	_reset() {
		this.taskManager.reset()
		this._isGameStarted = false
		this._isGameOver = false

		gsap.to(this._gameOverElement, { autoAlpha: 0, duration: 0.25, ease: 'sine.inOut' })

		this.joystickSelectionManager.destroy()
		this.joystickSelectionManager = new JoystickSelectionManager(this.tasks)
	}

	_createSceneComponents() {
		this.background = new Background()
		this.desk = new Desk()

		// Instantiate tasks (do not call init yet)
		this.fan = new Fan({ experience: this.experience })
		this.computer = new Computer({ experience: this.experience })
		this.phone = new Phone({ experience: this.experience })

		// Instantiate the Head focus task
		this.head = new Head({ experience: this.experience })

		this.tasks.push(this.fan, this.computer, this.phone)
		this.focusTasks.push(this.head)
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
					this.taskManager.start()
				},
			},
			1,
		)
	}

	_playGameOverAnimation() {
		const gameOverTimeline = gsap.timeline()

		gameOverTimeline.to(this._gameOverElement, {
			autoAlpha: 1,
			duration: 0.25,
			ease: 'sine.inOut',
			onComplete: () => {
				this.axis.on('down', this._handleRestart.bind(this))
			},
		})
	}

	_handleRestart(e) {
		if (e.key === 'a') {
			this._reset()
			this.axis.off('down', this._handleRestart)
		}
	}

	_handleAxisDown(e) {
		if (e.key === 'a' && !this._isGameStarted) {
			this._playStartAnimation()
			this._isGameStarted = true
		}

		if (e.key === 'w' && this._isGameStarted && !this._isGameOver) {
			this._playGameOverAnimation()
			this._isGameOver = true
		}
	}

	_addEventListeners() {
		this.axis.on('down', this._handleAxisDown.bind(this))
	}

	update() {
		this.tasks.forEach((task) => {
			if (typeof task.update === 'function') {
				task.update()
			}
		})
		this.focusTasks.forEach((task) => {
			if (typeof task.update === 'function') {
				task.update()
			}
		})
	}
}
