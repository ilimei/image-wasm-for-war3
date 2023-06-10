const { encodeImage, decodeImage, ImageType, encodeJpeg, decodeJpeg } = require('./src/api');

/**
 * 将rgba数据编码成指定图片类型的数据
 * @param {ArrayBufferLike} buffer rgba图片数据
 * @param {number} width 图像宽度
 * @param {number} height 图像高度
 * @param {number} type 图像类型 0 TGA 1 PNG 2 JPEG
 * @param {number} quality 如果是jpeg 则需要设定图片质量
 * @returns {Promise<Uint8Array>} 图像数据
 */
function encode(buffer, width, height, type, quality = 100) {
    return new Promise((resolve, reject) => {
        if (type === ImageType.Jpeg) {
            encodeJpeg(buffer, { width, height, quality }, (err, encoded) => {
                if (err) {
                    reject(err);
                }
                resolve(encoded);
            });
        } else {
            encodeImage(buffer, { width, height, type }, (err, encoded) => {
                if (err) {
                    reject(err);
                }
                resolve(encoded);
            });
        }
    });
}

/**
 * 解码图像数据返回rgba的数据
 * @param {ArrayBufferLike} buffer 图像数据
 * @param {number} type 图像类型 0 TGA 1 PNG 2 JPEG
 * @returns {{width: number; height: number; data: Uint8Array}} rgba数据
 */
function decode(buffer, type) {
    return new Promise((resolve, reject) => {
        if (type === ImageType.Jpeg) {
            decodeJpeg(buffer, (err, decoded) => {
                if (err) {
                    reject(err);
                }
                resolve(decoded);
            });
        } else {
            decodeImage(buffer, type, (err, decoded) => {
                if (err) {
                    reject(err);
                }
                resolve(decoded);
            });
        }
    });
}

module.exports = {
    encode,
    decode,
    ImageType
}
