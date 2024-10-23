import gsap from "gsap"
import EventEmitter from "./EventEmitter"
import Experience from "./Experience";

const PARAMS = [
	{
		index: 1,
		duration: 120,
		tasks: 3,
		money: 10000,
		role: "Stagiaire",
	},
	{
		index: 2,
		duration: 120,
		tasks: 4,
		money: 100000,
		role: "Chef d'équipe",
	},
	{
		index: 3,
		duration: 120,
		tasks: 5,
		money: 500000,
		role: "Bras droit du patron",
	},
]

export default class DayManager extends EventEmitter {
	constructor() {
		super()
		this.experience = new Experience();
		this.day = PARAMS[0]
		this.tasksCount = 0
		this._dayPanelElement = document.getElementById('day-panel')
		this._dayCounterElement = document.getElementById('day-counter')
		this._dayRoleElement = document.getElementById('day-role')
	}

	reset() {
		this.tasksCount = 0
	}

	getDay() {
		return this.day
	}

	setDay(index) {
		this.day = PARAMS[index - 1]
		this._dayCounterElement.innerHTML = this.day.index
		this._dayRoleElement.innerHTML = this.day.role

		this.playChangeDayAnimation()
	}

	playChangeDayAnimation() {
		const dayTimeline = gsap.timeline()

		dayTimeline.to(this._dayPanelElement, { autoAlpha: 1, duration: 0.25, ease: 'sine.inOut' }, 0)
		dayTimeline.to(
			this._dayPanelElement,
			{
				autoAlpha: 0,
				delay: 0.5,
				duration: 0.25,
				ease: 'sine.inOut',
				onComplete: () => {
					this.trigger('day:changed')
				},
			},
			1
		)
	}
}
