const nodeHTMLParser = require('node-html-parser');
const fs = require('fs');

const allTitles = new Set();
const allTitlesReverse = new Map();
const redirects = JSON.parse(fs.readFileSync('index/redirects.json').toString());
Object.keys(redirects).forEach(k => {
    redirects[k].forEach(r => {
        allTitles.add(r.toLowerCase());
        allTitlesReverse.set(r.toLowerCase(), k);
    });
});

let timeSum = 1;
let count = 1;
const files = fs.readdirSync('./html');
//const files = ['Zadar.html'];

for (let i = 0; i < files.length; i++) {
    const f = files[i];
    //if (i > 1000) break;

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

        fs.closeSync(t);

        const container = doc.querySelector('#pcs');

        container.querySelectorAll('figure').forEach(e => {
            const src = e.querySelector('[data-src]')?.getAttribute('data-src');
            if (!src) {
                e.remove();
                return;
            }

            const width = e.querySelector('[data-width]').getAttribute('data-width');
            const height = e.querySelector('[data-height]').getAttribute('data-height');
            const srclocal = src.split('/').slice(-1)[0];
            e.innerHTML = `<img src="images/${srclocal}" width="${width}" height="${height}" />`
        });

        container.querySelectorAll('[data-src]').forEach(e => {
            const src = e.getAttribute('data-src');
            const width = e.getAttribute('data-width');
            const height = e.getAttribute('data-height');
            const srclocal = src.split('/').slice(-1)[0];
            e.replaceWith(`<img src="images/${srclocal}" width="${width}" height="${height}" />`);
        });

        container.querySelectorAll('source,.mwe-math-fallback-image-inline,.pcs-edit-section-link-container,.pcs-fold-hr,.noprint,.pcs-collapse-table-collapsed-container,.pcs-collapse-table-collapsed-bottom,.hatnote,.ext-phonos-attribution').forEach(e => {
            e.remove();
        });

        container.querySelectorAll('[src]').forEach(e => {
            if (!e.getAttribute('resource')) {
                // previously processed
                return;
            }
            const resource = e.getAttribute('resource').replace(/^\.\/File:/,'');
            e.setAttribute('src', 'images/' + resource);
            e.removeAttribute('resource');
        });

        container.querySelectorAll('*').forEach(e => {
            e.removeAttribute('data-mw-section-id');
            e.removeAttribute('about');
            e.removeAttribute('style');
            e.removeAttribute('title');
            e.removeAttribute('alt');
            e.removeAttribute('alttext');
            e.removeAttribute('role');
            e.removeAttribute('note');
            e.removeAttribute('decoding');
            e.removeAttribute('data-file-width');
            e.removeAttribute('data-file-height');
            e.removeAttribute('data-file-type');
            e.removeAttribute('srcset');
            e.classList.remove('navigation-not-searchable');
        });

        container.querySelectorAll('.pcs-edit-section-header').forEach(e => {
            e.outerHTML = e.innerHTML;
        });

        container.querySelectorAll('.pcs-edit-section-title').forEach((e,i) => {
            if (i > 0 && e.innerText.trim().match(/^(See Also|Bibliography|Citations|(Notes|References|Sources|Citations)_and_(notes|references|sources|citations)|External_links|Explanatory_notes|Fictional_portrayals|Footnotes|Further_reading|In_(popular_)?(culture|fiction|literature|media)(_.+)?|Map_gallery|Notes(_and(citations|references))?|Philanthropy|Popular_culture|References(_in_popular.+)?|Trivia|Twin_towns|Sister_cities|Twin_towns_–_sister_cities)$/i)) {
                e.closest('section')?.remove();
            }
        });

        container.querySelectorAll('header,section').forEach(e => {
            e.outerHTML = e.innerHTML;
        });

        container.querySelectorAll('a[href]').forEach(e => {
            const href = e.getAttribute('href').replace(/^\.\//, '').replace(/_/g, ' ');
            const title = href.replace(/#.*$/, '').toLowerCase();

            if (allTitles.has(title)) {
                const hash = (href.match(/(#.+)$/) || [])[1] || '';
                const realHref = allTitlesReverse.get(title); // already includes extension
                e.setAttribute('href', realHref + hash);
            } else { // guess fallback based on text
                const title2 = e.innerHTML.toLowerCase();
                if (allTitles.has(title2)) {
                    e.setAttribute('href', title2 + '.html');
                } else {
                    e.replaceWith(e.innerHTML);
                }
            }
        });

        const out = fs.openSync('w/' + f, 'w');
        fs.writeFileSync(out, container.innerHTML);
        fs.closeSync(out);

        //process.exit()

    } catch (e) {
        console.log(e);
        console.log(f);
        process.exit();
    }

    const end = +new Date();
    const fullDuration = (end - start) / 1000;
    timeSum += fullDuration;
    count++;
}
