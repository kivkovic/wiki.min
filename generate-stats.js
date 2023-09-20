const nodeHTMLParser = require('node-html-parser');
const fs = require('fs/promises');

let timeSum = 1;
let count = 1;

const images_all = {};
const links_all = {};
const redirects = [];

(async function () {

const files = await fs.readdir('./html');

const stats_images = await fs.open('index/images.json', 'w');
const stats_links = await fs.open('index/links.json', 'w');
const stats_redirects = await fs.open('index/redirects.json', 'w');

try {
    await fs.access('index/')
} catch {
    await fs.mkdir('index/');
}

for (let i = 0; i < files.length; i += 10) {

    const start = +new Date();

    await Promise.all([
        process(files[i + 0]),
        process(files[i + 1]),
        process(files[i + 2]),
        process(files[i + 3]),
        process(files[i + 4]),
        process(files[i + 5]),
        process(files[i + 6]),
        process(files[i + 7]),
        process(files[i + 8]),
        process(files[i + 9]),
    ]);

    const end = +new Date();
    const fullDuration = (end - start) / 1000;
    timeSum += fullDuration;
    count++;

    const rem = ((files.length - i) / 10 * (timeSum / count) / 3600).toFixed(2);
    console.log(`${i+1}/${files.length}, ETA ${rem}h`);
}

await fs.writeFile(stats_redirects, '{\n' + redirects.join(',\n') + '\n}\n');
await fs.writeFile(stats_images, '{\n' + Object.keys(images_all).map(k => JSON.stringify({ [k]: images_all[k] }).slice(1,-1)).join(',\n') + '\n}');
await fs.writeFile(stats_links, '{\n' + Object.keys(links_all).map(k => JSON.stringify({ [k]: links_all[k] }).slice(1,-1)).join(',\n') + '\n}');

await stats_images.close();
await stats_links.close();
await stats_redirects.close();

})();

async function process(f) {

    if (f == null || !f.match(/\.html$/) || f == 'index.html') {
        return false;
    }

    try {
        //const t = fs.openSync('html/' + f, 'r');
        //const html = fs.readFileSync(t);
        //fs.closeSync(t);

        const html = await fs.readFile('html/' + f, { encoding: 'utf-8' });

        const doc = nodeHTMLParser.parse(html);

        const title = doc.querySelector('title').innerHTML.trim().replace(/\&lt;/g,'<').replace(/\&gt;/g,'>').replace(/<\/?i>/g,'');
        const redirects1 = Array.from(doc.querySelectorAll('meta[redirect]'))
            .map(e => e.getAttribute('redirect'))
            .filter(r => !r.match(/^(Category|Draft|Wikipedia talk|KanjiReference|Status|Talk|Template|User|Wikipedia|UN\/LOCODE|ISO 639|ISO 3166-1|ISO 15924):/i));

        const redirectsLC = redirects1.map(r => r.toLowerCase());
        const redirects2 = redirects1.filter((v,i,a) => redirectsLC.indexOf(v.toLowerCase()) == i);

        const description = doc.querySelector('.shortdescription')?.innerText;

        const list = JSON.stringify({ [f]: [title].concat(redirects2).concat(description ? {d:description} : []) }).slice(1,-1);
        redirects.push(list);

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

    return true;
}