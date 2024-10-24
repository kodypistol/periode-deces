import EventEmitter from 'core/EventEmitter.js'
import Experience from 'core/Experience.js'

export default class Sizes extends EventEmitter {
	constructor() {
		super()

		// Setup
		this.downScale = 3
		this.width = window.innerWidth / this.downScale
		this.height = window.innerHeight / this.downScale
		this.pixelRatio = Math.min(devicePixelRatio, 1)
		this.isMobile = this.#checkIfMobile()

		// Resize event
		addEventListener('resize', () => {
			this.width = window.innerWidth / this.downScale
			this.height = window.innerHeight / this.downScale
			this.pixelRatio = Math.min(devicePixelRatio, 1)
			this.isMobile = this.#checkIfMobile()

			this.trigger('resize')
		})

		this.experience = new Experience()
		if (this.experience.debug.active)
			this.experience.debug.ui
				.addBinding(this, 'downScale', {
					label: 'Down scale',
					min: 1,
					max: 5,
					step: 1,
				})
				.on('change', () => {
					this.width = window.innerWidth / this.downScale
					this.height = window.innerHeight / this.downScale
					this.trigger('resize')
				})
	}
	#checkIfMobile() {
		const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
		const isMobileScreen = this.width < 1024
		return isMobileUa || isMobileScreen
	}
}
