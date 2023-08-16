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
const { ImageType, encode } = require("image-wasm-for-war3");

const data = new Uint8Array(
  new Array(100 * 100 * 4).fill(0).map((_, i) => i % 255)
);
const image = {
    width: 100,
    height: 100,
    buffer: data.buffer,
}

encode(image, ImageType.Tga).then((tgaContent) => {
  fs.writeFileSync("test.tga", Buffer.from(tgaContent));
});

encode(image, ImageType.Blp1).then((blp1Content) => {
  fs.writeFileSync("test.blp", Buffer.from(blp1Content));
});
```

## decode

```js
const fs = require("fs");
const { ImageType, decode } = require("image-wasm-for-war3");

decode(fs.readFileSync('test.tga'), ImageType.Tga).then((rgbaData) => {
    console.info(rgbaData.width);
    console.info(rgbaData.height);
    console.info(rgbaData.buffer);
});

decode(fs.readFileSync('test.blp'), ImageType.Blp1).then((rgbaData) => {
    console.info(rgbaData.width);
    console.info(rgbaData.height);
    console.info(rgbaData.buffer);
});
```

## resize
```js
const fs = require("fs");
const { ImageType, encode, decode, resize } = require("image-wasm-for-war3");

decode(fs.readFileSync('big.tga'), ImageType.Tga)
  .then((rgbaData) => resize(rgbaData, 50, 50))
  .then(resizeImage => encode(resizeImage, ImageType.Tga))
  .then((tgaContent) => {
    fs.writeFileSync("small.tga", Buffer.from(tgaContent));
  });
```

## blp1的处理

```js
const fs = require("fs");
const { Blp1File, encode, decode, ImageType } = require("image-wasm-for-war3");

const resizeImage = await decode(fs.readFileSync('some jpeg path'), ImageType.Jpeg);
// 生成一个 mimap是一个 质量是80 的blp1文件
const blpContent = await Blp1File.encode(resizeImage).encode(80, 1);
// 保存文件
fs.writeFileSync('some blp path', Buffer.from(blpContent));

// 获取blp的第一张mimap数据
const blpImageData = await Blp1File.decode(fs.readFileSync('some blp path')).getMimapData(0);
// 编码成png
const pngContent = await encode(blpImageData, ImageType.Png);
// 保存成png
fs.writeFileSync('some png path', Buffer.from(pngContent));
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
