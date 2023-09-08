const nodeHTMLParser = require('node-html-parser');
const fs = require('fs');

const stats_images = fs.openSync('index/images.json', 'w');
const stats_links = fs.openSync('index/links.json', 'w');
const stats_redirects = fs.openSync('index/redirects.json', 'w');

fs.writeFileSync(stats_images, '{\n');
fs.writeFileSync(stats_links, '{\n');
fs.writeFileSync(stats_redirects, '{\n');

let timeSum = 1;
let count = 1;
const files = fs.readdirSync('./html');

const images_all = {};
const links_all = {};

for (let i = 0; i < files.length; i++) {
    const f = files[i];

    //if (i > 100) break;

    if (!f.match(/\.html$/)) continue;
    const rem = ((files.length - i) * (timeSum / count) / 3600).toFixed(2);
    console.log(`${f}, ${i+1}/${files.length}, ETA ${rem}h`)

    const start = +new Date();

    try {

        const t = fs.openSync('html/' + f, 'r');
        const html = fs.readFileSync(t);
        //const html = fs.readFileSync('html/' + f);

        //const dom = new JSDOM(html);
        //const doc = dom.window.document;
        const doc = nodeHTMLParser.parse(html);

        const title = doc.querySelector('title').innerHTML.trim().replace(/\&lt;/g,'<').replace(/\&gt;/g,'>').replace(/<\/?i>/g,'');
        const redirects = Array.from(doc.querySelectorAll('meta[redirect]')).map(e => e.getAttribute('redirect'));
        const list = JSON.stringify({ [f]: [title].concat(redirects) }).slice(1,-1);
        //const list = [title].concat(redirects).map(s => JSON.stringify({ [s]: f }).slice(1,-1))
        //fs.writeFileSync(stats_redirects, list.join(',\n') + '\n');
        fs.writeFileSync(stats_redirects, list + ',\n');

        //fs.writeFileSync(stats_redirects, JSON.stringify({ [title]: redirects }).slice(1,-1) + ',\n')
        //fs.appendFileSync('index/redirects', JSON.stringify({ [title]: redirects }) + '\n')
        //dom.window.close();

        doc.querySelectorAll('img').forEach((e,i) => {
            const src = e.getAttribute('src');
            if (!images_all[src]) {
                images_all[src] = { c: 0, s: 0, i: 0 };
            }
            images_all[src].c++;
            images_all[src].s += Math.max(1, 10 - i);
            if (!images_all[src].i && e.closest('.infobox')) {
                images_all[src].i = 1;
            }
        });

        doc.querySelectorAll('[data-src]').forEach((e,i) => {
            const src = e.getAttribute('data-src');
            if (!src.match(/\.(png|jpe?g|gif|webp|svg)/)) return;

            if (!images_all[src]) {
                images_all[src] = { c: 0, s: 0, i: 0 };
            }
            images_all[src].c++;
            images_all[src].s += Math.max(1, 10 - i);
            if (!images_all[src].i && e.closest('.infobox')) {
                images_all[src].i = 1;
            }
        });

        doc.querySelectorAll('a[href]').forEach((e,i) => {
            const src = e.getAttribute('href').replace(/^\.\//,'').replace(/#.+$/,'');
            if (src.indexOf(':') != -1 || src.indexOf('/') != -1) return;
            if (!links_all[src]) {
                links_all[src] = { c: 0, s: 0, i: 0 };
            }
            links_all[src].c++;
            links_all[src].s += 1;
            if (!links_all[src].i && e.closest('.infobox')) {
                links_all[src].i = 1;
            }
        });

        doc.querySelector('section').querySelectorAll('a[href]').forEach((e,i) => {
            const src = e.getAttribute('href').replace(/^\.\//,'').replace(/#.+$/,'');;
            if (src.indexOf(':') != -1 || src.indexOf('/') != -1) return;
            links_all[src].s += 10;
        });

        fs.closeSync(t);

    } catch (e) {
        console.log(e);
        console.log(f);
    }

    const end = +new Date();
    const fullDuration = (end - start) / 1000;
    timeSum += fullDuration;
    count++;
}

fs.writeFileSync(stats_redirects, '\n}');
fs.writeFileSync(stats_images, Object.keys(images_all).map(k => JSON.stringify({ [k]: images_all[k] }).slice(1,-1)).join(',\n') + '\n}');
fs.writeFileSync(stats_links, Object.keys(links_all).map(k => JSON.stringify({ [k]: links_all[k] }).slice(1,-1)).join(',\n') + '\n}');

fs.closeSync(stats_images);
fs.closeSync(stats_links);
fs.closeSync(stats_redirects);
