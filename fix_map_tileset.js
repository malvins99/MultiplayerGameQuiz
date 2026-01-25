
const fs = require('fs');
const path = require('path');

const mapFiles = ['map_baru1.tmj', 'map_baru2.tmj', 'map_baru3.tmj'];
const assetsDir = path.join(__dirname, 'client/public/assets');

mapFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${file}, not found.`);
        return;
    }

    try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const mapData = JSON.parse(rawData);

        console.log(`Processing ${file}...`);

        if (mapData.tilesets) {
            mapData.tilesets = mapData.tilesets.map(tileset => {
                if (tileset.source) {
                    console.log(`  - Fixing external tileset: ${tileset.source}`);

                    // Determine image based on source name (simplistic logic)
                    // If source is "spr_tileset_sunnysideworld_16px.tsx", ignore extension
                    // We assume the image is just the png version.

                    const sourceName = path.basename(tileset.source, path.extname(tileset.source));

                    // Construct embedded tileset
                    // Preserving firstgid is CRITICAL
                    return {
                        firstgid: tileset.firstgid,
                        name: sourceName,
                        tilewidth: 16,
                        tileheight: 16,
                        spacing: 0,
                        margin: 0,
                        image: "spr_tileset_sunnysideworld_16px.png", // Hardcoded based on user asset
                        imagewidth: 512, // Approximation, Phaser usually ignores if not strict
                        imageheight: 512, // Approximation
                        // We assume standard 16x16
                    };
                }
                return tileset;
            });
        }

        fs.writeFileSync(filePath, JSON.stringify(mapData, null, 0)); // Minified write back
        console.log(`  - Saved fixed ${file}`);

    } catch (err) {
        console.error(`Error processing ${file}:`, err);
    }
});
