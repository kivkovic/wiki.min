const sharp = require('sharp');
const fs = require('fs');

const files = fs.readdirSync('id').filter(f => f.match(/\.(jpe?g|png|gif|webp|tiff?|svg)$/i));

const indir = 'id/'
const outdir = 'io/';


if (!fs.existsSync(outdir)) {
    fs.mkdirSync(outdir);
}


(async function () {

    for (let i = 0; i < files.length; i++) {

        const nameIn = files[i];
        if (!nameIn.match(/\.(jpe?g|png|gif|webp|tiff?|svg)$/i)) continue;

        const name = nameIn.replace(/(\.svg)?\.[a-z]{3,4}$/i, '');

        if (fs.existsSync(outdir + name + '.webp')) continue;

        console.log(i, '/', files.length, name);

        try {

            await sharp(indir + nameIn, { animated: true })
                .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 75 })
                .toFile(outdir + name + '.webp');

        } catch (e) {
            console.log('ERROR', indir + '/' + name)
            console.log(e);
            //process.exit(1);
        }
        //break;
    }

})();
