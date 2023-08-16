const fs = require('fs');
const { ImageType, resize, decode, encode } = require('../src/index');

const data = new Uint8Array(new Array(100 * 100 * 4).fill(0).map((_, i) => i % 255));
const image = {
    width: 100,
    height: 100,
    buffer: data.buffer,
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function main() {
    const tgaContent = await encode(image, ImageType.Tga);
    fs.writeFileSync(__dirname + '/test.tga', Buffer.from(tgaContent));
    const pngContent = await encode(image, ImageType.Png);
    fs.writeFileSync(__dirname + '/test.png', Buffer.from(pngContent));
    const jpegContent = await encode(image, ImageType.Jpeg, { quality: 80 });
    fs.writeFileSync(__dirname + '/test.jpg', Buffer.from(jpegContent));
    const blp1Content = await encode(image, ImageType.Blp1, { quality: 80 });
    fs.writeFileSync(__dirname + '/test.blp', Buffer.from(blp1Content));

    const originImage = await decode(fs.readFileSync(__dirname + '/00003-3043987025.jpeg'), ImageType.Jpeg);
    const resizeImage = await resize(originImage, originImage.width / 2, originImage.height / 2);
    const resizeImageContent = await encode(resizeImage, ImageType.Jpeg, { quality: 80 });
    fs.writeFileSync(__dirname + '/resize.jpg', Buffer.from(resizeImageContent));
    const resizeBlpContent = await encode(resizeImage, ImageType.Blp1, { quality: 80 });
    fs.writeFileSync(__dirname + '/resize.blp', Buffer.from(resizeBlpContent));

    const tagImage = await decode(fs.readFileSync(__dirname + '/test.tga'), ImageType.Tga);
    assert(tagImage.width === 100 && tagImage.height === 100 && tagImage.buffer.byteLength === 100 * 100 * 4, 'tga decode error');
    const pngImage = await decode(fs.readFileSync(__dirname + '/test.png'), ImageType.Png);
    assert(pngImage.width === 100 && pngImage.height === 100 && pngImage.buffer.byteLength === 100 * 100 * 4, 'png decode error');
    const jpegImage = await decode(fs.readFileSync(__dirname + '/test.jpg'), ImageType.Jpeg);
    assert(jpegImage.width === 100 && jpegImage.height === 100 && jpegImage.buffer.byteLength === 100 * 100 * 4, 'jpeg decode error');
    const blpImage = await decode(fs.readFileSync(__dirname + '/test.blp'), ImageType.Blp1);
    assert(blpImage.width === 100 && blpImage.height === 100 && blpImage.buffer.byteLength === 100 * 100 * 4, 'blp1 decode error');
    const blp1Image = await decode(fs.readFileSync(__dirname + '/HeroLevel-Border.blp'), ImageType.Blp1);
    assert(blp1Image.width === 64 && blp1Image.height === 64, 'blp1 decode error');
    const blp1AlphaImage = await decode(fs.readFileSync(__dirname + '/HumanUI-ReplayCover.blp'), ImageType.Blp1);
    assert(blp1AlphaImage.width === 512 && blp1AlphaImage.height === 512, 'blp1 decode error');
}

main();
