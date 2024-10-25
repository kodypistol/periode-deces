export default class TaskManager {
	constructor(options = {}) {
		this.tasks = options.tasks || []
		this.focusTasks = options.focusTasks || []
		this.axis = options.axis
		this.selectionManager = options.selectionManager
		this.activeTasks = []
		this.activeFocusTask = null

		this._onTaskComplete = this._onTaskComplete.bind(this)
		this._onFocusTaskComplete = this._onFocusTaskComplete.bind(this)

		this._setupTasks()
	}

	_setupTasks() {
		this.tasks.forEach((task) => {
			task.addEventListener('task:complete', this._onTaskComplete)
		})
		this.focusTasks.forEach((task) => {
			task.addEventListener('task:complete', this._onFocusTaskComplete)
		})
	}

	start() {
		this._startTaskScheduler()
		this._startFocusTaskScheduler()
	}

	_startTaskScheduler() {
		const interval = 1000 // Adjust interval as needed
		this.taskInterval = setInterval(() => {
			const availableTasks = this.tasks.filter((task) => !task.isPlaying && !task.isAvailable)
			if (availableTasks.length > 0) {
				const randomTask = availableTasks[Math.floor(Math.random() * availableTasks.length)]
				randomTask.showTask()
				this.activeTasks.push(randomTask)
			}
		}, interval)
	}

	_startFocusTaskScheduler() {
		const interval = 30000 // Adjust interval as needed
		this.focusTaskTimeout = setInterval(this._triggerFocusTask.bind(this), interval)
	}

	_triggerFocusTask() {
		if (this.activeFocusTask) return

		const availableFocusTasks = this.focusTasks.filter((task) => !task.isPlaying)

		if (availableFocusTasks.length > 0) {
			const randomTask = availableFocusTasks[Math.floor(Math.random() * availableFocusTasks.length)]

			this.activeFocusTask = randomTask

			// Pause all active tasks
			this.pauseAllTasks()

			randomTask.playTask()
		}
	}

	pauseAllTasks() {
		// Pause selection manager
		if (this.selectionManager) {
			console.log('Pausing selection manager')
			this.selectionManager.setEnabled(false)
		}

		// Pause all active tasks
		this.activeTasks.forEach((task) => {
			if (task.isPlaying) {
				task.pause()
			}
		})
	}

	resumeAllTasks() {
		// Resume selection manager
		if (this.selectionManager) {
			console.log('Resuming selection manager')
			this.selectionManager.setEnabled(true)
		}

		// Resume all active tasks
		this.activeTasks.forEach((task) => {
			if (task.isPaused) {
				task.resume()
			}
		})
	}

	_onTaskComplete(event) {
		const task = event.task
		const index = this.activeTasks.indexOf(task)
		if (index > -1) {
			this.activeTasks.splice(index, 1)
		}
	}

	_onFocusTaskComplete(event) {
		const task = event.task
		console.log('Active focus task:', this.activeFocusTask)
		console.log('Completed task:', task)
		if (this.activeFocusTask === task) {
			console.log('Focus task completed:', task)
			this.activeFocusTask = null

			// Resume all tasks
			this.resumeAllTasks()
		} else {
			console.log('Completed focus task does not match active focus task')
		}
	}

	reset() {
		clearInterval(this.taskInterval)
		clearTimeout(this.focusTaskTimeout)
		this.tasks.forEach((task) => task.reset())
		this.focusTasks.forEach((task) => task.reset())
		this.activeTasks = []
		this.activeFocusTask = null
	}
}
