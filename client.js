function findMatches(source, string) {
    const matches = [];
    if (string.length <= 2) return matches;

    const safeString = string.trim().replace(/([\(\)\[\]\.\+\*\?\&\|\/\\])/gi, '\\$1');

    let r = new RegExp(safeString, 'gi');
    let m;
    let i = 0;
    let lastLineEnd = -1;

    while ((m = r.exec(source)) !== null && i < 1000) {
        if (m.index < lastLineEnd) continue;

        let lineStart = -1, lineEnd = -1;
        for (let j = m.index; j > m.index - 1000; j--) {
            if (source[j] == '\n') {
                lineStart = j + 1;
                break;
            }
        }
        for (let j = m.index; j < m.index + 1000; j++) {
            if (source[j] == '\n') {
                lineEnd = j - 1;
                break;
            }
        }
        if (lineStart != -1 && lineEnd != -1) {
            try {
                const line = source.slice(lineStart, lineEnd);
                const content = line.match(/^("[^[]+"):(\[.*\]),?\s*$/);
                const other_titles = JSON.parse(content[2]);
                const description = other_titles.slice(-1)[0].d;
                if (description != undefined) {
                    other_titles.splice(other_titles.length - 1, 1);
                }

                matches.push([
                    JSON.parse(content[1]), // file target
                    other_titles, // title matches
                    source[m.index - 1] == '"', // is match start of word
                    m.index - lineStart, // distance of match from line start
                    description || '',
                ]);
                lastLineEnd = lineEnd;

            } catch (e) {
                console.log('parsing error', e);
            }
        }
        i++;
    }

    const matchesTop = matches.sort((a, b) => {
        if (a[2] && !b[2]) return -1;
        if (!a[2] && b[2]) return 1;
        if (a[3] != b[3]) return a[3] - b[3];
        return a[1][0].length - b[1][0].length;
    }).slice(0,20);

    for (const match of matchesTop) {

        const titles = [match[0].replace(/\.html$/,'')].concat(match[1]).map(s => specialDecode(s.trim()).replace(/_/g, ' '));
        const titles_pruned = [];

        for (let i = 0; i < titles.length; i++) {
            let skip = false;
            for (let j = 0; j < i; j++) {
                if (levenshtein_dist(titles[i], titles[j]) < 5) {
                    skip = true;
                    break;
                }
            }
            if (!skip) {
                titles_pruned.push(titles[i]);
            }
        }
        match[1] = titles_pruned;
    }

    return matchesTop;
}

window.addEventListener('hashchange', () => {
    const title = window.location.hash.slice(1);
    if (title) return loadPage(title);
    document.querySelector('#content').innerHTML = '';
});

var loadedTitle;

function jumpToSection(name) {
    if (name) {
        const subtitles = Array.from(document.querySelectorAll('h1,h2,h3,h4'));
        for (const t of subtitles) {
            if (t.innerText.trim().toLowerCase() == name.toLowerCase()) {
                t.scrollIntoView();
                return false;
            }
        }
    }
    return false;
}

async function loadPage(linkInput, clearSearch = true) {

    const container = document.querySelector('#content');

    if (!linkInput) {
        window.location.hash = '';
        loadedTitle = '';
        container.innerHTML = '';
        return;
    }

    const parts = linkInput.match(/^(?:\.\/)?(.+?)(?:#(.+))?$/);
    const title = parts[1];
    const section = parts[2];

    if (loadedTitle == title) {
        return jumpToSection(section);
    }

    window.location.hash = title;
    loadedTitle = decodeURIComponent(title);

    container.innerHTML = '';

    const contentResponse = await fetch('./w-zip/' + specialEncode(decodeURIComponent(title)).replace(/%/g,'%25') + '.zip');
    const contentCompressed = await contentResponse.blob();

    const jszip = new JSZip();
    const contentUncompressed = await jszip.loadAsync(contentCompressed);
    const contentHTML = await contentUncompressed.files[Object.keys(contentUncompressed.files)[0]].async('string');
    container.innerHTML = contentHTML;
    document.querySelector('#search-results').innerHTML = '';

    setLinks(document.querySelectorAll('#content a'));

    try {
        document.title = document.querySelector('h1').innerText;
    } catch { }

    document.querySelector('#search').value = '';

    return false;
}

function setLinks(elements) {
    elements.forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            loadPage(e.target.getAttribute('href'));
            return false;
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const redirectsRequest = await fetch('./search-index.json');
    const redirects = await redirectsRequest.text();

    const title = window.location.hash.slice(1);
    if (title) {
        loadPage(title);
    } else {
        //loadPage('index');
        loadPage();
    }

    const searchResults = document.querySelector('#search-results');

    document.querySelector('#search').addEventListener('input', e => {
        const matches = findMatches(redirects, e.target.value);

        searchResults.innerHTML = '';
        for (const m of matches) {
            const a = document.createElement('a');
            a.innerHTML = `<b>${m[1][0]}</b> - ` + (m[4] || m[1].slice(1).slice(0,4).join(', '));
            a.setAttribute('href', '#');
            a.addEventListener('click', (e) => {
                e.preventDefault();
                loadPage(m[0]);
                return false;
            });
            searchResults.append(a);
        }
    });

    document.querySelector('#back-to-index').addEventListener('click', (e) => {
        document.querySelector('#content').innerHTML = '';
        document.title = 'Wikipedia';
    });

    setLinks(document.querySelectorAll('#index a'));
});

function levenshtein_dist(_a, _b, case_sensitive = false) {

    function _min(d0, d1, d2, bx, ay) {
        return d0 < d1 || d2 < d1
            ? d0 > d2
                ? d2 + 1
                : d0 + 1
            : bx === ay
                ? d1
                : d1 + 1;
    }

    let a = case_sensitive ? _a : _a.toLowerCase();
    let b = case_sensitive ? _b : _b.toLowerCase();

    if (a === b) {
        return 0;
    }

    if (a.length > b.length) {
        var tmp = a;
        a = b;
        b = tmp;
    }

    var la = a.length;
    var lb = b.length;

    while (la > 0 && (a.charCodeAt(la - 1) === b.charCodeAt(lb - 1))) {
        la--;
        lb--;
    }

    var offset = 0;

    while (offset < la && (a.charCodeAt(offset) === b.charCodeAt(offset))) {
        offset++;
    }

    la -= offset;
    lb -= offset;

    if (la === 0 || lb < 3) {
        return lb;
    }

    var x = 0;
    var y, d0, d1, d2, d3, dd, dy, ay, bx0, bx1, bx2, bx3;
    var vector = [];

    for (y = 0; y < la; y++) {
        vector.push(y + 1);
        vector.push(a.charCodeAt(offset + y));
    }

    var len = vector.length - 1;

    for (; x < lb - 3;) {
        bx0 = b.charCodeAt(offset + (d0 = x));
        bx1 = b.charCodeAt(offset + (d1 = x + 1));
        bx2 = b.charCodeAt(offset + (d2 = x + 2));
        bx3 = b.charCodeAt(offset + (d3 = x + 3));
        dd = (x += 4);
        for (y = 0; y < len; y += 2) {
            dy = vector[y];
            ay = vector[y + 1];
            d0 = _min(dy, d0, d1, bx0, ay);
            d1 = _min(d0, d1, d2, bx1, ay);
            d2 = _min(d1, d2, d3, bx2, ay);
            dd = _min(d2, d3, dd, bx3, ay);
            vector[y] = dd;
            d3 = d2;
            d2 = d1;
            d1 = d0;
            d0 = dy;
        }
    }

    for (; x < lb;) {
        bx0 = b.charCodeAt(offset + (d0 = x));
        dd = ++x;
        for (y = 0; y < len; y += 2) {
            dy = vector[y];
            vector[y] = dd = _min(dy, d0, dd, bx0, vector[y + 1]);
            d0 = dy;
        }
    }

    return dd;
}

function specialDecode(s) {
    return (s
        .replace(/%26/g, '&')
        .replace(/%2A/g, '*')
        .replace(/%2F/g, '/')
        .replace(/%3A/g, ':')
        .replace(/%3F/g, '?')
    );
};

function specialEncode(s) {
    return (s
        .replace(/\&/g, '%26')
        .replace(/\*/g, '%2A')
        .replace(/\//g, '%2F')
        .replace(/\:/g, '%3A')
        .replace(/\?/g, '%3F')
    );
};