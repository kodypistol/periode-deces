import Experience from 'core/Experience.js'
import { CustomToneMapping, NoToneMapping, ShaderChunk, Vector2, WebGLRenderer } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'

export default class Renderer {
	constructor() {
		this.experience = new Experience()
		this.canvas = this.experience.canvas
		this.sizes = this.experience.sizes
		this.scene = this.experience.scene
		this.camera = this.experience.camera

		this._createInstance()
		this._createToneMapping()
		this._createSnapVertices()
		// this._createPostprocessing()
	}

	_createInstance() {
		this.instance = new WebGLRenderer({
			canvas: this.canvas,
			powerPreference: 'high-performance',
		})
		this.instance.outputColorSpace = 'srgb'
		this.instance.toneMapping = CustomToneMapping
		// this.instance.shadowMap.enabled = true
		// this.instance.shadowMap.type = PCFSoftShadowMap
		this.instance.setClearColor('#211d20')
		this.instance.setSize(this.sizes.width, this.sizes.height)
		this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 2))
	}

	_createToneMapping() {
		ShaderChunk.tonemapping_pars_fragment = ShaderChunk.tonemapping_pars_fragment.replace(
			'vec3 CustomToneMapping( vec3 color ) { return color; }',
			`
    // Simple random function based on screen coordinates
    //float random(vec2 uv) {
    //  return fract(sin(dot(uv.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    //}

    vec3 CustomToneMapping( vec3 color ) {
      float levels = 70.;

      // Generate noise based on screen position
      //float noise = random(gl_FragCoord.xy);

      // Add dithering to the color (apply noise before quantizing)
      //color += noise / levels;

      // Posterize the color
       color = floor(color * levels) / levels;

      return color;
    }
  `,
		)
	}

	_createSnapVertices() {
		const resolution = new Vector2(320, 240)

		ShaderChunk.project_vertex = ShaderChunk.project_vertex.replace(
			'gl_Position = projectionMatrix * mvPosition;',
			`
            vec4 pos = projectionMatrix * mvPosition;
            float dist = length(mvPosition);
            float affine = dist + (mvPosition.w * 8.0) / dist * 0.5;
            vAffine = affine;
            pos.xyz /= pos.w;
            pos.xy = floor(vec2(${resolution.toArray()}) * pos.xy) / vec2(${resolution.toArray()});
            pos.xyz *= pos.w;
            gl_Position = pos;
            `,
		)

		ShaderChunk.uv_pars_vertex =
			`
            varying vec2 vUv;
            varying float vAffine;
        ` + ShaderChunk.uv_pars_vertex

		ShaderChunk.uv_pars_fragment =
			`
            varying vec2 vUv;
            varying float vAffine;
        ` + ShaderChunk.uv_pars_fragment

		ShaderChunk.map_fragment = ShaderChunk.map_fragment.replace(
			'vec4 texelColor = texture2D( map, vUv );',
			`
            vec2 uv = vUv / vAffine;
            vec4 texelColor = texture2D( map, uv );
            `,
		)
	}

	_createPostprocessing() {
		this._composer = new EffectComposer(this.instance)

		const renderPass = new RenderPass(this.scene, this.camera.instance)
		this._composer.addPass(renderPass)
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
