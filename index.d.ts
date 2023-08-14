import { Blp1File } from "./src/blp";

declare const ImageType: {
    Tga: 0,
    Png: 1,
    Jpeg: 2,
};

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

/**
 * 缩放图像
 * @param buffer buffer rgba图片数据
 * @param width 图像宽度
 * @param height 图像高度
 * @param outWidth 新图片宽度
 * @param outHeight 新图片高度
 * @returns {Promise<ArrayBuffer>} 图像数据
 */
declare function resize(buffer: ArrayBufferLike, width: number, height: number, outWidth: number, outHeight: number): Promise<ArrayBuffer>

export { encode, decode, resize, Blp1File, ImageType };
