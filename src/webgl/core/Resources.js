import EventEmitter from 'core/EventEmitter.js'
import { AudioLoader, CubeTexture, CubeTextureLoader, Object3D, Texture, TextureLoader } from 'three'
import Experience from 'core/Experience.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

export default class Resources extends EventEmitter {
	constructor(sources) {
		super()

		this.experience = new Experience()
		this.debug = this.experience.debug

		// Organize sources and groups
		this.sources = []
		this.groups = {}
		this.groupSources = {}
		this.groupLoads = {}

		for (this.groupName in sources) {
			const groupResources = sources[this.groupName]
			this.groups[this.groupName] = []
			this.groupSources[this.groupName] = groupResources

			for (const resource of groupResources) {
				resource.group = this.groupName
				this.sources.push(resource)
				this.groups[this.groupName].push(resource.name)
			}
		}

		this.items = {}
		this.toLoad = 0
		this.loaded = 0

		// Load the persistent group by default
		this.loadGroup('persistent')
	}

	setLoadingScreen() {
		const loadingScreenStyles = {
			position: 'fixed',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			background: '#000',
			zIndex: 100,
		}
		const loadingBarStyles = {
			position: 'fixed',
			top: '50%',
			left: '25%',
			width: '50%',
			margin: 'auto',
			height: '2px',
			background: 'white',
			zIndex: 100,
			transformOrigin: 'left',
			transform: 'scaleX(0)',
		}
		this.loadingScreenElement = document.createElement('div')
		Object.assign(this.loadingScreenElement.style, loadingScreenStyles)
		this.loadingBarElement = document.createElement('div')
		Object.assign(this.loadingBarElement.style, loadingBarStyles)
		this.loadingScreenElement.appendChild(this.loadingBarElement)
		document.body.appendChild(this.loadingScreenElement)
	}

	setLoaders() {
		this.loaders = {}
		this.loaders.gltfLoader = new GLTFLoader()
		const dracoLoader = new DRACOLoader()
		dracoLoader.setDecoderPath('/draco/')
		this.loaders.gltfLoader.setDRACOLoader(dracoLoader)
		this.loaders.textureLoader = new TextureLoader()
		this.loaders.cubeTextureLoader = new CubeTextureLoader()
		this.loaders.audioLoader = new AudioLoader()
	}

	loadGroup(groupName) {
		const groupResources = this.groupSources[groupName]
		if (!groupResources) {
			console.warn(`Group ${groupName} does not exist.`)
			return
		}

		// Initialize group load tracking
		if (!this.groupLoads[groupName]) {
			this.groupLoads[groupName] = {
				toLoad: groupResources.length,
				loaded: 0,
			}
		}

		this.toLoad += groupResources.length

		if (this.toLoad === 0) {
			console.warn('No resources to load.')
			this.trigger('ready')
			return
		}

		if (!this.debug.active || this.debug.debugParams.LoadingScreen) {
			this.setLoadingScreen()
		}
		if (!this.loaders) {
			this.setLoaders()
		}
		this.startLoading(groupResources, groupName)
	}

	startLoading(groupResources, groupName) {
		if (this.debug.active && this.debug.debugParams.ResourceLog) {
			console.group('🖼️ Resources')
			console.debug('⏳ Loading resources...')
			this.totalStartTime = performance.now()
		}
		// Load each source
		for (const source of groupResources) {
			source.startTime = performance.now()
			switch (source.type) {
				case 'gltf':
					this.loaders.gltfLoader.load(source.path, (file) => {
						this.sourceLoaded(source, file, groupName)
					})
					break
				case 'texture':
					this.loaders.textureLoader.load(source.path, (file) => {
						this.sourceLoaded(source, file, groupName)
					})
					break
				case 'cubeTexture':
					this.loaders.cubeTextureLoader.load(source.path, (file) => {
						this.sourceLoaded(source, file, groupName)
					})
					break
				case 'audio':
					this.loaders.audioLoader.load(source.path, (file) => {
						this.sourceLoaded(source, file, groupName)
					})
					break
				default:
					console.error(source.type + ' is not a valid source type')
					break
			}
		}
	}

	sourceLoaded(source, file) {
		const { name, path, type, startTime, group, ...rest } = source
		Object.assign(file, rest)

		// Store resource in items using its name
		this.items[name] = file
		this.loaded++
		this.groupLoads[this.groupName].loaded++

		if (this.debug.active && this.debug.debugParams.ResourceLog)
			console.debug(
				`%c🖼️ ${name}%c loaded in ${source.loadTime}ms. (${this.loaded}/${this.toLoad})`,
				'font-weight: bold',
				'font-weight: normal'
			)
		if (this.loadingScreenElement) {
			this.loadingBarElement.style.transform = `scaleX(${this.loaded / this.toLoad})`
		}

		// Check if group is fully loaded
		if (this.groupLoads[this.groupName].loaded === this.groupLoads[this.groupName].toLoad) {
			this.trigger('groupLoaded:' + this.groupName)
		}

		if (this.loaded === this.toLoad) {
			if (this.debug.active && this.debug.debugParams.ResourceLog) {
				const totalEndTime = performance.now()
				const totalLoadTime = totalEndTime - this.totalStartTime
				console.debug(`✅ Resources loaded in ${totalLoadTime}ms!`)
				console.groupEnd()
			}
			if (this.loadingScreenElement) this.loadingScreenElement.remove()
			this.trigger('ready')
		}
	}
}
