/**
 * the script should be run by zx
 */

import path from 'path';

const EXPORTED_FUNCTIONS = [
    'encode_jpeg',
    'decode_jpeg',
    'resize_image',
    'encode_image',
    'decode_image',
    'free',
    'malloc'
];
const ROOT_DIR = path.resolve(__dirname, '..');

async function build_jpeg() {
    const JPEG_DIR= path.resolve(ROOT_DIR, 'libjpeg-turbo');
    await $`cd ${JPEG_DIR} && emcmake cmake -DWITH_JPEG8=1`
    await $`cd ${JPEG_DIR} && emmake make -j8 jpeg12-static/fast jpeg16-static/fast jpeg-static/fast`
}

async function build_rust_image() {
    cd(`${ROOT_DIR}/rust-image`)
    await $`cargo build --release --target wasm32-unknown-emscripten`
}

async function build_target() {
    const CFLAGS = [
        '-std=c11', // C11 标准
        // '-O2', // 优化等级 2
        '-fPIC', // 生成位置无关代码
    ];
    const ARG_EXPORTED_FUNCTIONS = JSON.stringify(EXPORTED_FUNCTIONS.map(f => `_${f}`));
    const ARG_EXPORTED_RUNTIME_METHODS = JSON.stringify([
        'ccall',
        'cwrap',
        'setValue',
        'getValue',
        'UTF8ToString',
        'stackAlloc',
        'stackSave',
        'stackRestore'
    ]);
    const CWASMFALGS = [
        '-s', // 附加选项
        'ALLOW_MEMORY_GROWTH=1', // 允许内存增长
        '-s', 
        'WASM=1',
        '-s',
        `EXPORTED_FUNCTIONS=${ARG_EXPORTED_FUNCTIONS}`, // 导出方法
        '-s',
        `EXPORTED_RUNTIME_METHODS=${ARG_EXPORTED_RUNTIME_METHODS}`, // 导出运行时方法
    ];
    const C_API_PATH = path.resolve(ROOT_DIR, 'src/api.c');
    const INCLUDE_PATH = path.resolve(ROOT_DIR, 'libjpeg-turbo');
    const INCLUDE_RUST_PATH = path.resolve(ROOT_DIR, 'rust-image');
    const JPEG_A_PATH = path.resolve(ROOT_DIR, 'libjpeg-turbo/libjpeg.a');
    const RUST_IMAGE_LIB_PATH = path.resolve(ROOT_DIR, 'rust-image/target/wasm32-unknown-emscripten/release/librust_image.a');

    await $`mkdir -p ${ROOT_DIR}/dist`;
    cd(`${ROOT_DIR}/dist`);

    await $`emcc ${CFLAGS} ${C_API_PATH} -I${INCLUDE_PATH} -I${INCLUDE_RUST_PATH} -s SIDE_MODULE=1 -c -o api.o`;
    await $`emcc ${CFLAGS} ${CWASMFALGS} api.o ${JPEG_A_PATH} ${RUST_IMAGE_LIB_PATH} -o libimage.js`;
}


// await build_jpeg();
await build_rust_image();
await build_target();
