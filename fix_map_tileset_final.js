
const fs = require('fs');
const path = require('path');

const mapFiles = ['map_baru1.tmj', 'map_baru2.tmj', 'map_baru3.tmj'];
const assetsDir = path.join(__dirname, 'client/public/assets');

// Correct dimensions from check_image_dim.js: 1024 x 1024
const IMG_WIDTH = 1024;
const IMG_HEIGHT = 1024;

mapFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${file}, not found.`);
        return;
    }

    try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const mapData = JSON.parse(rawData);

        console.log(`Paching ${file} with correct image dimensions...`);

        if (mapData.tilesets) {
            mapData.tilesets = mapData.tilesets.map(tileset => {
                // Check if this is our target tileset (either by name or has the specific image or has source)
                // We want to force fix if it has 'source' or if it matches our image
                if (tileset.source || (tileset.image && tileset.image.includes('spr_tileset_sunnysideworld_16px.png'))) {

                    console.log(`  - Fixing tileset ${tileset.name || 'unnamed'}`);

                    return {
                        firstgid: tileset.firstgid,
                        name: "spr_tileset_sunnysideworld_16px", // Force correct name
                        image: "spr_tileset_sunnysideworld_16px.png",
                        imagewidth: IMG_WIDTH,
                        imageheight: IMG_HEIGHT,
                        tilewidth: 16,
                        tileheight: 16,
                        spacing: 0,
                        margin: 0,
                        tilecount: (IMG_WIDTH / 16) * (IMG_HEIGHT / 16),
                        columns: IMG_WIDTH / 16
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
