"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const pngjs_1 = require("pngjs");
exports.run = () => __awaiter(void 0, void 0, void 0, function* () {
    if (process.argv.length !== 4) {
        console.log('./ICpng [Action] [Filename] (Output)');
        console.log("\tAction\t\t'TXT' for .png => .txt or 'PNG' for .txt => .png");
        console.log('\tFilename\tInput file .png or .txt');
        console.log('\tOutput\t\t(optional) Output name file');
        return;
    }
    if (process.argv[2] !== 'TXT' && process.argv[2] !== 'PNG') {
        console.log(`./ICpng: '${process.argv[2]}': Unrecognized action, try --help`);
        return;
    }
    if (!fs_1.default.existsSync(process.argv[3])) {
        console.log(`./ICpng: '${process.argv[3]}': No such file or directory`);
        return;
    }
    if (process.argv[2] === 'TXT') {
        png_to_txt(process.argv[3], process.argv[4]);
    }
    else {
        txt_to_png(process.argv[3]);
    }
});
function png_to_txt(path_in, path_out) {
    const png = pngjs_1.PNG.sync.read(fs_1.default.readFileSync(path_in));
    let out = '';
    for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
            const idx = (png.width * y + x) << 2;
            if (png.data[idx + 3] < 30)
                out += `(${y},${x}) (0,0,0)\n`;
            else
                out += `(${y},${x}) (${png.data[idx]},${png.data[idx + 1]},${png.data[idx + 2]})\n`;
        }
    }
    fs_1.default.writeFileSync(path_out || 'out.txt', out, 'utf8');
}
function txt_to_png(path_in, path_out) {
    const reg1 = RegExp('\\(\\d+,\\d+\\) \\(\\d+,\\d+,\\d+\\)');
    const reg2 = RegExp('\\(\\d+,\\d+,\\d+\\)');
    const reg3 = new RegExp('(\\d+)', 'g');
    const file = fs_1.default.readFileSync(path_in, 'utf8');
    const lines = file.split('\n');
    const data = [];
    const color = { r: 0, g: 0, b: 0 };
    let width = -1;
    let height = -1;
    lines.forEach((line) => {
        const nb = [];
        let tmp = reg3.exec(line);
        while (tmp) {
            nb.push(tmp[0]);
            tmp = reg3.exec(line);
        }
        if (reg1.test(line) && nb) {
            data.push({ x: +nb[1], y: +nb[0], r: color.r, g: color.g, b: color.b });
            if (width < +nb[1])
                width = +nb[1];
            if (height < +nb[0])
                height = +nb[0];
        }
        else if (reg2.test(line) && nb) {
            color.r = +nb[0];
            color.g = +nb[1];
            color.b = +nb[2];
        }
    });
    width += 1;
    height += 1;
    if (data.length === 0 || width <= 0 || height <= 0)
        return;
    const newfile = new pngjs_1.PNG({ width, height });
    data.forEach((value) => {
        //const idx = (newfile.height * (newfile.height - value.y - 1) + (newfile.width - value.x - 1)) << 2
        const idx = (newfile.height * value.y + value.x) << 2;
        newfile.data[idx] = value.r;
        newfile.data[idx + 1] = value.g;
        newfile.data[idx + 2] = value.b;
        newfile.data[idx + 3] = 0xff;
    });
    const buffer = pngjs_1.PNG.sync.write(newfile);
    fs_1.default.writeFileSync(path_out || 'out.png', buffer);
}
