import { gsap } from 'gsap'

import Experience from 'core/Experience.js'
import EventEmitter from '@/webgl/core/EventEmitter'

export default class Graph extends EventEmitter {
	constructor() {
		super()
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug
		this.camera = this.experience.camera
		this.resources = this.scene.resources
		this.axis = this.experience.axis
		this.time = this.experience.time
		this.dayManager = this.experience.dayManager
		this.moneyManager = this.experience.moneyManager

		this._element = document.body.querySelector('.graph')
		this._notification = this._element.querySelector('.notification')
		this._activity = this._element.querySelector('.activity')
		this._graphCanvas = this._element.querySelector('.canvas')
		this._scoreNumber = this._element.querySelector('.number')
		this._completedElement = this._element.querySelector('.completed')

		this.context = this._createContext()

		// Graph data and settings
		this.originalGraph = this._generateRandomGraph() // Random trading graph (hard coded for now)
		this.userScoreGraph = [] // The user's graph based on key inputs
		this.userGraph = [] // The user's graph based on key inputs
		this.currentX = 0 // Track the current position in X
		this.currentY = this._graphCanvas.height / 2 // Start drawing in the middle
		this.score = 0 // Score is not an actual score for now; it's just percentages
		this.drawingSpeed = .2 // Constant horizontal drawing speed
		this.isGameActive = false
		this.isPlaying = false
		this.timeLimit = 7000
		this.playTime = 0

		// Bind event handlers
		this._updateJoystick = this._updateJoystick.bind(this)
	}

	showTask() {
		gsap.to(this._notification, {
			duration: 0.2,
			scale: 1,
		})
	}

	hideTask() {
		gsap.to(this._notification, {
			duration: 0.2,
			scale: 0,
		})
	}

	playTask() {
		this._bindEvents()
		gsap.to(this._notification, {
			duration: 0.01,
			scale: 0,
		})

		gsap.to(this._activity, {
			duration: 0.2,
			scale: 1,
		})

		this.isGameActive = true
		this.isPlaying = true
		this._draw()
	}

	end() {
		// Make element blink opacity 3 times
		gsap.to(this._completedElement, {
			duration: 0.4,
			autoAlpha: 1,
			repeat: 4,
			yoyo: true,
			ease: 'steps(1)',
			onComplete: () => {
				this.moneyManager.multiplyRate(this.score / 10, 5)
				this.dayManager.tasksCount++
				this.trigger('end') // Notify parent
			},
		})
	}

	gameOver() {
		// Make element blink opacity 3 times
		gsap.to(this._completedElement, {
			duration: 0.4,
			autoAlpha: 1,
			repeat: 4,
			yoyo: true,
			ease: 'steps(1)',
			onComplete: () => {
				this.moneyManager.subtractMoneyRate(0.05, 5)
				this.trigger('end') // Notify parent
			},
		})
	}

	hide() {
		gsap.to(this._activity, {
			scale: 0,
			duration: 0.3,
		})

		gsap.to(this._completedElement, {
			opacity: 0,
		})
	}

	_reset() {
		this.isGameActive = false
		this.userGraph = []
		this.currentX = 0
		this.currentY = this._graphCanvas.height / 2
		this.score = 0
		this.playTime = 0

		clearInterval(this._joystickInterval)
		this._joystickInterval = null
		this._joystickBottom = false
		this._joystickTop = false

		this.axis.off('joystick:move:right', this._updateJoystick)
	}

	_createContext() {
		const context = this._graphCanvas.getContext('2d')

		// Get the CSS width and height
		this._displayWidth = this._graphCanvas.clientWidth
		this._displayHeight = this._graphCanvas.clientHeight

		// Get the device pixel ratio (e.g., 2 for Retina screens)
		const pixelRatio = 2
		// const pixelRatio = window.devicePixelRatio || 1;

		// Set the canvas width and height based on the pixel ratio
		this._graphCanvas.width = this._displayWidth * pixelRatio
		this._graphCanvas.height = this._displayHeight * pixelRatio

		// Scale the context to match the pixel ratio
		context.scale(pixelRatio, pixelRatio)

		return context
	}

	// Generate a random trading graph to follow
	_generateRandomGraph() {
		let graph = []
		const maxChanges = 10 // Maximum number of direction changes
		let changes = 0 // Track the number of direction changes
		let direction = 1 // Start with an upward direction
		let lastY = this._displayHeight * 0.75 // Start 3/4 down the canvas
		let lastX = 0 // Start 3/4 down the canvas

		const stepX = this._displayWidth / 10 // Step X-axis increment (adjustable)

		for (let i = 0; i <= changes; i++) {
			// Make sure Y stays within bounds (0 <= Y <= canvas height)
			lastY = Math.max(5, Math.min(this._displayHeight - 10, lastY)) // Keep it within bounds

			const x = lastX

			graph.push({ x, y: lastY })

			// Randomly change direction (but limit changes)
			if (Math.random() < 0.1 && changes < maxChanges) {
				direction *= -1 // Flip the direction
				changes++
			}

			lastX = x
		}

		graph = [
			{ x: 0, y: this._displayHeight - 5 },
			{ x: 10, y: 20 },
			{ x: 15, y: 25 },
			{ x: 20, y: 30 },
			{ x: 30, y: 20 },
			{ x: 35, y: 5 },
			{ x: 40, y: 25 },
			{ x: 50, y: 10 },
			{ x: 55, y: 30 },
			{ x: 60, y: 20 },
			{ x: 70, y: 10 },
			{ x: 75, y: 30 },
			{ x: 85, y: 0 },
		]

		return graph
	}

	_drawOriginalGraph() {
		this.context.beginPath()
		this.originalGraph.forEach((point, index) => {
			if (index === 0) {
				this.context.moveTo(point.x, point.y)
			} else {
				this.context.lineTo(point.x, point.y)
			}
		})
		this.context.strokeStyle = '#CCCCCC' // Light gray color for the original graph
		this.context.lineWidth = 1 // Slightly thicker line for better visibility
		this.context.stroke()
	}

	// Draw both the original graph and the user's graph
	_draw() {
		if (!this.isGameActive) return

		this.context.fillStyle = '#FFFFFF' // White background
		this.context.fillRect(0, 0, this._graphCanvas.width, this._graphCanvas.height) // Clear canvas

		this._drawGrid() // Draw background grid
		this._drawOriginalGraph() // Draw the reference graph
		this._drawUserGraph() // Draw the user's graph

		this._calculateScore() // Calculate score based on user's drawing

		requestAnimationFrame(() => this._draw()) // Keep redrawing the canvas
	}

	_drawGrid() {
		// Draw horizontal lines
		for (let y = 0; y <= this._graphCanvas.height; y += 5) {
			this.context.beginPath()
			this.context.moveTo(0, y)
			this.context.lineTo(this._graphCanvas.width, y)
			this.context.strokeStyle = '#EEEEEE' // Light gray color for grid lines
			this.context.lineWidth = 1 // Slightly thicker line for better visibility
			this.context.stroke()
		}

		// Draw vertical lines
		for (let x = 0; x <= this._graphCanvas.width; x += 10) {
			this.context.beginPath()
			this.context.moveTo(x, 0)
			this.context.lineTo(x, this._graphCanvas.height)
			this.context.strokeStyle = '#EEEEEE' // Light gray color for grid lines
			this.context.stroke()
		}
	}

	_drawUserGraph() {
		if (this.userGraph.length > 1) {
			for (let i = 1; i < this.userGraph.length; i++) {
				const prev = this.userGraph[i - 1]
				const curr = this.userGraph[i]

				this.context.beginPath()
				this.context.moveTo(prev.x, prev.y)
				this.context.lineTo(curr.x, curr.y)
				this.context.strokeStyle = curr.y < prev.y ? 'green' : 'red' // Red if going down, green if up
				this.context.stroke()
			}
		}
	}

	// _calculateScore() {
	// 		this._scoreNumber.innerHTML = `${this.score.toFixed(0)}%`
	//     const maxSamplePoints = 50;  // Number of points to compare (fewer points for better performance)
	//     const userGraphLength = Math.min(this.userGraph.length, this.originalGraph.length);  // Use the shorter graph
	//     const step = Math.max(1, Math.floor(userGraphLength / maxSamplePoints));  // Ensure we don’t step too fast

	//     let totalDifference = 0;
	//     let pointsCompared = 0;

	//     // Sample fewer points to avoid too many comparisons
	//     for (let i = 0; i < userGraphLength; i += step) {
	//         const originalPoint = this.originalGraph[i];
	//         const userPoint = this.userGraph[i];

	//         if (originalPoint && userPoint) {
	//             const distance = Math.abs(originalPoint.y - userPoint.y);  // Only compare Y values
	//             totalDifference += distance;
	//             pointsCompared++;
	//         }

	// 				console.log(totalDifference);


	//         // If the total difference is getting too high early, we can stop
	//         if (totalDifference > 10000) {  // Example threshold, adjust as needed
	//             break;
	//         }
	//     }

	//     // Prevent division by zero and ensure maxDifference is correctly calculated
	//     const maxDifference = this._displayHeight * pointsCompared;
	//     const accuracy = Math.max(0, (1 - totalDifference / maxDifference)) * 100;

	//     // Display score
	//     this._scoreNumber.innerHTML = `${accuracy.toFixed(2)}%`;
	//     this._scoreNumber.style.backgroundColor = accuracy > 50 ? 'green' : 'red';
	// }

	_calculateScore() {
		// Update the score display
		this._scoreNumber.innerHTML = `${this.score.toFixed(0)}%`
		this._scoreNumber.style.backgroundColor = this.score >= 0 ? 'green' : 'red'
	}

	// on event joystick up set up boolean to false
	// then on update if event push up or down on graph then
	_bindEvents() {
		this.axis.on('joystick:move:right', this._updateJoystick)

		this._joystickInterval = setInterval(() => {
			if (!this.isGameActive) return
			const step = .5 // How much the line moves vertically per arrow key press

			if (this._joystickBottom) {
				this.currentY = Math.max(0, this.currentY + step) // Move up
				// if (this.score > 0) this.score = 0
				this.score -= 1
				this._calculateScore() // Update score for moving down

				this.currentX += this.drawingSpeed // Move horizontally at a constant speed
				this.userGraph.push({ x: this.currentX, y: this.currentY })
			} else if (this._joystickTop) {
				this.currentY = Math.min(this._graphCanvas.height, this.currentY - step) // Move down
				// if (this.score < 0) this.score = 0
				this.score += 1
				this._calculateScore() // Update score for moving up

				this.currentX += this.drawingSpeed // Move horizontally at a constant speed
				this.userGraph.push({ x: this.currentX, y: this.currentY })
			}

			if (this.currentX >= this._displayWidth) {
				this.isPlaying = false
				this.isGameActive = false
				this.end()
			}

			if (this.playTime > this.timeLimit) {
				this.isPlaying = false
				this.isGameActive = false
				this.gameOver()
			}
		}, 10)
	}

	_updateJoystick(e) {
		if (!this.isGameActive) return

		if (e.position.y < -0.4) {
			this._joystickBottom = true
			this._joystickTop = false
		} else if (e.position.y > 0.4) {
			this._joystickBottom = false
			this._joystickTop = true
		} else {
			this._joystickBottom = false
			this._joystickTop = false
		}
	}

	update() {
		// update playtime
		if (this.isPlaying) {
			this.playTime += this.time.delta
		}
	}
}
