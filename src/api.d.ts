declare function decodeJpeg(buffer: ArrayBufferLike, callback: (err: any, decoded: {
    width: number;
    height: number;
    buffer: ArrayBuffer;
}) => void);

declare function encodeJpeg(buffer: ArrayBufferLike,
    option: { width: number, height: number, quality: number }, 
    callback: (err: any, encoded: ArrayBuffer) => void);

declare function resizeImage(buffer: ArrayBufferLike,
        option: { width: number, height: number, outWidth: number, outHeight: number }, 
        callback: (err: any, encoded: ArrayBuffer) => void);

export { decodeJpeg, encodeJpeg, resizeImage };