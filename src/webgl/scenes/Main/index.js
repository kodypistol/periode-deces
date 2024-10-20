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
		this._isGameStarted = false
		this._isGameOver = false

		this.scene.resources.on('ready', () => {
			this._start()
			this._addEventListeners()

			// this._skipIntro()
		})
	}

	_start() {
		this._startMenuElement = document.getElementById('start-menu')
		this._dayPanelElement = document.getElementById('day-panel')
		this._gameOverElement = document.getElementById('game-over')

		this._createSceneComponents()
	}

	_skipIntro() {
		this._selectionBehavior()

		this._isGameStarted = true
		const startTimeline = gsap.timeline()

		startTimeline.to(this._startMenuElement, { autoAlpha: 0, duration: 0.01, ease: 'sine.inOut' }, 0)
		startTimeline.to(this._dayPanelElement, { autoAlpha: 1, duration: 0.01, ease: 'sine.inOut' }, 0)
		startTimeline.to(this._dayPanelElement, {
			autoAlpha: 0, duration: 0.01, ease: 'sine.inOut',
			onComplete: () => {
				this._randomTasks()
				this._randomFocusTasks()
			},
		}, 1)
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
	}

	_createSceneComponents() {
		this.background = new Background()
		this.desk = new Desk()

		this.head = new Head()
		this.focusTasks.push(this.head)

		this.fan = new Fan()
		this.scene.add(this.fan)
		// this.fan.renderOrder = 2
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
		const repeat = () => {
			if (this.tasks.find((task) => task.mesh.name === 'phone').isPlaying) {
				//prevent subtitle conflict
				setTimeout(this._randomFocusTasks.bind(this), timeout)
				return
			}
			const randomIndex = Math.floor(Math.random() * this.focusTasks.length)
			randomTask = this.focusTasks[randomIndex]
			randomTask.playTask()
			this.leftSelectionEnabled = false
			this.rightSelectionEnabled = false
			randomTask.on('task:complete', handleComplete)
		}
		setTimeout(repeat, timeout)

		const handleComplete = () => {
			setTimeout(repeat, timeout)
			this.leftSelectionEnabled = true
			this.rightSelectionEnabled = true
			randomTask.off('task:complete', handleComplete)
		}
	}


	_selectionBehavior() {
		const selectColors = {
			left: 0x00FF00,
			right: 0xFF0000,
		};

		let leftSelectionIndex = 0;
		let rightSelectionIndex = 1;

		this.leftSelectionEnabled = true;
		this.rightSelectionEnabled = true;

		// Filter out tasks that are either playing or already selected by another hand
		const getSelectableTasks = () => this.tasks.filter(task => !task.isPlaying && !task.isSelected);

		// Highlight a task for the specified hand
		const highlightTask = (index, selectColor) => {
			if (!this.tasks[index]) return;
			this.tasks[index].backgroundMesh.visible = true;
			this.tasks[index].backgroundMesh.material.color.set(selectColor);

			this.tasks[index].isSelected = true;
		};

		// Unhighlight a task (disable visibility and deselect)
		const unhighlightTask = (task) => {
			task.backgroundMesh.visible = false;
			task.isSelected = false;
		};

		// Move selection for left or right hand
		const moveSelection = (currentIndex, hand, selectColor, direction) => {
			const selectableTasks = getSelectableTasks();

			if (selectableTasks.length === 0) return currentIndex;  // No tasks left to select

			// Unhighlight the current task
			const currentTask = this.tasks[currentIndex];
			unhighlightTask(currentTask);

			// Move selection left or right, wrapping around the available tasks
			let nextSelectableIndex = direction === 'left'
				? (currentIndex - 1 + selectableTasks.length) % selectableTasks.length
				: (currentIndex + 1) % selectableTasks.length;

			// Highlight the new task
			let nextIndex = this.tasks.indexOf(selectableTasks[nextSelectableIndex]);
			highlightTask(nextIndex, selectColor);

			return nextIndex;
		};

		// Select and start playing the task based on the current index
		const playTask = (index, hand, selectColor) => {
			const selectableTasks = getSelectableTasks();

			if (selectableTasks.length === 0) return;

			const selectedTask = this.tasks[index];

			// If the task is already playing, do nothing
			if (selectedTask.isPlaying) return;

			// Mark the task as playing and unhighlight it
			selectedTask.isPlaying = true;
			unhighlightTask(selectedTask);

			// Simulate task playing and disable selection for this hand while playing
			setTimeout(() => {
				selectedTask.isPlaying = false;
				selectedTask.isSelected = false;  // The task becomes selectable again once it's done playing
			}, 3000);  // Simulate 3 seconds of task playing
		};

		// Initial task selection for both hands
		highlightTask(leftSelectionIndex, selectColors.left);
		highlightTask(rightSelectionIndex, selectColors.right);

		// Event listener for left hand task selection
		this.experience.axis.on(`down:left`, (event) => {
			if (!this.leftSelectionEnabled) return;
			if (event.key === 'a') {
				playTask(leftSelectionIndex, 'left', selectColors.left);
				this.leftSelectionEnabled = false;  // Prevent left hand from selecting another task while playing
			}
		});

		// Event listener for right hand task selection
		this.experience.axis.on(`down:right`, (event) => {
			if (!this.rightSelectionEnabled) return;
			if (event.key === 'a') {
				playTask(rightSelectionIndex, 'right', selectColors.right);
				this.rightSelectionEnabled = false;  // Prevent right hand from selecting another task while playing
			}
		});

		// Move selection for left hand
		this.experience.axis.on(`joystick:quickmove:left`, (event) => {
			if (event.direction === 'up' || event.direction === 'down') return;
			if (!this.leftSelectionEnabled) return;

			// Update leftSelectionIndex and ensure the new task is highlighted
			leftSelectionIndex = moveSelection(leftSelectionIndex, 'left', selectColors.left, event.direction);
		});

		// Move selection for right hand
		this.experience.axis.on(`joystick:quickmove:right`, (event) => {
			if (event.direction === 'up' || event.direction === 'down') return;
			if (!this.rightSelectionEnabled) return;

			// Update rightSelectionIndex and ensure the new task is highlighted
			rightSelectionIndex = moveSelection(rightSelectionIndex, 'right', selectColors.right, event.direction);
		});
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
				this.axis.on('down', (e) => {
					if (e.key === 'a') {
						window.location.reload()
					}
				})
			},
		})
	}

	_handleAxisDown(e) {
		if (e.key === 'a' && !this._isGameStarted) {
			this._selectionBehavior()
			this._playStartAnimation()

			this._isGameStarted = true
		}

		if (e.key === 'w' && this._isGameStarted) {
			this._playGameOverAnimation()
			this._isGameOver = true
		}

		if (e.key === 'a' && this._isGameOver) {
			window.location.reload()
			// this._reset() //TODO:/ do a clean reset
		}
	}

	_addEventListeners() {
		this.axis.on('down', this._handleAxisDown.bind(this))
	}

	update() {
		if (this.fan) this.fan.update()
		// if (this.phone) this.phone.update()
		if (this.computer) this.computer.update()
	}
}
