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
			this._qteElement.appendChild(child)
		})
		let index = 0

		this.experience.axis.on('down', (event) => {
			const firstChild = this._qteElement.children[index]
			if (event.key === 'a' && firstChild.alt === 'a') {
				firstChild.style.opacity = 0.5
				index++
			}
			if (event.key === 'x' && firstChild.alt === 'x') {
				firstChild.style.opacity = 0.5
				index++
			}
			if (event.key === 'i' && firstChild.alt === 'i') {
				firstChild.style.opacity = 0.5
				index++
			}
			if (event.key === 's' && firstChild.alt === 's') {
				firstChild.style.opacity = 0.5
				index++
			}
			if (index === children.length) {
				this._qteElement.style.opacity = '0'
				this.blockSubtitle = false
				this.playSubtitle(this.currentSubtitle.success)
			}
		})
	}
}
