function findMatches(source, string) {
    const matches = [];
    if (string.length <= 2) return matches;

    let r = new RegExp(string, 'gi');
    let m;
    let i = 0;
    let lastLineEnd = -1;

    while ((m = r.exec(source)) !== null && i < 100) {
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
                matches.push([
                    JSON.parse(content[1]), // file target
                    JSON.parse(content[2]), // title matches
                    source[m.index - 1] == '"', // is match start of word
                    m.index - lineStart // distance of match from line start
                ]);
                lastLineEnd = lineEnd;

            } catch (e) {
                console.log('parsing error', e);
            }
        }
        i++;
    }

    return matches.sort((a, b) => {
        if (a[2] && !b[2]) return -1;
        if (!a[2] && b[2]) return 1;
        if (a[3] != b[3]) return a[3] - b[3];
        return a[1][0].length - b[1][0].length;
    });
}

window.addEventListener('hashchange', () => {
    const title = window.location.hash.slice(1);
    if (title) return loadPage(title + '.html');
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

    const parts = linkInput.match(/^(.+)\.html(?:#(.+))?$/);
    const title = parts[1];
    const section = parts[2];

    if (loadedTitle == title) {
        return jumpToSection(section);
    }

    window.location.hash = title;
    loadedTitle = decodeURIComponent(title);

    const container = document.querySelector('#content');
    container.innerHTML = '';
    const contentResponse = await fetch('./w/' + title + '.html');
    const contentHTML = await contentResponse.text();
    container.innerHTML = contentHTML;
    document.querySelector('#search-results').innerHTML = '';

    document.querySelectorAll('#content a').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            loadPage(e.target.getAttribute('href'));
            return false;
        });
    });

    try {
        document.title = document.querySelector('h1').innerText;
    } catch { }

    return false;
}

document.addEventListener('DOMContentLoaded', async () => {
    const redirectsRequest = await fetch('./index/redirects.json');
    const redirects = await redirectsRequest.text();

    const title = window.location.hash.slice(1);
    if (title) {
        loadPage(title + '.html');
    }

    const searchResults = document.querySelector('#search-results');

    document.querySelector('#search').addEventListener('input', e => {
        const matches = findMatches(redirects, e.target.value);

        searchResults.innerHTML = '';
        for (const m of matches) {
            const a = document.createElement('a');
            m[1][0] = `<b>${m[1][0]}</b>`;
            a.innerHTML = m[1].join(', ');
            a.setAttribute('href', '#');
            a.addEventListener('click', (e) => {
                e.preventDefault();
                loadPage(m[0]);
                return false;
            });
            searchResults.append(a);
        }
    });
});
