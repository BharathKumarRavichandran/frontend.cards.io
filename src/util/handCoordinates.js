const isMobile = window.screen.width < 768

const binom = (n, k) => {
	var coeff = 1
	var i
	if (k < 0 || k > n) return 0
	for (i = 0; i < k; i++) coeff = (coeff * (n - i)) / (i + 1)
	return coeff
}

const bezierEqn = (points, t) => {
	let result = { x: 0, y: 0 }
	let n = points.length - 1
	for (let i = 0; i < points.length; i++) {
		result.x +=
			binom(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i) * points[i].x
		result.y +=
			binom(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i) * points[i].y
	}
	return result
}

const findOtherHandCoordinates = (width, height, count) => {
	let points = [],
		results = [],
		px = 40,
		py = 40,
		isPortrait = window.screen.orientation.type.includes('portrait')

	if (isMobile) {
		px = 30
	}

	width = width - 2 * px
	height = height - 2 * py

	if (isPortrait) {
		height -= height * 0.05
		points.push({ x: 0, y: 0 })
		points.push({ x: 0, y: height / 6 })
		points.push({ x: 0, y: height / 3 })
		points.push({ x: 0, y: height / 2 })
		points.push({ x: 0, y: (2 * height) / 3 })
		points.push({ x: 0, y: (5 * height) / 6 })
		points.push({ x: width / 6, y: height })
		points.push({ x: width / 3, y: height })
		points.push({ x: width / 2, y: height })
		points.push({ x: (2 * width) / 3, y: height })
		points.push({ x: (5 * width) / 6, y: height })
		points.push({ x: width, y: (5 * height) / 6 })
		points.push({ x: width, y: (2 * height) / 3 })
		points.push({ x: width, y: height / 2 })
		points.push({ x: width, y: height / 3 })
		points.push({ x: width, y: height / 6 })
		points.push({ x: width, y: 0 })
	} else {
		points.push({ x: 0, y: 0 })
		points.push({ x: 0, y: (2 * height) / 3 })
		points.push({ x: width / 3, y: height })
		points.push({ x: width / 2, y: height })
		points.push({ x: (2 * width) / 3, y: height })
		points.push({ x: width, y: (2 * height) / 3 })
		points.push({ x: width, y: 0 })
	}

	let base = 1 / (count + 1)
	for (let i = 1; i < count + 1; i++) {
		let r = bezierEqn(points, i * base)
		r.y = height - r.y
		results.push(r)
	}

	return results
}

const findPlayerHandCoordinates = (width, height, cardScale) => {
	let cardHeight = 249
	let px = 40

	if (isMobile) px = 30

	let x = width / 2 - px,
		y = height - cardHeight * cardScale

	return { x, y }
}

const findHandCoordinates = (width, height, cardScale, count) => {
	return {
		player: findPlayerHandCoordinates(width, height, cardScale),
		others: findOtherHandCoordinates(width, height, count)
	}
}

export { findHandCoordinates }
