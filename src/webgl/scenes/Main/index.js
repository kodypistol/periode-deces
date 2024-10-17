import Experience from 'core/Experience.js'
import Resources from 'core/Resources.js'
import sources from './sources.json'
import Fan from 'components/Fan.js'
import { Vector2 } from 'three'
import throttle from 'axis-api/src/utils/throttle.js'
import Axis from 'axis-api'

export default class Main {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.scene.resources = new Resources(sources)

		this.tasks = []

		this.scene.resources.on('ready', () => {
			this._createSceneElements()
			this._selectionBehavior()
		})
	}

	_createSceneElements() {
		this.fanLeft = new Fan()
		this.tasks.push(this.fanLeft)
		// this.fanLeft.playTask('left')
		this.fanLeft.mesh.position.x -= 2
		this.fanRight = new Fan()
		this.tasks.push(this.fanRight)
		// this.fanRight.playTask('right')
		this.fanRight.mesh.position.x += 2
	}

	_selectionBehavior() {
		let leftIndexSelection = 0
		let leftSelectionMode = true
		this.experience.axis.on('down:left', (event) => {
			if (event.key === 'a') {
				this.tasks[leftIndexSelection].playTask('left')
				leftSelectionMode = false
			}
		})

		// this.experience.renderer.outlinePass.selectedObjects = [this.tasks[leftIndexSelection].mesh]
		this.experience.axis.on('joystick:quickmove:left', (event) => {
			if (!leftSelectionMode) return
			if (event.position.x > 0.9 || event.position.x < -0.9) {
				leftIndexSelection = (leftIndexSelection + 1) % this.tasks.length
				// if (rightIndexSelection === leftIndexSelection) leftIndexSelection = (leftIndexSelection + 1) % tasks.length

				// this.experience.renderer.outlinePass.selectedObjects = []
				// this.experience.renderer.outlinePass.selectedObjects = [this.tasks[leftIndexSelection].mesh]
			}
		})
	}

	update() {
		if (this.fanLeft) this.fanLeft.update()
		if (this.fanRight) this.fanRight.update()
	}
}
