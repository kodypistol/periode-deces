import Task from 'core/Task'
import { MeshBasicMaterial } from 'three'
import { gsap } from 'gsap'

const CALL = {
	DURATION: 4, // seconds
	VOLUMES: {
		CALLING: 0.2,
		TALKING: 1,
	},
}

export default class Phone extends Task {
	constructor(options = {}) {
		super(options)
		this.side = options.side || 'right'
		this.duration = options.duration || 10
		this.camera = this.experience.camera.instance

		// Initialize audio elements
		this.calling = new Audio('/audio/phone/ringtone.mp3')
		this.calling.loop = true
		this.talking = new Audio('/audio/phone/talking.mp3')
		this.talking.loop = true
		this.closeCall = new Audio('/audio/phone/close_call.mp3')

		// Prepare animations (will initialize after mesh is created)
		this.telModel = null
		this.baseTalValues = null
		this.answerAnim = null
		this.shakeAnim = null
		this.resetAnim = null
	}

	_createMesh() {
		const texture = this.resources.items.bakeTexture
		texture.channel = 1
		this._material = new MeshBasicMaterial({ map: texture })

		const phoneModel = this.resources.items.phoneModel
		if (!phoneModel) {
			console.error('phoneModel not found in resources.items')
			return
		}

		this.mesh = phoneModel.scene.clone()
		this.mesh.name = 'phone'

		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this._material
			}
		})

		// Get the telephone handset model
		this.telModel = this.mesh.children.find(({ name }) => name === 'tel')
		this.baseTalValues = {
			rotation: this.telModel.rotation.clone(),
			position: this.telModel.position.clone(),
		}

		this.add(this.mesh)

		// Now that the telModel is available, set up animations
		this._setAnswerAnim()
		this._setShakeAnim()
		this._setResetAnim()
	}

	playTask() {
		if (!this.isAvailable || this.isPlaying) return
		this.isPlaying = true
		this.hideTask()

		this.shakeAnim.pause()
		this.calling.pause()
		this.answerAnim.play()

		this.experience.subtitlesManager.playSubtitle('client') // Ensure 'client' key exists in subtitles.json

		const handleDown = (event) => {
			if (event.key === 'a') {
				this.experience.subtitlesManager.next()
			}
		}

		this.axis.on(`down:right`, handleDown)

		this.experience.subtitlesManager.on('finish', () => {
			this.answerAnim.reverse()
			this.completeTask()
			this.axis.off(`down:right`, handleDown)
			this.isPlaying = false
		})
	}

	showTask() {
		super.showTask()
		this.shakeAnim.play()
		this.calling.volume = CALL.VOLUMES.CALLING
		this.calling.play()
	}

	hideTask() {
		super.hideTask()
		this.shakeAnim.pause()
		gsap.to(this.calling, { volume: 0, duration: 0.25, onComplete: () => this.calling.pause() })
	}

	_setAnswerAnim() {
		const duration = 1.25
		const sideF = this.side === 'left' ? -1 : 1

		const dist = 1 // Adjust this value based on your camera setup

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

	reset() {
		super.reset()
		if (this.shakeAnim) this.shakeAnim.pause(0)
		if (this.answerAnim) this.answerAnim.pause(0)
		if (this.resetAnim) this.resetAnim.pause(0)
		gsap.to(this.calling, { volume: 0, duration: 0.25, onComplete: () => this.calling.pause() })
		gsap.to(this.talking, { volume: 0, duration: 0.25, onComplete: () => this.talking.pause() })
	}
}
