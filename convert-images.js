const sharp = require('sharp');
const fs = require('fs');

const files = fs.readdirSync('images').filter(f => f.match(/\.(jpe?g|png|gif|webp|tiff?|svg)$/i));

if (!fs.existsSync('i/')) {
    fs.mkdirSync('i');
}

const outdir = 'i/';

(async function () {

    for (let i = 0; i < files.length; i++) {

        const nameIn = files[i];
        if (!nameIn.match(/\.(jpe?g|png|gif|webp|tiff?|svg)$/i)) continue;

        const name = nameIn.replace(/(\.svg)?\.[a-z]{3,4}$/i, '');

        if (fs.existsSync(outdir + name + '.webp')) continue;

        console.log(i, '/', files.length, name);

        try {

            await sharp('images/' + nameIn, { animated: true })
                .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 75 })
                .toFile(outdir + name + '.webp');

        } catch (e) {
            console.log('ERROR', inputDir + '/' + name)
            console.log(e);
            process.exit(1);
        }
        //break;
    }

})();
