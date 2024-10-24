export default class MoneyManager {
	constructor() {
		// Implement singleton pattern
		if (MoneyManager.instance) {
			return MoneyManager.instance
		}

		this.money = 0
		this.baseRate = 0.01 // Base rate (incremento de dinero por intervalo)
		this.currentRate = this.baseRate // Current effective rate
		this.interval = 10 // Intervalo en milisegundos
		this.rateModifiers = [] // Active rate modifiers
		this.additionalRates = [] // Additive rate modifiers (for money subtraction)
		this.timer = null
		this.onMoneyChange = null // Callback function

		MoneyManager.instance = this // Save the instance

		this.element = document.getElementById('overlay')
	}

	// Método para establecer la función de callback cuando el dinero cambia
	setOnMoneyChangeCallback(callback) {
		this.onMoneyChange = callback
	}

	// Método para iniciar el incremento de dinero
	startIncrement() {
		if (this.timer) {
			console.warn('El incremento ya ha comenzado.')
			return
		}

		this.timer = setInterval(() => {
			this.money += this.currentRate

			// Llamar al callback si está definido
			if (this.onMoneyChange) {
				this.onMoneyChange(this.money)
			}

			// console.log(`Dinero: ${this.formatNumber(this.money)}`)
		}, this.interval)
	}

	// Método para multiplicar la tasa de incremento temporalmente
	multiplyRate(factor, durationInSeconds) {
		const modifier = {
			factor: factor,
			timeoutId: null,
		}
		this.rateModifiers.push(modifier)
		this.updateCurrentRate()

		// Programar la reversión del multiplicador
		modifier.timeoutId = setTimeout(() => {
			this.removeModifier(modifier)
			this.element.style.color = 'white'
		}, durationInSeconds * 1000)

		this.element.style.color = 'green'

		console.log(`Tasa multiplicada por ${factor} durante ${durationInSeconds} segundos.`)
	}

	// Método para disminuir el dinero a una tasa específica temporalmente
	subtractMoneyRate(rate, durationInSeconds) {
		// Añadir un modificador de tasa negativa
		const modifier = {
			rate: -rate, // Tasa negativa para restar dinero
			timeoutId: null,
		}
		this.additionalRates.push(modifier)
		this.updateCurrentRate()

		// Cambiar el color del elemento a rojo
		if (this.element) {
			this.element.style.color = 'red'
		}

		// Programar la reversión del modificador
		modifier.timeoutId = setTimeout(() => {
			this.removeAdditionalRate(modifier)
			// Restaurar el color del elemento
			if (this.element) {
				this.element.style.color = 'white'
			}
		}, durationInSeconds * 1000)

		console.log(`Restando dinero a una tasa de ${rate} durante ${durationInSeconds} segundos.`)
	}

	// Método para actualizar la tasa actual basada en los modificadores activos
	updateCurrentRate() {
		let totalMultiplier = 1
		for (const mod of this.rateModifiers) {
			totalMultiplier *= mod.factor
		}

		let totalAdditionalRate = 0
		for (const mod of this.additionalRates) {
			totalAdditionalRate += mod.rate
		}

		this.currentRate = this.baseRate * totalMultiplier + totalAdditionalRate
		console.log(`Nueva tasa actual: ${this.currentRate}`)
	}

	// Método para eliminar un modificador y actualizar la tasa
	removeModifier(modifier) {
		const index = this.rateModifiers.indexOf(modifier)
		if (index !== -1) {
			this.rateModifiers.splice(index, 1)
			this.updateCurrentRate()
		}
	}

	// Método para eliminar un modificador de tasa adicional y actualizar la tasa
	removeAdditionalRate(modifier) {
		const index = this.additionalRates.indexOf(modifier)
		if (index !== -1) {
			this.additionalRates.splice(index, 1)
			this.updateCurrentRate()
		}
	}

	// Método para detener el incremento de dinero
	stop() {
		if (this.timer) {
			clearInterval(this.timer)
			this.timer = null
			console.log('Incremento de dinero detenido.')

			// Limpiar todos los modificadores pendientes
			for (const mod of this.rateModifiers) {
				clearTimeout(mod.timeoutId)
			}
			this.rateModifiers = []
			this.currentRate = this.baseRate
		} else {
			console.warn('El incremento ya está detenido.')
		}
	}

	// Método para formatear el número con comas y sufijos
	formatNumber(number) {
		const units = ['k', 'M', 'B', 'T']
		let index = 0
		while (number >= 1000 && index < units.length - 1) {
			number /= 1000
			index++
		}
		return number.toFixed(2) + units[index]
	}

	render() {
		console.log('MoneyManager Renderizado')
	}
}
