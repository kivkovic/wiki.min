const fs = require('fs');
const he = require('he');
const https = require('https');
const wiki = require('./wikipedia');


//const titles = ['Batman', 'American_comic_book'];
const list = fs.readFileSync('title-check').toString();
const titles =  list.split(/\n/g).filter(s => s.trim().length > 0);

let consecutiveErrors = 0;

(async () => {
    for (let j = 0; j < titles.length; j++) {
        try {

            const title = titles[j].replace(/\\"/g, '"').replace(/\&/g, '%26').replace(/\+/g, '%2B').replace(/\//g, '%2F');

            let desc = '';

            try {
                const page = await wiki.page(title);
                const summary = await page.summary();
                desc = summary.description;
            } catch (e) { }

            if (desc?.match(/(novel|book|poem|play|memoir|non-fiction)/i)) {
                console.log('(1)', titles[j], titles[j]);
                fs.appendFileSync('titles-checked', titles[j] + '\n');

            } else {

                const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${title} novel&limit=1&namespace=0&format=json`;
                const response = await new Promise((resolve) => {
                    let data = '';
                    https.get(url, res => {
                        res.on('data', chunk => { data += chunk })
                        res.on('end', () => resolve(data));
                    });
                });

                let realTitle = JSON.parse(response)[1][0];

                /*if (!realTitle) {
                    const url2 = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${title}&limit=1&namespace=0&format=json`;
                    const response2 = await new Promise((resolve) => {
                        let data = '';
                        https.get(url2, res => {
                            res.on('data', chunk => { data += chunk })
                            res.on('end', () => resolve(data));
                        });
                    });

                    realTitle = JSON.parse(response2)[1][0];
                }*/

                if (realTitle) {
                    console.log('(2)', titles[j], realTitle);
                    fs.appendFileSync('titles-checked', realTitle + '\n');
                } else {
                    console.log('(3)', titles[j], '*** not found ***');
                }
            }

            /*const url = title.replace(/\\"/g, '"').replace(/\&/g, '%26').replace(/\+/g, '%2B').replace(/\//g, '%2F');
            const page = await wiki.page(url);

            const summary = await page.summary();
            if (!summary.description.match(/novel|book/i)) {
                console.log(title, summary.description);
                //process.exit()
            }*/


        } catch (error) {
            console.log(error);
            //console.log('ERROR', title)
            consecutiveErrors++;
        }


        if (consecutiveErrors >= 1) {
            console.log('terminating...');
            process.exit(1);
        }

        await new Promise(r => setTimeout(r, 500));
    }
})();
