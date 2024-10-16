import Axis from 'axis-api'
import EventEmitter from './EventEmitter'

/**
 * Preset controls to apply
 */
const DESKTOP_CONTROLS = {
	left: {
		a: ['a'],
		x: ['z'],
		i: ['e'],
		s: ['r'],
		w: ['s'],
	},
	right: {
		a: ['u'],
		x: ['i'],
		i: ['o'],
		s: ['p'],
		w: ['l'],
	},
}

export default class AxisManager extends EventEmitter {
	constructor() {
		super()

		// Initialize
		this.controls = {}
		this.leds = Axis.ledManager.leds
		this.setControls()
		this.setValues()
		this.setEvents()
	}

	/**
	 * This method initializes the axis controls for the joysticks.
	 */
	setControls() {
		const left = DESKTOP_CONTROLS.left
		const right = DESKTOP_CONTROLS.right

		this.controls = {
			left: {
				stick: Axis.createGamepadEmulator(0),
				a: Axis.registerKeys(left.a, 'a', 1), // keyboard key "q" to button "a" from group 1
				x: Axis.registerKeys(left.x, 'x', 1), // keyboard key "d" to button "x" from group 1
				i: Axis.registerKeys(left.i, 'i', 1), // keyboard key "z" to button "i" from group 1
				s: Axis.registerKeys(left.s, 's', 1), // keyboard key "s" to button "s" from group 1
				w: Axis.registerKeys(left.w, 'w', 1), // keyboard key Space to button "w" from group 1
			},
			right: {
				stick: Axis.createGamepadEmulator(1),
				a: Axis.registerKeys(right.a, 'a', 2), // keyboard key "ArrowLeft" to button "a" from group 2
				x: Axis.registerKeys(right.x, 'x', 2), // keyboard key "ArrowRight" to button "x" from group 2
				i: Axis.registerKeys(right.i, 'i', 2), // keyboard key "ArrowUp" to button "i" from group 2
				s: Axis.registerKeys(right.s, 's', 2), // keyboard key "ArrowDown" to button "s" from group 2
				w: Axis.registerKeys(right.w, 'w', 2), // keyboard key "Enter" to button "w" from group 2
			},
		}
	}

	/**
	 * Set values object
	 */
	setValues() {
		this.values = {
			left: {
				stick: {},
				a: false,
				x: false,
				i: false,
				s: false,
				w: false,
			},
			right: {
				stick: {},
				a: false,
				x: false,
				i: false,
				s: false,
				w: false,
			},
		}
	}

	/**
	 * Set events
	 */
	setEvents() {
		Axis.addEventListener('keydown', this.keydownHandler.bind(this))
		Axis.addEventListener('keyup', this.keyupHandler.bind(this))
		this.controls.left.stick.addEventListener('joystick:move', this.sickLeftHandler.bind(this))
		this.controls.right.stick.addEventListener('joystick:move', this.sickRightHandler.bind(this))
	}

	/**
	 * On key down
	 * @param {*} evt
	 */
	keydownHandler(evt) {
		this.trigger('down', evt)
		const side = evt.id === 1 ? 'left' : 'right'
		this.values[side][evt.key] = true
	}

	/**
	 * On key up
	 * @param {*} evt
	 */
	keyupHandler(evt) {
		this.trigger('up', evt)
		const side = evt.id === 1 ? 'left' : 'right'
		this.values[side][evt.key] = false
	}

	/**
	 * On sick left
	 * @param {*} evt
	 */
	sickLeftHandler(evt) {
		this.trigger('stick:left', evt)
		this.values.left.stick = evt
	}

	/**
	 * On sick right
	 * @param {*} evt
	 */
	sickRightHandler(evt) {
		this.trigger('stick:right', evt)
		this.values.right.stick = evt
	}

	/**
	 * Update on each ticks
	 */
	update() {
		this.controls.left.stick.update()
		this.controls.right.stick.update()
	}

	/**
	 * Destroy
	 */
	destroy() {
		Axis.removeEventListener('keydown', this.keydownHandler)
		Axis.removeEventListener('keyup', this.keyupHandler)
		this.controls.left.stick.removeEventListener('joystick:move', this.sickLeftHandler)
		this.controls.right.stick.removeEventListener('joystick:move', this.sickRightHandler)
	}
}
