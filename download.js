const wiki = require('./wikipedia');
const fs = require('fs');
const nodeHTMLParser = require('node-html-parser');
const he = require('he');


const list = fs.readFileSync('articles_v3').toString();
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
        .replace(/\+/g, '%2B')
    );
};

if (!fs.existsSync('html/')) {
    fs.mkdirSync('html');
}

function decode(string) {
    return string.replace(/(%..)/g, (m0, m1) => {
        const d = he.decode(m1);
        try {
            return decodeURIComponent(d);
        } catch {
            return d;
        }
    })
}

(async () => {
    for (let j = 0; j < titles.length; j += 5) {
        const batch = titles.slice(j, j+5).filter(title => {
            const safetitle = specialEncode(decode(title)); //he.decode(title).replace(/<[^<>]+>/g,'').replace(/[\*\?\&\:<>|\/\\]/g, s => s == '*' ? '%2A' : encodeURIComponent(s));
            const exists = fs.existsSync('html/' + safetitle + '.html');
            return title && !exists;
        });

        if (!batch.length) continue;

        const rem = ((titles.length - j) / 5 * (timeSum / count) / 3600).toFixed(2);
        console.log(`${j+1}/${titles.length}, ETA ${rem}h`)
        const start = +new Date();

        await Promise.all(batch.map(async (title) => {

            try {
                const url = specialEncode(title).replace(/%/g, '%25');
                const page = await wiki.page(url);
                const html = await page.desktopHtml();

                const doc = nodeHTMLParser.parse(html);

                Array.from(doc.querySelectorAll('script,style,meta,link')).map(e => e.remove());

                const head = doc.querySelector('head');
                page.redirects.map(alttitle => {
                    head.insertAdjacentHTML('beforeend', `<meta redirect="${alttitle}" />`);
                });

                const fileTitle = specialEncode(doc.querySelector('title')
                    .innerText
                    .replace(/&lt;/gi,'<')
                    .replace(/&gt;/gi,'>')
                    .replace(/\&amp;/gi, '&')
                    .replace(/<(\/|%2f)?([a-z]+)[^<>]*>/gi, ''));

                fs.appendFileSync('html/' + fileTitle + '.html', doc.toString());

                consecutiveErrors = 0;

            } catch (error) {
                console.log(error);
                consecutiveErrors++;
                //process.exit(1)
                fs.appendFileSync('download-errors', title);
            }

            return 1;
        }));

        await new Promise(r => setTimeout(r, 500));

        const realEnd = +new Date();
        const fullDuration = (realEnd - start) / 1000;
        timeSum += fullDuration;
        count++;

        if (consecutiveErrors >= 10) {
            console.log('terminating after 10 errors');
            process.exit(1);
        }
    }
})();
