import Experience from 'core/Experience.js'
import { MeshBasicMaterial, Vector2 } from 'three'
import { lerp } from 'three/src/math/MathUtils.js'
import EventEmitter from '../core/EventEmitter'
import Component from '../core/Component'
import { gsap } from 'gsap'

const SETTINGS = {
	TURNS: 4,
	NAS_BUTTONS_CHANGE_INTERVAL: 1,
}
export default class Fan extends Component {
	constructor() {
		super()
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug
		this.dayManager = this.experience.dayManager
		this.moneyManager = this.experience.moneyManager
		this.isGameFinished = false
		this.nasButtons = []
		this.nasButtonTweens = []

		this._createMaterial()
		this._createMesh()

		this._createNASButtonsMaterial()
		this._createNASButtonsMesh()

		this.targetRotation = 0
	}

	_reset() {
		this.targetRotation = 0
		this.helix.rotation.x = 0
	}

	_createMaterial() {
		const texture = this.scene.resources.items.bakeTexture
		// texture.flipY = false
		// texture.channels = 1
		this._material = new MeshBasicMaterial({ map: texture })

		this._witnessMaterial = new MeshBasicMaterial({ map: texture })
	}

	_createMesh() {
		this.mesh = this.scene.resources.items.fanModel.scene.children[0].clone()
		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this._material
				// child.material.depthTest = false
				if (child.name === 'HELICES') {
					this.helix = child
				}
				if (child.name === 'BOUTON') {
					this.witness = child
					child.material = this._witnessMaterial
					// child.material.depthTest = false
				}
			}
		})
		this.mesh.name = 'fan'

		this.scene.resources.items.taskBackgrounds.scene.traverse((child) => {
			if (child.name.includes('fan')) {
				this.backgroundMesh = child
				this.backgroundMesh.material = new MeshBasicMaterial({ color: 0x000000 })
				this.backgroundMesh.visible = false
			}
		})

		this.add(this.mesh)
		this.add(this.backgroundMesh)
		// addObjectDebug(this.debug.ui, this.mesh)
	}

	_createNASButtonsMaterial() {
		const texture = this.scene.resources.items.NASTexture
		this.NASButtonsMaterial = new MeshBasicMaterial({ map: texture })
	}

	_createNASButtonsMesh() {
		this.NASButtonsMesh = this.scene.resources.items.nasButtonsModel.scene.clone()
		this.NASButtonsMesh.traverse((child) => {
			if (child.isMesh) {
				console.log(child);
				this.nasButtons.push(child)

				child.material = new MeshBasicMaterial({ map: this.scene.resources.items.NASTexture })
			}
		})
		this.NASButtonsMesh.name = 'nasButtons'
		this.add(this.NASButtonsMesh)
	}

	animateNASButtonsSequentially() {
		this.nasButtonTweens = []
		// Clear previous tweens
		this.nasButtons.forEach((button, index) => {
				const tween = gsap.to(button.material.color, {
						r: 100,  // Adjust color as needed
						duration: 0.5,
						repeat: -1,
						yoyo: true,
						paused: true,  // Initially pause the animation
				})
				// Start the animation with a delay for each button
				gsap.delayedCall(SETTINGS.NAS_BUTTONS_CHANGE_INTERVAL * index, () => {
						if (!this.isGameFinished) {
								tween.play()  // Start the tween after the delay
						}
				})
				this.nasButtonTweens.push(tween)  // Store the tween to stop later
		})
	}

	stopNASButtonsAnimation() {
		this.nasButtonTweens.forEach(tween => tween.kill())  // Stop all tweens
		this.nasButtons.forEach(button => {
				button.material.color.set(0xffffff)  // Reset button color
		})
}

	/**
	 * @param {'left' | 'right'} side
	 */
	playTask(side = 'left') {
		this.isPlaying = true
		this.showTaskTl?.kill()
		this.witness.material.color.set(0xffffff)

		let lastAngle = new Vector2()

		const handleMove = (event) => {
			const distanceFromCenter = event.position.distanceTo(new Vector2())
			const angle = event.position.angle()
			const angleDelta = angle - lastAngle

			if (distanceFromCenter > 0.75 && angleDelta > 0 && angleDelta < 1) {
				this.targetRotation += angleDelta
			}
			lastAngle = angle

			if (this.targetRotation >= Math.PI * 2 * SETTINGS.TURNS) {
				this.isGameFinished = true
				this.stopNASButtonsAnimation()
				if(this.moneyManager.isMoneyDecreased) {
					this.moneyManager.removePermanentRate(0.015)
					this.moneyManager.isMoneyDecreased = false
				}
				this.trigger('task:complete')
				this.dayManager.tasksCount++
				this.isPlaying = false
				this.experience.axis.off(`joystick:move:${side}`, handleMove)

				this.targetRotation = Math.PI * 2 * SETTINGS.TURNS

				setTimeout(() => {
					this.targetRotation = 0
					this.helix.rotation.x = 0
				}, 1000)

				setTimeout(() => {
					this.isGameFinished = false
				}, 4000)
			}
		}

		this.experience.axis.on(`joystick:move:${side}`, handleMove)
	}

	showTask() {
		this.showTaskTl = gsap.to(this.witness.material.color, {
			r: 100,
			duration: 0.5,
			repeat: -1,
			yoyo: true,
		})

		this.animateNASButtonsSequentially()

		setTimeout(() => {
			if (!this.isGameFinished) {
				this.moneyManager.isMoneyDecreased = true
				this.moneyManager.subtractMoneyRatePermanent(0.015)
			}
		}, 5000)
	}

	hideTask() {
		this.showTaskTl?.kill()
		this.witness.material.color.set(0xffffff)
		this.stopNASButtonsAnimation()
	}

	update() {
		this.helix.rotation.x = lerp(this.helix.rotation.x, -this.targetRotation, 0.01 * this.experience.time.delta)
	}
}
