# Madoka 桌宠 / Madoka Desk Pet

一个 [Driftlet](https://github.com/xiaochengzina/Driftlet) 桌面皮肤：Live2D 桌面宠物——鼠标跟随、自动眨眼、自然呼吸、点击切换发光表情。

A desktop pet skin for [Driftlet](https://github.com/xiaochengzina/Driftlet), rendered with Live2D Cubism: mouse tracking, auto blink, breathing, tap-to-glow.

![预览 / Preview](preview.png)

## 功能 / Features

- 鼠标跟随：模型视线跟随鼠标移动（可在设置中开关）
- 自动眨眼与自然呼吸
- 点击切换发光表情；支持常亮发光与自动随机脉冲
- 模型缩放（0.5×–2.0×）
- 中英双语设置面板，配置随管理器持久化

## 安装 / Install

1. 安装 [Driftlet](https://github.com/xiaochengzina/Driftlet/releases)。
2. 从本仓库 [Releases](../../releases) 下载最新的 `.dskin` 包。
3. 双击 `.dskin` 文件，或在 Driftlet 管理器中点「+ 添加皮肤」选择该文件。

## 从源码运行 / Run from Source

本仓库**不包含** `cubismcore.min.js`（Live2D Cubism Core 是 Live2D Inc. 的专有软件，不随源码分发）：

1. 从 [Live2D 官网](https://www.live2d.com/download/cubism-sdk/)下载 Cubism SDK for Web（需同意其许可协议）；
2. 把 SDK 中的 `live2dcubismcore.min.js` 复制到本目录并重命名为 `cubismcore.min.js`；
3. 将整个文件夹复制到 `<Driftlet 安装目录>\skins\`，在管理器中刷新并加载。

打包分发：放入 `cubismcore.min.js` 后用 Driftlet 自带的 `tools\pack-skin.exe` 生成 `.dskin`。

## 许可证 / License

本仓库采用分层授权，请按文件类型区分：

| 内容 | 许可证 |
|---|---|
| 代码（`index.html`、`main.js`、`skin.json` 等作者原创文件） | [MIT](LICENSE) © 2026 小城子 |
| `model/` 下的模型资产 | 保留所有权利，仅允许随本皮肤使用——见 [model/LICENSE](model/LICENSE) |
| `cubismcore.min.js`（仅存在于发布包） | Live2D Inc. 专有软件，见 [NOTICE.txt](NOTICE.txt) |
| `pixi.min.js`、`live2d.min.js` | MIT，见 [NOTICE.txt](NOTICE.txt) |

模型由画师【画师署名】创作，本人已买断著作财产权；署名权归画师所有。

This project uses split licensing: original code is MIT-licensed; the model
assets under `model/` are all rights reserved (usable only as part of this
skin); Live2D Cubism Core is proprietary software of Live2D Inc. — see
[NOTICE.txt](NOTICE.txt) for details.

## 致谢 / Credits

- 模型 / Model：【画师署名】
- [Driftlet](https://github.com/xiaochengzina/Driftlet) — 桌面皮肤管理器（GPL-3.0）
- [PixiJS](https://github.com/pixijs/pixijs)（MIT）
- [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display)（MIT）
- Live2D Cubism Core © Live2D Inc.（专有软件，[许可协议](https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html)）
