var Module = require('./build/libjpeg');
var { decodeJPEG } = require('./jpgDecoder');
var Runtime = Module;
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
/* see 'api.h' for declarations */
var encode_tga = Module.cwrap('encode_tga', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number']);

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
 * @callback { width: number, height: number, data: Uint8Array }
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
 * Encodes RGBA data as JPEG.
 *
 * @param {ArrayBuffer} buf An array or RGB tripvars.
 * @param {object} options Params { width: number, height: number }
 *                  Width of RGBA image, pixels.
 *                  Height of RGBA image, pixels.
 * @param {function} cb Callback to invoke on compvarion.
 *
 * @callback { width: number, height: number, data: Uint8Array }
 */
function encodeTga(buf, options, cb) {
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
        var result = encode_tga(rgbBufferPtr, width, height, type, outBufferPtrPtr, outBufferSizePtr, outMsgPtrPtr);

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

const data = new Uint8Array(new Array(100 * 100 * 4).fill(0).map((_, i) => i % 255));

const ImageType = {
    Tga: 0,
    Png: 1,
    Gif: 2,
    Jpeg: 3,
}

encodeTga(data.buffer, { width: 100, height: 100, type: ImageType.Tga }, (err, encoded) => {
    if (err) {
        console.error(err);
    }
    // console.info(new Uint8Array(encoded));
    // console.info(decodeJPEG(new Uint8Array(encoded)));
    require('fs').writeFileSync('test.tga', Buffer.from(encoded));
});
encodeTga(data.buffer, { width: 100, height: 100, type: ImageType.Png }, (err, encoded) => {
    if (err) {
        console.error(err);
    }
    // console.info(new Uint8Array(encoded));
    // console.info(decodeJPEG(new Uint8Array(encoded)));
    require('fs').writeFileSync('test.png', Buffer.from(encoded));
});
