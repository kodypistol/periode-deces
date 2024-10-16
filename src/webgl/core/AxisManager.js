import Axis from 'axis-api'
import EventEmitter from './EventEmitter'
import Experience from './Experience'
import Stats from 'stats.js'
import { Vector2 } from 'three'

/**
 * Preset controls to apply for desktop
 */
const PARAMS = {
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
		// Experience
		this.experience = new Experience()
		this.debug = this.experience.debug

		// Initialize
		this.controls = {}
		this.leds = Axis.ledManager.leds
		this.setControls()
		this.setValues()
		this.setEvents()
		this.setDebug()
	}

	/**
	 * This method initializes the axis controls for the joysticks.
	 */
	setControls() {
		const left = PARAMS.left
		const right = PARAMS.right

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
				stick: {
					position: new Vector2(0, 0),
				},
				a: false,
				x: false,
				i: false,
				s: false,
				w: false,
			},
			right: {
				stick: {
					position: new Vector2(0, 0),
				},
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

		Axis.joystick1.addEventListener('joystick:move', this.stickLeftHandler.bind(this))
		Axis.joystick2.addEventListener('joystick:move', this.stickRightHandler.bind(this))

		Axis.joystick1.addEventListener('joystick:quickmove', this.stickLeftQuickHandler.bind(this))
		Axis.joystick2.addEventListener('joystick:quickmove', this.stickRightQuickHandler.bind(this))
	}

	/**
	 * Set debug
	 */
	setDebug() {
		this.setAxisStats()
		if (!this.debug.active) return

		this.debugFolder = this.debug.ui.addFolder({
			title: 'Axis Manager',
			expanded: false,
		})

		const valueL = { position: { x: 0, y: 0 } }
		this.debugStickL = this.debugFolder.addBinding(valueL, 'position', {
			picker: 'inline',
			expanded: true,
			x: { min: -1, max: 1 },
			y: { min: -1, max: 1, inverted: true },
		})
		this.debugStickL.on('change', (evt) => {
			if (evt.last) {
				valueL.position.x = 0
				valueL.position.y = 0
				this.debugStickL.refresh()
			}

			this.stickLeftHandler({ position: evt.value })
			this.stickLeftQuickHandler({ position: evt.value })
		})

		const valueR = { position: { x: 0, y: 0 } }
		this.debugStickR = this.debugFolder.addBinding(valueR, 'position', {
			picker: 'inline',
			expanded: true,
			x: { min: -1, max: 1 },
			y: { min: -1, max: 1, inverted: true },
		})
		this.debugStickR.on('change', (evt) => {
			if (evt.last) {
				valueR.position.x = 0
				valueR.position.y = 0
				this.debugStickR.refresh()
			}

			this.stickRightHandler({ position: evt.value })
			this.stickRightQuickHandler({ position: evt.value })
		})
	}

	/**
	 * Set axis stats
	 */
	setAxisStats() {
		this.axisJsPanel = new Stats()
		document.body.appendChild(this.axisJsPanel.domElement)

		const keys = ['a', 'x', 'i', 's', 'w']
		const monitoringValues = [
			{
				name: 'L-stick',
				value: () => JSON.stringify(this.values?.left?.stick ?? {}),
			},
			...keys.map((key) => ({
				name: `L-${key}`,
				value: () => this.values?.left?.[key],
			})),
			{
				name: 'R-stick',
				value: () => JSON.stringify(this.values?.right?.stick ?? {}),
			},
			...keys.map((key) => ({
				name: `R-${key}`,
				value: () => this.values?.right?.[key],
			})),
		]

		this.axisMonitoringSection = document.createElement('section')
		Object.assign(this.axisMonitoringSection.style, {
			position: 'fixed',
			bottom: '1rem',
			left: '1rem',
			pointerEvents: 'none',
			userSelect: 'none',
			zIndex: '1000',
			display: 'flex',
			gap: '1rem',
			fontSize: '12px',
			mixBlendMode: 'difference',
		})

		monitoringValues.forEach((monitoringValue) => {
			const monitoringValueElement = document.createElement('span')
			monitoringValueElement.id = monitoringValue.name.toLowerCase()
			monitoringValue.element = monitoringValueElement
			this.axisMonitoringSection.appendChild(monitoringValueElement)
		})

		document.body.appendChild(this.axisMonitoringSection)

		this.axisStats = {
			monitoringValues,
			update: () => {
				this.axisJsPanel.update()
				monitoringValues.forEach((monitoringValue) => {
					if (monitoringValue.value() === monitoringValue.lastValue) return
					monitoringValue.lastValue = monitoringValue.value()
					monitoringValue.element.innerHTML = `<b>${monitoringValue.lastValue}</b> ${monitoringValue.name}`
				})
			},
		}
	}

	/**
	 * On key down
	 * @param {*} evt
	 */
	keydownHandler(evt) {
		const side = evt.id === 1 ? 'left' : 'right'
		this.trigger('down:' + side, [evt])
		this.values[side][evt.key] = true
	}

	/**
	 * On key up
	 * @param {*} evt
	 */
	keyupHandler(evt) {
		const side = evt.id === 1 ? 'left' : 'right'
		this.trigger('up:' + side, [evt])
		this.values[side][evt.key] = false
	}

	/**
	 * On sick left
	 * @param {*} evt
	 */
	stickLeftHandler(evt) {
		this.setStickValues('left', evt)
		this.trigger('joystick:move:left', [this.values.left.stick])
	}

	/**
	 * On sick right
	 * @param {*} evt
	 */
	stickRightHandler(evt) {
		this.setStickValues('right', evt)
		this.trigger('joystick:move:right', [this.values.right.stick])
	}

	/**
	 * On sick left
	 * @param {*} evt
	 */
	stickLeftQuickHandler(evt) {
		this.setStickValues('left', evt)
		this.trigger('joystick:quickmove:left', [this.values.left.stick])
	}

	/**
	 * On sick right
	 * @param {*} evt
	 */
	stickRightQuickHandler(evt) {
		this.setStickValues('right', evt)
		this.trigger('joystick:quickmove:right', [this.values.right.stick])
	}

	/**
	 * Set values
	 */
	setStickValues(side, evt) {
		const pos = evt.position
		this.values[side].stick = {
			...evt,
			position: this.values[side].stick.position.set(pos.x, pos.y),
		}
	}

	/**
	 * Update on each ticks
	 */
	update() {
		this.controls.left.stick.update()
		this.controls.right.stick.update()

		// if (this.debug.active && this.debug.debugParams) {
		this.axisStats?.update()
		// }
	}

	/**
	 * Destroy
	 */
	destroy() {
		// Remove event listeners
		Axis.removeEventListener('keydown', this.keydownHandler)
		Axis.removeEventListener('keyup', this.keyupHandler)

		// Remove joystick event listeners
		this.controls.left.stick.removeEventListener('joystick:move', this.stickLeftHandler)
		this.controls.right.stick.removeEventListener('joystick:move', this.stickRightHandler)

		// Remove stats
		this.axisJsPanel.domElement.remove()
		this.axisMonitoringSection.remove()
	}
}
