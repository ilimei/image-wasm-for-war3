# 构建

在构建之前，您需要安装以下工具：

- emcc
- rust
- cmake

## rust 需要安装target wasm32-unknown-emscripten
rustup target add wasm32-unknown-emscripten

## 开始构建

```sh
npm i 
npm run build
```

如果一切顺利，构建完成后您将会在 dist 目录下找到编译好的文件