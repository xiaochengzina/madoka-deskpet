# Madoka 桌宠 / Madoka DeskPet

一个 [Driftlet](https://github.com/xiaochengzina/Driftlet) 桌面皮肤：Live2D 桌面宠物——鼠标跟随、自动眨眼、自然呼吸、点击切换发光表情。

A desktop-pet skin for [Driftlet](https://github.com/xiaochengzina/Driftlet) rendered with Live2D Cubism — mouse tracking, auto blink, breathing, tap-to-glow.

![预览 / Preview](preview.png)

[中文](#中文) · [English](#english)

---

## 中文

### 功能

- 鼠标跟随：模型视线跟随鼠标移动（可在设置中开关）
- 自动眨眼与自然呼吸
- 点击切换发光表情；支持常亮发光与自动随机脉冲
- 模型缩放（0.5×–2.0×）
- 长跑自刷新：WebView 连跑多天会累积内存，本皮肤按 Driftlet《皮肤开发指南》§3.7 的建议（重 WebGL 皮肤 12 小时一档）自动 `location.reload()` 回到干净基线；只在安全点刷新——模型已就绪、发光脉冲已演完、用户 10 秒内无交互（点击会写设置，避免写入在途）——不安全则顺延 1 小时重试。间隔可在设置中调整或整个关闭
- 中英双语设置面板，配置随管理器持久化

### 安装

1. 安装 [Driftlet](https://github.com/xiaochengzina/Driftlet/releases)。
2. 从本仓库 [Releases](../../releases) 下载最新的 `.dskin` 包。
3. 双击 `.dskin` 文件，或在 Driftlet 管理器中点「+ 添加皮肤」选择该文件。

### 从源码运行

本仓库**不包含** `cubismcore.min.js`（Live2D Cubism Core 是 Live2D Inc. 的专有软件，不随源码分发）：

1. 从 [Live2D 官网](https://www.live2d.com/download/cubism-sdk/)下载 Cubism SDK for Web（需同意其许可协议）；
2. 把 SDK 中的 `live2dcubismcore.min.js` 复制到本目录并重命名为 `cubismcore.min.js`；
3. 将整个文件夹复制到 `<Driftlet 安装目录>\skins\`，在管理器中刷新并加载。

打包分发：放入 `cubismcore.min.js` 后用 Driftlet 自带的 `tools\pack-skin.exe` 生成 `.dskin`。

### 许可证

本仓库采用分层授权，请按文件类型区分：

| 内容 | 许可证 |
|---|---|
| 代码（`index.html`、`main.js`、`skin.json` 等作者原创文件） | [MIT](LICENSE) © 2026 小城子 |
| `model/` 下的模型资产 | 保留所有权利，仅允许随本皮肤使用——见 [model/LICENSE](model/LICENSE) |
| `cubismcore.min.js`（仅存在于发布包） | Live2D Inc. 专有软件，见 [NOTICE.txt](NOTICE.txt) |
| `pixi.min.js`、`live2d.min.js` | MIT，见 [NOTICE.txt](NOTICE.txt) |

模型由画师 [Twi棱镜](https://space.bilibili.com/25894873) 创作，本人已买断著作财产权；署名权归画师所有。

### 致谢

- 模型 / Model：[Twi棱镜](https://space.bilibili.com/25894873)
- [Driftlet](https://github.com/xiaochengzina/Driftlet) — 桌面皮肤管理器（GPL-3.0）
- [PixiJS](https://github.com/pixijs/pixijs)（MIT）
- [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display)（MIT）
- Live2D Cubism Core © Live2D Inc.（专有软件，[许可协议](https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html)）

---

## English

### Features

- Mouse tracking: the model's gaze follows your cursor (toggleable in settings)
- Auto blink and natural breathing
- Tap to toggle the glow expression; supports always-on glow and random auto pulses
- Model scale from 0.5× to 2.0×
- Long-run self-refresh: a WebView accumulates memory over days of uptime, so — following Driftlet's skin guide §3.7 (12-hour tier for heavy WebGL skins) — the skin calls `location.reload()` for a clean baseline. It only reloads at a safe point: model ready, no glow pulse in flight, and no user interaction in the last 10 seconds (a tap writes a setting, so an in-flight write must settle); otherwise it retries an hour later. The interval is adjustable in settings, or can be turned off entirely
- Bilingual (Chinese/English) settings panel; preferences persist in the host manager

### Install

1. Install [Driftlet](https://github.com/xiaochengzina/Driftlet/releases).
2. Download the latest `.dskin` package from [Releases](../../releases).
3. Double-click the `.dskin` file, or click "+ Add Skin" in the Driftlet manager and choose it.

### Run from Source

This repository does **not** include `cubismcore.min.js` — Live2D Cubism Core is proprietary software of Live2D Inc. and is not distributed with the source code:

1. Download the Cubism SDK for Web from the [Live2D official site](https://www.live2d.com/download/cubism-sdk/) (which requires accepting its license agreement);
2. Copy `live2dcubismcore.min.js` from the SDK into this folder and rename it to `cubismcore.min.js`;
3. Copy the whole folder into `<Driftlet installation>\skins\`, then refresh and load it in the manager.

To package for distribution: with `cubismcore.min.js` in place, run Driftlet's bundled `tools\pack-skin.exe` to produce a `.dskin` package.

### License

This project uses split licensing — please check by file type:

| Content | License |
|---|---|
| Original code (`index.html`, `main.js`, `skin.json`, etc.) | [MIT](LICENSE) © 2026 小城子 |
| Model assets under `model/` | All rights reserved; usable only as part of this skin — see [model/LICENSE](model/LICENSE) |
| `cubismcore.min.js` (release packages only) | Proprietary software of Live2D Inc. — see [NOTICE.txt](NOTICE.txt) |
| `pixi.min.js`, `live2d.min.js` | MIT — see [NOTICE.txt](NOTICE.txt) |

The model was created by [Twi棱镜](https://space.bilibili.com/25894873). The economic copyrights have been fully transferred (buyout); the artist retains the right of attribution.

### Credits

- Model: [Twi棱镜](https://space.bilibili.com/25894873)
- [Driftlet](https://github.com/xiaochengzina/Driftlet) — desktop skin manager (GPL-3.0)
- [PixiJS](https://github.com/pixijs/pixijs) (MIT)
- [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display) (MIT)
- Live2D Cubism Core © Live2D Inc. (proprietary — [license agreement](https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html))
