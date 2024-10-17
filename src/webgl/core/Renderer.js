import Experience from 'core/Experience.js'
import {
	ACESFilmicToneMapping,
	CineonToneMapping,
	Color,
	PCFSoftShadowMap,
	SRGBColorSpace,
	Vector2,
	WebGLRenderer,
} from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutlinePass } from 'webgl/effects/OutlinePass.js'

export default class Renderer {
	constructor() {
		this.experience = new Experience()
		this.canvas = this.experience.canvas
		this.sizes = this.experience.sizes
		this.scene = this.experience.scene
		this.camera = this.experience.camera

		this._createInstance()
		// this._createPostprocessing()
	}

	_createInstance() {
		this.instance = new WebGLRenderer({
			canvas: this.canvas,
			powerPreference: 'high-performance',
		})
		// this.instance.outputColorSpace = SRGBColorSpace
		// this.instance.toneMapping = ACESFilmicToneMapping
		// this.instance.toneMappingExposure = 1.75
		// this.instance.shadowMap.enabled = true
		// this.instance.shadowMap.type = PCFSoftShadowMap
		this.instance.setClearColor('#211d20')
		this.instance.setSize(this.sizes.width, this.sizes.height)
		this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 2))
	}

	_createPostprocessing() {
		this._composer = new EffectComposer(this.instance)

		const renderPass = new RenderPass(this.scene, this.camera.instance)
		this._composer.addPass(renderPass)

		// this.outlinePass = new OutlinePass(
		// 	new Vector2(this.sizes.width, this.sizes.height),
		// 	this.scene,
		// 	this.camera.instance,
		// )
		// this._composer.addPass(this.outlinePass)
	}

	resize() {
		this.instance.setSize(this.sizes.width, this.sizes.height)
		this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 2))
	}

	update() {
		// this._composer.render()
		this.instance.render(this.scene, this.camera.instance)
	}
}
