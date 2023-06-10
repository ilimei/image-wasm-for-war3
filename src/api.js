var Module = require('../dist/libimage');
var Runtime = Module;

var doneF = new Promise(function (resolve, reject) {
    /**
     * Called asynchronously when the runtime is initialized.
     * It is safe to run 'encode' and 'decode' only after this call.
     */
    Module['onRuntimeInitialized'] = function () {
        try {
            resolve('RuntimeInitialized');
        } catch (err) {
            reject(err);
        }
    }
});

module.exports.encode = encodeJpeg;

/* see 'api.h' for declarations */
var encode_jpeg = Module.cwrap('encode_jpeg', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number']);
// int decode_jpeg(unsigned char* jpeg_buffer, unsigned int jpeg_size, unsigned char** out_buffer, unsigned int* out_width,  unsigned int* out_height, char** out_msg);
var decode_jpeg = Module.cwrap('decode_jpeg', 'number', ['number', 'number', 'number', 'number', 'number', 'number']);
// int encode_image(unsigned char* rgb_buffer, unsigned int rgb_width, unsigned int rgb_height, unsigned int type, unsigned char **out_buffer, unsigned int *out_size, char **out_msg);
var encode_image = Module.cwrap('encode_image', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number']);
// int decode_image(unsigned char* image_buffer, unsigned int buffer_size, unsigned int type, unsigned char** out_buffer, unsigned int* out_width,  unsigned int* out_height, char** out_msg);
var decode_image = Module.cwrap('decode_image', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number']);

var SIZE_OF_POINTER = 4;

var DEFAULT_QUALITY = 90;

/**
 * Encodes RGBA data as JPEG.
 *
 * @param {ArrayBuffer} buf An array or RGB tripvars.
 * @param {object} options Params { width: number, height: number, quality: number }
 *                  Width of RGBA image, pixels.
 *                  Height of RGBA image, pixels.
 *                  Quality, [0 - 100].
 * @param {function} cb Callback to invoke on compvarion.
 *
 * @callback { data: ArrayBuffer }
 */
function encodeJpeg(buf, options, cb) {
    if (typeof options === 'function') {
        cb = options;
        options = {};
    }

    if (!options.hasOwnProperty('width') || !options.hasOwnProperty('height')) {
        return cb(new Error('Width & height of the buffer is not provided.'));
    }

    var width = options.width;
    var height = options.height;
    var quality = options.quality || DEFAULT_QUALITY;

    doneF.then(function () {
        var stack = Runtime.stackSave();

        var rgbBufferPtr = Module._malloc(buf.byteLength);
        Module.HEAPU8.set(new Uint8Array(buf), rgbBufferPtr);

        var outBufferPtrPtr = Runtime.stackAlloc(SIZE_OF_POINTER);
        var outBufferSizePtr = Runtime.stackAlloc(SIZE_OF_POINTER);
        var outMsgPtrPtr = Runtime.stackAlloc(SIZE_OF_POINTER);

        Module.setValue(outBufferPtrPtr, 0, 'i32');
        Module.setValue(outBufferSizePtr, 0, 'i32');
        Module.setValue(outMsgPtrPtr, 0, 'i32');

        // invoke
        var result = encode_jpeg(rgbBufferPtr, width, height, quality, outBufferPtrPtr, outBufferSizePtr, outMsgPtrPtr);

        var outBufferPtr = Module.getValue(outBufferPtrPtr, 'i32');
        var outBufferSize = Module.getValue(outBufferSizePtr, 'i32');
        var outMsgPtr = Module.getValue(outMsgPtrPtr, 'i32');

        var err;
        var encoded;

        if (!result) {
            var jpegBuffer = new Uint8Array(Module.HEAPU8.buffer, outBufferPtr, outBufferSize);
            encoded = new ArrayBuffer(outBufferSize);
            new Uint8Array(encoded).set(jpegBuffer);
        } else {
            var jpegBuffer = new Uint8Array(Module.HEAPU8.buffer, outMsgPtr, 1000);
            // q: jpegBuffer转成string
            var jpegString = String.fromCharCode.apply(null, jpegBuffer);
            console.log(jpegString);
            console.info(jpegBuffer);
            err = new Error(Module.Pointer_stringify(outMsgPtr));
        }

        Module._free(rgbBufferPtr);
        Module._free(outBufferPtr);
        Module._free(outMsgPtr);

        Runtime.stackRestore(stack);

        if (err) {
            return cb(err);
        } else {
            return cb(null, encoded);
        }
    })
        .catch(cb)
}

/**
 * Decodes JPEG
 * @param buf An ArrayBuffer with JPEG data.
 * @param cb Callback to invoke on compvarion.
 *
 * @callback { buffer: ArrayBuffer, width: number, height: number }.
 */
function decodeJpeg(buf, cb) {
    doneF.then(function () {
        var stack = Runtime.stackSave();

        var jpegBufferPtr = Module._malloc(buf.byteLength);
        Module.HEAPU8.set(new Uint8Array(buf), jpegBufferPtr);

        var outBufferPtrPtr = Runtime.stackAlloc(SIZE_OF_POINTER);
        var outBufferWidthPtr = Runtime.stackAlloc(SIZE_OF_POINTER);
        var outBufferHeightPtr = Runtime.stackAlloc(SIZE_OF_POINTER);
        var outMsgPtrPtr = Runtime.stackAlloc(SIZE_OF_POINTER);

        Module.setValue(outBufferPtrPtr, 0, 'i32');
        Module.setValue(outBufferWidthPtr, 0, 'i32');
        Module.setValue(outBufferHeightPtr, 0, 'i32');
        Module.setValue(outMsgPtrPtr, 0, 'i32');

        var result = decode_jpeg(jpegBufferPtr, buf.byteLength, outBufferPtrPtr, outBufferWidthPtr, outBufferHeightPtr, outMsgPtrPtr);

        var outBufferPtr = Module.getValue(outBufferPtrPtr, 'i32');
        var outBufferWidth = Module.getValue(outBufferWidthPtr, 'i32');
        var outBufferHeight = Module.getValue(outBufferHeightPtr, 'i32');
        var outMsgPtr = Module.getValue(outMsgPtrPtr, 'i32');

        var err;
        var decoded;

        if (!result) {
            var outBufferSize = outBufferWidth * outBufferHeight * 4;
            var rgbBuffer = new Uint8Array(Module.HEAPU8.buffer, outBufferPtr, outBufferSize);
            decoded = new ArrayBuffer(outBufferSize);
            new Uint8Array(decoded).set(rgbBuffer);
        } else {
            err = new Error(Module.Pointer_stringify(outMsgPtr));
        }

        Module._free(jpegBufferPtr);
        Module._free(outBufferPtr);
        Module._free(outMsgPtr);

        Runtime.stackRestore(stack);

        if (err) {
            return cb(err);
        } else {
            return cb(null, {
                buffer: decoded,
                width: outBufferWidth,
                height: outBufferHeight
            });
        }
    })
        .catch(cb)
}

/**
 * Encodes RGBA data as TGA or PNG.
 *
 * @param {ArrayBuffer} buf An array or RGB tripvars.
 * @param {object} options Params { width: number, height: number }
 *                  Width of RGBA image, pixels.
 *                  Height of RGBA image, pixels.
 * @param {function} cb Callback to invoke on compvarion.
 *
 * @callback { width: number, height: number, data: Uint8Array }
 */
function encodeImage(buf, options, cb) {
    if (typeof options === 'function') {
        cb = options;
        options = {};
    }

    if (!options.hasOwnProperty('width') || !options.hasOwnProperty('height')) {
        return cb(new Error('Width & height of the buffer is not provided.'));
    }

    var width = options.width;
    var height = options.height;
    var type = options.type;

    doneF.then(function () {
        var stack = Runtime.stackSave();

        var rgbBufferPtr = Module._malloc(buf.byteLength);
        Module.HEAPU8.set(new Uint8Array(buf), rgbBufferPtr);

        var outBufferPtrPtr = Runtime.stackAlloc(SIZE_OF_POINTER);
        var outBufferSizePtr = Runtime.stackAlloc(SIZE_OF_POINTER);
        var outMsgPtrPtr = Runtime.stackAlloc(SIZE_OF_POINTER);

        Module.setValue(outBufferPtrPtr, 0, 'i32');
        Module.setValue(outBufferSizePtr, 0, 'i32');
        Module.setValue(outMsgPtrPtr, 0, 'i32');

        // invoke
        var result = encode_image(rgbBufferPtr, width, height, type, outBufferPtrPtr, outBufferSizePtr, outMsgPtrPtr);

        var outBufferPtr = Module.getValue(outBufferPtrPtr, 'i32');
        var outBufferSize = Module.getValue(outBufferSizePtr, 'i32');
        var outMsgPtr = Module.getValue(outMsgPtrPtr, 'i32');

        var err;
        var encoded;

        if (!result) {
            var jpegBuffer = new Uint8Array(Module.HEAPU8.buffer, outBufferPtr, outBufferSize);
            encoded = new ArrayBuffer(outBufferSize);
            new Uint8Array(encoded).set(jpegBuffer);
        } else {
            var jpegBuffer = new Uint8Array(Module.HEAPU8.buffer, outMsgPtr, 1000);
            // q: jpegBuffer转成string
            var jpegString = String.fromCharCode.apply(null, jpegBuffer);
            console.log(jpegString);
            console.info(jpegBuffer);
            err = new Error(Module.Pointer_stringify(outMsgPtr));
        }

        Module._free(rgbBufferPtr);
        Module._free(outBufferPtr);
        Module._free(outMsgPtr);

        Runtime.stackRestore(stack);

        if (err) {
            return cb(err);
        } else {
            return cb(null, encoded);
        }
    })
        .catch(cb)
}

/**
 * Decodes TGA or PNG
 * @param buf An ArrayBuffer with image data.
 * @param type Type of image to decode. TGA = 0, PNG = 1
 * @param cb Callback to invoke on compvarion.
 *
 * @callback { buffer: ArrayBuffer, width: number, height: number }.
 */
function decodeImage(buf, type, cb) {
    doneF.then(function () {
        var stack = Runtime.stackSave();

        var imageBufferPtr = Module._malloc(buf.byteLength);
        Module.HEAPU8.set(new Uint8Array(buf), imageBufferPtr);

        var outBufferPtrPtr = Runtime.stackAlloc(SIZE_OF_POINTER);
        var outBufferWidthPtr = Runtime.stackAlloc(SIZE_OF_POINTER);
        var outBufferHeightPtr = Runtime.stackAlloc(SIZE_OF_POINTER);
        var outMsgPtrPtr = Runtime.stackAlloc(SIZE_OF_POINTER);

        Module.setValue(outBufferPtrPtr, 0, 'i32');
        Module.setValue(outBufferWidthPtr, 0, 'i32');
        Module.setValue(outBufferHeightPtr, 0, 'i32');
        Module.setValue(outMsgPtrPtr, 0, 'i32');

        var result = decode_image(imageBufferPtr, buf.byteLength, type, outBufferPtrPtr, outBufferWidthPtr, outBufferHeightPtr, outMsgPtrPtr);
        var outBufferPtr = Module.getValue(outBufferPtrPtr, 'i32');
        var outBufferWidth = Module.getValue(outBufferWidthPtr, 'i32');
        var outBufferHeight = Module.getValue(outBufferHeightPtr, 'i32');
        var outMsgPtr = Module.getValue(outMsgPtrPtr, 'i32');

        var err;
        var decoded;

        if (!result) {
            var outBufferSize = outBufferWidth * outBufferHeight * 4;
            var rgbBuffer = new Uint8Array(Module.HEAPU8.buffer, outBufferPtr, outBufferSize);
            decoded = new ArrayBuffer(outBufferSize);
            new Uint8Array(decoded).set(rgbBuffer);
        } else {
            err = new Error(Module.Pointer_stringify(outMsgPtr));
        }

        Module._free(imageBufferPtr);
        Module._free(outBufferPtr);
        Module._free(outMsgPtr);

        Runtime.stackRestore(stack);

        if (err) {
            return cb(err);
        } else {
            return cb(null, {
                buffer: decoded,
                width: outBufferWidth,
                height: outBufferHeight
            });
        }
    })
        .catch(cb)
}

const ImageType = {
    Tga: 0,
    Png: 1,
    Jpeg: 2,
}

module.exports = {
    ImageType,
    encodeJpeg,
    decodeJpeg,
    encodeImage,
    decodeImage,
};
