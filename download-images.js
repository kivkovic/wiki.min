const fs = require('fs');
const https = require('https');
const sharp = require('sharp');

if (!fs.existsSync('images/')) {
    fs.mkdirSync('images');
}

const images = JSON.parse(fs.readFileSync('index/images.json'));

function download(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'custombot/0.0 (kivkovic@pm.me) nodejs/0.0' } }, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                console.log(url);
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));

            }
        });
    });
}

const map = new Map();

for (const img in images) {
    if (!img.match(/^\/\//)) { // external images, skip
        continue;
    }

    const basename = img.split('/').slice(-1)[0].replace(/^(?:(?:(?:lossy|lossless)-)?page\d+-)?\d+px-/i, '').replace(/\.((svg|pdf|xcf|tiff?)\.png|png|jpe?g|gif|webp|tiff?)(\?.*)?$/i,'');
    const size = Number(((img.match(/[\/\-](\d+)px-/)||[])[1]||220));
    const previous = map.get(basename);
    const stats = {
        count: (previous?.count || 0) + images[img].c,
        infobox: (previous?.infobox || 0) + images[img].i,
        size: previous?.size > size ? previous.size : size,
        url: previous?.size > size ? previous.url : 'https:' + img,
    };
    map.set(basename, stats);
}

for (const [key, value] of map.entries()) {
    if (value.count + value.infobox <= 2) {
        map.delete(key);
        continue;
    }

    try {
        value.extension = value.url.match(/(\.[a-z]+)(\?.*)?$/i)[1];
    } catch (e) {
        console.log(e)
        console.log(key, value);
        process.exit();
    }

    /*const maxsize = 480;
    if (value.size > maxsize) {
        value.url = value.url.replace(new RegExp(`([\/-])${value.size}(px-)`), `$1${maxsize}$2`);
        value.size = maxsize;
    }*/
}

//let existing_same = 0;
//let existing_smaller = 0;
//let existing_larger = 0;
(async function () {

    for (const [key, value] of map.entries()) {

        const name = key.length < 240 ? key : key.slice(0,240);
        const filename = name + '.webp';

        if (fs.existsSync('i/' + filename) || fs.existsSync('images/' + name + value.extension)) {
            //console.log('skipping')
            map.delete(key);
        }

        /*if (fs.existsSync('i-old/' + filename)) {

            try {
                const img = await sharp('i-old/' + filename);
                const meta = await img.metadata();

                if (meta.width == value.size) {
                    fs.copyFileSync('i-old/' + filename, 'i/' + filename);
                    map.delete(key);
                    existing_same++;
                } else {
                    if (meta.width < value.size) {
                        existing_smaller++;
                    } else {
                        existing_larger++;
                    }
                    console.log('present:', meta.width, 'new:', value.size);
                }
            } catch (e) {
                console.log('sharp error')
            }
        }*/
    }

    //console.log('existing identical images:', existing_same);
    //console.log('existing smaller images:', existing_smaller);
    //console.log('existing larger images:', existing_larger);
    console.log('images to download:', map.size);
    //process.exit()

    await new Promise(r => setTimeout(r, 3000));

    let i = 0;
    let errors = 0;
    for (const [key, value] of map.entries()) {

        const name = key.length < 240 ? key : key.slice(0,240);
        const savePath = 'images/' + name + value.extension;

        if (fs.existsSync(savePath)) continue;

        console.log(++i, '/', map.size);
        try {
            await download(value.url, savePath);

            if (errors && i % 10 == 0) { // gradually decrease counter if error hasn't occured for multiple iters
                errors--;
            }
        } catch (e) {
            console.log(e);
            errors++;
        }

        if (errors >= 10) {
            console.log('terminated because of too many errors');
            process.exit();
        }

        await new Promise(r => setTimeout(r, 100));
    }
})();
