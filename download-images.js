const fs = require('fs');
const https = require('https');

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

const filtered = [];
const map = new Map();

for (const img in images) {

    const basename = img.split('/').slice(-1)[0].replace(/^(?:(?:(?:lossy|lossless)-)?page\d+-)?\d+px-/, '').replace(/\.((svg|pdf|xcf)\.png|png|jpe?g|gif|webp|tiff?)$/i,'');
    if (fs.existsSync('i/' + basename + '.webp')) continue;

    const size = Number(((img.match(/[\/\-](\d+)px-/)||[])[1]||220));
    const previous = map.get(basename);
    const stats = {
        count: (previous?.count || 0) + 1,
        infobox: previous?.infobox || images[img].i,
        size: previous?.size > size ? previous.size : size,
        url: previous?.size > size ? previous.url : 'https:' + img,
    };

    map.set(basename, stats);
}

for (const [key, value] of map.entries()) {
    if (fs.existsSync('i/' + key + '.webp')) continue;

    if (value.count + value.infobox <= 2) {
        map.delete(key);
        continue;
    }

    value.extension = value.url.match(/(\.[a-z]+)$/i)[1];

    if (value.size > 320) {
        value.url = value.url.replace(new RegExp(`([\/-])${value.size}(px-)`), `$1${320}$2`);
        value.size = 320;
    }
}

console.log('images to download:', map.size);

(async function () {
    let i = 0;
    for (const [key, value] of map.entries()) {

        const name = key.length < 250 ? key : key.slice(0,245) + value.extension;
        const savePath = 'images/' + name + value.extension;

        if (fs.existsSync(savePath)) continue;

        await download(value.url, savePath);
        console.log(++i, key);
        await new Promise(r => setTimeout(r, 300));
    }
})();
