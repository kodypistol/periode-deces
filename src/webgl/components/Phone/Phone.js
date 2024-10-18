import EventEmitter from '@/webgl/core/EventEmitter'
import Experience from 'core/Experience.js'
import { gsap } from 'gsap'
import { MeshBasicMaterial, Vector2 } from 'three'

const CALL = {
	DURATION: 4, // seconds
	VOLUMES: {
		CALLING: 0.2,
		TALKING: 1,
	},
}
export default class Phone extends EventEmitter {
	/**
	 *
	 * @param {'left' | 'right'} _side
	 */
	constructor({ duration = 10, side = 'right' } = {}) {
		super()

		this.experience = new Experience()
		this.scene = this.experience.scene
		this.camera = this.experience.camera.instance
		this.resources = this.scene.resources
		this.debug = this.experience.debug
		this.axis = this.experience.axis
		this.calling = new Audio('/audio/phone/calling.wav')
		this.calling.loop = true
		this.talking = new Audio('/audio/phone/talking.mp3')
		this.talking.loop = true
		this.closeCall = new Audio('/audio/phone/close_call.mp3')
		this.side = side
		this.duration = duration

		this._setMaterial()
		this._setModel()
		this._setDebug()

		this.targetRotation = 0
	}

	_setMaterial() {
		const texture = this.resources.items.bakeTexture
		texture.channel = 1
		this._material = new MeshBasicMaterial({ map: texture })
	}

	_setModel() {
		this.mesh = this.resources.items.phoneModel.scene.clone()
		this.mesh.name = 'phone'

		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this._material
			}
		})
		// this.model.position.x += 1.2
		// this.model.position.y += 1
		// this.model.position.z += 5

		this.telModel = this.mesh.children.find(({ name }) => name === 'tel')
		this.baseTalValues = {
			rotation: this.telModel.rotation.clone(),
			position: this.telModel.position.clone(),
		}
		this._setShakeAnim()
		this._setAnswerAnim()
		this._setResetAnim()

		this.scene.add(this.mesh)
	}

	/**
	 * Activate the CTA of the call (ringing)
	 */
	showTask() {
		this.shakeAnim.play()
		this.calling.volume = CALL.VOLUMES.CALLING
		this.calling.play()
		// this.playTask()

		// this.outCall = setTimeout(() => {
		// 	this.shakeAnim.pause()
		// 	this.resetAnim.play()
		// 	this.trigger('task:fail')
		// }, this.duration * 1000)
	}

	/**
	 * Deactivate the CTA of the call (ringing)
	 */
	ratio() {
		this.answerAnim.reverse()
	}

	/**
	 * @param {'left' | 'right'} side
	 */
	playTask(side = 'left') {
		this.isPlaying = true
		this.experience.subtitlesManager.playSubtitle('client')
		this.shakeAnim.pause()
		this.calling.pause()
		this.answerAnim.play()
		const handleDown = (event) => {
			if (event.key === 'a') {
				this.experience.subtitlesManager.next()
			}
		}
		this.axis.on(`down:${side}`, handleDown)
		this.experience.subtitlesManager.on('finish', () => {
			this.answerAnim.reverse()
			this.trigger('task:complete')
			this.axis.off(`down:${side}`, handleDown)
			this.isPlaying = false
		})
	}

	_handlePlayTask(e) {
		if (e.key !== 'a') return
		this.axis.off('down:' + this.side, this._handlePlayTask)
		gsap.to(this.calling, { volume: 0, duration: 0.25, onComplete: () => this.calling.pause() })

		this.shakeAnim.pause()
		this.answerAnim.play()

		this.talking.volume = CALL.VOLUMES.TALKING
		this.talking.play()

		setTimeout(() => {
			gsap.to(this.talking, { volume: 0, duration: 0.25, onComplete: () => this.talking.pause() })

			this.answerAnim.pause()
			this.resetAnim.play()

			this.trigger('task:complete')
		}, CALL.DURATION * 1000)
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
				0,
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
				0,
			)
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
			0,
		)

		this.shakeAnim.to(
			this.telModel.position,
			{
				duration,
				y: this.telModel.position.y + 0.1,
				ease: 'bounce.out',
			},
			0,
		)
	}

	_setResetAnim() {
		const duration = 1.25
		this.resetAnim = gsap
			.timeline({ paused: true })
			.to(
				this.telModel.rotation,
				{
					duration,
					x: this.baseTalValues.rotation.x,
					y: this.baseTalValues.rotation.y,
					z: this.baseTalValues.rotation.z,
					ease: 'power2.inOut',
				},
				0,
			)
			.to(
				this.telModel.position,
				{
					duration,
					x: this.baseTalValues.position.x,
					y: this.baseTalValues.position.y,
					z: this.baseTalValues.position.z,
					ease: 'power2.inOut',
					onComplete: () => {
						this.closeCall.play()
					},
				},
				0,
			)
	}

	_setDebug() {
		// const debugFolder = addObjectDebug(this.debug.ui, this.model)
	}
}
