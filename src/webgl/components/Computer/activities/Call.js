import EventEmitter from 'core/EventEmitter.js'
import Experience from 'core/Experience.js'
import { gsap } from 'gsap'

export default class Call extends EventEmitter {
	constructor() {
		super()
		this.experience = new Experience()
		this.axis = this.experience.axis

		this.dayManager = this.experience.dayManager
		this.moneyManager = this.experience.moneyManager

		this.computer = this.experience.computer
		this.computerScreenElement = this.experience.computer.screenElement.element

		this.score = 1

		this.TALKING_PHRASES = 30

		this.init()
	}

	init() {
		this._element = document.createElement('div')
		this._element.className = 'activityContainer call'

		this._element.innerHTML = `
      <div class="notification">
				<img src="/call-notification.png" alt="" />
			</div>
      <div class="activity">
      	<img class="top" src="/call-top.png" alt="" />
        <div class="call-members">
					<div class="row up">
						<div class="call-item">
							<p class="call-item-title">Emma Sussey, H2O Superhero</p>
							<img class="head" src="/heads/adel.png" alt="Head" />
							<img class="office-background" src="/heads/bg-adel.png" alt="Head" />
						</div>
						<div class="call-item">
							<p class="call-item-title">David Mekouil, CEM Coach Executive Mentor</p>
							<img class="head" src="/heads/camille.png" alt="Head" />
							<img class="office-background" src="/heads/bg-camille.png" alt="Head" />
						</div>
					</div>
					<div class="row">
						<div class="call-item">
							<p class="call-item-title">Joseph Outre, CTO</p>
							<img class="head" src="/heads/jules.png" alt="Head" />
							<img class="office-background" src="/heads/bg-jules.png" alt="Head" />
						</div>
						<div class="call-item">
							<p class="call-item-title">Maëva Tuffer-Anculay, Chief Placer Manager</p>
							<img class="head" src="/heads/gaetan.png" alt="Head" />
							<img class="office-background" src="/heads/bg-gaetan.png" alt="Head" />
						</div>
						<div class="call-item">
							<p class="call-item-title">Tim Petlekouy, Chief Happiness Officer</p>
							<img class="head" src="/heads/aurel.png" alt="Head" />
							<img class="office-background" src="/heads/bg-aurel.png" alt="Head" />
						</div>
					</div>
				</div>
				<div class="bottom">
					<img class="cta" src="/micro.svg" alt="" />
					<img class="logos" src="/logos.png" alt="" />

				</div>
      </div>
      <div class="completed">
      	<p>The call is ended!</p>
			</div>
    `
		this.computerScreenElement.prepend(this._element)

		this._notification = this._element.querySelector('.notification')
		this._activity = this._element.querySelector('.activity')
		this._items = this._element.querySelectorAll('.call-item')
		this._completed = this._element.querySelector('.completed')
	}

	showTask() {
		gsap.to(this._notification, {
			duration: 0.2,
			scale: 1,
		})
	}

	playTask() {
		gsap.to(this._notification, {
			duration: 0.01,
			scale: 0,
		})

		gsap.to(this._activity, {
			duration: 0.2,
			scale: 1,
		})

		this.initTaskAnimations()
		this._bindEvents()

		this.isGameActive = true
		this.isPlaying = true
	}

	_bindEvents() {
		this.axis.on('down:right', this.handleDown.bind(this))
	}

	hide() {
		gsap.to(this._activity, {
			scale: 0,
			duration: 0.3,
		})
	}

	handleDown(event) {
		if (this.isPlaying) {
			if (event.key === 'a') {
				console.log('down')
			}
		}
	}

	end() {
		const endTimeline = gsap.timeline()

		this.moneyManager.multiplyRate(this.score / 10, 5)
		this.dayManager.tasksCount++
		this.trigger('activity:end', [this])
	}

	getRandomItemIndex() {
		return Math.floor(Math.random() * this._items.length)
	}

	initTaskAnimations() {
		const loopTalkTimeline = gsap.timeline()

		const loop = () => {
			loopTalkTimeline.clear()
			for (let i = 0; i < this.TALKING_PHRASES; i++) {
				const index = this.getRandomItemIndex()
				loopTalkTimeline
					.to(
						this._items[index],
						{
							duration: 0.2,
							borderColor: '#3DEB5D',
						},
						'-=1',
					)
					.to(this._items[index], {
						duration: 0.5,
						ease: 'power3.inOut',
						delay: 1.5,
						borderColor: 'transparent',
					})
			}

			loopTalkTimeline.eventCallback('onComplete', this.end.bind(this))
		}
		loop()
	}

	reset() {
		this.isGameActive = false
		this.isPlaying = false

		console.log('reset')
		this.axis.off('down:right', this.handleDown.bind(this))
	}
}
