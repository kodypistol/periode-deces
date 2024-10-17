import { gsap } from 'gsap'

import Experience from 'core/Experience.js'

export default class Graph {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.debug = this.experience.debug
        this.camera = this.experience.camera;
        this.resources = this.scene.resources;

        this._element = document.body.querySelector('.graph')
        this._notification = this._element.querySelector('.notification')
        this._activity = this._element.querySelector('.activity')
        this._canvas = this._element.querySelector('.canvas')

        this.context = this._createContext()

        // Graph data and settings
        this.originalGraph = this._generateRandomGraph();  // Random trading graph
        this.userGraph = [];  // The user's graph based on key inputs
        this.currentX = 0;  // Track the current position in X
        this.currentY = this._canvas.height / 2;  // Start drawing in the middle
        this.score = 0;
        this.drawingSpeed = 2; // Constant horizontal drawing speed
        this.isGameActive = false;

        this._bindEvents();

        window.addEventListener('mousedown', () => {
            this.playTask()
        })
    }

    showTask() {
        gsap.to(this._notification, {
            duration: 0.01,
            autoAlpha: 1,
        })
    }

    playTask() {
        gsap.to(this._notification, {
            duration: 0.01,
            autoAlpha: 0,
        })

        gsap.to(this._activity, {
            duration: 0.01,
            autoAlpha: 1,
        })

        this.isGameActive = true;
        this._draw();
    }

    _createContext() {
        const context = this._canvas.getContext('2d');

        // Set canvas size based on its CSS display size
        const displayWidth = this._canvas.clientWidth;  // CSS width
        const displayHeight = this._canvas.clientHeight; // CSS height

        // Set canvas width and height based on CSS size
        this._canvas.width = displayWidth;
        this._canvas.height = displayHeight;

        // No need to scale the context, since the canvas will remain at CSS size
        // context.scale(pixelRatio, pixelRatio);  // We remove pixel ratio scaling here

        return context;
    }

    // Generate a random trading graph to follow
    _generateRandomGraph() {
        const graph = [];
        let lastY = this._canvas.height / 2;
        for (let x = 0; x <= this._canvas.width; x += this.drawingSpeed) {
            const randomChange = Math.random() * 10 - 5;  // Random upward/downward movement
            lastY += randomChange;
            lastY = Math.max(0, Math.min(this._canvas.height, lastY));  // Stay within bounds
            graph.push({ x, y: lastY });
        }
        return graph;
    }

    // Draw both the original graph and the user's graph
    _draw() {
        if (!this.isGameActive) return;

        this.context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        // Draw the original trading graph
        this._drawOriginalGraph();

        // Draw the user's graph
        this._drawUserGraph();

        // Calculate the score based on the accuracy of the user's drawing
        this._calculateScore();

        // Continue updating the frame
        requestAnimationFrame(() => this._draw());
    }

    _drawOriginalGraph() {
        this.context.beginPath();
        this.originalGraph.forEach((point, index) => {
            if (index === 0) {
                this.context.moveTo(point.x, point.y);
            } else {
                this.context.lineTo(point.x, point.y);
            }
        });
        this.context.strokeStyle = '#AAAAAA';  // Light color for original graph
        this.context.stroke();
    }

    _drawUserGraph() {
        if (this.userGraph.length > 1) {
            for (let i = 1; i < this.userGraph.length; i++) {
                const prev = this.userGraph[i - 1];
                const curr = this.userGraph[i];

                this.context.beginPath();
                this.context.moveTo(prev.x, prev.y);
                this.context.lineTo(curr.x, curr.y);
                this.context.strokeStyle = curr.y < prev.y ? 'green' : 'red';  // Red if going down, green if up
                this.context.stroke();
            }
        }
    }

    _calculateScore() {
        // Compare the user's graph to the original and calculate accuracy
        let totalDifference = 0;
        for (let i = 0; i < this.userGraph.length; i++) {
            const originalY = this.originalGraph[i]?.y;
            const userY = this.userGraph[i]?.y;
            if (originalY !== undefined && userY !== undefined) {
                totalDifference += Math.abs(originalY - userY);
            }
        }

        // The lower the totalDifference, the better the score
        const maxDifference = this._canvas.height * this.userGraph.length;
        const accuracy = 1 - (totalDifference / maxDifference);  // Accuracy as a percentage

        // Display score as percentage
        this.context.font = '20px Arial';
        this.context.fillStyle = '#000';
        this.context.fillText(`Score: ${(accuracy * 100).toFixed(2)}%`, 10, 30);
    }

    _bindEvents() {
        // Listen for arrow key presses to control the Y position of the user's drawing
        window.addEventListener('keydown', (event) => {
            if (!this.isGameActive) return;

            const step = 5;  // How much the line moves vertically per arrow key press
            if (event.key === 'ArrowUp') {
                this.currentY = Math.max(0, this.currentY - step);  // Move up
            }
            if (event.key === 'ArrowDown') {
                this.currentY = Math.min(this._canvas.height, this.currentY + step);  // Move down
            }

            // Update the user's graph
            this.currentX += this.drawingSpeed;  // Move horizontally at a constant speed
            this.userGraph.push({ x: this.currentX, y: this.currentY });

            // End game if user reaches the end of the canvas
            if (this.currentX >= this._canvas.width) {
                this.isGameActive = false;
            }
        });
    }
}
