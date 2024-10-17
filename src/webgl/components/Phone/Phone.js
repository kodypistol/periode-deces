import addObjectDebug from '@/webgl/utils/addObjectDebug'
import Experience from 'core/Experience.js'
import { gsap } from 'gsap'
import { Vector2 } from 'three'

export default class Phone {
	/**
	 *
	 * @param {'left' | 'right'} _side
	 */
	constructor(_side = 'right') {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.camera = this.experience.camera.instance
		this.resources = this.scene.resources
		this.debug = this.experience.debug
		this.axis = this.experience.axis
		this.side = _side

		this._setModel()
		this._setDebug()

		this.targetRotation = 0
	}

	_setModel() {
		this.model = this.resources.items.phoneModel.scene
		this.model.name = 'phone'
		// this.model.position.x += 1.2
		// this.model.position.y += 1
		// this.model.position.z += 5

		this.telModel = this.model.children.find(({ name }) => name === 'tel')
		this._setShakeAnim()
		this._setAnswerAnim()
		this.pickMe()

		this.scene.add(this.model)
	}

	/**
	 * Activate the CTA of the call (ringing)
	 */
	pickMe() {
		this.shakeAnim.play()
		this.playTask()
	}

	ratio() {
		this.answerAnim.reverse()
	}

	_setShakeAnim() {
		const duration = 0.5
		this.shakeAnim = gsap.timeline({ repeat: -1, yoyo: true, paused: true })

		this.shakeAnim.to(
			this.telModel.rotation,
			{
				duration: duration - duration / 3,
				delay: duration / 3,
				x: this.telModel.rotation.x + 0.1,
				y: this.telModel.rotation.y + 0.1,
				z: this.telModel.rotation.z - 0.05,
				ease: 'bounce.out',
			},
			0
		)

		this.shakeAnim.to(
			this.telModel.position,
			{
				duration,
				y: this.telModel.position.y + 0.1,
				ease: 'bounce.out',
			},
			0
		)
	}

	/**
	 * @param {'left' | 'right'} side
	 */
	playTask() {
		this.axis.on('down:' + this.side, this._handlePlayTask.bind(this))
	}

	_handlePlayTask(e) {
		if (e.key !== 'a') return
		this.axis.off('down:' + this.side, this._handlePlayTask)

		this.shakeAnim.reverse().then(() => {
			setTimeout(() => this.ratio(), 2000)
			this.answerAnim.play()
		})
	}

	_setAnswerAnim() {
		const duration = 1.25
		const sideF = this.side === 'left' ? -1 : 1

		const target = new Vector2()
		this.camera.getViewSize(1, target) // result written to target
		const dist = target.x * 0.5

		this.answerAnim = gsap
			.timeline({ paused: true })
			.to(
				this.telModel.rotation,
				{
					duration,
					x: -Math.PI / 2,
					z: (Math.PI / 2) * sideF,
					ease: 'power2.inOut',
				},
				0
			)
			.to(
				this.telModel.position,
				{
					duration,
					x: this.camera.position.x - dist * sideF,
					y: this.camera.position.y,
					z: this.camera.position.z,
					ease: 'power2.inOut',
				},
				0
			)
	}

	_setDebug() {
		const debugFolder = addObjectDebug(this.debug.ui, this.model)
	}

	update() {
		if (this.telModel) {
			// this.telModel.position.y += this.animValues.shake.factor * 0.01
		}
	}
}
