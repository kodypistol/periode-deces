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
import Horloge from 'components/Horloge.js'
import TaskManager from 'core/TaskManager.js'

export default class Main {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.scene.resources = new Resources(sources)
		this.axis = this.experience.axis
		this.dayManager = this.experience.dayManager
		this.moneyManager = this.experience.moneyManager

		this.setMoneyCounter()

		this.tasks = []
		this.focusTasks = []
		this._isGameStarted = false
		this._isGameOver = false

		this.scene.resources.on('ready', () => {
			this._start()
			this._addEventListeners()
		})

		this.dayManager.on('day:finished', () => {
			this.tasks.forEach((task) => {
				task.reset()
				task.isPlaying = false
				task.hideTask()
			})

			this.focusTasks.forEach((task) => {
				task._reset()
			})
			this.moneyManager.stop()
		})

		this.dayManager.on('day:changed', () => {
			this.moneyManager.resetAllRates()
			this.moneyManager.startIncrement()
		})

		this.dayManager.on('day:gameOver', () => {
			this._isGameOver = true
			this._playGameOverAnimation()
			this._reset()
			this.dayManager.stop()
		})
	}

	_start() {
		this._startMenuElement = document.getElementById('start-menu')
		this._dayPanelElement = document.getElementById('day-panel')
		this._gameOverElement = document.getElementById('game-over')
		this._overlayElement = document.getElementById('overlay')

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

	_gameOver() {
		this.tasks = []
		this.focusTasks = []
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

		this.horloge = new Horloge()

		this.tasks.push(this.fan, this.computer, this.phone)
		this.focusTasks.push(this.head)
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
					this.taskManager.start()
					this.moneyManager.startIncrement()
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

		gameOverTimeline.play()
	}

	_handleRestart(e) {
		if (e.key === 'a') {
			// Reset the game
			// this._reset()
			window.location.reload()
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

		if (e.key === 'w' && this._isGameStarted && !this._isGameOver) {
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
		if (this.horloge) {
			this.horloge.update()
		}
	}

	destroy() {
		this.scene.clear()
	}
}
