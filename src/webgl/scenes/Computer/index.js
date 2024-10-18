import Experience from 'core/Experience.js'
import Cube from 'components/Cube/Cube.js'
import Computer from 'components/Computer/index.js'
import Resources from 'core/Resources.js'
import sources from './sources.json'
import Phone from '@/webgl/components/Phone/Phone'

export default class Main {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.scene.resources = new Resources(sources)

		// Wait for resources
		this.scene.resources.on('ready', () => {
			// Setup
			// this.floor = new Floor()
			// this.fox = new Fox()
			// this.cube = new Cube()
			// this.environment = new Environment()
			this.computer = new Computer()
			this.phone = new Phone()
		})
	}

	update() {
		if (this.computer) this.computer.update()
	}
}
