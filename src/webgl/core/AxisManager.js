import Axis from 'axis-api'
import EventEmitter from './EventEmitter'
import Experience from './Experience'
import Stats from 'stats.js'
import { TpEvent } from '@tweakpane/core'

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
				stick: {
					position: { x: 0, y: 0 },
				},
				a: false,
				x: false,
				i: false,
				s: false,
				w: false,
			},
			right: {
				stick: {
					position: { x: 0, y: 0 },
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
		Axis.joystick1.addEventListener('joystick:move', this.sickLeftHandler.bind(this))
		Axis.joystick2.addEventListener('joystick:move', this.sickRightHandler.bind(this))
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

		this.debugStickL = this.debugFolder.addBinding(this.values.left.stick, 'position', {
			picker: 'inline',
			expanded: true,
			x: { min: -1, max: 1 },
			y: { min: -1, max: 1, inverted: true },
		})
		this.debugStickL.on('change', (evt) => {
			if (evt.last) {
				this.values.left.stick.position = { x: 0, y: 0 }
				this.debugStickL.refresh()
			}
		})

		this.debugStickR = this.debugFolder.addBinding(this.values.right.stick, 'position', {
			picker: 'inline',
			expanded: true,
			x: { min: -1, max: 1 },
			y: { min: -1, max: 1, inverted: true },
		})
		this.debugStickR.on('change', (evt) => {
			if (evt.last) {
				this.values.right.stick.position = { x: 0, y: 0 }
				this.debugStickR.refresh()
			}
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
		this.trigger('down:' + side, evt)
		this.values[side][evt.key] = true
	}

	/**
	 * On key up
	 * @param {*} evt
	 */
	keyupHandler(evt) {
		const side = evt.id === 1 ? 'left' : 'right'
		this.trigger('up:' + side, evt)
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

		// if (this.debug.active && this.debug.debugParams) {
		this.axisStats?.update()
		// }
	}

	/**
	 * Destroy
	 */
	destroy() {
		Axis.removeEventListener('keydown', this.keydownHandler)
		Axis.removeEventListener('keyup', this.keyupHandler)
		this.controls.left.stick.removeEventListener('joystick:move', this.sickLeftHandler)
		this.controls.right.stick.removeEventListener('joystick:move', this.sickRightHandler)
		this.axisJsPanel.domElement.remove()
		this.axisMonitoringSection.remove()
	}
}
