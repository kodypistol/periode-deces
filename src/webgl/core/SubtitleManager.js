import subtitles from '@/subtitles.json'
import { gsap } from 'gsap'
import Experience from 'core/Experience.js'

export class SubtitleManager {
	constructor(props) {
		this._subtitleElement = document.querySelector('.subtitle')
		this._qteElement = document.querySelector('.qte')
		this.experience = new Experience()

		this.typeAudio = new Audio('/audio/type.mp3')
	}

	playSubtitle(key) {
		this._subtitleElement.innerText = ''
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
		this.tl = gsap.to(this._subtitleElement.querySelectorAll('span'), {
			stagger: {
				each: 0.05,
				onComplete: () => {
					this.typeAudio.play()
				},
			},
			visibility: 'visible',
			onComplete: () => {
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
		}
	}

	playQte() {
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
				a: 'a',
				x: 'x',
				i: 'i',
				s: 's',
			}

			if (keyMap[event.key] && firstChild.alt === keyMap[event.key]) {
				firstChild.style.opacity = 0.5
				index++
			} else {
				this.playSubtitle(this.currentSubtitle.error)
				endQte()
			}

			if (index === children.length) {
				this.playSubtitle(this.currentSubtitle.success)
				endQte()
			}
		}

		requestAnimationFrame(() => {
			this.experience.axis.on('down', handleDown)
		})
	}
}
