#!/usr/bin/env bash

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}" )" && pwd)
ROOT_DIR=$(readlink -f "${SCRIPT_DIR}/../")

function build_jpeg() {
    local JPEG_DIR=$(readlink -f "${ROOT_DIR}/libjpeg-turbo")
    cd ${JPEG_DIR}
    emcmake cmake -DWITH_JPEG8=1
    emmake make -j8 jpeg12-static/fast jpeg16-static/fast jpeg-static/fast
}

function build_rust_image() {
    cd ${ROOT_DIR}/rust-image
    cargo build --release --target wasm32-unknown-emscripten
}

function build_target() {
    local CFLAGS="-std=c11 -O2 -fPIC -s ALLOW_MEMORY_GROWTH=1"
    local EXPORTED_FUNCTIONS='["_encode_jpeg", "_encode_tga", "_free", "_malloc"]'
    local EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "setValue", "getValue", "UTF8ToString", "stackAlloc", "stackSave", "stackRestore"]'
    local C_API_PATH=$(readlink -f "${ROOT_DIR}/src/api.c")
    local INCLUDE_PATH=$(readlink -f "${ROOT_DIR}/libjpeg-turbo")
    local INCLUDE_RUST_PATH=$(readlink -f "${ROOT_DIR}/rust-image")
    local JPEG_A_PATH=$(readlink -f "${ROOT_DIR}/libjpeg-turbo/libjpeg.a")
    local RUST_IMAGE_LIB_PATH=$(readlink -f "${ROOT_DIR}/rust-image/target/wasm32-unknown-emscripten/release/librust_image.a")

    mkdir -p ${ROOT_DIR}/build
    cd ${ROOT_DIR}/build

    emcc ${CFLAGS} ${C_API_PATH} -I${INCLUDE_PATH} -I${INCLUDE_RUST_PATH} -s SIDE_MODULE=1 -s EXPORT_ALL=1 -c -o api.o
    emcc ${CFLAGS} api.o ${JPEG_A_PATH} ${RUST_IMAGE_LIB_PATH}\
        -s WASM=0 \
        -s EXPORTED_FUNCTIONS="${EXPORTED_FUNCTIONS}" \
        -s EXPORTED_RUNTIME_METHODS="${EXPORTED_RUNTIME_METHODS}" \
        -o libjpeg.js
}

build_jpeg
build_rust_image
build_target
