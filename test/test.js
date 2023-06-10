const fs = require('fs');
const { ImageType, decode, encode } = require('../index');

const data = new Uint8Array(new Array(100 * 100 * 4).fill(0).map((_, i) => i % 255));

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function main() {
    const tgaContent = await encode(data.buffer, 100, 100, ImageType.Tga);
    fs.writeFileSync(__dirname + '/test.tga', Buffer.from(tgaContent));
    const pngContent = await encode(data.buffer, 100, 100, ImageType.Png);
    fs.writeFileSync(__dirname + '/test.png', Buffer.from(pngContent));
    const jpegContent = await encode(data.buffer, 100, 100, ImageType.Jpeg);
    fs.writeFileSync(__dirname + '/test.jpg', Buffer.from(jpegContent));

    const tagData = await decode(tgaContent, ImageType.Tga);
    assert(tagData.width === 100 && tagData.height === 100 && tagData.buffer.byteLength === 100 * 100 * 4, 'tga decode error');
    const pngData = await decode(pngContent, ImageType.Png);
    assert(pngData.width === 100 && pngData.height === 100 && pngData.buffer.byteLength === 100 * 100 * 4, 'png decode error');
    const jpegData = await decode(jpegContent, ImageType.Jpeg);
    assert(jpegData.width === 100 && jpegData.height === 100 && jpegData.buffer.byteLength === 100 * 100 * 4, 'jpeg decode error');
}

main();
