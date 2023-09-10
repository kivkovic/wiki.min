const fs = require('fs');
const sizeOf = require('image-size')
const files = fs.readdirSync('./i').filter(f => f.match(/\.(png|jpe?g|webp|svg)$/i));

const imagesRaster = fs.readFileSync('index/images-raster').toString().split('\n').map(e => e.split('\t')).map(([u,s]) => ({ u, s }));
const imagesVector = fs.readFileSync('index/images-svg').toString().split('\n').filter(s => s).map(e => e.split('\t')).map(([u,s]) => ({ u, s }));
const existing = [...imagesRaster, ...imagesVector].map(i => ({
        u_o: i.u,
        u: i.u.split('/').slice(-1)[0].replace(/\?.+$/,'').replace(/\.(png|jpe?g|svg|webp)$/i, ''),
        s: Number(i.s),
    })
);

const outfile = fs.openSync('index/images-fix', 'w');

let i = 0;

for (const f of files) {
    const { width, height } = sizeOf('i/' + f);
    if (width <= 320) {
        const basename = f.replace(/\.(png|jpe?g|svg|webp)$/i, '');
        for (const e of existing) {
            if (e.u == basename && e.s > width) {
                fs.writeFileSync(outfile, e.u_o + '\t' + e.s + '\n');
                i++;
                break;
            }
        }
        //console.log(f);
        //i++;
    }
}

console.log(i);

fs.closeSync(outfile);
