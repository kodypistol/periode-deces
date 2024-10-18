import Experience from 'core/Experience.js'
import addObjectDebug from 'utils/addObjectDebug.js'
import gsap from 'gsap'
import EventEmitter from 'core/EventEmitter.js'

export default class Head extends EventEmitter {
	constructor() {
		super()
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug

		this._createMesh()
	}

	_createMesh() {
		this.mesh = this.scene.resources.items.headModel.scene.clone()
		this.mesh.position.y = 2
		this.mesh.position.x = -0.5
		this.mesh.position.z = -1
		this.mesh.rotation.z = 0.2
		this.mesh.scale.set(2, 2, 2)

		this.mesh.name = 'head'
		this.scene.add(this.mesh)
		addObjectDebug(this.debug.ui, this.mesh)
	}

	playTask() {
		gsap.to(this.mesh.position, {
			y: 2.8,
			onComplete: () => {
				this.experience.subtitlesManager.playSubtitle('colleague')
				//repeat anim rotation
				gsap.to(this.mesh.rotation, {
					x: -0.05,
					yoyo: true,
					repeat: -1,
					ease: 'none',
					duration: 0.5,
				})
				gsap.to(this.mesh.position, {
					y: '-=0.02',
					yoyo: true,
					repeat: -1,
					ease: 'none',
					duration: 0.5,
				})

				const handleDown = (event) => {
					if (event.key === 'a') {
						this.experience.subtitlesManager.next()
					}
				}
				this.experience.axis.on('down', handleDown)

				this.experience.subtitlesManager.on('finish', () => {
					gsap.to(this.mesh.position, {
						y: 2,
					})
					this.experience.axis.off('down', handleDown)
					this.trigger('task:complete')
				})
			},
		})
	}
}