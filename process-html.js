const nodeHTMLParser = require('node-html-parser');
const fs = require('fs');
const JSZip = require('jszip');
const { hash } = require('./fnv-plus.js');

const files = fs.readdirSync('./html')
    .map(f => ({
        path: f,
        hash: hash(f.toLowerCase()).hex().slice(0,3),
    })).sort((a,b) => a.hash.localeCompare(b.hash));


const redirectsFull = JSON.parse(fs.readFileSync('index/redirects.json').toString());
const redirects = {};

for (const k in redirectsFull) {
    redirects[k] = redirectsFull[k].filter(o => o.d == undefined);
    if (!fs.existsSync('html/' + k)) {
        console.log('redirects.json is incosistent with filesystem contents!');
        console.log('following json key is not found on fs:', k);
        process.exit(1);
    }
}

const allTitles = new Set();
const allTitlesReverse = new Map();

const specialDecode = (s) => {
    return (s
        .replace(/%26/g, '&')
        .replace(/%2A/g, '*')
        .replace(/%2F/g, '/')
        .replace(/%3A/g, ':')
        .replace(/%3F/g, '?')
    );
};

const specialEncode = (s) => {
    return (s
        .replace(/\&/g, '%26')
        .replace(/\*/g, '%2A')
        .replace(/\//g, '%2F')
        .replace(/\:/g, '%3A')
        .replace(/\?/g, '%3F')
    );
};

const skip_dup = new Set();

Object.keys(redirects).forEach(k => {
    redirects[k].forEach(r => {
        if (!r.length) {
            return;
        }

        allTitles.add(r.toLowerCase());
        const t = specialEncode(r.toLowerCase());
        if (allTitlesReverse.has(t)) {
            const k2 = allTitlesReverse.get(t);
            if (k2 != k) {

                const r1 = JSON.stringify(redirects[k].sort().map(s => s.toLowerCase().trim()));
                const r2 = JSON.stringify(redirects[k2].sort().map(s => s.toLowerCase().trim()));

                if (r1 == r2) {

                    const first = redirects[k][0].trim();
                    const kt1 = k.replace(/\.html$/, '').trim();
                    const kt2 = k2.replace(/\.html$/, '').trim();

                    if (kt1 == first && kt2 != first) {
                        skip_dup.add(k2);
                    } else if (kt2 == first && kt1 != first) {
                        skip_dup.add(k);
                    } else if (kt1.indexOf(first) == 0 && kt2.indexOf(first) != 0) {
                        skip_dup.add(k2);
                    } else if (kt2.indexOf(first) == 0 && kt1.indexOf(first) != 0) {
                        skip_dup.add(k);
                    } else {
                        const i1 = redirects[k].map(s => s.toLowerCase()).indexOf(kt1.toLowerCase());
                        const i2 = redirects[k].map(s => s.toLowerCase()).indexOf(kt2.toLowerCase());
                        if (i1 == -1 && i2 == -1) {
                            if (kt1.length < kt2.length) {
                                skip_dup.add(k2);
                            } else {
                                skip_dup.add(k);
                            }
                        } else if (i1 > -1 && i2 == -1) {
                            skip_dup.add(k2);
                        } else if (i1 == -1 && i2 > -1) {
                            skip_dup.add(k);
                        } else if (i1 < i2) {
                            skip_dup.add(k2);
                        } else if (i1 > i2) {
                            skip_dup.add(k);
                        }
                    }
                }
            }
        }
        allTitlesReverse.set(t, k);
    });
});

for (const k in redirects) {
    const def = k.replace(/\.html$/, '').replace(/_/g, ' ');
    if (redirects[k].indexOf(def) == -1) {
        redirects[k].unshift(def);
    }
}

let timeSum = 1;
let count = 1;

const getimgsrc = (path) => {

    if (path.match(/^(Interactive_icon\.)/)) {
        return null;
    }

    const basename = path.length >= 250 ? path.slice(0, 245) : path.replace(/(\.[a-z]{3,4})?\.[a-z]{3,4}$/i, '');
    const mainanme = basename.replace(/^(((lossy|lossless)-)?page\d+-)?\d+px-/, '');

    const diskpath = 'i/' + specialEncode(mainanme) + '.webp';
    if (fs.existsSync(diskpath)) {
        return 'i/' + encodeURIComponent(specialEncode(mainanme)) + '.webp';
    }
    return null;
};

const closestImgParent = (e, debug) => {

    if (e.parentNode.tagName.toLowerCase() == 'figure') return e.parentNode;
    const closestFigure = e.closest('figure');
    if (closestFigure) return closestFigure;
    const tsingle = e.closest('.tsingle');
    if (tsingle) return tsingle;
    const gallerybox = e.closest('.gallerybox');
    if (gallerybox) return gallerybox;
    const thumbcaption = e.closest('.thumbcaption');
    if (thumbcaption) return thumbcaption;
    const closestCell = e.closest('.ib-settlement-cols-cell');
    if (closestCell) return closestCell;
    const mergedtoprow = e.closest('.mergedtoprow');
    if (mergedtoprow && mergedtoprow.querySelectorAll('img').length <= 1) return mergedtoprow;
    const ibfd = e.closest('.ibfd');
    if (ibfd && ibfd.querySelectorAll('img').length <= 1) return ibfd;

    if (e.parentNode.tagName.toLowerCase() == 'a') return e.parentNode;

    return e;
};

let dups = 0;

(async function () {

let zipFile;
let zipHash;
//let lastFile;

for (let i = 0; i < files.length; i++) {
    const f = files[i].path;
    const fHash = files[i].hash;

    if (!f.match(/\.html$/)) continue;

    if (skip_dup.has(f)) {
        delete redirects[f];
        dups++;
        continue;
    }

    const rem = ((files.length - i) * (timeSum / count) / 3600).toFixed(2);
    //console.log(`${f}, ${i + 1}/${files.length}, ETA ${rem}h`)

    const start = +new Date();

    lastFile = f;

    try {

        const t = fs.openSync('html/' + f, 'r');
        const html = fs.readFileSync(t);
        const doc = nodeHTMLParser.parse(html);

        fs.closeSync(t);

        const container = doc.querySelector('#pcs');
        if (!container) continue;

        container.querySelectorAll('*[style]').forEach(e => {
            const style = e.getAttribute('style');
            if (style?.length) {
                e.setAttribute('style', style.replace(/display: *none;?/, ''));
            }
        });

        container.querySelectorAll('[src]').forEach(e => {
            const src = e.getAttribute('src');
            const width = e.getAttribute('width');
            const height = e.getAttribute('height');
            const srclocal = getimgsrc(src.split('/').slice(-1)[0]);

            if (srclocal == null) {
                closestImgParent(e, 1).remove();
                return;
            }

            let width2 = width, height2 = height;
            if (width >= 640 && !src.match(/\.(svg|png)$/i)) {
                width2 = width / 2;
                height2 = height / 2;
            }

            const figure = e.closest('figure');
            if (figure && !figure.classList.contains('mw-halign-left') && !figure.classList.contains('mw-halign-right')) {
                figure.classList.add('har');
            }

            const target = e.parentNode.tagName == 'A' ? e.parentNode : e;
            target.replaceWith(`<img src="${srclocal}" width="${width2}" height="${height2}" />`);
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

            let width2 = width, height2 = height;
            if (width >= 640 && !src.match(/\.(svg|png)$/i)) {
                width2 = width / 2;
                height2 = height / 2;
            }

            const figure = e.closest('figure');
            if (figure
                && !figure.classList.contains('mw-halign-left')
                && !figure.classList.contains('mw-halign-right')
                && !figure.classList.contains('har')
                && !figure.classList.contains('hal')
            ) {
                figure.classList.add('har');
            }

            const target = e.parentNode.tagName == 'A' ? e.parentNode : e;
            target.replaceWith(`<img src="${srclocal}" width="${width2}" height="${height2}" />`);
        });

        const remove = [
            'link',
            'script',
            'noscript',
            'audio',
            'source',
            '.mwe-math-fallback-image-inline',
            '.pcs-edit-section-link-container',
            '.pcs-fold-hr',
            '.noprint',
            '.pcs-collapse-table-collapsed-container',
            '.pcs-collapse-table-collapsed-bottom',
            '.hatnote',
            '.ext-phonos-attribution',
            '.sistersitebox',
            '#pcs-edit-section-add-title-description',
            '.switcher-label',
            '.ambox',
        ];

        container.querySelectorAll(remove.join(',')).forEach(e => {
            e.remove();
        });

        container.querySelectorAll('div,span').forEach(e => {
            if (e.getAttribute('style')?.length > 60) return;

            if (e.childNodes.length == 0) {
                if (e.parentNode.childNodes.length == 1) {
                    e.parentNode.remove();
                } else {
                    e.remove();
                }
            }
        });

        container.querySelectorAll('.pcs-edit-section-title').forEach((e, i) => {
            //console.log(e.innerText.trim())
            if (i > 0 && e.innerText.trim().match(/^(See Also|Bibliography|Citations|General References|(Notes|References|Sources|Citations) and (notes|references|sources|citations|further reading)|External links|Explanatory notes|Fictional portrayals|Footnotes|Further reading|In (popular )?(culture|fiction|literature|media)( .+)?|Map gallery|Notes( and (citations|references))?|Philanthropy|Popular culture|References( in popular.+)?|Trivia|Twin towns|Sister cities|Twin towns – sister cities)$/i)) {
                e.closest('section')?.remove();
            }
        });

        const atts = [
            'data-mw-section-id',
            'about',
            //'style',
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
            'typeof',
            'data-mw',
            'data-description-source',
            'data-wikdata-entity-id',
            'id',
            'data-id',
        ];

        for (const a of atts) {
            container.querySelectorAll('[' + a + ']').forEach(e => {
                e.removeAttribute(a);
            });
        }

        container.querySelectorAll('[dir="ltr"]').forEach(e => {
            e.removeAttribute('dir');
        });

        const classes = {
            'category': null,
            'center-aligned': 'ca',
            'collapsible-block-js': null,
            'collapsible-block': null,
            'collapsible-heading': null,
            'flagicon': null,
            'floatleft': 'fl',
            'floatright': 'fr',
            'ib-settlement-caption-link': 'ibscl',
            'ib-settlement-cols-cell': 'ibscc',
            'ib-settlement-cols-row': 'ibscr',
            'ib-settlement-cols': 'ibsc',
            'ib-settlement-fn': 'ibsf',
            'ib-settlement-official': 'ibso',
            'ib-settlement-other-name': 'ibson',
            'ib-settlement': 'ibs',
            'image-lazy-loaded': null,
            'infobox-above': 'iba',
            'infobox-below': 'ibb',
            'infobox-caption': null,
            'infobox-data': 'ibd',
            'infobox-full-data': 'ibfd',
            'infobox-header': 'ibh',
            'infobox-image': 'ibi',
            'infobox-label': 'ibl',
            'infobox-subheader': 'ibsh',
            'infobox': 'ib',
            'left-aligned': 'la',
            'maptable': null,
            'mergedbottomrow': 'mtr',
            'mergedrow': null,
            'mergedtoprow': null,
            'mf-section-0': null,
            'mf-section-1': null,
            'mf-section-2': null,
            'mf-section-3': null,
            'mf-section-4': null,
            'mw-collapsible-content': null,
            'mw-collapsible': null,
            'mw-content-ltr': null,
            'mw-default-size': null,
            'mw-empty-elt': 'emp',
            'mw-file-description': null,
            'mw-file-element': null,
            'mw-halign-left': 'hal',
            'mw-halign-right': 'har',
            'mw-highlight': 'mwh',
            'mw-image-border': null,
            'mw-page-title-main': null,
            'navigation-not-searchable': null,
            'nickname': null,
            'noexcerpt': null,
            'nopopups': null,
            'notheme': null,
            'nowrap': 'nw',
            'nowraplinks': 'nwl',
            'open-block': null,
            'plainlist': 'pl',
            'pcs-collapse-table-container': null,
            'pcs-collapse-table-content': null,
            'pcs-collapse-table': 'ct',
            'pcs-edit-section-header': null,
            'pcs-edit-section-title': null,
            'pcs-header-inner-left': null,
            'pcs-header-inner-right': null,
            'pullquote': null,
            'quotebox': 'qb',
            'quotebox-title': 'qbt',
            'right-aligned': 'ra',
            'rt-commentedText': 'ct',
            'section-heading': 'sh',
            'wikitable': 'wt',
            'pcs-widen-image-ancestor': null,
            'mwe-math-mathml-inline': null,
            'mwe-math-mathml-a11y': null,
        };

        for (const c in classes) {
            container.querySelectorAll('.' + c).forEach(e => {
                e.classList.remove(c);
                if (classes[c]) {
                    e.classList.add(classes[c]);
                }
            });
        }

        container.querySelectorAll('.locmap,.thumb').forEach(e => {
            // .locmap is switchable location map; each entry has 1 bullet img and map image; if a map is missing, remove the corresponding switch case
            if (e.querySelectorAll('img').length <= 1) {
                e.remove();
            }
        });

        container.querySelectorAll('.switcher-container').forEach(e => {
            e.querySelectorAll('.locmap').forEach((f, i) => {
                if (i > 0) {
                    f.remove();
                }
            })
        })

        container.querySelectorAll('.pcs-edit-section-header,header,section').forEach(e => {
            e.replaceWith(e.innerHTML);
        });

        container.querySelectorAll('[class=""]').forEach(e => {
            e.removeAttribute('class');
        });

        container.querySelectorAll('a[href]').forEach(e => {
            const href = e.getAttribute('href').replace(/^\.\//, '').replace(/_/g, ' ');
            const title = specialEncode(href.replace(/#.*$/, '').toLowerCase()).replace(/\.html$/, '');

            //console.log(title);

            if (allTitles.has(title)) {
                //console.log(1)
                const hash = (href.match(/(#.+)$/) || [])[1] || '';
                const realHref = allTitlesReverse.get(title).replace(/\.html$/,'');
                e.setAttribute('href', realHref + hash);

            } else {
                let title2 = specialDecode(title);
                try {
                    title2 = decodeURIComponent(title);
                } catch (e) { }

                if (title2 && allTitles.has(title2)) {
                    //console.log(2)
                    const hash = (href.match(/(#.+)$/) || [])[1] || '';
                    const realHref = (allTitlesReverse.get(title2) ?? allTitlesReverse.get(specialEncode(title2))).replace(/\.html$/,'');
                    e.setAttribute('href', realHref + hash);

                } else {
                    /*const title3 = e.innerHTML.trim().toLowerCase();
                    if (allTitles.has(title3)) {
                        console.log(3, title3)
                        e.setAttribute('href', title3);
                    } else {*/
                        e.replaceWith(e.innerHTML);
                    //}
                }

            }
        });

        if (zipHash != fHash) {
            await createNewZip();
            zipHash = fHash;
            zipFile = new JSZip();
        }
        zipFile.file(f, container.innerHTML);

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

async function createNewZip() {
    if (zipFile) {
        console.log('creating ' + zipHash + '.zip');
        const compressed = await zipFile.generateAsync({
            type: "uint8array",
            compression: "DEFLATE",
            compressionOptions: {
                level: 9
            }
        });
        fs.writeFileSync('w/' + zipHash + '.zip', compressed);
    }
    return true;
}

createNewZip();

console.log('Skipped duplicates:', dups);

const search_index = fs.openSync('search-index.json', 'w');
fs.writeFileSync(search_index, '{\n');
const keys = Object.keys(redirects);
for (let i = 0; i < keys.length; i++) {
    const values = redirectsFull[keys[i]].map(s => s.replace ? s.replace(/_/g, ' ') : s);
    fs.writeFileSync(search_index, JSON.stringify({ [keys[i].replace(/\.html$/,'')]: values }).slice(1,-1) + (i < keys.length - 1 ? ',' : '') + '\n');
}
fs.writeFileSync(search_index, '\n}');
console.log('wrote redirects:', keys.length);

})();
