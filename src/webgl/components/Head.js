import Task from 'core/Task'
import gsap from 'gsap'

export default class Head extends Task {
	constructor(options = {}) {
		super(options)
		this.selectionManager = options.selectionManager
	}

	_reset() {
		this.mesh.position.y = 2
		this.mesh.rotation.z = 0.2
		this.completeTask()
		this.experience.camera.resetAnimation()
		this.experience.subtitlesManager.stop()
	}

	_createMesh() {
		const headModel = this.resources.items.headModel
		if (!headModel) {
			console.error('headModel not found in resources.items')
			return
		}

		this.mesh = headModel.scene.clone()
		this.mesh.position.y = 2
		this.mesh.position.x = -0.5
		this.mesh.position.z = -1
		this.mesh.rotation.z = 0.2
		this.mesh.scale.set(2, 2, 2)

		this.mesh.name = 'head'
		this.add(this.mesh)
	}

	playTask() {
		if (this.isPlaying) return
		this.isPlaying = true

		// The TaskManager will handle pausing other tasks and the selection manager

		this.experience.camera.headAnimation()
		gsap.to(this.mesh.position, {
			y: 2.8,
			onComplete: () => {
				this.experience.subtitlesManager.playSubtitle('colleague')
				const rotationTl = gsap.to(this.mesh.rotation, {
					x: -0.05,
					yoyo: true,
					repeat: -1,
					ease: 'none',
					duration: 0.5,
				})
				const positionTl = gsap.to(this.mesh.position, {
					y: '-=0.015',
					yoyo: true,
					repeat: -1,
					ease: 'none',
					duration: 0.7,
				})

				const handleDown = (event) => {
					if (event.key === 'a') {
						this.experience.subtitlesManager.next()
					}
				}
				this.experience.axis.on('down', handleDown)

				this.experience.subtitlesManager.on('finish', () => {
					positionTl.kill()
					rotationTl.kill()
					gsap.to(this.mesh.position, {
						y: 2,
					})
					this.experience.axis.off('down', handleDown)
					this.completeTask()
					this.experience.camera.resetAnimation()
				})
			},
		})
	}

	completeTask() {
		super.completeTask()
		// The TaskManager will handle resuming other tasks and the selection manager
	}
}
