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
    if (value.count <= 2 && !value.infobox) {
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
}


for (const [key, value] of map.entries()) {
    if (fs.existsSync('i/' + key + '.webp')) {
        map.delete(key);
    }
}

(async function () {

    for (const [key, value] of map.entries()) {

        const name = key.length < 240 ? key : key.slice(0,240);
        const filename = name + '.webp';

        if (fs.existsSync('i/' + filename) || fs.existsSync('id/' + name + value.extension)) {
            map.delete(key);
        }
    }

    console.log('images to download:', map.size);

    await new Promise(r => setTimeout(r, 3000));

    let i = 0;
    let errors = 0;
    for (const [key, value] of map.entries()) {

        const name = key.length < 240 ? key : key.slice(0,240);
        const savePath = 'id/' + name + value.extension;

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
