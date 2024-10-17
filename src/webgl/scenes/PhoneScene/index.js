import Experience from 'core/Experience.js'
import Resources from 'core/Resources.js'
import sources from './sources.json'
import Phone from '@/webgl/components/Phone/Phone'
import { AmbientLight } from 'three'

export default class PhoneScene {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.scene.resources = new Resources(sources)

		this.scene.resources.on('ready', () => this._init())
	}

	_init() {
		this.phone = new Phone()
	}

	update() {
		this.phone?.update()
	}
}
