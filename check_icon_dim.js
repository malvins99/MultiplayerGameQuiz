const fs = require('fs');
const path = require('path');

function getPngDimensions(filePath) {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(24);
    fs.readSync(fd, buffer, 0, 24, 0);
    fs.closeSync(fd);

    // Check PNG signature
    if (buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
        throw new Error('Not a valid PNG file');
    }

    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
}

const files = [
    'c:\\Legends of Learning (LoL)\\Pixel_Fable_free_icons\\png\\PF_icon_evasion.png',
    'c:\\Legends of Learning (LoL)\\Pixel_Fable_free_icons\\png\\PF_icon_sword.png'
];

files.forEach(f => {
    try {
        const dim = getPngDimensions(f);
        console.log(`${path.basename(f)}: ${dim.width}x${dim.height}`);
    } catch (e) {
        console.error(`Error reading ${f}: ${e.message}`);
    }
});
