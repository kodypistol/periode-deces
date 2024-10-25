import subtitles from '@/subtitles.json'
import { gsap } from 'gsap'
import Experience from 'core/Experience.js'
import EventEmitter from 'core/EventEmitter.js'

export class SubtitleManager extends EventEmitter {
	constructor() {
		super()
		this._subtitleElement = document.querySelector('.subtitle')
		this._qteElement = document.querySelector('.qte')
		this._nextElement = document.querySelector('.next')
		this.experience = new Experience()
		this.dayManager = this.experience.dayManager
		this.moneyManager = this.experience.moneyManager

		this.typeAudio = new Audio('/audio/type.mp3')

		// Hide the subtitle element initially
		this._subtitleElement.style.opacity = '0'
	}

	playSubtitle(key) {
		// Clear existing text and hide the "next" button
		this._subtitleElement.innerText = ''
		this._nextElement.style.opacity = '0'

		this.currentSubtitle = subtitles[key]
		if (!this.currentSubtitle) {
			console.error(`Subtitle key "${key}" does not exist.`)
			this.trigger('finish') // End the subtitle sequence gracefully
			return
		}

		// Set subtitle text color if specified
		this._subtitleElement.style.color = this.currentSubtitle.color || ''

		const splitText = this.currentSubtitle.text.split('')

		// Create span elements for each character
		splitText.forEach((char) => {
			const span = document.createElement('span')
			span.style.visibility = 'hidden'
			span.innerText = char
			this._subtitleElement.appendChild(span)
		})

		// Show the subtitle element before starting the animation
		this._subtitleElement.style.opacity = '1'

		// Animate the appearance of characters
		this.tl = gsap.timeline()
		this.tl.to(this._subtitleElement.querySelectorAll('span'), {
			stagger: {
				each: 0.05,
				onComplete: () => {
					this.typeAudio.play()
				},
			},
			visibility: 'visible',
			onComplete: () => {
				this._nextElement.style.opacity = '1'
				if (this.currentSubtitle.success) {
					this.playQte()
				}
			},
		})
	}

	next() {
		if (this.blockSubtitle) return

		if (this.tl && this.tl.progress() < 1) {
			// Fast-forward the animation if it's still in progress
			this.tl.seek(this.tl.duration())
			this._nextElement.style.opacity = '1'
			if (this.currentSubtitle.success) {
				this.playQte()
				return
			}
			return
		}

		if (this.currentSubtitle.next) {
			// Play the next subtitle
			this.playSubtitle(this.currentSubtitle.next)
			this.typeAudio.play()
		} else {
			// No more subtitles; clear text and hide the subtitle element
			this._subtitleElement.innerText = ''
			this._subtitleElement.style.opacity = '0' // Hide the subtitle element
			this.trigger('finish')
		}
		this._nextElement.style.opacity = '0'
	}

	playQte() {
		this._nextElement.style.opacity = '0'
		this._qteElement.style.opacity = '1'
		this.blockSubtitle = true
		const children = Array.from(this._qteElement.children)
		children.sort(() => Math.random() - 0.5)
		children.forEach((child) => {
			child.style.opacity = 1
			this._qteElement.appendChild(child)
		})
		let index = 0

		const endQte = () => {
			this._qteElement.style.opacity = '0'
			this.experience.axis.off('down', handleDown)
			this.blockSubtitle = false

			// Hide the subtitle element after QTE ends if no subtitles are displayed
			if (!this.currentSubtitle.next) {
				this._subtitleElement.style.opacity = '0'
			}
		}

		const handleDown = (event) => {
			const firstChild = this._qteElement.children[index]
			const keyMap = {
				x: 'x',
				i: 'i',
				s: 's',
			}

			if (keyMap[event.key] && firstChild.alt === keyMap[event.key]) {
				firstChild.style.opacity = 0.5
				index++
			} else {
				if (this.currentSubtitle.error) {
					this.playSubtitle(this.currentSubtitle.error)
				} else {
					console.error('Error key is missing in currentSubtitle.')
					// Provide a fallback message
					this._subtitleElement.innerText = 'You failed the task.'
					this._subtitleElement.style.opacity = '1'
				}
				// Adjust money
				this.moneyManager.subtractMoneyRate(0.05, 5)
				endQte()
			}

			if (index === children.length) {
				if (this.currentSubtitle.success) {
					this.playSubtitle(this.currentSubtitle.success)
				} else {
					console.error('Success key is missing in currentSubtitle.')
					// Provide a fallback message
					this._subtitleElement.innerText = 'You succeeded!'
					this._subtitleElement.style.opacity = '1'
				}
				// Adjust money
				this.moneyManager.multiplyRate(5, 5)
				this.dayManager.tasksCount++
				endQte()
			}
		}

		requestAnimationFrame(() => {
			this.experience.axis.on('down', handleDown)
		})
	}

	stop() {
		this._subtitleElement.style.opacity = '0'
		this._qteElement.style.opacity = '0'
		this._nextElement.style.opacity = '0'
		this.experience.axis.off('down')
	}
}
