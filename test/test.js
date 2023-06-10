const { ImageType, decode, encode } = require('../index');

const data = new Uint8Array(new Array(100 * 100 * 4).fill(0).map((_, i) => i % 255));

// encode(data.buffer, 100, 100, ImageType.Tga).then(encoded => {
//     require('fs').writeFileSync(__dirname + '/test.tga', Buffer.from(encoded));
// });
// encode(data.buffer, 100, 100, ImageType.Jpeg).then(encoded => {
//     require('fs').writeFileSync(__dirname + '/test.jpg', Buffer.from(encoded));
// });
// encode(data.buffer, 100, 100, ImageType.Png).then(encoded => {
//     require('fs').writeFileSync(__dirname + '/test.png', Buffer.from(encoded));
// });

decode(require('fs').readFileSync(__dirname + '/test.tga')).then(decoded => {
    console.log(decoded);
});