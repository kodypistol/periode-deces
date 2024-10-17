import {
	AdditiveBlending,
	Color,
	HalfFloatType,
	Matrix4,
	MeshBasicMaterial,
	NoBlending,
	ShaderMaterial,
	UniformsUtils,
	Vector2,
	Vector3,
	WebGLRenderTarget,
} from 'three'
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'

class OutlinePass extends Pass {
	constructor(resolution, scene, camera, selectedObjects) {
		super()

		this.renderScene = scene
		this.renderCamera = camera
		this.selectedObjects = selectedObjects !== undefined ? selectedObjects : []
		this.visibleEdgeColor = new Color(0, 1, 0)
		this.edgeStrength = 3.0
		this.edgeThickness = 4
		this.downSampleRatio = 4

		this._visibilityCache = new Map()
		this._selectionCache = new Set()

		this.resolution =
			resolution !== undefined
				? new Vector2(Math.round(resolution.x / this.downSampleRatio), Math.round(resolution.y / this.downSampleRatio))
				: new Vector2(256, 256)

		this.renderTargetMaskBuffer = new WebGLRenderTarget(this.resolution.x, this.resolution.y)
		this.renderTargetMaskBuffer.texture.name = 'OutlinePass.mask'
		this.renderTargetMaskBuffer.texture.generateMipmaps = false

		this.edgeDetectionMaterial = this.getEdgeDetectionMaterial()
		this.renderTargetEdgeBuffer = new WebGLRenderTarget(this.resolution.x, this.resolution.y, { type: HalfFloatType })
		this.renderTargetEdgeBuffer.texture.name = 'OutlinePass.edge'
		this.renderTargetEdgeBuffer.texture.generateMipmaps = false

		// Overlay material
		this.overlayMaterial = this.getOverlayMaterial()

		// copy material

		const copyShader = CopyShader

		this.copyUniforms = UniformsUtils.clone(copyShader.uniforms)

		this.materialCopy = new ShaderMaterial({
			uniforms: this.copyUniforms,
			vertexShader: copyShader.vertexShader,
			fragmentShader: copyShader.fragmentShader,
			blending: NoBlending,
			depthTest: false,
			depthWrite: false,
		})

		this.enabled = true

		this._oldClearColor = new Color()
		this.oldClearAlpha = 1

		this.fsQuad = new FullScreenQuad(null)
	}

	dispose() {
		this.renderTargetMaskBuffer.dispose()
		this.renderTargetEdgeBuffer.dispose()

		this.edgeDetectionMaterial.dispose()
		this.overlayMaterial.dispose()
		this.materialCopy.dispose()

		this.fsQuad.dispose()
	}

	setSize(width, height) {
		const resx = width / this.downSampleRatio
		const resy = height / this.downSampleRatio
		this.renderTargetMaskBuffer.setSize(resx, resy)
		this.renderTargetEdgeBuffer.setSize(resx, resy)
	}

	updateSelectionCache() {
		const cache = this._selectionCache

		function gatherSelectedMeshesCallBack(object) {
			if (object.isMesh) cache.add(object)
		}

		cache.clear()

		for (let i = 0; i < this.selectedObjects.length; i++) {
			const selectedObject = this.selectedObjects[i]
			selectedObject.traverse(gatherSelectedMeshesCallBack)
		}
	}

	changeVisibilityOfSelectedObjects(bVisible) {
		const cache = this._visibilityCache

		for (const mesh of this._selectionCache) {
			if (bVisible === true) {
				mesh.visible = cache.get(mesh)
			} else {
				cache.set(mesh, mesh.visible)
				mesh.visible = bVisible
			}
		}
	}

	changeVisibilityOfNonSelectedObjects(bVisible) {
		const visibilityCache = this._visibilityCache
		const selectionCache = this._selectionCache

		function VisibilityChangeCallBack(object) {
			if (object.isMesh || object.isSprite) {
				// only meshes and sprites are supported by OutlinePass

				if (!selectionCache.has(object)) {
					const visibility = object.visible

					if (bVisible === false || visibilityCache.get(object) === true) {
						object.visible = bVisible
					}

					visibilityCache.set(object, visibility)
				}
			} else if (object.isPoints || object.isLine) {
				// the visibilty of points and lines is always set to false in order to
				// not affect the outline computation

				if (bVisible === true) {
					object.visible = visibilityCache.get(object) // restore
				} else {
					visibilityCache.set(object, object.visible)
					object.visible = bVisible
				}
			}
		}

		this.renderScene.traverse(VisibilityChangeCallBack)
	}

	render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
		if (this.selectedObjects.length > 0) {
			// renderer.getClearColor(this._oldClearColor)
			// this.oldClearAlpha = renderer.getClearAlpha()
			// const oldAutoClear = renderer.autoClear
			//
			// renderer.autoClear = false
			// if (maskActive) renderer.state.buffers.stencil.setTest(false)
			// renderer.setClearColor(0xffffff, 1)
			// this.updateSelectionCache()
			// const currentBackground = this.renderScene.background
			// this.renderScene.background = null
			// Make non selected objects invisible, and draw only the selected objects, by comparing the depth buffer of non selected objects
			// this.changeVisibilityOfNonSelectedObjects(false)
			// this.renderScene.overrideMaterial = new MeshBasicMaterial({ color: 'black' })
			// renderer.setRenderTarget(this.renderTargetMaskBuffer)
			// renderer.clear()
			// renderer.render(this.renderScene, this.renderCamera)
			// this.renderScene.overrideMaterial = null
			// this.changeVisibilityOfNonSelectedObjects(true)
			// this._visibilityCache.clear()
			// this._selectionCache.clear()
			//
			// this.renderScene.background = currentBackground
			// 3. Apply Edge Detection Pass
			// this.fsQuad.material = this.edgeDetectionMaterial
			// this.edgeDetectionMaterial.uniforms['maskTexture'].value = this.renderTargetMaskBuffer.texture
			// this.edgeDetectionMaterial.uniforms['visibleEdgeColor'].value = this.visibleEdgeColor
			// this.edgeDetectionMaterial.uniforms['texSize'].value.set(
			// 	this.renderTargetMaskBuffer.width / this.edgeThickness,
			// 	this.renderTargetMaskBuffer.height / this.edgeThickness,
			// )
			// renderer.setRenderTarget(this.renderTargetEdgeBuffer)
			// renderer.clear()
			// this.fsQuad.render(renderer)
			// Blend it additively over the input texture
			// this.fsQuad.material = this.overlayMaterial
			// this.overlayMaterial.uniforms['maskTexture'].value = this.renderTargetMaskBuffer.texture
			// this.overlayMaterial.uniforms['edgeTexture'].value = this.renderTargetEdgeBuffer.texture
			// this.overlayMaterial.uniforms['edgeStrength'].value = this.edgeStrength
			// if (maskActive) renderer.state.buffers.stencil.setTest(true)
			// renderer.setRenderTarget(readBuffer)
			// this.fsQuad.render(renderer)
			// renderer.setClearColor(this._oldClearColor, this.oldClearAlpha)
			// renderer.autoClear = oldAutoClear
		}

		// if (this.renderToScreen) {
		// 	this.fsQuad.material = this.materialCopy
		// 	this.copyUniforms['tDiffuse'].value = readBuffer.texture
		// 	renderer.setRenderTarget(null)
		// 	this.fsQuad.render(renderer)
		// }
	}

	getEdgeDetectionMaterial() {
		return new ShaderMaterial({
			uniforms: {
				maskTexture: { value: null },
				texSize: { value: new Vector2(0.5, 0.5) },
				visibleEdgeColor: { value: new Vector3(1.0, 1.0, 1.0) },
				hiddenEdgeColor: { value: new Vector3(1.0, 1.0, 1.0) },
			},

			vertexShader: `varying vec2 vUv;

				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,

			fragmentShader: `varying vec2 vUv;

				uniform sampler2D maskTexture;
				uniform vec2 texSize;
				uniform vec3 visibleEdgeColor;
				uniform vec3 hiddenEdgeColor;

				void main() {
					vec2 invSize = 1.0 / texSize;
					vec4 uvOffset = vec4(1.0, 0.0, 0.0, 1.0) * vec4(invSize, invSize);
					vec4 c1 = texture2D( maskTexture, vUv + uvOffset.xy);
					vec4 c2 = texture2D( maskTexture, vUv - uvOffset.xy);
					vec4 c3 = texture2D( maskTexture, vUv + uvOffset.yw);
					vec4 c4 = texture2D( maskTexture, vUv - uvOffset.yw);
					float diff1 = (c1.r - c2.r)*0.5;
					float diff2 = (c3.r - c4.r)*0.5;
					float d = length( vec2(diff1, diff2) );
					float a1 = min(c1.g, c2.g);
					float a2 = min(c3.g, c4.g);
					float visibilityFactor = min(a1, a2);
					vec3 edgeColor = 1.0 - visibilityFactor > 0.001 ? visibleEdgeColor : hiddenEdgeColor;
					gl_FragColor = vec4(edgeColor, 1.0) * vec4(d);
				}`,
		})
	}

	getOverlayMaterial() {
		return new ShaderMaterial({
			uniforms: {
				maskTexture: { value: null },
				edgeTexture: { value: null },
				edgeStrength: { value: 1.0 },
			},

			vertexShader: `varying vec2 vUv;

				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,

			fragmentShader: `varying vec2 vUv;

				uniform sampler2D maskTexture;
				uniform sampler2D edgeTexture;
				uniform float edgeStrength;

				void main() {
					vec4 edgeValue = texture2D(edgeTexture, vUv);
					vec4 maskColor = texture2D(maskTexture, vUv);
					vec4 finalColor = edgeStrength * maskColor.r * edgeValue;
					gl_FragColor = maskColor;
				}`,
			blending: AdditiveBlending,
			depthTest: false,
			depthWrite: false,
			transparent: true,
		})
	}
}

export { OutlinePass }
