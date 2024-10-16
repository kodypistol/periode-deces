import Experience from 'core/Experience.js'
import Resources from 'core/Resources.js'
import sources from './sources.json'
import Fan from 'components/Fan.js'

export default class Main {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.scene.resources = new Resources(sources)

		// Wait for resources
		this.scene.resources.on('ready', () => {
			// Setup
			this.fanLeft = new Fan()
			this.fanLeft.playTask('left')
			this.fanLeft._mesh.position.x -= 2
			this.fanRight = new Fan()
			this.fanRight.playTask('right')
			this.fanRight._mesh.position.x += 2
		})
	}

	update() {
		if (this.fanLeft) this.fanLeft.update()
		if (this.fanRight) this.fanRight.update()
	}
}
