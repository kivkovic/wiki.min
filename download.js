const wiki = require('./wikipedia');
//const { JSDOM } = require("jsdom");
const fs = require('fs');
const { title } = require('process');
const nodeHTMLParser = require('node-html-parser');
const he = require('he');

if (fs.existsSync('log')) {
    fs.appendFileSync('log', '\n\n' + (new Date().toISOString()) + '\n\n');
}
/*
if (fs.existsSync('stats/links')) {
    fs.appendFileSync('stats/links', '\n\n' + (new Date().toISOString()) + '\n\n');
}
if (fs.existsSync('stats/images')) {
    fs.appendFileSync('stats/images', '\n\n' + (new Date().toISOString()) + '\n\n');
}
if (fs.existsSync('stats/images-infobox')) {
    fs.appendFileSync('stats/images-infobox', '\n\n' + (new Date().toISOString()) + '\n\n');
}
*/

//const titles = ['Batman', 'American_comic_book'];
const list = fs.readFileSync('articles_v2').toString();
const titles =  list.split(/\n/g);

let timeSum = 1;
let count = 1;
let consecutiveErrors = 0;

(async () => {
    for (let j = 0; j < titles.length; j += 5) {
        const batch = titles.slice(j, j+5).filter(title => {
            const safetitle = he.decode(title).replace(/<[^<>]+>/g,'').replace(/[\*\?\&\:<>|\/\\]/g, s => s == '*' ? '%2A' : encodeURIComponent(s));
            const exists = fs.existsSync('html/' + safetitle + '.html');
            return title && !exists;
        });

        const rem = ((titles.length - j) * (timeSum / count) / 3600).toFixed(2);
        console.log(`${j+1}/${titles.length}, ETA ${rem}h`)

        await Promise.all(batch.map(async (title) => {

            try {
                const start = +new Date();
                const safetitle = he.decode(title).replace(/\\"/g, '"').replace(/<[^<>]+>/g,'').replace(/[\*\?\&\:<>|\/\\]/g, s => s == '*' ? '%2A' : encodeURIComponent(s));
                console.log(safetitle);

                /*const already = fs.existsSync('html/' + safetitle + '.html');
                const rem = ((titles.length - i) * (timeSum / count) / 3600).toFixed(2);
                console.log(title, '...', i+1, '/', titles.length, ',', rem, 'h,', already ? 'already exists' : 'downloading');
                if (already) continue;*/

                const url = title.replace(/\\"/g, '"').replace(/\&/g, '%26').replace(/\+/g, '%2B').replace(/\//g, '%2F');
                //console.log(url);
                const page = await wiki.page(url);

                //console.log(page);
                //process.exit(0);

                const html = await page.mobileHtml();

                //const dom = new JSDOM(html);
                //const doc = dom.window.document;

                const doc = nodeHTMLParser.parse(html);

                const discardableSections = /^(Bibliography|Citations|(Notes|References|Sources|Citations)_and_(notes|references|sources|citations)|External_links|Explanatory_notes|Fictional_portrayals|Footnotes|Further_reading|In_(popular_)?(culture|fiction|literature|media)(_.+)?|Map_gallery|Notes(_and(citations|references))?|Philanthropy|Popular_culture|References(_in_popular.+)?|Trivia|Twin_towns|Sister_cities|Twin_towns_–_sister_cities)$/i;
                const possibleDiscardableSections = /^(Sources|Other|Literature)$/;

                Array.from(doc.querySelectorAll('h2')).forEach((h2, i, a) => {
                    if ((h2.id || '').match(discardableSections) || ((h2.id || '').match(possibleDiscardableSections) && i >= a.length - 3)) {
                        const block = h2.closest('section');
                        if (block) {
                            block.remove();
                        }
                    }
                });

                Array.from(doc.querySelectorAll('sup.reference,script,style,meta,link')).map(e => e.remove());

                const head = doc.querySelector('head');
                page.redirects.map(alttitle => {
                    /*const meta = doc.createElement('meta');
                    meta.setAttribute('redirect', alttitle);
                    head.appendChild(meta);*/
                    head.insertAdjacentHTML('beforeend', `<meta redirect="${alttitle}" />`);
                });

                /*
                const t = doc.querySelector('title');
                //console.log(t.innerHTML);
                t.innerHTML = t.innerHTML.replace(/\&lt;/g,'<').replace(/\&gt;/g,'>').replace(/<[^<>]+>/g, '');
                //console.log(t.innerHTML);
                //process.exit(0)
                */

                Array.from(doc.querySelectorAll('section,div')).map(e => e.removeAttribute('style'));

                /*const links = new Set();
                Array.from(doc.querySelectorAll('a')).map(e => e.getAttribute('href')).filter(s => s).map(url => {
                    if (url.match(/^(\.?\/)?[^\/]+\/?$/) && url.indexOf(':') == -1) {
                        links.add(url.replace(/^(\.?\/)/, '').replace(/#.+$/, ''));
                    }
                });

                fs.appendFileSync('stats/links', Array.from(links).join('\n'));

                const images = new Set();
                Array.from(doc.querySelectorAll('img')).map(e => e.getAttribute('src')).map(url => {
                    images.add('https:' + url);
                });

                fs.appendFileSync('stats/images', Array.from(images).join('\n'));

                Array.from(doc.querySelectorAll('.infobox img')).map(e => e.getAttribute('src')).map(url => {
                    fs.appendFileSync('stats/images-infobox', 'https:' + url + '\n');
                });*/

                fs.appendFileSync('html/' + safetitle + '.html', doc.toString());

                const end = +new Date();
                if (end - start < 30) {
                    await new Promise(r => setTimeout(r, 30));
                }

                const realEnd = +new Date();
                const fullDuration = (realEnd - start) / 1000;
                timeSum += fullDuration;
                count++;

                fs.appendFileSync('log', title + '\t' + new Date() + '\n');
                consecutiveErrors = 0;

            } catch (error) {
                fs.appendFileSync('log', title + ' FAILED\n');
                console.log(error);
                consecutiveErrors++;
                process.exit(1)
            }

            return 1;
        }));

        if (consecutiveErrors >= 10) {
            console.log('terminating after 10 errors');
            process.exit(1);
        }

        //process.exit(0)
    }
})();
