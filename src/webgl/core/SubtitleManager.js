import subtitles from '@/subtitles.json'
import { gsap } from 'gsap'
import Experience from 'core/Experience.js'

export class SubtitleManager {
	constructor(props) {
		this._subtitleElement = document.querySelector('.subtitle')
		this.experience = new Experience()

		this.typeAudio = new Audio('/audio/type.mp3')
	}

	playSubtitle(key) {
		this._subtitleElement.innerText = ''
		this.currentSubtitle = subtitles[key]
		if (!this.currentSubtitle) throw new Error('key doesnt exist')
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
		})
	}
	next() {
		if (this.tl.progress() < 1) {
			this.tl.seek(this.tl.duration())
			return
		}
		this.playSubtitle(this.currentSubtitle.next)
		this.typeAudio.play()
	}
}
