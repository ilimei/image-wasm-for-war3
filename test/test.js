const fs = require('fs');
const { ImageType, resize, decode, encode, Blp1File } = require('../index');

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

    const resizeImage = await decode(fs.readFileSync(__dirname + '/00003-3043987025.jpeg'), ImageType.Jpeg);
    // const originPngContent = await encode(resizeImage.buffer, resizeImage.width, resizeImage.height, ImageType.Png);
    // fs.writeFileSync(__dirname + '/origin.png', Buffer.from(originPngContent));
    // const smallIamge = await resize(resizeImage.buffer, resizeImage.width, resizeImage.height, resizeImage.width / 2, resizeImage.height / 2);
    // const smallPngContent = await encode(smallIamge, resizeImage.width / 2, resizeImage.height / 2, ImageType.Png);
    // fs.writeFileSync(__dirname + '/small.png', Buffer.from(smallPngContent));
    // const smallContent = await encode(smallIamge, resizeImage.width / 2, resizeImage.height / 2, ImageType.Jpeg);
    // fs.writeFileSync(__dirname + '/small.jpg', Buffer.from(smallContent));
    const blpContent = await Blp1File.encode(resizeImage).encode();
    fs.writeFileSync(__dirname + '/test.blp', Buffer.from(blpContent));

    const blp2Jpeg = await Blp1File.decode(fs.readFileSync(__dirname + '/shibaidi.blp').buffer).getMimapData(0);
    const blp2JpegContent = await encode(blp2Jpeg.buffer, blp2Jpeg.width, blp2Jpeg.height, ImageType.Png);
    fs.writeFileSync(__dirname + '/shibaidi.png', Buffer.from(blp2JpegContent));

    const tagData = await decode(tgaContent, ImageType.Tga);
    assert(tagData.width === 100 && tagData.height === 100 && tagData.buffer.byteLength === 100 * 100 * 4, 'tga decode error');
    const pngData = await decode(pngContent, ImageType.Png);
    assert(pngData.width === 100 && pngData.height === 100 && pngData.buffer.byteLength === 100 * 100 * 4, 'png decode error');
    const jpegData = await decode(jpegContent, ImageType.Jpeg);
    assert(jpegData.width === 100 && jpegData.height === 100 && jpegData.buffer.byteLength === 100 * 100 * 4, 'jpeg decode error');
}

main();
