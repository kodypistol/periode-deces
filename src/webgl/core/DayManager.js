import gsap from 'gsap'
import EventEmitter from './EventEmitter'
import Experience from './Experience'
import { MeshBasicMaterial } from 'three'

const PARAMS = [
	{
		index: 1,
		duration: 120,
		workHours: [9, 17],
		tasks: 3,
		money: 10, // in K€
		role: 'Stagiaire',
	},
	{
		index: 2,
		duration: 120,
		workHours: [9, 19],
		tasks: 4,
		money: 100, // in K€
		role: "Chef d'équipe",
	},
	{
		index: 3,
		duration: 120,
		workHours: [9, 21],
		tasks: 5,
		money: 500, // in K€
		role: 'Bras droit du patron',
	},
]

export default class DayManager extends EventEmitter {
	constructor() {
		super()
		this.experience = new Experience()
		this.time = this.experience.time
		this.moneyManager = this.experience.moneyManager
		this.day = PARAMS[0]
		this.isDayStarted = false
		this.tasksCount = 0
		this.timeCount = 0
		this._dayPanelElement = document.getElementById('day-panel')
		this._dayCounterElement = document.getElementById('day-counter')
		this._dayRoleElement = document.getElementById('day-role')
	}

	reset() {
		this.tasksCount = 0
		this.isDayStarted = false
		this.timeCount = 0
	}

	getDay() {
		return this.day
	}

	setDay(index) {
		this.day = PARAMS[index - 1]
		this._dayCounterElement.innerHTML = this.day.index
		this._dayRoleElement.innerHTML = this.day.role

		this.trigger('day:finished')
		this.playChangeDayAnimation()
	}

	playChangeDayAnimation() {
		const dayTimeline = gsap.timeline()

		dayTimeline.to(
			this._dayPanelElement,
			{
				autoAlpha: 1,
				duration: 0.25,
				ease: 'sine.inOut',
				onComplete: () => {
					this.reset()
				},
			},
			0
		)
		dayTimeline.to(
			this._dayPanelElement,
			{
				autoAlpha: 0,
				delay: 1.5,
				duration: 0.25,
				ease: 'sine.inOut',
				onComplete: () => {
					this.trigger('day:changed')
					this.isDayStarted = true
				},
			},
			1
		)
	}

	getCurrentDayGroupName() {
		switch (this.day.index) {
			case 1:
				return 'stagiaire'
			case 2:
				return 'manager'
			case 3:
				return 'subBoss'
			default:
				return 'stagiaire' // Default group
		}
	}

	checkEndOfDay() {
		if (this.timeCount > this.day.duration) {
			if (this.tasksCount >= this.day.tasks && this.moneyManager.money >= this.day.money) {
				const nextDayIndex = this.day.index + 1
				if (nextDayIndex <= PARAMS.length) {
					this.reset()
					this.setDay(nextDayIndex)
				} else {
					console.log('All days completed.')
					// Handle what happens when all days are completed
				}
			} else {
				console.log('Not enough tasks or money to proceed to the next day.')
				this.moneyManager.stop()
				this.trigger('day:gameOver')
			}
		}
	}

	updateClock() {
		// Get the start and end work hours from the current day
		const startHour = this.day.workHours[0]
		const endHour = this.day.workHours[1]

		// Calculate the total work hours for the day
		const totalWorkHours = endHour - startHour

		// Calculate the proportion of the day completed (timeCount / day duration)
		const progress = this.timeCount / this.day.duration

		// Calculate the current hour within the work hours
		const currentHour = startHour + progress * totalWorkHours

		// Split the currentHour into hours and minutes
		const hours = Math.floor(currentHour)
		const minutes = Math.floor((currentHour - hours) * 60)

		// Update the clock display in the HTML
		const hoursDisplay = String(hours).padStart(2, '0')
		const minutesDisplay = String(minutes).padStart(2, '0')

		document.getElementById('horloge-hours').innerHTML = `${hoursDisplay}:${minutesDisplay}`
	}

	stop() {
		this.isDayStarted = false
	}

	update() {
		if (!this.isDayStarted) return
		this.timeCount += this.time.delta / 1000 // Convert ms to s
		this.updateClock()
		this.checkEndOfDay()
	}
}
