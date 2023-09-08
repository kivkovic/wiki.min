const fs = require('fs');
const https = require('https');

const imagesRaster = fs.readFileSync('index/images-raster').toString().split('\n').map(e => e.split('\t')).map(([u,s]) => ({ u, s }));
const imagesVector = fs.readFileSync('index/images-svg').toString().split('\n');

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

(async function () {
    let elapsed = 0;
    let skipped = 0;
    const delay = 500;

    for (let i = 0; i < imagesVector.length; i++) {
        const start = +new Date();

        const u = imagesVector[i].replace(/\/thumb\//, '/');
        let filename = u.split('/').slice(-1)[0];

        if (filename.length >= 255) {
            // IMPORTANT: max file name limit on os is 255, fix these paths in html manually later!
            filename = filename.slice(0,250) + filename.match(/\.[a-z]+$/i);
        }

        if (fs.existsSync('images/' + filename)) {
            skipped++;
            continue;
        }

        const url = 'https:' + u;
        await download(url, 'images/' + filename);

        const end = +new Date();
        console.log(filename, 'time:', end - start, 'ms')
        if (end - start < delay) {
            await new Promise(r => setTimeout(r, Math.max(200, Math.min(delay, delay - (end - start)))));
        }

        const fullEnd = +new Date();
        elapsed += (fullEnd - start) / 1000;

        if (i > 0) {
            const rem = (elapsed / (i - skipped)) * (imagesVector.length - i);
            console.log(`${i+1}/${imagesVector.length}`, 'ETA:', (rem / 3600).toFixed(2), 'h');
        } else {
            console.log(`${i+1}/${imagesVector.length}`);
        }
    }

    elapsed = 0;
    skipped = 0;

    for (let i = 0; i < imagesRaster.length; i++) {
        const start = +new Date();

        const img = imagesRaster[i];
        const filename = img.u.split('/').slice(-1)[0];
        let filenameFS = filename;

        if (filenameFS.length >= 255) {
            // IMPORTANT: max file name limit on os is 255, fix these paths in html manually later!
            filenameFS = filenameFS.slice(0,250) + filenameFS.match(/\.[a-z]+$/i);
        }

        if (fs.existsSync('images/' + filenameFS)) {
            skipped++;
            continue;
        }

        let path = img.u;
        if (path.match(/\/wikipedia\/(commons|[a-z]{2})\/[0-9a-f]\//)) {
            path = path.replace(/(\/wikipedia\/(?:commons|[a-z]{2})\/)/, '$1thumb/');
        }

        const size = img.s && img.s != 'null' ? img.s : 480;
        let url = 'https:' + path + '/' + (size) + 'px-' + filename;

        if (filename.match(/\.(tiff?|pdf)$/i)) {
            url += '.jpg';
        }

        if (path.match(/\/(lossy-)?page\d/)) { // some tiffs etc
            url = 'https:' + path;
        }

        //process.exit()
        //upload.wikimedia.org/wikipedia/commons/thumb/7/76/2-%D1%8F_%D0%B3%D0%B2%D0%B0%D1%80%D0%B4%D0%B5%D0%B9%D1%81%D0%BA%D0%B0%D1%8F_%D0%A2%D0%B0%D0%BC%D0%B0%D0%BD%D1%81%D0%BA%D0%B0%D1%8F_%D0%BC%D0%BE%D1%82%D0%BE%D1%81%D1%82%D1%80%D0%B5%D0%BB%D0%BA%D0%BE%D0%B2%D0%B0%D1%8F_%D0%B4%D0%B8%D0%B2%D0%B8%D0%B7%D0%B8%D1%8F.jpg/15px-2-%D1%8F_%D0%B3%D0%B2%D0%B0%D1%80%D0%B4%D0%B5%D0%B9%D1%81%D0%BA%D0%B0%D1%8F_%D0%A2%D0%B0%D0%BC%D0%B0%D0%BD%D1%81%D0%BA%D0%B0%D1%8F_%D0%BC%D0%BE%D1%82%D0%BE%D1%81%D1%82%D1%80%D0%B5%D0%BB%D0%BA%D0%BE%D0%B2%D0%B0%D1%8F_%D0%B4%D0%B8%D0%B2%D0%B8%D0%B7%D0%B8%D1%
        //upload.wikimedia.org/wikipedia/commons/thumb/7/76/2-%D1%8F_%D0%B3%D0%B2%D0%B0%D1%80%D0%B4%D0%B5%D0%B9%D1%81%D0%BA%D0%B0%D1%8F_%D0%A2%D0%B0%D0%BC%D0%B0%D0%BD%D1%81%D0%BA%D0%B0%D1%8F_%D0%BC%D0%BE%D1%82%D0%BE%D1%81%D1%82%D1%80%D0%B5%D0%BB%D0%BA%D0%BE%D0%B2%D0%B0%D1%8F_%D0%B4%D0%B8%D0%B2%D0%B8%D0%B7%D0%B8%D1%8F.jpg	15


        //const host = url.slice('https://'.length).split('/')[0];
        //const path = url.slice('https://'.length).split('/').slice(1).join('/')
        //await download(host, path, 'images/' + filename);
        await download(url, 'images/' + filenameFS);

        const end = +new Date();
        console.log(filename, 'time:', end - start, 'ms')
        if (end - start < delay) {
            await new Promise(r => setTimeout(r, Math.max(200, Math.min(delay, delay - (end - start)))));
        }

        const fullEnd = +new Date();
        elapsed += (fullEnd - start) / 1000;

        if (i > 0) {
            const rem = (elapsed / (i - skipped)) * (imagesRaster.length - i);
            console.log(`${i+1}/${imagesRaster.length}`, 'ETA:', (rem / 3600).toFixed(2), 'h');
        } else {
            console.log(`${i+1}/${imagesRaster.length}`);
        }
    }
})();