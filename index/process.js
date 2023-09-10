const fs = require('fs');
const he = require('he');

/*
const files = fs.readdirSync('./html').filter(f => f.match(/\.html$/i));
const redirects = JSON.parse(fs.readFileSync('index/redirects.json').toString());

for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (!redirects[f]) continue; //// temp
    const safename = he.decode(redirects[f][0]).replace(/<[^<>]+>/g,'').replace(/[\*\?\&\:<>|\/\\]/g, s => s == '*' ? '%2A' : encodeURIComponent(s));
    if (f == safename + '.html') continue;
    console.log(f, safename);
    fs.renameSync('html/' + f, 'html/' + safename + '.html');
}
*/


/*
// extract canonical article names

const redirects = JSON.parse(fs.readFileSync('index/redirects.json').toString());
const articlesCanonical = Object.values(redirects).map(e => e[0].replace(/<[^<>]+>/g,'')).filter((v,i,a) => a.indexOf(v) == i);

fs.writeFileSync('articlesCanonical', articlesCanonical.join('\n'));
*/

/*
// links sorter

const redirects = JSON.parse(fs.readFileSync('index/redirects.json').toString());
//const articles =  src.split(/\n/g).map(a => a.replace(/ /g, '_'));
const articles = [];
Object.keys(redirects).map(k => articles.push(...redirects[k]));
const articlesSet = new Set(articles);

const links = JSON.parse(fs.readFileSync('index/links.json'));

const list = Object.keys(links)
    //.filter(k => links[k].c >= 2 && articles.indexOf(k) == -1)
    .filter(k => links[k].c >= 2 && !articlesSet.has(k.replace(/_/g, ' ')))
    .sort((a,b) => links[b].s - links[a].s).map(k => ({ [k]: links[k] }));

fs.writeFileSync('index/links-sorted.json', list.map(e => JSON.stringify(e).slice(1,-1)).join(',\n') + '\n}');
*/

// image sorter

/*
const links = JSON.parse(fs.readFileSync('index/images.json'));

const list = Object.keys(links)
    //.filter(k => links[k].c >= 2 && articles.indexOf(k) == -1)
    .filter(k => links[k].c >= 2)
    .sort((a,b) => links[b].s - links[a].s).map(k => ({ [k]: links[k] }));

fs.writeFileSync('index/images-sorted.json', list.map(e => JSON.stringify(e).slice(1,-1)).join(',\n') + '\n}');
*/

const images = JSON.parse(fs.readFileSync('index/images.json'));
const imagesFlat = new Map();
for (const k in images) {

    let base = k.split('/').slice(0,-1).join('/');

    if (k.match(/\/(math\/render\/|osm-intl,)/)) continue;

    if (!base.match(/\.(jpe?g|png|gif|svg|tiff)/i)) {
        base = k;
    }

    if (!base.match(/\.(jpe?g|png|gif|svg|tiff)/i)) {
        console.log(k)
        //process.exit()
    }

    const size = Number((k.match(/\/(?:[a-z0-9\-]+-)?(\d+)px-[^\/]+$/)||[])[1]);

    /*if (k.match(/\.svg/) && size == 640) {
        console.log(k, size)
        process.exit()
    }*/

    if (!imagesFlat.has(base)) {
        const o = { ...images[k] };
        o.z = size || null;
        imagesFlat.set(base, o);
    } else {
        const prev = imagesFlat.get(base);
        let newsize = null;
        if (size) {
            if (prev.z) {
                newsize = prev.z < size ? size : prev.z;
            } else {
                newsize = size || null;
            }
        }

        imagesFlat.set(base, { c: prev.c + images[k].c, s: prev.s + images[k].s, i: prev.i || images[k].i ? 1 : 0, z: newsize });
    }
}

const imagesRaster = fs.openSync('index/images-raster', 'w');
const imagesSvg = fs.openSync('index/images-svg', 'w');

const imagesList = [];
for (const k of imagesFlat.keys()) {
    const e = imagesFlat.get(k);
    if (e.c >= 4 || (e.c >= 1 && e.i)) {
        imagesList.push(k);
        if (k.match(/\.svg$/i)) {
            fs.writeFileSync(imagesSvg, k + '\t' + e.z + '\n');
        } else {
            fs.writeFileSync(imagesRaster, k + '\t' + e.z + '\n');
        }
    }
}

fs.closeSync(imagesRaster);
fs.closeSync(imagesSvg);

console.log(imagesList.slice(0,10));
console.log(imagesList.length);
