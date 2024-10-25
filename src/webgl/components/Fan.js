import Task from 'core/Task'
import { MeshBasicMaterial, Vector2 } from 'three'
import { lerp } from 'three/src/math/MathUtils.js'
import { gsap } from 'gsap'

const SETTINGS = {
	TURNS: 4,
	NAS_BUTTONS_CHANGE_INTERVAL: 1,
}

export default class Fan extends Task {
	constructor(options = {}) {
		super(options)
		this.dayManager = this.experience.dayManager
		this.moneyManager = this.experience.moneyManager
		this.isGameFinished = false
		this.targetRotation = 0
		this.nasButtons = []
		this.nasButtonTweens = []

		this._createNASButtonsMaterial()
		this._createNASButtonsMesh()
	}

	_createMesh() {
		console.log('Fan _createMesh: this.resources:', this.resources)
		const texture = this.resources.items.bakeTexture
		this._material = new MeshBasicMaterial({ map: texture })

		const fanModel = this.resources.items.fanModel
		if (!fanModel) {
			console.error('fanModel not found in resources.items')
			return
		}

		this.mesh = fanModel.scene.children[0].clone()
		this.mesh.traverse((child) => {
			if (child.isMesh) {
				child.material = this._material.clone()
				if (child.name === 'HELICES') {
					this.helix = child
				}
			}
		})
		this.mesh.name = 'fan'
		this.add(this.mesh)
	}

	_createNASButtonsMaterial() {
		const texture = this.scene.resources.items.NASTexture
		this.NASButtonsMaterial = new MeshBasicMaterial({ map: texture })
	}

	_createNASButtonsMesh() {
		this.NASButtonsMesh = this.scene.resources.items.nasButtonsModel.scene.clone()
		this.NASButtonsMesh.traverse((child) => {
			if (child.isMesh) {
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
				r: 100, // Adjust color as needed
				duration: 0.5,
				repeat: -1,
				yoyo: true,
				paused: true, // Initially pause the animation
			})
			// Start the animation with a delay for each button
			gsap.delayedCall(SETTINGS.NAS_BUTTONS_CHANGE_INTERVAL * index, () => {
				if (!this.isGameFinished) {
					tween.play() // Start the tween after the delay
				}
			})
			this.nasButtonTweens.push(tween) // Store the tween to stop later
		})
	}

	stopNASButtonsAnimation() {
		this.nasButtonTweens.forEach((tween) => tween.kill()) // Stop all tweens
		this.nasButtons.forEach((button) => {
			button.material.color.set(0xffffff) // Reset button color
		})
	}

	playTask() {
		if (!this.isAvailable || this.isPlaying) {
			return
		}
		this.isPlaying = true
		this.hideTask()

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
				this.completeTask()
				this.isGameFinished = true
				this.stopNASButtonsAnimation()

				if (this.moneyManager.isMoneyDecreased) {
					this.moneyManager.removePermanentRate(0.015)
					this.moneyManager.isMoneyDecreased = false
				}

				this.dayManager.tasksCount++
				this.isPlaying = false
				this.axis.off(`joystick:move:right`, handleMove)
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

		this.axis.on(`joystick:move:right`, handleMove)
	}

	showTask() {
		super.showTask()
		this.animateNASButtonsSequentially()

		setTimeout(() => {
			if (!this.isGameFinished) {
				this.moneyManager.isMoneyDecreased = true
				this.moneyManager.subtractMoneyRatePermanent(0.015)
			}
		}, 5000)
	}

	hideTask() {
		super.hideTask()
		this.stopNASButtonsAnimation()
	}

	update() {
		if (this.helix) {
			this.helix.rotation.x = lerp(this.helix.rotation.x, -this.targetRotation, 0.01 * this.experience.time.delta)
		}
	}

	reset() {
		super.reset()
		this.targetRotation = 0
		if (this.helix) {
			this.helix.rotation.x = 0
		}
	}
}
