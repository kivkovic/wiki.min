const nodeHTMLParser = require('node-html-parser');
const fs = require('fs');

if (!fs.existsSync('index/')) {
    fs.mkdirSync('index/');
}

const stats_images = fs.openSync('index/images.json', 'w');
const stats_links = fs.openSync('index/links.json', 'w');
const stats_redirects = fs.openSync('index/redirects.json', 'w');

let timeSum = 1;
let count = 1;
const files = fs.readdirSync('./html');

const images_all = {};
const links_all = {};
const redirects = [];

let comma = false;

for (let i = 0; i < files.length; i++) {
    const f = files[i];

    if (!f.match(/\.html$/) || f == 'index.html') continue;
    const rem = ((files.length - i) * (timeSum / count) / 3600).toFixed(2);
    console.log(`${i+1}/${files.length}, ETA ${rem}h`);

    const start = +new Date();

    try {

        const t = fs.openSync('html/' + f, 'r');
        const html = fs.readFileSync(t);
        fs.closeSync(t);

        const doc = nodeHTMLParser.parse(html);

        const title = doc.querySelector('title').innerHTML.trim().replace(/\&lt;/g,'<').replace(/\&gt;/g,'>').replace(/<\/?i>/g,'');
        const redirects1 = Array.from(doc.querySelectorAll('meta[redirect]'))
            .map(e => e.getAttribute('redirect'))
            .filter(r => !r.match(/^(Category|Draft|Wikipedia talk|KanjiReference|Status|Talk|Template|User|Wikipedia|UN\/LOCODE|ISO 639|ISO 3166-1|ISO 15924):/i));

        const redirectsLC = redirects1.map(r => r.toLowerCase());
        const redirects2 = redirects1.filter((v,i,a) => redirectsLC.indexOf(v.toLowerCase()) == i);

        //const descElem = doc.querySelector('#pcs-edit-section-title-description');
        //const addDescElemt = doc.querySelector('#pcs-edit-section-add-title-description');
        //const description = addDescElemt && !descElem ? '' : descElem.innerText.trim();
        const description = doc.querySelector('.shortdescription')?.innerText;

        const list = JSON.stringify({ [f]: [title].concat(redirects2).concat(description ? {d:description} : []) }).slice(1,-1);
        redirects.push(list);

        if (!comma) comma = true;

        doc.querySelectorAll('[src],[data-src]').forEach((e,i) => {


            const src = e.getAttribute('src') || e.getAttribute('data-src');

            if (!src.match(/\.(png|jpe?g|gif|webp|svg)/i)) return;

            if (!images_all[src]) {
                images_all[src] = { c: 0, s: 0, i: 0 };
            }
            images_all[src].c++;
            images_all[src].s += Math.max(1, 10 - i);
            if (e.closest('.infobox')) {
                images_all[src].i++;
            }
        });

        doc.querySelectorAll('a[href]').forEach((e,i) => {
            const src = e.getAttribute('href').replace(/^\.\//,'').replace(/#.+$/,'');
            if (src.indexOf(':') != -1 || src.indexOf('/') != -1) return;

            if (!links_all[src]) {
                links_all[src] = { c: 0, s: 0, i: 0, n: 0 };
            }
            links_all[src].c++;
            if (!links_all[src].i && e.closest('.infobox')) {
                links_all[src].i++;
            }
            if (e.closest('.navbox')) {
                links_all[src].n++;
            }
            if (e.closest('section[data-mw-section-id="0"]')) {
                links_all[src].s++;
            }
        });

    } catch (e) {
        console.log(e);
        console.log(f);
    }

    const end = +new Date();
    const fullDuration = (end - start) / 1000;
    timeSum += fullDuration;
    count++;
}

fs.writeFileSync(stats_redirects, '{\n' + redirects.join(',\n') + '\n}\n');
fs.writeFileSync(stats_images, '{\n' + Object.keys(images_all).map(k => JSON.stringify({ [k]: images_all[k] }).slice(1,-1)).join(',\n') + '\n}');
fs.writeFileSync(stats_links, '{\n' + Object.keys(links_all).map(k => JSON.stringify({ [k]: links_all[k] }).slice(1,-1)).join(',\n') + '\n}');

fs.closeSync(stats_images);
fs.closeSync(stats_links);
fs.closeSync(stats_redirects);
