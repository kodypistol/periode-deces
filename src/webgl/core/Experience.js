import Debug from 'core/Debug.js'
import Sizes from 'core/Sizes.js'
import Time from 'core/Time.js'
import Camera from 'core/Camera.js'
import Renderer from './Renderer.js'
import SceneManager from 'core/SceneManager.js'
import { Mesh, Scene } from 'three'
import InteractionManager from 'core/InteractionManager.js'
import AxisManager from './AxisManager.js'

let instance = null

export default class Experience {
	constructor(_canvas) {
		// Singleton
		if (instance) {
			return instance
		}
		instance = this

		// Global access
		window.experience = this

		// Options
		this.canvas = _canvas

		// Setup
		this.sizes = new Sizes()
		this.time = new Time()
		this.scene = new Scene()
		this.debug = new Debug()
		this.camera = new Camera()
		this.interactionManager = new InteractionManager(this.camera.instance)
		this.activeScene = new SceneManager()
		this.axis = new AxisManager()
		this.renderer = new Renderer()

		this.setLedsEvent()

		// Resize event
		this.sizes.on('resize', () => {
			this.resize()
		})

		// Time tick event
		this.time.on('tick', () => {
			this.update()
		})
	}

	/**
	 * Set leds events
	 */
	setLedsEvent() {
		const left = Object.values(this.axis.controls.left)
		const right = Object.values(this.axis.controls.right)
		const values = [...left, ...right]
		const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'cyan', 'white']

		this.axis.controls.left.a.setLedColor('yellow')

		values?.forEach((val) => {
			val.addEventListener('keydown', () => {
				console.log(val)
				val.setLedColor?.(colors[Math.floor(Math.random() * colors.length)])
			})
		})
	}

	resize() {
		this.camera.resize()
		this.renderer.resize()
	}

	update() {
		if (this.activeScene.update) this.activeScene.update()
		this.renderer.update()
		this.debug.update()
		this.interactionManager.update()
		this.axis.update()
	}

	destroy() {
		this.sizes.off('resize')
		this.time.off('tick')

		// Traverse the whole scene
		this.scene.traverse((child) => {
			// Test if it's a mesh
			if (child instanceof Mesh) {
				child.geometry.dispose()

				// Loop through the material properties
				for (const key in child.material) {
					const value = child.material[key]

					// Test if there is a dispose function
					if (value && typeof value.dispose === 'function') {
						value.dispose()
					}
				}
			}
		})

		this.camera.dispose()
		this.renderer.instance.dispose()

		if (this.debug.active) this.debug.ui.destroy()
		this.axis.destroy()
	}
}
