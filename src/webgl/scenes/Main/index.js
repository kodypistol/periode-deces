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
import AudioManager from 'utils/AudioManager.js'
import { MeshBasicMaterial } from 'three'

const PARAMS = {
	axisKey: 'Periode-Deces-Final-MVP-Official-Release-d66b9d70-8337-438c-bbc1-8137a8ab7f0d',
}

export default class Main {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.scene.resources = new Resources(sources)
		this.axis = this.experience.axis
		this.leaderboard = this.axis.instance.createLeaderboard({
			id: PARAMS.axisKey,
		})

		this.dayManager = this.experience.dayManager
		this.moneyManager = this.experience.moneyManager
		this.subtitlesManager = this.experience.subtitlesManager

		this.setMoneyCounter()
		this.setObjectives()

		this.tasks = []
		this.focusTasks = []
		this._isGameStarted = false
		this._isGameOver = false
		this._isIntroFinished = false
		this._isIntroStarted = false

		this.scene.resources.on('ready', () => {
			this._intro()
			this._createBossHead()
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
			this.setObjectives()
		})

		this.dayManager.on('day:changed', () => {
			this.moneyManager.resetAllRates()
			this.moneyManager.startIncrement()
		})

		this.dayManager.on('day:gameOver', () => {
			console.log('oh noooo')

			this._isGameOver = true
			this._playGameOverAnimation()
			this.dayManager.stop()
			this.tasks.forEach((task) => {
				task.reset()
				task.isPlaying = false
				task.hideTask()
			})

			this.focusTasks.forEach((task) => {
				task._reset()
			})
		})

		this.dayManager.on('day:gameWin', () => {
			this.dayManager.stop()
			this.tasks.forEach((task) => {
				task.reset()
				task.isPlaying = false
				task.hideTask()
			})

			this.focusTasks.forEach((task) => {
				task._reset()
			})

			this.leaderboard
				.postScore({
					username: 'JuloPipooooo',
					value: this.moneyManager.money,
				})
				.then(() => {
					// Get all scores
					this.leaderboard.getScores().then((response) => {
						console.log(response)
						this.games = []
						this.top10 = []
						response.forEach((game, index) => {
							this.games.push(game)
						})
						this.games.sort((a, b) => b.value - a.value)
						this.top10 = this.games.slice(0, 10)

						this.top10.forEach((game, index) => {
							const score = document.createElement('div')
							score.classList.add('score')
							score.innerHTML = `<span>${index + 1}. ${game.username}</span> <span>${game.value}k €</span>`
							document.querySelector('#leaderboard').appendChild(score)
						})
					})
				})

			this._playWinAnimation()
		})
	}

	_intro() {
		this._startMenuElement = document.getElementById('start-menu')
		this._dayPanelElement = document.getElementById('day-panel')
		this._gameOverElement = document.getElementById('game-over')
		this._winScreenElement = document.getElementById('win-screen')
		this._overlayElement = document.getElementById('overlay')
		this._overlayObjectives = document.getElementById('overlay-objectives')

		this._createSceneComponents()

		// // Initialize tasks after resources are loaded
		this.tasks.forEach((task) => {
			task.init()
			this.scene.add(task)
		})
		this.focusTasks.forEach((task) => {
			task.init()
			this.scene.add(task)
		})
	}

	_start() {
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
		// this.tasks.push(this.computer)
		this.focusTasks.push(this.head)
	}

	_playStartAnimation() {
		const startTimeline = gsap.timeline()

		startTimeline.to(this._overlayElement, { opacity: 1, duration: 0, ease: 'sine.inOut', delay: '0.25' }, 0)
		startTimeline.to(this._overlayObjectives, { opacity: 1, duration: 0, ease: 'sine.inOut' }, 0)
		startTimeline.to(this._dayPanelElement, { autoAlpha: 1, duration: 0.25, ease: 'sine.inOut' }, 0)
		startTimeline.to(
			this._dayPanelElement,
			{
				autoAlpha: 0,
				delay: 0.5,
				duration: 0.25,
				ease: 'sine.inOut',
				onComplete: () => {
					this._start()
					this.taskManager.start()
					this.moneyManager.startIncrement()
				},
			},
			1,
		)
	}

	_playWinAnimation() {
		const winTimeline = gsap.timeline()

		winTimeline.to(this._winScreenElement, {
			opacity: 1,
			duration: 0.5,
			ease: 'sine.inOut',
			onComplete: () => {
				console.log('You win')
				this.axis.on('down', this._handleRestart.bind(this))
			},
		})

		winTimeline.play()
	}

	_playGameOverAnimation() {
		const gameOverTimeline = gsap.timeline()

		const keCounter = document.querySelector('#game-over #ke-counter')
		keCounter.textContent = this.moneyManager.formatNumber(this.moneyManager.money)

		gameOverTimeline.to(this._gameOverElement, {
			opacity: 1,
			duration: 0.5,
			ease: 'sine.inOut',
			onComplete: () => {
				console.log('Game over')

				this.axis.on('down', this._handleRestart.bind(this))
			},
		})

		gameOverTimeline.play()
	}

	_createBossHead() {
		this.bossHeadMesh = this.scene.resources.items.headModel.scene.clone()
		this.bossHeadMesh.children[0].material = new MeshBasicMaterial({ map: this.scene.resources.items.julesTexture })
		this.bossHeadMesh.position.y = 2
		this.bossHeadMesh.position.x = -0.5
		this.bossHeadMesh.position.z = -1
		this.bossHeadMesh.rotation.z = 0.2
		this.bossHeadMesh.scale.set(2, 2, 2)
		this.bossHeadMesh.name = 'head'
		this.scene.add(this.bossHeadMesh)
	}

	_bossTalking() {
		const bossTalkingTimeline = gsap.timeline()

		bossTalkingTimeline.to(this.bossHeadMesh.position, {
			y: 2.8,
			onComplete: () => {
				this.experience.subtitlesManager.playSubtitle('intro')
				const rotationTl = gsap.to(this.bossHeadMesh.rotation, {
					x: -0.05,
					yoyo: true,
					repeat: -1,
					ease: 'none',
					duration: 0.5,
				})
				const positionTl = gsap.to(this.bossHeadMesh.position, {
					y: '-=0.015',
					yoyo: true,
					repeat: -1,
					ease: 'none',
					duration: 0.7,
				})

				const handleDown = (event) => {
					if (event.key === 'a') {
						this.experience.subtitlesManager.next()
					}
				}
				this.axis.on('down', handleDown)

				this.experience.subtitlesManager.on('finish', () => {
					console.log('Intro finished')

					if (this._isIntroFinished) return
					positionTl.kill()
					rotationTl.kill()
					gsap.to(this.bossHeadMesh.position, {
						y: 2,
					})
					this.axis.off('down', handleDown)
					this.experience.camera.resetAnimation()
					this._isIntroFinished = true
					this.dayManager.setDay(1)
					this._playStartAnimation()
					this._isGameStarted = true
				})
			},
		})
	}

	_handleRestart(e) {
		if (e.key === 'a') {
			// Reset the game
			this._reset()
			window.location.reload()
			// Remove this event listener after resetting
			this.axis.off('down', this._handleRestart)
		}
	}

	_handleAxisDown(e) {
		if (e.key === 'a' && !this._isGameStarted && !this._isIntroFinished && !this._isIntroStarted) {
			const introTimeline = gsap.timeline()
			introTimeline.to(
				this._startMenuElement,
				{
					autoAlpha: 0,
					duration: 0.5,
					ease: 'sine.inOut',
					onComplete: () => {
						this.experience.camera.headAnimation()
						this._isIntroStarted = true
						this._bossTalking()
					},
				},
				0,
			)
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

	setObjectives() {
		const moneyObjectives = document.querySelector('#overlay-objectives .score #count')
		const timeObjectives = document.querySelector('#overlay-objectives .time #hours')

		moneyObjectives.textContent = this.moneyManager.formatNumber(this.dayManager.day.money)
		timeObjectives.textContent = '[' + this.dayManager.day.workHours[0] + '-' + this.dayManager.day.workHours[1] + 'h]'
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
