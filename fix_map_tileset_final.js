
const fs = require('fs');
const path = require('path');

const mapFiles = ['map_baru1_tetap.tmj', 'map_baru2.tmj', 'map_baru3.tmj', 'map_newest_easy.tmj', 'map_easy_sementara.tmj', 'map_newest_easy_nomor1.tmj'];
const assetsDir = path.join(__dirname, 'client/public/assets');

// Image dimensions
const BG_WIDTH = 1024;
const BG_HEIGHT = 1024;
const FOREST_WIDTH = 320;
const FOREST_HEIGHT = 576;

mapFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${file}, not found.`);
        return;
    }

    try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const mapData = JSON.parse(rawData);

        console.log(`Patching ${file}...`);

        if (mapData.tilesets) {
            mapData.tilesets = mapData.tilesets.map(tileset => {
                // Fix Standard 16px Tileset
                if (tileset.name === 'spr_tileset_sunnysideworld_16px' || (tileset.image && tileset.image.includes('spr_tileset_sunnysideworld_16px.png'))) {
                    console.log(`  - Fixing standard tileset`);
                    return {
                        ...tileset,
                        name: "spr_tileset_sunnysideworld_16px",
                        image: "spr_tileset_sunnysideworld_16px.png",
                        imagewidth: BG_WIDTH,
                        imageheight: BG_HEIGHT,
                        tilewidth: 16,
                        tileheight: 16,
                        spacing: 0,
                        margin: 0,
                        tilecount: (BG_WIDTH / 16) * (BG_HEIGHT / 16),
                        columns: BG_WIDTH / 16
                    };
                }
                // Fix Forest Tileset
                if (tileset.name === 'spr_tileset_sunnysideworld_forest_32px' || (tileset.image && tileset.image.includes('spr_tileset_sunnysideworld_forest_32px.png'))) {
                    console.log(`  - Fixing forest tileset`);
                    return {
                        ...tileset,
                        name: "spr_tileset_sunnysideworld_forest_32px",
                        image: "spr_tileset_sunnysideworld_forest_32px.png",
                        imagewidth: FOREST_WIDTH,
                        imageheight: FOREST_HEIGHT,
                        tilewidth: 16, // Wait, tiled shows 16 for width/height in tileset data even for "32px" named tileset? Check!
                        tileheight: 16,
                        spacing: 0,
                        margin: 0,
                        tilecount: (FOREST_WIDTH / 16) * (FOREST_HEIGHT / 16),
                        columns: FOREST_WIDTH / 16
                    };
                }
                return tileset;
            });
        }

        fs.writeFileSync(filePath, JSON.stringify(mapData, null, 0));
        console.log(`  - Saved fixed ${file}`);

    } catch (err) {
        console.error(`Error processing ${file}:`, err);
    }
});
