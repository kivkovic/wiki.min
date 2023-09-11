//const lzma = require('lzma');
const JSZip = require("jszip");
const fs = require('fs');

(async function () {

    const files = fs.readdirSync('./w');
    for (const f of files) {
        console.log(f);

        var zip = new JSZip();
        zip.file(f, fs.readFileSync('w/' + f));
        const compressed = await zip.generateAsync({
            type: "uint8array",
            compression: "DEFLATE",
            compressionOptions: {
                level: 9
            }
        });
        fs.writeFileSync('w/' + f.replace(/\.html$/,'.zip'), compressed);
    }

})();