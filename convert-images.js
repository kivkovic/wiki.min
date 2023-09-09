const sharp = require('sharp');
const fs = require('fs');

const files = fs.readdirSync('images');//.filter(f => !f.match(/\.svg$/i) && f.match(/\.(jpe?g|png|gif|webp|tiff?)$/i));

let originalTotal = 0;
let outputTotal = 0;

const outdir = 'images-vector-converted/';

(async function () {

    for (let i = 0; i < files.length; i++) {

        const nameIn = files[i];
        if (!nameIn.match(/\.(jpe?g|png|gif|webp|tiff?|svg)$/i)) continue;

        const name = nameIn.replace(/(\.svg)?\.[a-z]{3,4}$/i, '');

        if (fs.existsSync(outdir + name + '.webp')) continue;

        console.log(i, '/', files.length);

        try {

            await sharp('images/' + nameIn)
                .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 75 })
                .toFile(outdir + name + '.webp');

            //console.log(`input: ${Math.round(svg.length / 1024)}, output: ${Math.round(output.data.length / 1024)}, ratio: ${(output.data.length / svg.length).toFixed(2)}`)

            //originalTotal += svg.length / 1024 / 1024;
            //outputTotal += output.data.length / 1024 / 1024;

            //if (i % 100 == 0) {
            //    console.log('summary:', originalTotal, outputTotal);
            //}

        } catch (e) {
            console.log('ERROR', 'images/' + name)
            console.log(e);
            process.exit(1);
        }
        //break;
    }

})();

//console.log('summary:', originalTotal, outputTotal);
