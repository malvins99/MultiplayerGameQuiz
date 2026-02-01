
const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, 'client', 'public', 'assets', 'map_baru1_fix.tmj');

try {
    let content = fs.readFileSync(mapPath, 'utf8');

    // Define the tileset structure we want
    const newTilesets = `  "tilesets":[
         {
          "firstgid":1,
          "columns":64,
          "image":"spr_tileset_sunnysideworld_16px.png",
          "imageheight":1024,
          "imagewidth":1024,
          "margin":0,
          "name":"spr_tileset_sunnysideworld_16px",
          "spacing":0,
          "tilecount":4096,
          "tileheight":16,
          "tilewidth":16
         }, 
         {
          "firstgid":4097,
          "columns":20,
          "image":"spr_tileset_sunnysideworld_forest_32px.png",
          "imageheight":576,
          "imagewidth":320,
          "margin":0,
          "name":"spr_tileset_sunnysideworld_forest_32px",
          "spacing":0,
          "tilecount":720,
          "tileheight":16,
          "tilewidth":16
         }],`;

    // Regex to find the tilesets array block
    // Looking for "tilesets":[ ... ] at the end of the file
    // The original content has newlines and specific indentation

    // We will replace the whole tilesets block
    const regex = /"tilesets":\[\s*\{\s*"firstgid":1,\s*"source":"[^"]+"\s*\},\s*\{\s*"firstgid":4097,\s*"source":"[^"]+"\s*\}\],/s;

    if (regex.test(content)) {
        console.log("Found tilesets block via RegEx.");
        content = content.replace(regex, newTilesets);
        fs.writeFileSync(mapPath, content, 'utf8');
        console.log("Map fixed successfully!");
    } else {
        console.log("Could not match RegEx. printing snippet:");
        const start = content.indexOf('"tilesets":[');
        if (start !== -1) {
            console.log(content.substring(start, start + 300));
        } else {
            console.log("tilesets not found");
        }
    }

} catch (e) {
    console.error(e);
}
