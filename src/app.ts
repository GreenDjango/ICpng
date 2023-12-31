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
	const pattern1Regex = /\((\d+),(\d+)\) \((\d+),(\d+),(\d+)\)/
	const file = fs.readFileSync(path_in, 'utf8')
	const lines = file.split('\n')
	const data: { x: number; y: number; r: number; g: number; b: number }[] = []
	let width = -1
	let height = -1

	for (const line of lines) {
		if (!pattern1Regex.test(line)) continue

		const [_, y, x, r, g, b] = pattern1Regex.exec(line)!
		data.push({ x: +x, y: +y, r: +r, g: +g, b: +b })
		if (width < +x) width = +x
		if (height < +y) height = +y
	}

	console.log(data)

	width += 1
	height += 1
	if (data.length === 0 || width <= 0 || height <= 0) return
	const newfile = new PNG({ width, height })

	for (const value of data) {
		//const idx = (newfile.width * (newfile.height - value.y - 1) + (newfile.width - value.x - 1)) << 2
		const idx = (newfile.width * value.y + value.x) << 2
		newfile.data[idx] = value.r
		newfile.data[idx + 1] = value.g
		newfile.data[idx + 2] = value.b
		newfile.data[idx + 3] = 0xff
	}

	const buffer = PNG.sync.write(newfile)
	fs.writeFileSync(path_out || 'out.png', buffer)
}
