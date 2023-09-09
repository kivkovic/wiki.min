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
//const files = fs.readdirSync('./html');
const files = ['Zadar.html'];

const getimgsrc = (path) => {
    const basename = path.length >= 250? path.slice(0,245) : path.replace(/(\.[a-z]{3,4})?\.[a-z]{3,4}$/i, '');
    const mainanme = basename.replace(/^(((lossy|lossless)-)?page\d+-)?\d+px-/, '');
    const finalpath = 'i/' + mainanme + '.webp';

    if (!fs.existsSync(finalpath)) {
        return null;
    }

    return encodeURIComponent(finalpath);
};

const closestImgParent = (e, debug) => {

    if (e.parentNode.tagName.toLowerCase() == 'figure') return e.parentNode;
    const closestFigure = e.closest('figure');
    if (closestFigure) return closestFigure;
    const closestCell = e.closest('.ib-settlement-cols-cell');
    if (closestCell) return closestCell;
    if (e.parentNode.tagName.toLowerCase() == 'a') return e.parentNode;

    return e;
};

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
            const srclocal = getimgsrc(src.split('/').slice(-1)[0]);

            if (srclocal == null) {
                e.remove();
                return;
            }

            e.innerHTML = `<img src="${srclocal}" width="${width}" height="${height}" />`
        });

        container.querySelectorAll('[data-src]').forEach(e => {
            const src = e.getAttribute('data-src');
            const width = e.getAttribute('data-width');
            const height = e.getAttribute('data-height');
            const srclocal = getimgsrc(src.split('/').slice(-1)[0]);

            if (srclocal == null) {
                closestImgParent(e, 1).remove();
                return;
            }

            e.replaceWith(`<img src="${srclocal}" width="${width}" height="${height}" />`);
        });

        container.querySelectorAll('link,script,noscript,source,.mwe-math-fallback-image-inline,.pcs-edit-section-link-container,.pcs-fold-hr,.noprint,.pcs-collapse-table-collapsed-container,.pcs-collapse-table-collapsed-bottom,.hatnote,.ext-phonos-attribution').forEach(e => {
            e.remove();
        });

        container.querySelectorAll('[src]').forEach(e => {
            if (!e.getAttribute('resource')) {
                // previously processed
                return;
            }
            const resource = e.getAttribute('resource').replace(/^\.\/File:/,'');
            const srclocal = getimgsrc(resource);

            if (srclocal == null) {
                closestImgParent(e, 2).remove();
                return;
            }

            e.setAttribute('src', srclocal);
            e.removeAttribute('resource');
        });

        const atts = [
            'data-mw-section-id',
            'about',
            'style',
            'title',
            'alt',
            'usemap',
            'alttext',
            'role',
            'note',
            'decoding',
            'data-file-width',
            'data-file-height',
            'data-file-type',
            'srcset',
        ];

        for (const a of atts) {
            container.querySelectorAll('['+a+']').forEach(e => {
                e.removeAttribute(a);
            });
        }

        container.querySelectorAll('[dir="ltr"]').forEach(e => {
            e.removeAttribute('dir');
        });

        const classes = {
            'collapsible-block-js': null,
            'collapsible-block': null,
            'collapsible-heading': null,
            'floatright': 'fr',
            'ib-settlement-caption-link': 'ibscl',
            'ib-settlement-cols-cell': 'ibscc',
            'ib-settlement-cols-row': 'ibscr',
            'image-lazy-loaded': null,
            'infobox-full-data': 'ibfd',
            'infobox-image': 'ibi',
            'infobox': 'ib',
            'maptable': 'mt',
            'mergedrow': 'mr',
            'mergedtoprow': 'mtr',
            'mf-section-0': null,
            'mf-section-1': null,
            'mf-section-2': null,
            'mf-section-3': null,
            'mf-section-4': null,
            'mw-default-size': 'ds',
            'mw-file-description': 'fd',
            'mw-halign-left': 'hal',
            'mw-halign-right': 'har',
            'mw-image-border': 'mib',
            'navigation-not-searchable': null,
            'open-block': null,
            'pullquote': 'pq',
            'quotebox': 'qb',
            'section-heading': 'sh',
            'mw-content-ltr': null,
            'mw-highlight': 'hl',
            'pcs-edit-section-header': null,
        };

        for (const c in classes) {
            container.querySelectorAll('.'+c).forEach(e => {
                e.classList.remove(c);
                if (classes[c]) {
                    e.classList.add(classes[c]);
                }
            });
        }

        container.querySelectorAll('.pcs-edit-section-header').forEach(e => {
            e.outerHTML = e.innerHTML;
        });

        container.querySelectorAll('.pcs-edit-section-title').forEach((e,i) => {
            if (i > 0 && e.innerText.trim().match(/^(See Also|Bibliography|Citations|(Notes|References|Sources|Citations)_and_(notes|references|sources|citations)|External_links|Explanatory_notes|Fictional_portrayals|Footnotes|Further_reading|In_(popular_)?(culture|fiction|literature|media)(_.+)?|Map_gallery|Notes(_and(citations|references))?|Philanthropy|Popular_culture|References(_in_popular.+)?|Trivia|Twin_towns|Sister_cities|Twin_towns_–_sister_cities)$/i)) {
                e.closest('section')?.remove();
            }
        });

        container.querySelectorAll('header,section').forEach(e => {
            e.replaceWith(e.innerHTML);
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
