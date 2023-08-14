import { createStruct, StringField, UInt32Field } from './struct';
import { decodeJpeg, encodeJpeg, resizeImage } from './api';

const BlpHeader = createStruct({
    magic: { type: StringField.create(4), isArray: false },
    compression: { type: UInt32Field.create(), isArray: false },
    alphaBits: { type: UInt32Field.create(), isArray: false },
    width: { type: UInt32Field.create(), isArray: false },
    height: { type: UInt32Field.create(), isArray: false },
    flags: { type: UInt32Field.create(), isArray: false },
    hasMipmaps: { type: UInt32Field.create(), isArray: false },
    mipmapOffsets: { type: UInt32Field.create(), isArray: true, arrayLength: 16 },
    mipmapSizes: { type: UInt32Field.create(), isArray: true, arrayLength: 16 },
} as const);

const MAX_NR_OF_BLP_MIP_MAPS = 16;

function swapRedBlue(image: {
    width: number;
    height: number;
    buffer: ArrayBuffer;
}, copy = false) {
    let ret = image;
    if(copy) {
        ret = {
            width: image.width,
            height: image.height,
            buffer: image.buffer.slice(0)
        };
    }
    const view = new DataView(ret.buffer);
    const pixelCount = ret.width * ret.height;
    for (let i = 0; i < pixelCount; i++) {
        const offset = i * 4;
        const r = view.getUint8(offset);
        const b = view.getUint8(offset + 2);
        view.setUint8(offset, b);
        view.setUint8(offset + 2, r);
    }
    return ret;
}

export class Blp1Reader {
    blpHeader = new BlpHeader();
    view: DataView;
    buffer: ArrayBufferLike;

    headerValue: {
        magic: string;
        compression: number; // 1: jpeg, 2: uncompressed, 3: DXTC
        alphaBits: number; //  alpha通道位数
        width: number;
        height: number;
        flags: number; // 默认是4 具体意义不明
        hasMipmaps: number; // 是否有mipmap
        mipmapOffsets: number[];
        mipmapSizes: number[];
    };
    mipmapsCount: number;
    jpegHeader?: {
        size: number;
        header: Uint8Array;
    };

    constructor(buffer: ArrayBufferLike) {
        this.buffer = buffer;
        const view = new DataView(buffer);
        const header = this.blpHeader.read(view, 0);
        this.view = view;
        this.headerValue = header;
        this.mipmapsCount = this.headerValue.mipmapOffsets.findIndex((offset) => offset === 0);
        // jpeg
        if (header.compression === 0) {
            const jpegHeaderSize = view.getUint32(this.blpHeader.size, true);
            const jpegHeader = new Uint8Array(buffer, this.blpHeader.size + 4, jpegHeaderSize);
            this.jpegHeader = {
                size: jpegHeaderSize,
                header: jpegHeader,
            };
        }
    }

    get width() {
        return this.headerValue.width;
    }

    get height() {
        return this.headerValue.height;
    }

    get hasMipmaps() {
        return this.headerValue.hasMipmaps;
    }

    getMimapData(index: number = 0): Promise<{
        width: number;
        height: number;
        buffer: ArrayBuffer;
    }> {
        if (index >= this.mipmapsCount) {
            throw new Error(`index [${index}] out of range ${this.mipmapsCount}`);
        }
        const offset = this.headerValue.mipmapOffsets[index];
        const buffer = this.buffer.slice(offset, offset + this.headerValue.mipmapSizes[index]);
        const scale = Math.pow(2, index);
        const width = this.width / scale;
        const height = this.height / scale;

        if (this.jpegHeader) {
            const jpeg = new Uint8Array(this.jpegHeader.size + buffer.byteLength);
            jpeg.set(this.jpegHeader.header);
            jpeg.set(new Uint8Array(buffer), this.jpegHeader.size);
            return new Promise((resolve, reject) => {
                decodeJpeg(jpeg.buffer, (err, decoded) => {
                    if (err) {
                        reject(err);
                    }
                    swapRedBlue(decoded);
                    resolve(decoded);
                });
            })
        }

        // bgra
        const palette = new Uint8Array(this.buffer, this.blpHeader.size, 256 * 4); // 调色板
        const size = width * height;
        const sourcePixels = new Uint8Array(buffer, 0, size); // 原始像素
        const out = new Uint8Array(size * 4);
        const alpha = new Uint8Array(buffer, size); // alpha通道
        switch (this.headerValue.alphaBits) {
            case 0:
                // 无alpha通道
                for (let i = 0; i < size; i++) {
                    out[i * 4] = palette[sourcePixels[i] * 4 + 2];
                    out[i * 4 + 1] = palette[sourcePixels[i] * 4 + 1];
                    out[i * 4 + 2] = palette[sourcePixels[i] * 4];
                    out[i * 4 + 3] = 255;
                }
                break;
            case 1:
                // 1位alpha通道
                for (let i = 0; i < size; i++) {
                    out[i * 4] = palette[sourcePixels[i] * 4 + 2];
                    out[i * 4 + 1] = palette[sourcePixels[i] * 4 + 1];
                    out[i * 4 + 2] = palette[sourcePixels[i] * 4];
                    out[i * 4 + 3] = (alpha[i >> 3] & (1 << (i & 7))) ? 1 : 0;
                }
                break;
            case 4:
                // 4位alpha通道
                for (let i = 0; i < size; i++) {
                    out[i * 4] = palette[sourcePixels[i] * 4 + 2];
                    out[i * 4 + 1] = palette[sourcePixels[i] * 4 + 1];
                    out[i * 4 + 2] = palette[sourcePixels[i] * 4];
                    switch (i & 1) {
                        case 0: out[i * 4 + 3] = alpha[i >> 1] & 0x0F; break;
                        case 1: out[i * 4 + 3] = (alpha[i >> 1] & 0xF0) >> 4; break;
                    }
                }
                break;
            case 8:
                // 8位alpha通道
                for (let i = 0; i < size; i++) {
                    out[i * 4] = palette[sourcePixels[i] * 4 + 2];
                    out[i * 4 + 1] = palette[sourcePixels[i] * 4 + 1];
                    out[i * 4 + 2] = palette[sourcePixels[i] * 4];
                    out[i * 4 + 3] = alpha[i];
                }
                break;
        }

        return Promise.resolve({
            width,
            height,
            buffer: out.buffer,
        });
    }
}

export class Blp1Encoder {
    blpHeader = new BlpHeader();
    headerValue = {
        magic: 'BLP1',
        compression: 0, // 0: jpeg, 1: uncompressed, 3: DXTC
        alphaBits: 8, //  alpha通道位数
        width: 256,
        height: 256,
        flags: 4, // 默认是4 具体意义不明
        hasMipmaps: 1, // 是否有mipmap
        mipmapOffsets: new Array(16).fill(0),
        mipmapSizes: new Array(16).fill(0),
    };
    mipMapsCount: number;
    image: {
        width: number,
        height: number,
        buffer: ArrayBuffer,
    };

    constructor(image: {
        width: number,
        height: number,
        buffer: ArrayBuffer,
    }) {
        this.image = swapRedBlue(image, true);
        this.headerValue.width = image.width;
        this.headerValue.height = image.height;

        let NrOfMipMaps = 0;
        let Size = Math.max(this.image.width, this.image.height);
        while (Size >= 1) {
            Size = Math.floor(Size / 2);
            NrOfMipMaps++;
        }
        if (NrOfMipMaps > MAX_NR_OF_BLP_MIP_MAPS) {
            NrOfMipMaps = MAX_NR_OF_BLP_MIP_MAPS;
        }
        if (NrOfMipMaps < 1) {
            throw new Error('width or height is too small');
        }

        this.mipMapsCount = NrOfMipMaps;
    }

    async encodeJpeg(image: {
        width: number,
        height: number,
        buffer: ArrayBuffer,
    }, quality: number = 90) {
        return new Promise<ArrayBuffer>((resolve, reject) => {
            encodeJpeg(image.buffer, {
                quality,
                width: image.width,
                height: image.height,
            }, (err, encoded) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(encoded);
            });
        });
    }

    async resizeImage(image: {
        width: number,
        height: number,
        buffer: ArrayBuffer,
    }) {
        return new Promise<{
            width: number,
            height: number,
            buffer: ArrayBuffer,
        }>((resolve, reject) => {
            const newWidth = Math.max(1, Math.floor(image.width / 2));
            const newHeight = Math.max(1, Math.floor(image.height / 2));
            resizeImage(image.buffer, {
                width: image.width,
                height: image.height,
                outWidth: newWidth,
                outHeight: newHeight,
            }, (err, resized) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({
                    width: newWidth,
                    height: newHeight,
                    buffer: resized,
                });
            });
        });
    }

    async encode(mipsCount: number = this.mipMapsCount - 1, quality: number = 90) {
        if (mipsCount > this.mipMapsCount) {
            throw new Error('mipsCount is too large');
        } else if (mipsCount < 1) {
            throw new Error('mipsCount is too small');
        }
        let img = this.image;
        const jpegBuffers: ArrayBuffer[] = [];
        let offset = this.blpHeader.size + 8;
        for (let i = 0; i < mipsCount; i++) {
            const jpegBuffer = await this.encodeJpeg(img, quality);
            jpegBuffers.push(jpegBuffer);
            this.headerValue.mipmapOffsets[i] = offset;
            this.headerValue.mipmapSizes[i] = jpegBuffer.byteLength - 4;
            offset += this.headerValue.mipmapSizes[i];
            img = await this.resizeImage(img);
        }
        const totalSize = this.blpHeader.size + 8 + jpegBuffers.reduce((sum, jpegBuffer) => sum + jpegBuffer.byteLength - 4, 0);
        const outBuffer = new ArrayBuffer(totalSize);
        const dataView = new DataView(outBuffer);
        const uint8View = new Uint8Array(outBuffer);
        this.blpHeader.write(dataView, this.headerValue, 0);
        // write jpeg header
        dataView.setUint32(this.blpHeader.size, 4, true);
        uint8View.set(new Uint8Array(jpegBuffers[0], 0, 4), this.blpHeader.size + 4);

        // 循环写入
        for (let i = 0; i < mipsCount; i++) {
            const jpegBuffer = jpegBuffers[i];
            uint8View.set(new Uint8Array(jpegBuffer, 4), this.headerValue.mipmapOffsets[i]);
        }
        return outBuffer;
    }
}

export class Blp1File {
    blpHeader = new BlpHeader();
    headerValue = {
        magic: 'BLP1',
        compression: 1, // 1: jpeg, 2: uncompressed, 3: DXTC
        alphaBits: 8, //  alpha通道位数
        width: 256,
        height: 256,
        flags: 4, // 默认是4 具体意义不明
        hasMipmaps: 1, // 是否有mipmap
        mipmapOffsets: new Array(16).fill(0),
        mipmapSizes: new Array(16).fill(0),
    };

    static decode(buffer: ArrayBufferLike) {
        return new Blp1Reader(buffer);
    }

    static encode(image: {
        width: number,
        height: number,
        buffer: ArrayBuffer,
    }) {
        return new Blp1Encoder(image);
    }
}
