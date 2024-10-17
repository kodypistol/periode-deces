import EventEmitter from 'core/EventEmitter.js'

export default class Sizes extends EventEmitter {
	constructor() {
		super()

		// Setup
		this.downScale = 2
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
	}
	#checkIfMobile() {
		const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
		const isMobileScreen = this.width < 1024
		return isMobileUa || isMobileScreen
	}
}
