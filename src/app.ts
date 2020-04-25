import fs from 'fs'
import { PNG } from 'pngjs'

export const run = async () => {
	if (process.argv.length !== 4) {
		console.log('./ICpng [Action] [Filename] (Output)')
		console.log("\tAction\t\t'TXT' for .png => .txt or 'PNG' for .txt => .png")
		console.log('\tFilename\tInput file .png or .txt')
		console.log('\tOutput\t\t(optional) Output name file')
		return
	}
	if (process.argv[2] !== 'TXT' && process.argv[2] !== 'PNG') {
		console.log(`./ICpng: '${process.argv[2]}': Unrecognized action, try --help`)
		return
	}
	if (!fs.existsSync(process.argv[3])) {
		console.log(`./ICpng: '${process.argv[3]}': No such file or directory`)
		return
	}
	if (process.argv[2] === 'TXT') {
		png_to_txt(process.argv[3], process.argv[4])
	} else {
		txt_to_png(process.argv[3])
	}
}

function png_to_txt(path_in: string, path_out?: string) {
	const png = PNG.sync.read(fs.readFileSync(path_in))
	let out = ''

	for (let y = 0; y < png.height; y++) {
		for (let x = 0; x < png.width; x++) {
			const idx = (png.width * y + x) << 2
			if (png.data[idx + 3] < 30) out += `(${y},${x}) (0,0,0)\n`
			else out += `(${y},${x}) (${png.data[idx]},${png.data[idx + 1]},${png.data[idx + 2]})\n`
		}
	}
	fs.writeFileSync(path_out || 'out.txt', out, 'utf8')
}

function txt_to_png(path_in: string, path_out?: string) {
	const reg1 = RegExp('\\(\\d+,\\d+\\) \\(\\d+,\\d+,\\d+\\)')
	const reg2 = RegExp('\\(\\d+,\\d+,\\d+\\)')
	const reg3 = new RegExp('(\\d+)', 'g')
	const file = fs.readFileSync(path_in, 'utf8')
	const lines = file.split('\n')
	const data: { x: number; y: number; r: number; g: number; b: number }[] = []
	const color: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 }
	let width = -1
	let height = -1

	lines.forEach((line) => {
		const nb: string[] = []
		let tmp = reg3.exec(line)
		while (tmp) {
			nb.push(tmp[0])
			tmp = reg3.exec(line)
		}
		if (reg1.test(line) && nb) {
			data.push({ x: +nb[1], y: +nb[0], r: color.r, g: color.g, b: color.b })
			if (width < +nb[1]) width = +nb[1]
			if (height < +nb[0]) height = +nb[0]
		} else if (reg2.test(line) && nb) {
			color.r = +nb[0]
			color.g = +nb[1]
			color.b = +nb[2]
		}
	})

	width += 1
	height += 1
	if (data.length === 0 || width <= 0 || height <= 0) return
	const newfile = new PNG({ width, height })

	data.forEach((value) => {
		//const idx = (newfile.width * (newfile.height - value.y - 1) + (newfile.width - value.x - 1)) << 2
		const idx = (newfile.width * value.y + value.x) << 2
		newfile.data[idx] = value.r
		newfile.data[idx + 1] = value.g
		newfile.data[idx + 2] = value.b
		newfile.data[idx + 3] = 0xff
	})

	const buffer = PNG.sync.write(newfile)
	fs.writeFileSync(path_out || 'out.png', buffer)
}
