
const fs = require('fs');
const path = require('path');

const relativePath = process.argv[2] || 'client/public/assets/spr_tileset_sunnysideworld_16px.png';
const imgPath = path.join(__dirname, relativePath);

try {
    const fd = fs.openSync(imgPath, 'r');
    const buffer = Buffer.alloc(24);
    fs.readSync(fd, buffer, 0, 24, 0);
    fs.closeSync(fd);

    // PNG signature is 8 bytes
    // IHDR chunk starts at byte 8 (length 4 bytes), type 4 bytes (IHDR)
    // Width is at byte 16 (4 bytes big endian)
    // Height is at byte 20 (4 bytes big endian)

    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    console.log(`Image: ${path.basename(imgPath)}`);
    console.log(`Dimensions: ${width} x ${height}`);

} catch (err) {
    console.error("Error reading image:", err);
}
