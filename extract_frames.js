const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Frames to extract (1-indexed): 1, 6, 7, 8, 9, 10
// Convert to 0-indexed: 0, 5, 6, 7, 8, 9
const framesToExtract = [0, 5, 6, 7, 8, 9];
const frameWidth = 24;
const frameHeight = 24;

async function extractFrames(inputPath, outputPath) {
    const img = await loadImage(inputPath);
    const newWidth = framesToExtract.length * frameWidth;
    const canvas = createCanvas(newWidth, frameHeight);
    const ctx = canvas.getContext('2d');

    framesToExtract.forEach((frameIdx, newIdx) => {
        const srcX = frameIdx * frameWidth;
        const destX = newIdx * frameWidth;
        ctx.drawImage(img, srcX, 0, frameWidth, frameHeight, destX, 0, frameWidth, frameHeight);
    });

    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    await new Promise(resolve => out.on('finish', resolve));
    console.log(`Created: ${outputPath}`);
}

async function main() {
    const assetsDir = 'c:\\Legends of Learning (LoL)\\client\\public\\assets';

    await extractFrames(
        path.join(assetsDir, 'PF_icon_sword.png'),
        path.join(assetsDir, 'icon_sword_subset.png')
    );

    await extractFrames(
        path.join(assetsDir, 'PF_icon_evasion.png'),
        path.join(assetsDir, 'icon_evasion_subset.png')
    );
}

main().catch(console.error);
