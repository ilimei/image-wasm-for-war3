declare function decodeJpeg(buffer: ArrayBuffer, callback: (err: any, decoded: {
    width: number;
    height: number;
    buffer: ArrayBuffer;
}) => void);

declare function encodeJpeg(buffer: ArrayBuffer,
    option: { width: number, height: number, quality: number },
    callback: (err: any, encoded: ArrayBuffer) => void);

declare function encodeImage(buffer: ArrayBuffer,
    option: { width: number, height: number, type: number },
    callback: (err: any, encoded: ArrayBuffer) => void);

declare function decodeImage(buffer: ArrayBuffer, type: number, callback: (err: any, decoded: {
    width: number;
    height: number;
    buffer: ArrayBuffer;
}) => void);

declare function resizeImage(buffer: ArrayBuffer,
    option: { width: number, height: number, outWidth: number, outHeight: number },
    callback: (err: any, encoded: ArrayBuffer) => void);

export { decodeJpeg, encodeJpeg, encodeImage, decodeImage, resizeImage };