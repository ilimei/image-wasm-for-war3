# 简介

image-wasm-for-war3 是一个使用 WebAssembly 技术实现的图像处理库，可以在浏览器和 Node.js 环境中使用。该库提供了一组 API，用于对 RGBA 的图像数据进行解码和编码

# 安装

您可以使用 npm 包管理器来安装 image-wasm-for-war3：

```sh
npm install image-wasm-for-war3
```

# 使用

## encode

```js
const fs = require("fs");
const { ImageType, encode } = require("../index");

const data = new Uint8Array(
  new Array(100 * 100 * 4).fill(0).map((_, i) => i % 255)
);

encode(data.buffer, 100, 100, ImageType.Tga).then((tgaContent) => {
  fs.writeFileSync("test.tga", Buffer.from(tgaContent));
});
```

## decode

```js
const fs = require("fs");
const { ImageType, decode } = require("../index");

const data = new Uint8Array(
  new Array(100 * 100 * 4).fill(0).map((_, i) => i % 255)
);

encode(fs.readFileSync('test.tga').buffer, ImageType.Tga).then((rgbaData) => {
    console.info(rgbaData.width);
    console.info(rgbaData.height);
    console.info(rgbaData.buffer);
});
```

# 构建

在构建之前，您需要安装以下工具：

- emcc
- rust
- cmake

## rust 需要安装 target wasm32-unknown-emscripten

rustup target add wasm32-unknown-emscripten

## 开始构建

```sh
npm i
npm run build
```

如果一切顺利，构建完成后您将会在 dist 目录下找到编译好的文件
