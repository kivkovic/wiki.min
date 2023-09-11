const wiki = require('./wikipedia');
const fs = require('fs');
const nodeHTMLParser = require('node-html-parser');
const he = require('he');


const list = fs.readFileSync('articles_v2').toString();
const titles =  list.split(/\n/g).filter(s => s.trim().length > 0);

let timeSum = 1;
let count = 1;
let consecutiveErrors = 0;

const specialEncode = (s) => {
    return (s
        .replace(/\&/g, '%26')
        .replace(/\*/g, '%2A')
        .replace(/\//g, '%2F')
        .replace(/\:/g, '%3A')
        .replace(/\?/g, '%3F')
        .replace(/"/g, '%22')
        .replace(/</g, '%3C')
        .replace(/>/g, '%3E')
    );
};

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

                const url = title.replace(/\\"/g, '"').replace(/\&/g, '%26').replace(/\+/g, '%2B').replace(/\//g, '%2F');

                const page = await wiki.page(url);
                const html = await page.mobileHtml();
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
                    head.insertAdjacentHTML('beforeend', `<meta redirect="${alttitle}" />`);
                });

                const fileTitle = specialEncode(doc.querySelector('title')
                    .innerText
                    .replace(/&lt;/g,'<')
                    .replace(/&gt;/g,'>')
                    .replace(/\&amp;/g, '&')
                    .replace(/<\/?([a-z]+)[^<>]*>/g, ''));

                fs.appendFileSync('html/' + fileTitle + '.html', doc.toString());

                const end = +new Date();
                if (end - start < 30) {
                    await new Promise(r => setTimeout(r, 30));
                }

                const realEnd = +new Date();
                const fullDuration = (realEnd - start) / 1000;
                timeSum += fullDuration;
                count++;

                consecutiveErrors = 0;

            } catch (error) {
                console.log(error);
                consecutiveErrors++;
            }

            return 1;
        }));

        if (consecutiveErrors >= 10) {
            console.log('terminating after 10 errors');
            process.exit(1);
        }
    }
})();
