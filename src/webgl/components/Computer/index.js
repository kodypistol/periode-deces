import Experience from 'core/Experience.js'
import fragmentShader from './fragment.glsl'
import vertexShader from './vertex.glsl'
import { BoxGeometry, Mesh, Scene, ShaderMaterial, MeshNormalMaterial, Vector3, Object3D, MeshBasicMaterial } from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import addObjectDebug from '@/webgl/utils/addObjectDebug'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

export default class Cube {
	constructor(_position = new Vector3(0, 0, 0)) {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.debug = this.experience.debug
		this.camera = this.experience.camera; // Get the camera for projection
		this.resources = this.scene.resources;
		this.position = _position

		this.css3dRenderer = this.setCss3dRenderer();
		this.css3dScene = this.setCss3dScene();

		this.screenPoint = this.setScreenPoint()
		this.screenElement = this.setScreenElement()
		this.screenBounds = this.setScreenBounds()

		this.setMaterial()
		this.setMesh()
		this.setDebug()

		this.tempPosition = new Vector3()
	}

	setMaterial() {
		this.material = new ShaderMaterial({
			fragmentShader,
			vertexShader,
			uniforms: {
				uOpacity: { value: 1 },
			},
		})
	}

	setMesh() {
		const computer = this.resources.items.computer.scene.clone();

		computer.traverse((child) => {
			if (child.isMesh) {
				child.material = new MeshNormalMaterial();
			}
		});

		this.scene.add(computer)
	}

	setCss3dRenderer() {
		const renderer = new CSS3DRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.domElement.style.position = 'absolute';
		renderer.domElement.style.top = 0;
		renderer.domElement.style.pointerEvents = 'none';
		document.body.appendChild(renderer.domElement);

		return renderer;
	}

	setCss3dScene() {
		const scene = new Scene();

		return scene;
	}

	setScreenElement() {
		const screen = document.querySelector('.computer-screen');

		const cssObject = new CSS3DObject(screen);

		// Position it on the cube (modify this based on your cube's dimensions and face positioning)
		cssObject.position.copy(this.screenPoint.position); // Example, adjust to position on the correct face
		cssObject.rotation.copy(this.screenPoint.rotation); // Example, adjust to position on the correct face
		cssObject.scale.set(0.0045, 0.0045, 0.0045); // Adjust the rotation as needed

		this.css3dScene.add(cssObject);

		return cssObject;
	}

	setScreenBounds() {
		const screenBounds = {};

		screenBounds.left = this.screenPoint.position.x;
		screenBounds.right = this.screenPoint.position.x;
		screenBounds.top = this.screenPoint.position.y;
		screenBounds.bottom = this.screenPoint.position.y;

		return screenBounds;
	}

	setScreenPoint() {
		const screenPoint = new Mesh(new BoxGeometry(0.1, 0.1, 0.1), new MeshBasicMaterial({ color: 0xff0000 }));
		screenPoint.position.set(-0.03, 2.17, 0.38);
		screenPoint.rotation.y = Math.PI;

		this.scene.add(screenPoint);

		return screenPoint;
	}

	// Convert 3D position of a cube face to 2D screen coordinates
	updateScreenElement() {
		// Project the world position to screen space
		const screenPosition = this.toScreenPosition();

		// Update the HTML element position to align with the cube face
		this.screenElement.style.transform = ` translate(${screenPosition.x}px, ${screenPosition.y}px)`;
	}

	// Helper function to convert 3D world coordinates to 2D screen coordinates
	toScreenPosition() {
		// position.y -= 0.5; // Center the position
		this.tempPosition.x = this.position.x;
		this.tempPosition.y = this.position.y;
		this.tempPosition.z = this.position.z;
		this.tempPosition.project(this.camera.instance); // Project the position to camera space

		const center = {
			x: this.tempPosition.x,
			y: this.tempPosition.y
		};

		this.tempPosition.x = this.screenBounds.left;
		this.tempPosition.y = this.screenBounds.top;
		this.tempPosition.z = this.screenPoint.position.z;
		this.tempPosition.project(this.camera.instance); // Project the position to camera space

		const leftTop = {
			x: this.tempPosition.x,
			y: this.tempPosition.y
		};

		this.tempPosition.x = this.screenBounds.right;
		this.tempPosition.y = this.screenBounds.bottom;
		this.tempPosition.z = this.screenPoint.position.z;

		this.tempPosition.project(this.camera.instance); // Project the position to camera space

		const rightBottom = {
			x: this.tempPosition.x,
			y: this.tempPosition.y
		};

		// Convert normalized device coordinates to screen coordinates
		const halfWidth = window.innerWidth / 2;
		const halfHeight = window.innerHeight / 2;

		// 1 in 3D equals 300px in 2D
		//calculate scale for css with that info
		const xLeft = (leftTop.x * halfWidth) + halfWidth;
		const xRight = (rightBottom.x * halfWidth) + halfWidth;
		const yTop = -(leftTop.y * halfHeight) + halfHeight;
		const yBottom = -(rightBottom.y * halfHeight) + halfHeight;

		const scale = Math.abs(xLeft - xRight) / 300;

		return {
			x: xLeft,
			y: yTop,
			scale
		};
	}

	// Update function that runs every frame
	update() {
		// this.updateScreenElement(); // Update the HTML element position on every frame
		this.css3dRenderer.render(this.css3dScene, this.camera.instance);
	}

	setDebug() {
		if (this.debug.active) {
			addObjectDebug(this.debug.ui, this.screenPoint, { title: 'Cube' })
		}
	}
}
