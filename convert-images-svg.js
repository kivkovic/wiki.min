const svgo = require('svgo');
const fs = require('fs');

const files = fs.readdirSync('images').filter(f => f.match(/\.svg$/i));

let originalTotal = 0;
let outputTotal = 0;

for (let i = 0; i < files.length; i++) {
    const name = files[i];

    if (fs.existsSync('images-converted/' + name)) continue;


    let svg = fs.readFileSync('images/' + name).toString().replace(/\x00/g, '');

    //console.log(name);
    while (svg.charCodeAt(0) === 0xFFFF || svg.charCodeAt(0) === 0xFEFF || svg.charCodeAt(0) === 0xFFFD) {
        svg = svg.slice(1);
    }

    svg = svg.replace(/(inkscape|sodipodi):([a-z0-9_\-]+)="[^<>"]+"/g, '')

    /*if (svg.charCodeAt(0) === 0xFEFF || svg.charCodeAt(0) === 0xFFFF || svg.charCodeAt(0) == 0xFFFD) {
        svg = svg.slice(1);
    }
    if (svg.charCodeAt(0) === 0xFEFF || svg.charCodeAt(0) === 0xFFFF || svg.charCodeAt(0) == 0xFFFD) {
        svg = svg.slice(1);
    }*/

    //for (let j = 0; j < 10; j++) console.log(svg.charCodeAt(j));

    try {

        const output = svgo.optimize(svg, {
            multipass: true,
            plugins: [
                'removeOffCanvasPaths',
                //'removeRasterImages',
                'removeScriptElement',
                //'removeXMLNS',
                'reusePaths',
                {
                    name: 'preset-default',
                    params: {
                        overrides: {
                            removeViewBox: false
                        }
                    }
                }
            ],
        });

        fs.writeFileSync('images-converted/' + name, output.data);

        console.log(`input: ${Math.round(svg.length / 1024)}, output: ${Math.round(output.data.length / 1024)}, ratio: ${(output.data.length / svg.length).toFixed(2)}`)

        originalTotal += svg.length / 1024 / 1024;
        outputTotal += output.data.length / 1024 / 1024;

        if (i % 100 == 0) {
            console.log('summary:', originalTotal, outputTotal);
        }

    } catch (e) {
        console.log('ERROR', 'images/' + name)
        console.log(e);
        process.exit(1);
        //console.log(e);
        /*if (e.reason == 'Unclosed root tag') {
            fs.unlinkSync('images/' + name);
        }*/
    }
    //break;
}

console.log('summary:', originalTotal, outputTotal);