import { encodeJpeg, encodeImage, decodeJpeg, decodeImage, resizeImage } from "./api";
import { Blp1File } from "./blp";

export { Blp1File } from "./blp";

export const ImageType = {
    Tga: 0,
    Png: 1,
    Jpeg: 2,
    Blp1: 3,
} as const;

type valueOf<T> = T[keyof T];

export interface ImageRgba {
    /** 图像的宽度 */
    width: number;
    /** 图像的高度 */
    height: number;
    /** rgba 的图像数据 */
    buffer: ArrayBuffer;
}

export interface EncodeOption {
    /** 编译成jpeg 或者 blp1 的质量 最大100 最小1 */
    quality?: number; // 编译成jpeg 或者 blp1 的质量 最大100 最小1
    /** 编译成blp1的时候的mimap数量 */
    mimapCount?: number;
}

/**
 * 将rgba数据编码成指定图片类型的数据
 * @param {ImageRgba} image rgba图片数据
 * @param {number} type 图像类型 0 TGA 1 PNG 2 JPEG 3 BLP1
 * @param {EncodeOption} opt 可以设定编译到blp1和jpeg的图像质量 以及编译到blp1的mimap数量
 * @returns {Promise<ArrayBuffer>} 图像数据
 */
export function encode(image: ImageRgba, type: valueOf<typeof ImageType>, opt?: EncodeOption): Promise<ArrayBuffer> {
    if (type === ImageType.Blp1) {
        return Blp1File.encode(image).encode(opt?.quality, opt?.mimapCount);
    }

    return new Promise<ArrayBuffer>((resolve, reject) => {
        if (type === ImageType.Jpeg) {
            encodeJpeg(image.buffer, { width: image.width, height: image.height, quality: opt?.quality || 100 }, (err, encoded) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(encoded);
            });
        } else {
            encodeImage(image.buffer, { width: image.width, height: image.height, type }, (err, encoded) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(encoded);
            });
        }
    });
}

/**
 * 解码图像数据返回rgba的数据
 * @param {ArrayBuffer | Buffer} buffer 图像数据
 * @param {number} type 图像类型 0 TGA 1 PNG 2 JPEG 3 BLP1
 * @returns {Promise<ImageRgba>} rgba数据
 */
export function decode(buffer: ArrayBuffer | Buffer, type: valueOf<typeof ImageType>): Promise<ImageRgba> {
    const buf = buffer instanceof ArrayBuffer ? buffer : Uint8Array.from(buffer);
    if (type === ImageType.Blp1) {
        return Blp1File.decode(buf).getMimapData(0);
    }
    return new Promise((resolve, reject) => {
        if (type === ImageType.Jpeg) {
            decodeJpeg(buf, (err, decoded) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(decoded);
            });
        } else {
            decodeImage(buf, type, (err, decoded) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(decoded);
            });
        }
    });
}

/**
 * 缩放图像
 * @param image  rgba图片数据
 * @param outWidth 新图片宽度
 * @param outHeight 新图片高度
 * @returns {Promise<ImageRgba>} 图像数据
 */
export function resize(image: ImageRgba, outWidth: number, outHeight: number): Promise<ImageRgba> {
    return new Promise((resolve, reject) => {
        resizeImage(image.buffer, { width: image.width, height: image.height, outWidth, outHeight }, (err, encoded) => {
            if (err) {
                reject(err);
                return;
            }
            resolve({
                width: outWidth,
                height: outHeight,
                buffer: encoded,
            });
        });
    });
}
