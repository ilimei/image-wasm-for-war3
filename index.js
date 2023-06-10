const { encodeImage, ImageType } = require('./src/api');

const data = new Uint8Array(new Array(100 * 100 * 4).fill(0).map((_, i) => i % 255));

encodeImage(data.buffer, { width: 100, height: 100, type: ImageType.Tga }, (err, encoded) => {
    if (err) {
        console.error(err);
    }
    // console.info(new Uint8Array(encoded));
    // console.info(decodeJPEG(new Uint8Array(encoded)));
    require('fs').writeFileSync('test.tga', Buffer.from(encoded));
});

encodeImage(data.buffer, { width: 100, height: 100, type: ImageType.Png }, (err, encoded) => {
    if (err) {
        console.error(err);
    }
    // console.info(new Uint8Array(encoded));
    // console.info(decodeJPEG(new Uint8Array(encoded)));
    require('fs').writeFileSync('test.png', Buffer.from(encoded));
});
