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

		this.typeAudio = new Audio('/audio/type.mp3')
	}

	playSubtitle(key) {
		this._subtitleElement.innerText = ''
		this._nextElement.style.opacity = '0'
		this.currentSubtitle = subtitles[key]
		if (!this.currentSubtitle) throw new Error('key doesnt exist')
		this._subtitleElement.style.color = this.currentSubtitle.color || ''
		const splitText = this.currentSubtitle.text.split('')

		splitText.forEach((char) => {
			const span = document.createElement('span')
			span.style.visibility = 'hidden'
			span.innerText = char
			this._subtitleElement.appendChild(span)
		})
		this.tl = gsap
			// .to(
			// 	this._subtitleElement,
			// 	{
			// 		opacity: 1,
			// 	},
			// 	0
			// )
			.to(this._subtitleElement.querySelectorAll('span'), {
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
		if (this.tl.progress() < 1) {
			this.tl.seek(this.tl.duration())
			this._nextElement.style.opacity = '1'
			if (this.currentSubtitle.success) {
				this.playQte()
				return
			}
			return
		}

		if (this.currentSubtitle.next) {
			this.playSubtitle(this.currentSubtitle.next)
			this.typeAudio.play()
		} else {
			this._subtitleElement.innerText = ''
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
				this.playSubtitle(this.currentSubtitle.error)
				// TODO: ADD MONEY DECREASE
				endQte()
			}

			if (index === children.length) {
				this.playSubtitle(this.currentSubtitle.success)
				// TODO: ADD MONEY SCALE
				this.dayManager.tasksCount++
				console.log(this.dayManager.tasksCount)

				endQte()
			}
		}

		requestAnimationFrame(() => {
			this.experience.axis.on('down', handleDown)
		})
	}
}
