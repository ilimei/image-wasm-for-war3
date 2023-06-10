declare const ImageType = {
    Tga = 0,
    Png = 1,
    Jpeg = 2,
} as const

/**
 * 将rgba数据编码成指定图片类型的数据
 * @param {ArrayBufferLike} buffer rgba图片数据
 * @param {number} width 图像宽度
 * @param {number} height 图像高度
 * @param {number} type 图像类型 0 TGA 1 PNG 2 JPEG
 * @param {number} quality 如果是jpeg 则需要设定图片质量
 * @returns {Promise<ArrayBuffer>} 图像数据
 */
declare function encode(buffer: ArrayBufferLike, width: number, height: number, type: 0 | 1 | 2, quality?: number): Promise<ArrayBuffer>;
/**
 * 解码图像数据返回rgba的数据
 * @param {ArrayBufferLike} buffer 图像数据
 * @param {number} type 图像类型 0 TGA 1 PNG 2 JPEG
 * @returns {Promise<{width: number; height: number; buffer: ArrayBuffer}>} rgba数据
 */
declare function decode(buffer: ArrayBufferLike, type: 0 | 1 | 2): Promise<{ width: number; height: number; buffer: ArrayBuffer }>;

export { encode, decode, ImageType };
